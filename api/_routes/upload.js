import express from 'express';
import upload from '../_middleware/upload.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Private/Admin
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  res.json({ success: true, imageUrl: req.file.path });
});

export default router;