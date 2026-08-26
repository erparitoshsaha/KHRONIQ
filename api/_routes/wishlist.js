import express from 'express';
import User from '../_models/User.js';
import { protect } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/wishlist/toggle
// @desc    Add/remove item from wishlist
// @access  Private
router.post('/toggle', protect, async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const wishlistStrings = user.wishlist.map(id => id.toString());
    const index = wishlistStrings.indexOf(productId.toString());
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    
    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
