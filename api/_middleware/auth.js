import jwt from 'jsonwebtoken';

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

      // Add sanitized user info to request object
      req.user = {
        id: decoded.id || decoded._id,
        _id: decoded.id || decoded._id,
        name: decoded.name,
        email: decoded.email?.toLowerCase(),
        role: decoded.role || 'customer'
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
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Admin authorization required' });
  }
};
