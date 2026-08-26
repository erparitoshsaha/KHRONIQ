import express from 'express';
import upload from '../_middleware/upload.js';
import { protect, adminOnly } from '../_middleware/auth.js';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Private/Admin
router.post('/', protect, adminOnly, (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    return next();
  }
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    if (req.body.image) {
      try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          throw new Error('Cloudinary credentials not configured');
        }
        // Base64 upload
        const uploadResponse = await cloudinary.uploader.upload(req.body.image, {
          folder: 'zenith-watches',
        });
        return res.json({ success: true, imageUrl: uploadResponse.secure_url });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError.message);
        return res.status(500).json({ success: false, message: `Cloudinary upload failed: ${cloudinaryError.message}` });
      }
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    res.json({ success: true, imageUrl: req.file.path });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server upload error' });
  }
});

export default router;