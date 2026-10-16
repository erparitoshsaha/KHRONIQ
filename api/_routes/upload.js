import express from 'express';
import { imageUpload } from '../_middleware/upload.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/upload/proxy
// @desc    Proxy external images with CORS headers to prevent canvas tainting in admin cropper
// @access  Public / Authenticated
router.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).send('Invalid protocol');
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).send('Error proxying image: ' + err.message);
  }
});

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