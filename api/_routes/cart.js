import express from 'express';
import User from '../_models/User.js';
import { protect } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.productId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Format cart to send to client
    const cartItems = user.cart.map(item => {
      if (!item.productId) return null;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        price: item.productId.price,
        stock: item.productId.stock,
        quantity: item.quantity
      };
    }).filter(Boolean);

    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cart/sync
// @desc    Sync guest cart with database cart (merge logic)
// @access  Private
router.post('/sync', protect, async (req, res) => {
  const { guestCart } = req.body;

  if (!Array.isArray(guestCart)) {
    return res.status(400).json({ success: false, message: 'Invalid guest cart data' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const mergedCart = [...user.cart];

    for (const guestItem of guestCart) {
      const existingItem = mergedCart.find(item => item.productId.toString() === guestItem.productId);
      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        mergedCart.push({
          productId: guestItem.productId,
          quantity: guestItem.quantity
        });
      }
    }

    user.cart = mergedCart;
    await user.save();

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(item => {
      if (!item.productId) return null;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        price: item.productId.price,
        stock: item.productId.stock,
        quantity: item.quantity
      };
    }).filter(Boolean);

    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', protect, async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID required' });
  }

  const qty = quantity ? parseInt(quantity) : 1;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingItem = user.cart.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      user.cart.push({ productId, quantity: qty });
    }

    await user.save();

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(item => {
      if (!item.productId) return null;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        price: item.productId.price,
        stock: item.productId.stock,
        quantity: item.quantity
      };
    }).filter(Boolean);

    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cart/update
// @desc    Update item quantity in cart
// @access  Private
router.post('/update', protect, async (req, res) => {
  const { productId, qty } = req.body;

  if (!productId || qty === undefined) {
    return res.status(400).json({ success: false, message: 'Product ID and quantity required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const item = user.cart.find(item => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    item.quantity = parseInt(qty);
    if (item.quantity <= 0) {
      user.cart = user.cart.filter(item => item.productId.toString() !== productId);
    }

    await user.save();

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(item => {
      if (!item.productId) return null;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        price: item.productId.price,
        stock: item.productId.stock,
        quantity: item.quantity
      };
    }).filter(Boolean);

    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/cart/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  const { productId } = req.params;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = user.cart.filter(item => item.productId.toString() !== productId);
    await user.save();

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(item => {
      if (!item.productId) return null;
      return {
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        price: item.productId.price,
        stock: item.productId.stock,
        quantity: item.quantity
      };
    }).filter(Boolean);

    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cart/clear
// @desc    Clear user's cart
// @access  Private
router.post('/clear', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = [];
    await user.save();

    res.json({ success: true, cart: [] });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
