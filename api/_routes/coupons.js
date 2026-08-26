import express from 'express';
import Coupon from '../_models/Coupon.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/coupons
// @desc    Get all coupons
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
// @desc    Create a coupon
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const { code, discountPercent, description } = req.body;
  try {
    const coupon = new Coupon({ code, discountPercent: Number(discountPercent), description });
    const createdCoupon = await coupon.save();
    res.status(201).json({ success: true, coupon: createdCoupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/coupons/:code
// @desc    Delete a coupon
// @access  Private/Admin
router.delete('/:code', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ code: req.params.code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon removed' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;