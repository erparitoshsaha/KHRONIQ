import jwt from 'jsonwebtoken';
import AdminSession from '../_models/AdminSession.js';
import User from '../_models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.trim() === '') {
        console.error('[SECURITY FATAL] JWT_SECRET is not configured.');
        return res.status(500).json({ success: false, message: 'Authentication service configuration error.' });
      }

      // Verify token
      const decoded = jwt.verify(token, secret);

      let dbUser = null;
      // If token belongs to an administrative account (has sessionId or admin/super_admin role)
      if (decoded.role === 'admin' || decoded.role === 'super_admin') {
        if (decoded.sessionId) {
          const session = await AdminSession.findOne({ sessionId: decoded.sessionId });
          if (!session || session.isRevoked) {
            return res.status(401).json({
              success: false,
              sessionRevoked: true,
              message: 'Session has been revoked or logged out. Please sign in again.'
            });
          }

          // Throttle lastActiveAt updates (at most once every 5 minutes)
          const now = Date.now();
          if (!session.lastActiveAt || (now - new Date(session.lastActiveAt).getTime() > 5 * 60 * 1000)) {
            session.lastActiveAt = new Date(now);
            session.save().catch(err => console.error('Failed to update session lastActiveAt:', err));
          }

          req.sessionId = decoded.sessionId;
        }

        // Fetch fresh status and permissions from DB
        dbUser = await User.findById(decoded.id || decoded._id).select('role permissions location locationId isActive');
        if (!dbUser) {
          return res.status(401).json({ success: false, message: 'User account no longer exists.' });
        }
        if (dbUser.isActive === false) {
          return res.status(403).json({
            success: false,
            accountDisabled: true,
            message: 'Your administrator account has been deactivated. Please contact the Super Administrator.'
          });
        }
      }

      // Add sanitized user info to request object
      req.user = {
        id: decoded.id || decoded._id,
        _id: decoded.id || decoded._id,
        name: decoded.name,
        email: decoded.email?.toLowerCase(),
        role: dbUser ? dbUser.role : (decoded.role || 'customer'),
        permissions: dbUser ? (dbUser.permissions || []) : (decoded.permissions || []),
        location: dbUser?.location || decoded.location || 'Main Store',
        locationId: dbUser?.locationId || decoded.locationId || 'loc-flagship',
        sessionId: decoded.sessionId || null
      };

      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Administrative authorization required' });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Super Admin authorization required' });
  }
};

export const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    // Super admin bypasses all permission restrictions
    if (req.user.role === 'super_admin') {
      return next();
    }
    // Restricted admin must have this specific permission
    if (req.user.role === 'admin' && Array.isArray(req.user.permissions) && req.user.permissions.includes(permissionKey)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied: '${permissionKey}' permission required.`
    });
  };
};
