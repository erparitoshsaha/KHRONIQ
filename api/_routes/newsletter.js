import express from 'express';
import Subscriber from '../_models/Subscriber.js';
import { newsletterLimiter } from '../_middleware/rateLimiter.js';

const router = express.Router();

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe an email address to the newsletter
// @access  Public (Rate-limited)
router.post('/subscribe', newsletterLimiter, async (req, res, next) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Please provide an email address.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const emailRegex = /^\S+@\S+\.\S+$/;

  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    const existing = await Subscriber.findOne({ email: cleanEmail });

    if (existing) {
      return res.json({
        success: true,
        message: 'You are already subscribed to the KHRONIQ Gazette.'
      });
    }

    await Subscriber.create({ email: cleanEmail });

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to the KHRONIQ Gazette!'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: 'You are already subscribed to the KHRONIQ Gazette.'
      });
    }
    console.error('Newsletter subscription error:', error);
    next(error);
  }
});

export default router;
