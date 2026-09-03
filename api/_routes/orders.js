import express from 'express';
import Order from '../_models/Order.js';
import Product from '../_models/Product.js';
import { protect, adminOnly, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/orders
// @desc    Get logged in user orders or all orders (if admin)
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let orders;
    const canViewAll = req.user.role === 'super_admin' || (req.user.role === 'admin' && req.user.permissions?.includes('orders'));
    if (canViewAll) {
      orders = await Order.find({}).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    }
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get order details by order ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ id: req.params.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    const isPrivileged = req.user.role === 'super_admin' || (req.user.role === 'admin' && req.user.permissions?.includes('orders'));
    if (!isPrivileged && order.userEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this order.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    next(error);
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, requirePermission('orders'), async (req, res, next) => {
  const { status } = req.body;

  const validStatuses = ['Paid', 'Pending', 'Processing', 'Cancelled', 'Shipped', 'Delivered', 'Exchange/Refund Requested'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
  }

  try {
    const order = await Order.findOne({ id: req.params.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update status error:', error);
    next(error);
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order with atomic stock restoration
// @access  Private
router.put('/:id/cancel', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ id: req.params.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check: only order owner or privileged admin can cancel
    const isPrivileged = req.user.role === 'super_admin' || (req.user.role === 'admin' && req.user.permissions?.includes('orders'));
    if (!isPrivileged && order.userEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied: not your order' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    if (order.status === 'Shipped' || order.status === 'Delivered') {
      return res.status(400).json({ success: false, message: 'Orders cannot be cancelled once shipped or delivered.' });
    }

    // Atomic stock restoration for every item
    for (const item of order.items) {
      if (item.productId) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    order.status = 'Cancelled';
    const updatedOrder = await order.save();

    res.json({ success: true, order: updatedOrder, message: 'Order cancelled and stock restored.' });
  } catch (error) {
    console.error('Cancel order error:', error);
    next(error);
  }
});

// @route   PUT /api/orders/:id/exchange-refund
// @desc    Request Exchange/Refund for a delivered order
// @access  Private
router.put('/:id/exchange-refund', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ id: req.params.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    const isPrivileged = req.user.role === 'super_admin' || (req.user.role === 'admin' && req.user.permissions?.includes('orders'));
    if (!isPrivileged && order.userEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied: not your order' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Exchange/Refund can only be requested after the order has been marked as Delivered.'
      });
    }

    if (order.status === 'Exchange/Refund Requested') {
      return res.status(400).json({ success: false, message: 'Exchange/Refund is already requested for this order.' });
    }

    order.status = 'Exchange/Refund Requested';
    const updatedOrder = await order.save();

    res.json({ success: true, order: updatedOrder, message: 'Exchange/Refund request submitted.' });
  } catch (error) {
    console.error('Request exchange/refund error:', error);
    next(error);
  }
});

export default router;
