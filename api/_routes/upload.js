import express from 'express';
import { imageUpload } from '../_middleware/upload.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Private/Admin
router.post('/', protect, adminOnly, (req, res, next) => {
  imageUpload.any()(req, res, (err) => {
    if (err) return next(err);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const uploaded = req.files[0];
    const imageUrl = uploaded.path || uploaded.secure_url || uploaded.url;

    if (!imageUrl) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve uploaded image URL' });
    }

    res.json({ success: true, imageUrl });
  });
});

export default router;