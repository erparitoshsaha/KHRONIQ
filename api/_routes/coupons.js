import express from 'express';
import Coupon from '../_models/Coupon.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/coupons
// @desc    Get all active coupons
// @access  Public
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/coupons
// @desc    Add a coupon
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const { code, discountPercent, description } = req.body;

  try {
    const codeUpper = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: codeUpper });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = new Coupon({
      code: codeUpper,
      discountPercent: Number(discountPercent),
      description
    });

    const createdCoupon = await coupon.save();
    res.status(201).json({ success: true, coupon: createdCoupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/coupons/:code
// @desc    Delete a coupon
// @access  Private/Admin
router.delete('/:code', protect, adminOnly, async (req, res) => {
  try {
    const codeUpper = req.params.code.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: codeUpper });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await Coupon.deleteOne({ code: codeUpper });
    res.json({ success: true, message: 'Coupon removed' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
