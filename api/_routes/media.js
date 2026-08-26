import express from 'express';
import { protect, adminOnly } from '../_middleware/auth.js';
import upload from '../_middleware/upload.js';
import Media from '../_models/Media.js';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// POST /api/admin/media - upload images/videos (supports JSON Base64 or standard file upload)
router.post('/', protect, adminOnly, (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    return next();
  }
  upload.array('files', 12)(req, res, next);
}, async (req, res) => {
  try {
    const section = req.body.section || 'homepage';
    const type = req.body.type || 'image';

    if (req.body.url) {
      const media = await Media.create({
        url: req.body.url,
        publicId: '',
        type,
        section,
        uploadedBy: req.user?._id
      });
      return res.json({ success: true, media: [media] });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const created = [];
    for (const file of req.files) {
      const isVideo = file.mimetype && file.mimetype.startsWith('video');
      const media = await Media.create({
        url: file.path,
        publicId: file.filename || file.public_id || '',
        type: isVideo ? 'video' : 'image',
        section,
        uploadedBy: req.user?._id
      });
      created.push(media);
    }
    res.json({ success: true, media: created });
  } catch (err) {
    console.error('Media upload error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/media - list, optional ?section=...
router.get('/', protect, adminOnly, async (req, res) => {
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
router.delete('/:id', protect, adminOnly, async (req, res) => {
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

    await media.remove();
    res.json({ success: true });
  } catch (err) {
    console.error('Media delete error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// GET /api/admin/media/public - public, returns the latest image per section as { section: url }
router.get('/public', async (req, res) => {
  try {
    const list = await Media.find({ type: 'image' }).sort({ createdAt: -1 });
    const lookup = {};
    list.forEach(doc => {
      if (!lookup[doc.section]) lookup[doc.section] = doc.url; // first hit per section = newest
    });
    res.json({ success: true, media: lookup });
  } catch (err) {
    console.error('Public media fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;