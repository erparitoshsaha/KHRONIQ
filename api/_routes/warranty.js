import express from 'express';
import Order from '../_models/Order.js';
import { protect } from '../_middleware/auth.js';

const router = express.Router();

// @route   POST /api/warranty/lookup
// @desc    Get the logged-in user's purchased watches (serial numbers only — no claim codes)
// @access  Private
router.post('/lookup', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.user.email.toLowerCase() });

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
// @desc    Verify serial + claim code against a real order item, then mark it claimed
// @access  Private
router.post('/claim', protect, async (req, res) => {
  const { userName, serialNumber, specialCode, country, stateName, phoneNumber } = req.body;

  if (!userName || !serialNumber || !specialCode || !country || !stateName || !phoneNumber) {
    return res.status(400).json({ success: false, message: 'All registration parameters are required.' });
  }

  try {
    const order = await Order.findOne({
      userEmail: req.user.email.toLowerCase(),
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
        registeredEmail: req.user.email,
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