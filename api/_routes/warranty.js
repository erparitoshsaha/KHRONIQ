import express from 'express';
import Order from '../_models/Order.js';
import { protect } from '../_middleware/auth.js';

const router = express.Router();

// @route   POST /api/warranty/lookup
// @desc    Get purchased watches for warranty registration (serial numbers only — no claim codes).
//          Regular customers are always locked to their own JWT email — the 'email' field in the
//          request body is only honored when the requester is an admin, so a customer can never
//          spoof another user's email to see their purchases.
// @access  Private
router.post('/lookup', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const requestedEmail = typeof req.body.email === 'string' ? req.body.email.trim() : '';

    if (isAdmin && !requestedEmail) {
      return res.status(400).json({ success: false, message: 'Please provide the customer\'s email to look up.' });
    }

    const targetEmail = (isAdmin ? requestedEmail : req.user.email).toLowerCase();

    const orders = await Order.find({ userEmail: targetEmail });

    const purchases = [];
    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      order.items.forEach(item => {
        if (!item.serialNumber) return; // older orders placed before this feature won't have one
        purchases.push({
          productId: item.productId,
          name: item.name,
          image: item.image,
          serialNumber: item.serialNumber,
          orderId: order.id,
          date: order.date,
          claimed: !!item.warrantyClaimed,
          warrantyMonths: item.warrantyMonths || 6
        });
      });
    });

    res.json({ success: true, purchases });
  } catch (error) {
    console.error('Warranty lookup error:', error);
    res.status(500).json({ success: false, message: 'Server error during lookup.' });
  }
});

// @route   POST /api/warranty/claim
// @desc    Verify serial + claim code against a real order item, then mark it claimed.
//          Same admin-override rule as /lookup: 'email' in the body is only honored for admins.
// @access  Private
router.post('/claim', protect, async (req, res) => {
  const { userName, serialNumber, specialCode, country, stateName, phoneNumber } = req.body;

  if (!userName || !serialNumber || !specialCode || !country || !stateName || !phoneNumber) {
    return res.status(400).json({ success: false, message: 'All registration parameters are required.' });
  }

  try {
    const isAdmin = req.user.role === 'admin';
    const requestedEmail = typeof req.body.email === 'string' ? req.body.email.trim() : '';

    if (isAdmin && !requestedEmail) {
      return res.status(400).json({ success: false, message: 'Please provide the customer\'s email.' });
    }

    const targetEmail = (isAdmin ? requestedEmail : req.user.email).toLowerCase();

    const order = await Order.findOne({
      userEmail: targetEmail,
      'items.serialNumber': serialNumber
    });

    if (!order) {
      return res.status(400).json({ success: false, message: 'Invalid serial number or claim code.' });
    }

    const item = order.items.find(i => i.serialNumber === serialNumber);

    if (!item || item.claimCode !== specialCode) {
      return res.status(400).json({ success: false, message: 'Invalid serial number or claim code.' });
    }

    if (item.warrantyClaimed) {
      return res.status(400).json({ success: false, message: 'This warranty has already been claimed.' });
    }

    item.warrantyClaimed = true;
    item.warrantyClaimedAt = new Date();
    item.warrantyCountry = country;
    item.warrantyState = stateName;
    item.warrantyPhoneNumber = phoneNumber;
    await order.save();

    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + (item.warrantyMonths || 6));
    const formattedExpiry = expirationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    res.json({
      success: true,
      message: 'Warranty registered successfully!',
      details: {
        status: 'Active & Certified',
        registeredTo: userName,
        registeredEmail: targetEmail,
        watchModel: item.name,
        warrantyMonths: item.warrantyMonths || 6,
        serialNumber: item.serialNumber,
        claimCode: item.claimCode,
        expiryDate: formattedExpiry
      }
    });
  } catch (error) {
    console.error('Warranty claim error:', error);
    res.status(500).json({ success: false, message: 'Server error during claim.' });
  }
});

export default router;