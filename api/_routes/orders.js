import express from 'express';
import Razorpay from 'razorpay';
import Order from '../_models/Order.js';
import Product from '../_models/Product.js';
import { protect, adminOnly } from '../_middleware/auth.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Shared by both the customer-facing /:id/cancel route and the admin-facing /:id/status route,


const processCancellationRefund = async (order) => {
  // Idempotency guard — never refund the same order twice.
  if (order.refund && order.refund.status === 'processed') {
    return;
  }

  const paymentId = order.paymentDetails?.razorpayPaymentId;

  if (!paymentId) {
    // without one) — nothing to refund automatically. Flag it so admin can handle manually.
    order.refund = {
      status: 'manual_required',
      amount: order.total,
      failureReason: 'No Razorpay payment ID on this order — refund must be issued manually.'

    };

    await order.save();

    try {
      await sendEmail({
        to: order.userEmail,
        subject: `KHRONIQ Watches - Order ${order.id} Cancelled`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">

            <h2>Your order has been cancelled</h2>
            <p>Hi ${order.userName},</p>

            <p>Your order <strong>${order.id}</strong> has been cancelled. Our team will process your refund of ₹${order.total.toLocaleString()} manually and confirm once complete.</p>

          </div>

        `
      });

    } catch (emailError) {
      console.error('Cancellation email failed to send:', emailError);
    }
    return;
  }
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(order.total * 100) // paise
    });

    order.refund = {
      status: 'processed',
      refundId: refund.id,
      amount: order.total,
      refundedAt: new Date()
    };
    await order.save();
    try {
      await sendEmail({
        to: order.userEmail,
        subject: `KHRONIQ Watches - Order ${order.id} Cancelled & Refunded`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <h2>Your order has been cancelled and refunded</h2>
            <p>Hi ${order.userName},</p>

            <p>Your order <strong>${order.id}</strong> has been cancelled. A full refund of <strong>₹${order.total.toLocaleString()}</strong> has been issued to your original payment method.</p>

            <p style="color:#888;font-size:12px;">Refunds typically take 5-7 business days to reflect, depending on your bank.</p>

            <p style="color:#888;font-size:12px;">Refund ID: ${refund.id}</p>

          </div>
        `
      });
    } catch (emailError) {
      console.error('Refund confirmation email failed to send:', emailError);
    }
  } catch (refundError) {
    console.error('Razorpay refund failed:', refundError);
    order.refund = {
      status: 'failed',
      amount: order.total,
      failureReason: refundError?.error?.description || refundError.message || 'Refund failed'
    };
    await order.save();
    try {
      await sendEmail({
        to: order.userEmail,
        subject: `KHRONIQ Watches - Order ${order.id} Cancelled`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">

            <h2>Your order has been cancelled</h2>

            <p>Hi ${order.userName},</p>

            <p>Your order <strong>${order.id}</strong> has been cancelled. We ran into an issue processing your refund automatically — our team has been notified and will process your refund of ₹${order.total.toLocaleString()} manually.</p>

          </div>

        `
      });
    } catch (emailError) {
      console.error('Cancellation email failed to send:', emailError);
    }
  }
};


// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res) => {
  const { items, subtotal, discount, total, shippingDetails, paymentDetails, giftingOptions } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No order items' });
  }
  try {
    // 1. Verify stock of all products first
    for (const item of items) {

      const product = await Product.findById(item.productId);

      if (!product) {

        return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });

      }

      if (product.stock < item.quantity) {

        return res.status(400).json({ 

          success: false, 

          message: `Insufficient stock for ${product.name}. Only ${product.stock} items left.` 

        });

      }

    }



    // 2. Deduct stock

    const dbItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();
      dbItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      });
    }

    // Generate Z-ID
    const randomId = 'Z-' + Math.floor(100000 + Math.random() * 900000);
    const order = new Order({
      id: randomId,
      userEmail: req.user.email,
      userName: req.user.name,
      items: dbItems,
      subtotal: Number(subtotal),
      discount: Number(discount),
      total: Number(total),
      shippingDetails,
      paymentDetails: {
        method: paymentDetails.method,
        last4: paymentDetails.cardNumber ? paymentDetails.cardNumber.slice(-4) : 'UPI'
      },

      status: 'Paid', // Standard in this app is mock instant payment
      giftingOptions: giftingOptions || { isGifting: false }
    });

    const createdOrder = await order.save();
    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// @route   GET /api/orders
// @desc    Get logged in user orders or all orders (if admin)
// @access  Private

router.get('/', protect, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find({}).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @access  Private/Admin

router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const wasAlreadyCancelled = order.status === 'Cancelled';
    order.status = status;

    // Mirror /:id/cancel's behavior when admin cancels via this route too — restore stock
    // and process the refund, so the outcome is identical no matter which UI path was used.
    if (status === 'Cancelled' && !wasAlreadyCancelled) {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      await order.save();
      await processCancellationRefund(order);
    } else {
      await order.save();
    }
    res.json({ success: true, order });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order (customer or admin)
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {

  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Authorization check

    if (req.user.role !== 'admin' && order.userEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied: not your order' });

    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    if (order.status === 'Shipped') {
      return res.status(400).json({ success: false, message: 'Orders cannot be cancelled after shipping.' });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'Cancelled';
    await order.save();
    await processCancellationRefund(order);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// @route   PUT /api/orders/:id/items/:itemIndex/warranty

// @desc    Manually set/override serial number and/or claim code for a specific order item.

//          Only overwrites fields actually provided — leaves auto-generated values untouched otherwise.

//          Notifies the customer by email if either value actually changed.

// @access  Private/Admin

router.put('/:id/items/:itemIndex/warranty', protect, adminOnly, async (req, res) => {
  const { serialNumber, claimCode } = req.body;
  const itemIndex = Number(req.params.itemIndex);
  try {

    const order = await Order.findOne({ id: req.params.id });

    if (!order) {

      return res.status(404).json({ success: false, message: 'Order not found' });

    }



    const item = order.items[itemIndex];
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const oldSerialNumber = item.serialNumber;
    const oldClaimCode = item.claimCode;
    let changed = false;

    if (serialNumber !== undefined && serialNumber.trim() !== '' && serialNumber.trim() !== oldSerialNumber) {
      const duplicate = await Order.findOne({ id: { $ne: order.id }, 'items.serialNumber': serialNumber.trim() });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'This serial number is already assigned to another item.' });
      }
      item.serialNumber = serialNumber.trim();
      changed = true;
    }

    if (claimCode !== undefined && claimCode.trim() !== '' && claimCode.trim() !== oldClaimCode) {
      const duplicate = await Order.findOne({ id: { $ne: order.id }, 'items.claimCode': claimCode.trim() });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'This claim code is already assigned to another item.' });
      }
      item.claimCode = claimCode.trim();
      changed = true;
    }
    const updatedOrder = await order.save();

    // Notify the customer — their previously emailed serial/claim code is no longer valid
    if (changed) {
      try {
        await sendEmail({
          to: order.userEmail,
          subject: `KHRONIQ Watches - Warranty Details Updated (Order ${order.id})`,
          html: `

            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">

              <h2>Warranty details updated</h2>

              <p>Hi ${order.userName},</p>

              <p>The warranty registration details for <strong>${item.name}</strong> in your order <strong>${order.id}</strong> have been updated by our team.</p>

              <p style="color:#c0392b;font-size:12px;">Any serial number or claim code previously sent to you for this item is no longer valid. Please use the details below going forward.</p>

              <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">

                <tr>

                  <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:bold;">Serial Number</td>

                  <td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;">${item.serialNumber}</td>

                </tr>

                <tr>

                  <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:bold;">Claim Code</td>

                  <td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;">${item.claimCode}</td>

                </tr>

              </table>

              <p style="color:#888;font-size:12px;">Keep this email — you'll need the Claim Code to register your warranty on our site.</p>

            </div>

          `
        });
      } catch (emailError) {
        console.error('Warranty update email failed to send:', emailError);
        // Don't fail the request over this — the DB update already succeeded.
      }
    }
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update item warranty error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/exchange-refund
// @access  Private

router.put('/:id/exchange-refund', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && order.userEmail !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Access denied: not your order' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Exchange/Refund can only be requested after the order has been delivered.' });
    }
    order.status = 'Exchange/Refund Requested';
    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Request exchange/refund error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

export default router;