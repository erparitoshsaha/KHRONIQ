import AdminSession from '../_models/AdminSession.js';
import LoginActivity from '../_models/LoginActivity.js';
import express from 'express';
import mongoose from 'mongoose';
import Order from '../_models/Order.js';
import Product from '../_models/Product.js';
import User from '../_models/User.js';
import { protect, adminOnly, requireSuperAdmin, requirePermission } from '../_middleware/auth.js';
import { VALID_PERMISSIONS } from '../_constants/permissions.js';

const router = express.Router();
router.use(express.json());

// @route   GET /api/admin/analytics
// @desc    Get store analytics (revenue, orders, category sales, trends, best sellers, low stock)
// @access  Private/Admin (Super Admin or Admin with analytics permission)
router.get('/analytics', protect, requirePermission('analytics'), async (req, res) => {
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

    // 2. Sales Analytics: Multi-view (Collection, Individual Watch, Gender)
    // Query current products from database
    const currentProducts = await Product.find({})
      .select('name category gender price stock')
      .lean();

    // Fast lookup maps for current products
    const productById = new Map();
    const productByName = new Map();

    currentProducts.forEach(p => {
      const idStr = p._id ? p._id.toString() : '';
      if (idStr) productById.set(idStr, p);
      const cleanName = (p.name || '').trim().toLowerCase();
      if (cleanName && !productByName.has(cleanName)) {
        productByName.set(cleanName, p);
      }
    });

    // Tracking maps initialized for all current catalog items
    const productRevenue = new Map();
    currentProducts.forEach(p => productRevenue.set(p._id.toString(), 0));

    // Dynamic collections derived strictly from current products (canonical field: category)
    const collectionRevenue = new Map();
    currentProducts.forEach(p => {
      const col = (p.category || 'Unassigned').trim();
      if (col && !collectionRevenue.has(col)) {
        collectionRevenue.set(col, 0);
      }
    });

    // Dynamic genders derived strictly from current products (canonical field: gender)
    const genderLabels = {
      men: "Men's",
      women: "Women's",
      unisex: "Unisex"
    };
    const genderRevenue = new Map();
    currentProducts.forEach(p => {
      const gRaw = (p.gender || 'unisex').trim().toLowerCase();
      const gLabel = genderLabels[gRaw] || (gRaw.charAt(0).toUpperCase() + gRaw.slice(1));
      if (!genderRevenue.has(gLabel)) {
        genderRevenue.set(gLabel, 0);
      }
    });

    // Query completed/valid non-cancelled orders to aggregate real revenue
    const nonCancelledOrders = await Order.find(
      { status: { $ne: 'Cancelled' } },
      'items.productId items.name items.price items.quantity'
    ).lean();

    nonCancelledOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const rev = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        const pid = item.productId ? item.productId.toString().trim() : '';
        const pname = item.name ? item.name.trim().toLowerCase() : '';

        let matchedProduct = null;
        if (pid && productById.has(pid)) {
          matchedProduct = productById.get(pid);
        } else if (pname && productByName.has(pname)) {
          matchedProduct = productByName.get(pname);
        }

        if (matchedProduct) {
          const mId = matchedProduct._id.toString();
          productRevenue.set(mId, (productRevenue.get(mId) || 0) + rev);

          const col = (matchedProduct.category || 'Unassigned').trim();
          if (collectionRevenue.has(col)) {
            collectionRevenue.set(col, (collectionRevenue.get(col) || 0) + rev);
          }

          const gRaw = (matchedProduct.gender || 'unisex').trim().toLowerCase();
          const gLabel = genderLabels[gRaw] || (gRaw.charAt(0).toUpperCase() + gRaw.slice(1));
          if (genderRevenue.has(gLabel)) {
            genderRevenue.set(gLabel, (genderRevenue.get(gLabel) || 0) + rev);
          }
        }
      });
    });

    // 1. Sales by Collection (Default View): sorted descending by revenue
    const salesByCollection = Array.from(collectionRevenue.entries()).map(([col, rev]) => ({
      _id: col,
      revenue: rev
    })).sort((a, b) => b.revenue - a.revenue || a._id.localeCompare(b._id));

    // 2. Sales by Individual Watch: all current products, no limits, sorted descending by revenue
    const salesByProduct = currentProducts.map(p => ({
      _id: (p.name || 'Untitled').trim(),
      productId: p._id.toString(),
      revenue: productRevenue.get(p._id.toString()) || 0
    })).sort((a, b) => b.revenue - a.revenue || a._id.localeCompare(b._id));

    // 3. Sales by Gender: only genders in current products, sorted descending by revenue
    const salesByGender = Array.from(genderRevenue.entries()).map(([gender, rev]) => ({
      _id: gender,
      revenue: rev
    })).sort((a, b) => b.revenue - a.revenue || a._id.localeCompare(b._id));

    // Sales by Category alias for backwards compatibility
    const salesByCategory = salesByCollection;

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
        salesByCollection,
        salesByProduct,
        salesByGender,
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


// ─── ADMIN SESSIONS & LOGIN ACTIVITY ──────────────────────────────────────

