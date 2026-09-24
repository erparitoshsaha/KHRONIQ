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
            uploadedBy: req.user?._id
          });
          return res.json({ success: true, media: [media] });
        }
        return res.status(400).json({ success: false, message: 'No files uploaded or url provided' });
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


// GET /api/admin/media/public - public, returns the latest image per section as { section: url }
router.get('/public', async (req, res) => {
  try {
    const list = await Media.find({
      type: 'image'
    })
      .sort({ createdAt: -1 })
      .select('section url')
      .lean();

    const lookup = {};
    list.forEach(doc => {
      if (!lookup[doc.section] && doc.url) lookup[doc.section] = doc.url; // first hit per section = newest
    });
    res.json({ success: true, media: lookup });
  } catch (err) {
    console.error('Public media fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;