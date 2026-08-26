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

export default router;