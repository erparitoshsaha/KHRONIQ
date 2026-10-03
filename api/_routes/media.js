import express from 'express';
import { protect, adminOnly, requirePermission } from '../_middleware/auth.js';
import { mediaUpload } from '../_middleware/upload.js';
import Media from '../_models/Media.js';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// POST /api/admin/media - upload images/videos (field name: files or any)
router.post('/', protect, requirePermission('homepage_media'), (req, res, next) => {
  mediaUpload.any()(req, res, async (err) => {
    if (err) return next(err);

    try {
      const mediaTitle = (req.body?.title || '').trim();
      if (!req.files || req.files.length === 0) {
        if (req.body && req.body.url && req.body.section) {
          const isVideo = req.body.type === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(req.body.url);
          let mediaUrl = req.body.url;
          let publicId = req.body.publicId || '';

          // If base64 data URI is provided, upload it to Cloudinary automatically
          if (typeof mediaUrl === 'string' && mediaUrl.startsWith('data:')) {
            try {
              const uploadRes = await cloudinary.uploader.upload(mediaUrl, {
                folder: 'zenith-watches/homepage',
                resource_type: isVideo ? 'video' : 'image'
              });
              mediaUrl = uploadRes.secure_url;
              publicId = uploadRes.public_id;
            } catch (cloudErr) {
              console.error('Failed to upload base64 to Cloudinary:', cloudErr);
            }
          }

          const media = await Media.create({
            url: mediaUrl,
            publicId,
            type: isVideo ? 'video' : 'image',
            section: req.body.section,
            title: mediaTitle,
            uploadedBy: req.user?._id
          });
          return res.json({ success: true, media: [media] });
        }
        if (req.body && req.body.section && (req.body.title !== undefined)) {
          const media = await Media.create({
            url: req.body.url || '',
            publicId: '',
            type: 'image',
            section: req.body.section,
            title: mediaTitle,
            uploadedBy: req.user?._id
          });
          return res.json({ success: true, media: [media] });
        }
        return res.status(400).json({ success: false, message: 'No files uploaded or url/title provided' });
      }
      const section = req.body.section || 'homepage';
      const created = [];
      for (const file of req.files) {
        const isVideo = file.mimetype && file.mimetype.startsWith('video');
        const media = await Media.create({
          url: file.path || file.secure_url || file.url,
          publicId: file.filename || file.public_id || '',
          type: isVideo ? 'video' : 'image',
          section,
          title: mediaTitle,
          uploadedBy: req.user?._id
        });
        created.push(media);
      }
      res.json({ success: true, media: created });
    } catch (dbErr) {
      console.error('Media upload error:', dbErr);
      res.status(500).json({ success: false, message: 'Server error saving uploaded media' });
    }
  });
});

// PUT /api/admin/media/title - update or set title/display name for a media section
router.put('/title', protect, requirePermission('homepage_media'), async (req, res) => {
  try {
    const { section, title } = req.body;
    if (!section) {
      return res.status(400).json({ success: false, message: 'Section is required' });
    }
    const cleanTitle = (title || '').trim();

    // Check if a media document exists for this section
    let doc = await Media.findOne({ section }).sort({ createdAt: -1 });
    if (doc) {
      doc.title = cleanTitle;
      await doc.save();
      return res.json({ success: true, media: doc });
    }

    // Otherwise create a document with the title
    doc = await Media.create({
      section,
      title: cleanTitle,
      url: '',
      type: 'image',
      uploadedBy: req.user?._id
    });
    return res.json({ success: true, media: doc });
  } catch (err) {
    console.error('Media title update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating media title' });
  }
});

// GET /api/admin/media - list, optional ?section=...
router.get('/', protect, requirePermission('homepage_media'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.section) filter.section = req.query.section;
    const list = await Media.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, media: list });
  } catch (err) {
    console.error('Media list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/media/:id - deletes DB entry and attempts Cloudinary deletion
router.delete('/:id', protect, requirePermission('homepage_media'), async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });

    if (media.publicId) {
      try {
        await cloudinary.uploader.destroy(media.publicId, { resource_type: media.type === 'video' ? 'video' : 'image' });
      } catch (e) {
        console.warn('Cloudinary deletion error:', e);
      }
    }

    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Media asset deleted successfully.' });
  } catch (err) {
    console.error('Media delete error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// GET /api/admin/media/public - public, returns the latest image and title per section
router.get('/public', async (req, res) => {
  try {
    const list = await Media.find({})
      .sort({ createdAt: -1 })
      .select('section url title')
      .lean();

    const lookup = {};
    const titles = {};
    list.forEach(doc => {
      if (doc.section) {
        if (!lookup[doc.section] && doc.url) lookup[doc.section] = doc.url; // first hit per section = newest
        if (!titles[doc.section] && doc.title) titles[doc.section] = doc.title;
      }
    });
    res.json({ success: true, media: lookup, titles });
  } catch (err) {
    console.error('Public media fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;