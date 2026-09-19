import express from 'express';
import User from '../_models/User.js';
import Product from '../_models/Product.js';
import { protect } from '../_middleware/auth.js';

const router = express.Router();

const formatCartItem = (item) => {
  if (!item || !item.productId) return null;
  const prod = item.productId;
  const mrp = Number(prod.mrp !== undefined && prod.mrp !== null ? prod.mrp : prod.price) || 0;
  const discountPercent = Number(prod.discountPercent) || 0;
  let sp = mrp;
  if (prod.sellingPrice !== undefined && prod.sellingPrice !== null) {
    sp = Number(prod.sellingPrice) || 0;
  } else if (discountPercent > 0 && discountPercent <= 100) {
    sp = Math.round(mrp * (100 - discountPercent) / 100);
  }
  return {
    productId: prod._id,
    name: prod.name,
    image: prod.image,
    price: sp, // Selling Price (actual payable product price)
    mrp,       // Reference MRP
    stock: prod.stock,
    quantity: item.quantity
  };
};

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.productId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let cartModified = false;
    // Auto-clamp any item whose quantity exceeds available stock
    user.cart.forEach(item => {
      if (!item.productId) return;
      const availableStock = Math.max(0, item.productId.stock ?? 0);
      if (item.quantity > availableStock) {
        item.quantity = availableStock;
        cartModified = true;
      }
    });

    if (cartModified) {
      await user.save();
    }

    const cartItems = user.cart.map(formatCartItem).filter(Boolean);
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
      const product = await Product.findById(guestItem.productId);
      if (!product) continue;
      const availableStock = Math.max(0, product.stock ?? 0);
      const existingItem = mergedCart.find(item => item.productId.toString() === guestItem.productId);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const targetQty = Math.min(currentQty + (guestItem.quantity || 1), availableStock);
      if (targetQty > 0) {
        if (existingItem) {
          existingItem.quantity = targetQty;
        } else {
          mergedCart.push({
            productId: guestItem.productId,
            quantity: targetQty
          });
        }
      }
    }

    user.cart = mergedCart;
    await user.save();

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(formatCartItem).filter(Boolean);

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

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const availableStock = Math.max(0, product.stock ?? 0);
    const existingItem = user.cart.find(item => item.productId.toString() === productId);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty < availableStock) {
      const allowedAdd = Math.min(qty, availableStock - currentQty);
      if (existingItem) {
        existingItem.quantity += allowedAdd;
      } else {
        user.cart.push({ productId, quantity: allowedAdd });
      }
      await user.save();
    }

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(formatCartItem).filter(Boolean);

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

    const product = await Product.findById(productId);
    const availableStock = product ? Math.max(0, product.stock ?? 0) : 0;
    const requestedQty = parseInt(qty);
    const finalQty = Math.min(requestedQty, availableStock);

    if (finalQty <= 0) {
      user.cart = user.cart.filter(item => item.productId.toString() !== productId);
    } else {
      item.quantity = finalQty;
    }

    await user.save();

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(formatCartItem).filter(Boolean);

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
    const cartItems = populatedUser.cart.map(formatCartItem).filter(Boolean);

    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cart/remove
// @desc    Remove item from cart (compatibility endpoint)
// @access  Private
router.post('/remove', protect, async (req, res) => {
  const { productId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cart = user.cart.filter(item => item.productId.toString() !== productId);
    await user.save();

    const populatedUser = await User.findById(user._id).populate('cart.productId');
    const cartItems = populatedUser.cart.map(formatCartItem).filter(Boolean);

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