// @route   GET /api/admin/sessions
// @desc    Get active admin sessions
// @access  Private/Admin
router.get('/sessions', protect, adminOnly, async (req, res) => {
  try {
    const filter = { isRevoked: false };
    // If not super_admin and doesn't have login_activity permission, restrict to own email
    if (req.user.role !== 'super_admin' && !req.user.permissions?.includes('login_activity')) {
      filter.email = req.user.email;
    } else if (req.query.email) {
      filter.email = req.query.email.toLowerCase().trim();
    }

    const sessions = await AdminSession.find(filter).sort({ lastActiveAt: -1 });

    res.json({
      success: true,
      currentSessionId: req.user.sessionId || req.sessionId || null,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        role: s.role || 'admin',
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
    const filter = {};
    if (req.user.role !== 'super_admin' && !req.user.permissions?.includes('login_activity')) {
      filter.email = req.user.email;
    } else if (req.query.email) {
      filter.email = req.query.email.toLowerCase().trim();
    }

    const activities = await LoginActivity.find(filter)
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      activities: activities.map(a => ({
        id: a._id.toString(),
        role: a.role || 'admin',
        email: a.email,
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
    const filter = { sessionId };
    // Non super_admins can only revoke their own session
    if (req.user.role !== 'super_admin') {
      filter.email = req.user.email;
    }

    const session = await AdminSession.findOne(filter);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    session.revokedReason = req.user.role === 'super_admin' ? 'Revoked by Super Administrator' : 'Admin manual logout';
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


// ─── SUPER ADMIN ONLY: ADMIN MANAGEMENT (CRUD) ────────────────────────────

// @route   GET /api/admin/users
// @desc    List all administrative accounts (Super Admin only)
// @access  Private/SuperAdmin
router.get('/users', protect, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .select('-password -adminOtp -adminOtpExpires -adminLoginCode -adminLoginCodeExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins: admins.map(a => {
        const isSuper = a.email === 'er.paritoshsaha@gmail.com' || a.email === 'khroniqofficial@gmail.com' || a.role === 'super_admin';
        return {
          id: a._id.toString(),
          _id: a._id.toString(),
          name: isSuper ? 'Super Admin' : (a.name === 'Master Admin' ? 'Khroniq Admin' : a.name),
          email: a.email,
          role: isSuper ? 'super_admin' : 'admin',
          location: a.location || 'Main Flagship',
          locationId: a.locationId || 'loc-flagship',
          permissions: isSuper ? ['all'] : (a.permissions || []),
          isActive: a.isActive !== false,
          lastLogin: a.lastLogin || a.updatedAt || null,
          createdAt: a.createdAt
        };
      })
    });
  } catch (error) {
    console.error('Fetch admin users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch administrator accounts.' });
  }
});

// @route   GET /api/admin/customers
// @desc    List all registered customer accounts (Name, Email, Phone, Status)
// @access  Private/Admin
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password -adminOtp -adminOtpExpires -adminLoginCode -adminLoginCodeExpire -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      customers: customers.map(c => ({
        id: c._id.toString(),
        _id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone || c.shippingAddress?.phone || 'N/A',
        role: c.role || 'customer',
        isActive: c.isActive !== false,
        lastLogin: c.lastLogin || c.updatedAt || null,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registered customers.' });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new restricted Admin account (Super Admin only)
// @access  Private/SuperAdmin
router.post('/users', protect, requireSuperAdmin, async (req, res) => {
  const { name, email, password, confirmPassword, location, locationId, permissions } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(400).json({ success: false, message: `An account with email '${normalizedEmail}' already exists.` });
    }

    // Filter permissions to valid set; default is empty array
    const cleanPermissions = Array.isArray(permissions)
      ? permissions.filter(p => VALID_PERMISSIONS.includes(p))
      : [];

    const newAdmin = new User({
      name: name.trim(),
      email: normalizedEmail,
      password, // pre-save hook in User model hashes this with bcrypt
      role: 'admin', // Restricted Admin role
      location: location ? location.trim() : 'Main Store',
      locationId: locationId ? locationId.trim() : 'loc-flagship',
      permissions: cleanPermissions,
      isActive: true
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      admin: {
        id: newAdmin._id.toString(),
        _id: newAdmin._id.toString(),
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        location: newAdmin.location,
        locationId: newAdmin.locationId,
        permissions: newAdmin.permissions,
        isActive: newAdmin.isActive,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating admin account.' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Edit existing Admin details (name, email, location, permissions, password, status) (Super Admin only)
// @access  Private/SuperAdmin
router.put('/users/:id', protect, requireSuperAdmin, async (req, res) => {
  const { name, email, password, location, locationId, permissions, isActive } = req.body || {};

  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    if (name) target.name = name.trim();
    if (location !== undefined) target.location = location ? location.trim() : 'Main Store';
    if (locationId !== undefined) target.locationId = locationId ? locationId.trim() : 'loc-flagship';

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== target.email) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing && existing._id.toString() !== target._id.toString()) {
          return res.status(400).json({ success: false, message: 'Email is already in use by another account.' });
        }
        target.email = normalizedEmail;
      }
    }

    // Optional password update
    if (password && typeof password === 'string' && password.trim()) {
      if (password.trim().length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
      }
      target.password = password.trim();
    }

    // Status toggle (protected against modifying super_admin)
    if (isActive !== undefined && target.role === 'admin') {
      target.isActive = Boolean(isActive);
      if (target.isActive === false) {
        await AdminSession.updateMany(
          { email: target.email, isRevoked: false },
          { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: 'Admin account deactivated by Super Admin' } }
        );
      }
    }

    // Only update permissions if passed and target is not super_admin (super_admin has universal access)
    if (permissions !== undefined && target.role === 'admin') {
      target.permissions = Array.isArray(permissions)
        ? permissions.filter(p => VALID_PERMISSIONS.includes(p))
        : [];
    }

    await target.save();

    res.json({
      success: true,
      message: 'Admin updated successfully.',
      admin: {
        id: target._id.toString(),
        _id: target._id.toString(),
        name: target.name,
        email: target.email,
        role: target.role,
        location: target.location,
        locationId: target.locationId,
        permissions: target.permissions,
        isActive: target.isActive !== false,
        lastLogin: target.lastLogin || null,
        createdAt: target.createdAt
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ success: false, message: 'Server error updating admin account.' });
  }
});

// @route   PUT /api/admin/users/:id/permissions
// @desc    Dedicated permissions update for an Admin (Super Admin only)
// @access  Private/SuperAdmin
router.put('/users/:id/permissions', protect, requireSuperAdmin, async (req, res) => {
  const { permissions } = req.body || {};

  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    if (target.role === 'super_admin') {
      return res.status(400).json({ success: false, message: 'Super Admin has universal full access; cannot restrict permissions.' });
    }

    const cleanPermissions = Array.isArray(permissions)
      ? permissions.filter(p => VALID_PERMISSIONS.includes(p))
      : [];

    target.permissions = cleanPermissions;
    await target.save();

    res.json({
      success: true,
      message: 'Admin permissions updated successfully.',
      permissions: target.permissions
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ success: false, message: 'Server error updating permissions.' });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Enable or Disable an Admin account (Super Admin only)
// @access  Private/SuperAdmin
router.put('/users/:id/status', protect, requireSuperAdmin, async (req, res) => {
  const { isActive } = req.body || {};

  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    // Cannot disable yourself
    if (target._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot disable your own administrative account.' });
    }

    // Cannot disable a Super Admin
    if (target.role === 'super_admin') {
      return res.status(400).json({ success: false, message: 'Super Admin accounts cannot be disabled.' });
    }

    target.isActive = Boolean(isActive);
    await target.save();

    // If disabled, revoke all active sessions immediately
    if (!target.isActive) {
      await AdminSession.updateMany(
        { email: target.email, isRevoked: false },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'Admin account disabled by Super Administrator'
          }
        }
      );
      await LoginActivity.updateMany(
        { email: target.email, logoutAt: null },
        { $set: { logoutAt: new Date() } }
      );
    }

    res.json({
      success: true,
      message: `Admin account has been ${target.isActive ? 'enabled' : 'disabled'}.`,
      isActive: target.isActive
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating account status.' });
  }
});

// @route   PUT /api/admin/users/:id/reset-password
// @desc    Reset an Admin password (Super Admin only)
// @access  Private/SuperAdmin
router.put('/users/:id/reset-password', protect, requireSuperAdmin, async (req, res) => {
  const { newPassword, confirmPassword } = req.body || {};

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    target.password = newPassword; // Pre-save hook in User model hashes with bcrypt
    await target.save();

    // Revoke all existing sessions for security so user must log in with new password
    await AdminSession.updateMany(
      { email: target.email, isRevoked: false },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Password reset by Super Administrator'
        }
      }
    );

    res.json({ success: true, message: 'Admin password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete an Admin account (Super Admin only)
// @access  Private/SuperAdmin
router.delete('/users/:id', protect, requireSuperAdmin, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    // Safety check: Cannot delete yourself
    if (target._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    // Safety check: Cannot delete a Super Admin
    if (target.role === 'super_admin') {
      return res.status(400).json({ success: false, message: 'Super Admin accounts cannot be deleted.' });
    }

    // Revoke any active sessions
    await AdminSession.updateMany(
      { email: target.email, isRevoked: false },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Admin account deleted by Super Administrator'
        }
      }
    );

    await User.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'Admin account deleted successfully.' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting admin account.' });
  }
});

// @route   GET /api/admin/users/:id/sessions
// @desc    Get active sessions of a specific Admin (Super Admin only)
// @access  Private/SuperAdmin
router.get('/users/:id/sessions', protect, requireSuperAdmin, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const sessions = await AdminSession.find({ email: target.email, isRevoked: false }).sort({ lastActiveAt: -1 });

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ip: s.ip,
        location: s.location,
        loginMethod: s.loginMethod,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt
      }))
    });
  } catch (error) {
    console.error('Fetch specific admin sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin sessions.' });
  }
});

export default router;
