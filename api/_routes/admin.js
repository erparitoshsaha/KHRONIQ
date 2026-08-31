import AdminSession from '../_models/AdminSession.js';
import LoginActivity from '../_models/LoginActivity.js';
import express from 'express';
import mongoose from 'mongoose';
import Order from '../_models/Order.js';
import Product from '../_models/Product.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/admin/analytics
// @desc    Get store analytics (revenue, orders, category sales, trends, best sellers, low stock)
// @access  Private/Admin
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    // 1. Total revenue & order status breakdown
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const ordersByStatus = {};
    statusCounts.forEach(s => { ordersByStatus[s._id] = s.count; });
    const totalOrders = await Order.countDocuments();

    // 2. Sales by category (unwind items, look up product category)
    const salesByCategory = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          let: {
            pid: {
              $cond: [
                { $regexMatch: { input: { $toString: '$items.productId' }, regex: /^[0-9a-fA-F]{24}$/ } },
                { $toObjectId: '$items.productId' },
                null
              ]
            }
          },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$pid'] } } }],
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$productInfo.category', 'Unknown'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // 3. Sales over last 7 days (by date)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesOverTime = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Best-selling products (by quantity sold)
    const bestSellers = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // 5. Low stock products (stock < 5, excluding fully out of stock — shown separately)
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
      .select('name stock category')
      .sort({ stock: 1 });

    const outOfStockCount = await Product.countDocuments({ stock: 0 });

    res.json({
      success: true,
      analytics: {
        totalRevenue,
        totalOrders,
        ordersByStatus,
        salesByCategory,
        salesOverTime,
        bestSellers,
        lowStockProducts,
        outOfStockCount
      }
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// @route   GET /api/admin/sessions
// @desc    Get all active admin sessions
// @access  Private/Admin
router.get('/sessions', protect, adminOnly, async (req, res) => {
  try {
    const sessions = await AdminSession.find({
      email: req.user.email,
      isRevoked: false
    }).sort({ lastActiveAt: -1 });

    res.json({
      success: true,
      currentSessionId: req.user.sessionId || req.sessionId || null,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ip: s.ip,
        location: s.location,
        loginMethod: s.loginMethod,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        isCurrent: Boolean((req.user.sessionId || req.sessionId) && (req.user.sessionId || req.sessionId) === s.sessionId)
      }))
    });
  } catch (error) {
    console.error('Fetch admin sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active sessions.' });
  }
});

// @route   GET /api/admin/login-activity
// @desc    Get recent admin login activities
// @access  Private/Admin
router.get('/login-activity', protect, adminOnly, async (req, res) => {
  try {
    const activities = await LoginActivity.find({
      email: req.user.email
    })
    .sort({ timestamp: -1 })
    .limit(50);

    res.json({
      success: true,
      activities: activities.map(a => ({
        id: a._id.toString(),
        status: a.status,
        failureReason: a.failureReason,
        sessionId: a.sessionId,
        deviceType: a.deviceType,
        browser: a.browser,
        os: a.os,
        ip: a.ip,
        location: a.location,
        loginMethod: a.loginMethod,
        timestamp: a.timestamp,
        logoutAt: a.logoutAt,
        isCurrent: Boolean((req.user.sessionId || req.sessionId) && (req.user.sessionId || req.sessionId) === a.sessionId)
      }))
    });
  } catch (error) {
    console.error('Fetch admin login activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch login activity.' });
  }
});

// @route   POST /api/admin/sessions/:sessionId/revoke
// @desc    Revoke specific session
// @access  Private/Admin
router.post('/sessions/:sessionId/revoke', protect, adminOnly, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AdminSession.findOne({ sessionId, email: req.user.email });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    session.revokedReason = 'Admin manual logout';
    await session.save();

    await LoginActivity.updateMany(
      { sessionId, logoutAt: null },
      { $set: { logoutAt: new Date() } }
    );

    res.json({ success: true, message: 'Session logged out successfully.' });
  } catch (error) {
    console.error('Revoke admin session error:', error);
    res.status(500).json({ success: false, message: 'Unable to revoke this session.' });
  }
});

// @route   POST /api/admin/sessions/revoke-others
// @desc    Revoke all other sessions except current
// @access  Private/Admin
router.post('/sessions/revoke-others', protect, adminOnly, async (req, res) => {
  try {
    const currentSessionId = req.user.sessionId || req.sessionId;
    const filter = {
      email: req.user.email,
      isRevoked: false
    };
    if (currentSessionId) {
      filter.sessionId = { $ne: currentSessionId };
    }

    const sessionsToRevoke = await AdminSession.find(filter);
    const sessionIds = sessionsToRevoke.map(s => s.sessionId);

    await AdminSession.updateMany(filter, {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Logged out all other sessions'
      }
    });

    await LoginActivity.updateMany(
      { sessionId: { $in: sessionIds }, logoutAt: null },
      { $set: { logoutAt: new Date() } }
    );

    res.json({ success: true, message: 'All other sessions have been logged out.' });
  } catch (error) {
    console.error('Revoke other admin sessions error:', error);
    res.status(500).json({ success: false, message: 'Unable to revoke other sessions.' });
  }
});

export default router;