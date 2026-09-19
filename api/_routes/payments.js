import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Product from '../_models/Product.js';
import Order from '../_models/Order.js';
import Coupon from '../_models/Coupon.js';
import { protect } from '../_middleware/auth.js';
import { paymentLimiter } from '../_middleware/rateLimiter.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials not configured in environment.');
  }

  return new Razorpay({ key_id, key_secret });
};

// Helper: Calculate authoritative prices, validate stock, and apply coupon server-side
async function calculateAuthoritativeCart(items, couponCode) {
  if (!Array.isArray(items) || items.length === 0) {
    throw { statusCode: 400, message: 'Cart items cannot be empty.' };
  }

  let mrpTotal = 0;
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw { statusCode: 400, message: `Invalid quantity for item: ${item.productId}` };
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      throw { statusCode: 404, message: `Product not found: ${item.productId}` };
    }

    if (product.stock < qty) {
      throw {
        statusCode: 400,
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${qty}.`
      };
    }

    // Authoritatively determine MRP and Selling Price (SP)
    const mrp = Number(product.mrp !== undefined && product.mrp !== null ? product.mrp : product.price) || 0;
    const discountPercent = Number(product.discountPercent) || 0;
    let sp = mrp;
    if (product.sellingPrice !== undefined && product.sellingPrice !== null) {
      sp = Number(product.sellingPrice) || 0;
    } else if (discountPercent > 0 && discountPercent <= 100) {
      sp = Math.round(mrp * (100 - discountPercent) / 100);
    }

    mrpTotal += mrp * qty;
    subtotal += sp * qty;

    validatedItems.push({
      productId: product._id.toString(),
      name: product.name,
      price: sp, // Authoritative Selling Price
      mrp,
      quantity: qty,
      image: product.image,
      warrantyMonths: product.warrantyMonths || 12
    });
  }

  let discount = 0;
  let appliedCouponDoc = null;

  if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
    const cleanCode = couponCode.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: cleanCode });
    if (coupon && coupon.discountPercent > 0) {
      discount = Math.round(subtotal * (coupon.discountPercent / 100));
      appliedCouponDoc = coupon;
    }
  }

  const finalSellingPrice = Math.max(0, subtotal - discount);
  // GST is 18% INCLUDED in the Selling Price: GST = SP * 18 / 118
  const gst = Math.round(((finalSellingPrice * 18) / 118) * 100) / 100;
  const basePrice = Math.round(((finalSellingPrice * 100) / 118) * 100) / 100;
  // Total customer payment is the final Selling Price (do NOT add GST again)
  const total = finalSellingPrice;

  return {
    mrpTotal,
    subtotal,
    discount,
    gst,
    basePrice,
    total,
    validatedItems,
    appliedCoupon: appliedCouponDoc
  };
}

// @route   POST /api/payments/create-order
// @desc    Calculate authoritative price and initiate Razorpay order
// @access  Private
router.post('/create-order', protect, paymentLimiter, async (req, res, next) => {
  const { items, couponCode } = req.body;

  try {
    const razorpay = getRazorpayInstance();

    // 1. Authoritative price calculation directly from DB
    const { subtotal, discount, gst, total, validatedItems } = await calculateAuthoritativeCart(items, couponCode);

    if (total <= 0) {
      return res.status(400).json({ success: false, message: 'Total order amount must be greater than zero.' });
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(total * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      notes: {
        userEmail: req.user.email,
        itemCount: validatedItems.length.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID,
      summary: {
        subtotal,
        discount,
        gst,
        total
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Razorpay create-order error:', error);
    next(error);
  }
});

// @route   POST /api/payments/verify
// @desc    Verify payment signature, atomic stock deduction, create paid order
// @access  Private
router.post('/verify', protect, paymentLimiter, async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items,
    couponCode,
    shippingDetails,
    giftingOptions
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing required Razorpay payment credentials.' });
  }

  if (!shippingDetails || !shippingDetails.fullName || !shippingDetails.streetAddress || !shippingDetails.city || !shippingDetails.zipCode) {
    return res.status(400).json({ success: false, message: 'Incomplete shipping address.' });
  }

  try {
    // 1. Signature Verification (HMAC SHA-256)
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('RAZORPAY_KEY_SECRET is not configured.');
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn(`[SECURITY] Invalid Razorpay signature attempt by ${req.user.email}`);
      return res.status(400).json({ success: false, message: 'Payment verification signature failed.' });
    }

    // 2. Idempotency Check: check if this payment was already verified and created
    const existingOrder = await Order.findOne({
      $or: [
        { razorpayPaymentId: razorpay_payment_id },
        { razorpayOrderId: razorpay_order_id }
      ]
    });

    if (existingOrder) {
      return res.json({
        success: true,
        order: existingOrder,
        message: 'Order already verified and processed.'
      });
    }

    // 3. Authoritative server-side price calculation
    const { subtotal, discount, total, validatedItems } = await calculateAuthoritativeCart(items, couponCode);

    // 4. Atomic stock deduction
    const deductedProducts = [];
    let stockFailure = false;
    let failedItemName = '';

    for (const item of validatedItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        stockFailure = true;
        failedItemName = item.name;
        break;
      }

      deductedProducts.push({ productId: item.productId, quantity: item.quantity });
    }

    // If stock deduction failed for any item, rollback deducted items
    if (stockFailure) {
      for (const roll of deductedProducts) {
        await Product.updateOne({ _id: roll.productId }, { $inc: { stock: roll.quantity } });
      }
      return res.status(400).json({
        success: false,
        message: `Unable to complete order. Stock ran out for ${failedItemName}.`
      });
    }

    // 5. Generate unique custom order ID, serial numbers, and warranty claim codes
    const randomSuffix = crypto.randomInt(100000, 1000000).toString();
    const orderCustomId = `Z-${randomSuffix}`;

    const dbItems = [];
    let unitIndex = 0;
    const currentYear = new Date().getFullYear();

    for (const item of validatedItems) {
      for (let unit = 1; unit <= item.quantity; unit++) {
        unitIndex++;
        const serialNumber = `KHQ-${currentYear}-${randomSuffix}-${String(unitIndex).padStart(2, '0')}`;
        const claimCode = `CLM-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

        dbItems.push({
          productId: item.productId,
          name: item.name,
          price: item.price,
          mrp: item.mrp,
          quantity: 1,
          image: item.image,
          serialNumber,
          claimCode,
          warrantyClaimed: false,
          warrantyMonths: item.warrantyMonths || 12
        });
      }
    }

    // 6. Create Paid Order in Database
    const order = new Order({
      id: orderCustomId,
      userEmail: req.user.email,
      userName: req.user.name,
      items: dbItems,
      subtotal,
      discount,
      total,
      shippingDetails: {
        fullName: shippingDetails.fullName.trim(),
        streetAddress: shippingDetails.streetAddress.trim(),
        city: shippingDetails.city.trim(),
        zipCode: shippingDetails.zipCode.trim(),
        country: shippingDetails.country || 'India'
      },
      paymentDetails: {
        method: 'Razorpay',
        last4: razorpay_payment_id.slice(-4)
      },
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'Paid',
      giftingOptions: giftingOptions || { isGifting: false }
    });

    const createdOrder = await order.save();

    // 7. Send confirmation email asynchronously (non-blocking)
    try {
      const itemsHtml = dbItems.map(item => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">1</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const warrantyHtml = dbItems.map(item => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;">${item.serialNumber}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;">${item.claimCode}</td>
        </tr>
      `).join('');

      sendEmail({
        to: req.user.email,
        subject: `KHRONIQ Watches - Order Confirmation ${orderCustomId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px;">
            <h2 style="color: #1f4d3a;">Thank you for your order, ${req.user.name}!</h2>
            <p>Your order <strong>${orderCustomId}</strong> has been successfully placed and confirmed.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #333;">Item</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #333;">Qty</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #333;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <p>Subtotal: ₹${subtotal.toLocaleString('en-IN')}</p>
            <p>GST (18% included): ₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            ${discount > 0 ? `<p style="color: #1f4d3a;">Discount: -₹${discount.toLocaleString('en-IN')}</p>` : ''}
            <p style="font-size: 16px; font-weight: bold;">Total Paid: ₹${total.toLocaleString('en-IN')}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <h3 style="margin-bottom: 6px;">Warranty Registration Information</h3>
            <p style="font-size: 12px; color: #666;">Keep this email safe — use your Claim Code to register your timepiece warranty.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px;">
              <thead>
                <tr>
                  <th style="padding: 6px 8px; text-align: left; border-bottom: 2px solid #333;">Watch</th>
                  <th style="padding: 6px 8px; text-align: left; border-bottom: 2px solid #333;">Serial</th>
                  <th style="padding: 6px 8px; text-align: left; border-bottom: 2px solid #333;">Claim Code</th>
                </tr>
              </thead>
              <tbody>${warrantyHtml}</tbody>
            </table>
            <p style="color: #888; font-size: 11px;">Payment ID: ${razorpay_payment_id}</p>
          </div>
        `
      }).catch(err => console.error('[EMAIL] Failed to send order receipt:', err.message));
    } catch (e) {
      console.error('[EMAIL] Unexpected error preparing receipt:', e);
    }

    res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    console.error('Payment verification error:', error);
    next(error);
  }
});

// @route   POST /api/payments/webhook
// @desc    Razorpay Webhook Handler for asynchronous reconciliation
// @access  Public (Signature Verified)
router.post('/webhook', async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!webhookSignature || !webhookSecret) {
    return res.status(400).json({ status: 'ignored', message: 'Missing signature or webhook secret' });
  }

  try {
    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      console.warn('[SECURITY] Invalid Razorpay webhook signature.');
      return res.status(400).json({ status: 'invalid_signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId || paymentId) {
        const order = await Order.findOne({
          $or: [
            ...(orderId ? [{ razorpayOrderId: orderId }] : []),
            ...(paymentId ? [{ razorpayPaymentId: paymentId }] : [])
          ]
        });

        if (order) {
          order.webhookProcessed = true;
          if (order.status !== 'Paid') {
            order.status = 'Paid';
          }
          await order.save();
          console.log(`[WEBHOOK] Successfully reconciled payment for order: ${order.id}`);
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    res.status(500).json({ status: 'error', message: 'Webhook handling error' });
  }
});

export default router;