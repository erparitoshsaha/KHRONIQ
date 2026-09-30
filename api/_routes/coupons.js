import express from 'express';
import Coupon from '../_models/Coupon.js';
import { protect, adminOnly, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

export const DEFAULT_COUPONS = [
  { code: 'FIRST20', discountPercent: 20, description: '20% off on your first luxury timepiece purchase' },
  { code: 'KHRONIQSTAR', discountPercent: 20, description: '20% off Khroniq Signature Collection' },
  { code: 'WELCOME10', discountPercent: 10, description: '10% off for first-time buyers' }
];

// Helper: Seed initial default coupons safely and idempotently
export async function seedDefaultCouponsSafe() {
  try {
    for (const c of DEFAULT_COUPONS) {
      const exists = await Coupon.findOne({ code: c.code });
      if (!exists) {
        await Coupon.create(c);
        console.log(`[SEED] Seeded default coupon: ${c.code}`);
      }
    }
  } catch (err) {
    console.error('Error seeding default coupons:', err);
  }
}

// Helper: Resilient case-insensitive coupon lookup with fallback to default seeding
export async function findCouponByCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) return null;
  const cleanCode = rawCode.toUpperCase().trim();
  const escaped = cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let coupon = await Coupon.findOne({
    $or: [
      { code: cleanCode },
      { code: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') } }
    ]
  });

  if (!coupon) {
    const isDefaultCode = DEFAULT_COUPONS.some(c => c.code === cleanCode);
    const totalCount = await Coupon.countDocuments();
    if (isDefaultCode || totalCount === 0) {
      await seedDefaultCouponsSafe();
      coupon = await Coupon.findOne({ code: cleanCode });
    }
    if (!coupon && isDefaultCode) {
      return DEFAULT_COUPONS.find(c => c.code === cleanCode) || null;
    }
  }

  return coupon;
}

// @route   GET /api/coupons
// @desc    Get all active coupons
// @access  Public
router.get('/', async (req, res) => {
  try {
    let coupons = await Coupon.find({});
    if (!coupons || coupons.length === 0) {
      await seedDefaultCouponsSafe();
      coupons = await Coupon.find({});
    }
    res.json({ success: true, coupons: coupons.length > 0 ? coupons : DEFAULT_COUPONS });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    res.json({ success: true, coupons: DEFAULT_COUPONS });
  }
});

// @route   POST /api/coupons
// @desc    Add a coupon
// @access  Private/Admin
router.post('/', protect, requirePermission('coupons'), async (req, res) => {
  const { code, discountPercent, description } = req.body;

  try {
    const codeUpper = (code || '').toUpperCase().trim();
    if (!codeUpper) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }
    const existing = await Coupon.findOne({ code: codeUpper });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = new Coupon({
      code: codeUpper,
      discountPercent: Number(discountPercent),
      description: description || `${Number(discountPercent)}% discount`
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
router.delete('/:code', protect, requirePermission('coupons'), async (req, res) => {
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

// @route   POST /api/coupons/validate
// @desc    Validate coupon code and return discount details
// @access  Public
router.post('/validate', async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
  }

  try {
    const coupon = await findCouponByCode(code);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    }

    const numSubtotal = Number(subtotal) || 0;
    const discountAmount = Math.round((numSubtotal * (coupon.discountPercent || 0)) / 100);

    return res.json({
      success: true,
      message: 'Coupon applied successfully!',
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountAmount,
        description: coupon.description || `${coupon.discountPercent}% discount`
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
});

export default router;
