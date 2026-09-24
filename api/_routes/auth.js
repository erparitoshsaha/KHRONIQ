import AdminSession from '../_models/AdminSession.js';
import LoginActivity from '../_models/LoginActivity.js';
import { parseUserAgent, extractClientIp, getCoarseLocation } from '../utils/deviceDetector.js';
import { adminOnly } from '../_middleware/auth.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../_models/User.js';
import { protect } from '../_middleware/auth.js';
import { apiLimiter, authLimiter, otpLimiter } from '../_middleware/rateLimiter.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

const generateToken = (user, sessionId = null) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured.');
  }
  const payload = {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    location: user.location || 'Main Store',
    locationId: user.locationId || 'loc-flagship'
  };
  if (sessionId) {
    payload.sessionId = sessionId;
  }
  return jwt.sign(payload, secret, { expiresIn: '30d' });
};

async function createAdminLoginSession(req, user, loginMethod = 'Password + OTP') {
  const ip = extractClientIp(req);
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = getCoarseLocation(ip);
  const sessionId = crypto.randomUUID();

  const session = await AdminSession.create({
    sessionId,
    userId: user.id || user._id,
    email: user.email,
    role: user.role || 'admin',
    deviceType,
    browser,
    os,
    userAgent: req.headers['user-agent'] || '',
    ip,
    location,
    loginMethod,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    isRevoked: false
  });

  await LoginActivity.create({
    userId: user.id || user._id,
    email: user.email,
    role: user.role || 'admin',
    status: 'successful',
    sessionId,
    deviceType,
    browser,
    os,
    userAgent: req.headers['user-agent'] || '',
    ip,
    location,
    loginMethod,
    timestamp: new Date()
  });

  return sessionId;
}

async function recordFailedLoginAttempt(req, user, email, failureReason, loginMethod = 'Password + OTP') {
  try {
    const ip = extractClientIp(req);
    const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
    const location = getCoarseLocation(ip);

    await LoginActivity.create({
      userId: user ? (user.id || user._id) : null,
      email: String(email || '').toLowerCase().trim(),
      role: user ? user.role : 'customer',
      status: 'failed',
      failureReason: failureReason || 'Authentication failed',
      deviceType,
      browser,
      os,
      userAgent: req.headers['user-agent'] || '',
      ip,
      location,
      loginMethod,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Failed to log failed activity:', err);
  }
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!email || !password || !name || !phone) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields including Phone Number.' });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
  }
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter.' });
  }
  if (!/[!@#$%^&*(),.?":{}|<>-_]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one special character.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const isSuper = normalizedEmail === 'er.paritoshsaha@gmail.com' || normalizedEmail === 'khroniqofficial@gmail.com';
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: isSuper ? 'super_admin' : 'customer'
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (Customers and Restricted Admins with email+password; Super Admins must use OTP)
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Super Admin accounts MUST use the 2FA OTP flow
    if (user.role === 'super_admin' || normalizedEmail === 'er.paritoshsaha@gmail.com' || normalizedEmail === 'khroniqofficial@gmail.com') {
      // Auto-dispatch OTP if not recently throttled
      let otpDispatched = false;
      try {
        const canSend = !user.adminOtpLastSent || (Date.now() - user.adminOtpLastSent.getTime() >= 60 * 1000);
        if (canSend) {
          const rawOtp = crypto.randomInt(100000, 1000000).toString();
          const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
          const expiryDate = new Date(Date.now() + 10 * 60 * 1000);

          user.adminOtp = hashedOtp;
          user.adminOtpExpires = expiryDate;
          user.adminLoginCode = hashedOtp;
          user.adminLoginCodeExpire = expiryDate;
          user.adminOtpAttempts = 0;
          user.adminOtpLastSent = new Date();
          await user.save();

          await sendEmail({
            to: user.email,
            subject: 'KHRONIQ Security - Super Admin Authentication Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #1f4d3a; margin-top: 0;">KHRONIQ Atelier Security</h2>
                <p>Hello ${user.name || 'Super Admin'},</p>
                <p>Your one-time administrative verification code is:</p>
                <div style="background-color: #f7f7f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111; border-radius: 4px;">
                  ${rawOtp}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 15px;">This code is valid for 10 minutes. If you did not request this, please secure your account immediately.</p>
              </div>
            `
          });
          otpDispatched = true;
          console.log(`[AUTH] Auto-dispatched OTP to ${user.email} via login endpoint`);
        }
      } catch (err) {
        console.error('[AUTH] Auto-dispatch OTP error:', err.message);
      }

      return res.status(200).json({
        success: false,
        requireOtp: true,
        isSuperAdmin: true,
        otpDispatched,
        message: otpDispatched
          ? 'Super Admin accounts require two-factor OTP verification. A verification code has been dispatched to your email.'
          : 'Super Admin accounts require two-factor OTP verification. Please enter the verification code sent to your email.'
      });
    }

    // Restricted Admin accounts use Email + Password
    if (user.role === 'admin') {
      if (user.isActive === false) {
        await recordFailedLoginAttempt(req, user, normalizedEmail, 'Account disabled by administrator', 'Email + Password');
        return res.status(403).json({
          success: false,
          accountDisabled: true,
          message: 'Your administrator account has been deactivated. Please contact the Super Administrator.'
        });
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const remainingSeconds = Math.ceil((user.lockUntil - Date.now()) / 1000);
        return res.status(423).json({
          success: false,
          message: `Too many failed attempts. Account locked. Please try again in ${remainingSeconds} seconds.`,
          remainingSeconds
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 60 * 1000);
          user.loginAttempts = 0;
          await user.save();
          await recordFailedLoginAttempt(req, user, normalizedEmail, 'Account locked: 5 failed attempts', 'Email + Password');
          return res.status(423).json({
            success: false,
            message: 'Too many failed attempts. Account locked for 1 minute.',
            remainingSeconds: 60
          });
        }
        await user.save();
        await recordFailedLoginAttempt(req, user, normalizedEmail, 'Invalid password', 'Email + Password');
        const attemptsRemaining = 5 - user.loginAttempts;
        return res.status(401).json({
          success: false,
          message: `Invalid email or password. ${attemptsRemaining} attempts remaining.`
        });
      }

      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLogin = new Date();
      await user.save();

      const sessionId = await createAdminLoginSession(req, user, 'Email + Password');
      const token = generateToken(user, sessionId);

      return res.json({
        success: true,
        token,
        sessionId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions || [],
          location: user.location || 'Main Store',
          locationId: user.locationId || 'loc-flagship'
        }
      });
    }

    // Regular customer login
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingSeconds = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(423).json({
        success: false,
        message: `Too many failed attempts. Account locked. Please try again in ${remainingSeconds} seconds.`,
        remainingSeconds
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 60 * 1000); // 1 minute lockout
        user.loginAttempts = 0; // Reset attempts after locking
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 1 minute.',
          remainingSeconds: 60
        });
      } else {
        await user.save();
        const attemptsRemaining = 5 - user.loginAttempts;
        return res.status(401).json({
          success: false,
          message: `Invalid email or password. ${attemptsRemaining} attempts remaining.`
        });
      }
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.shippingAddress?.phone || '',
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// @route   POST /api/auth/check-admin
// @desc    Check if an email belongs to an administrator account (returns whether OTP is required)
// @access  Public (Rate-limited via generous apiLimiter to prevent UI debounce lockouts)
router.post('/check-admin', apiLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Fast-path: Super Admin accounts
    if (normalizedEmail === 'er.paritoshsaha@gmail.com' || normalizedEmail === 'khroniqofficial@gmail.com') {
      return res.json({
        success: true,
        isAdmin: true,
        isSuperAdmin: true,
        requiresOtp: true,
        isActive: true
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    const isSuperAdmin = Boolean(user && user.role === 'super_admin');
    const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin'));
    const requiresOtp = isSuperAdmin;
    const isActive = user ? (user.isActive !== false) : true;

    return res.json({
      success: true,
      isAdmin,
      isSuperAdmin,
      requiresOtp,
      isActive
    });
  } catch (error) {
    console.error('Check admin error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error checking administrator status.' });
  }
});

// @route   POST /api/auth/admin-otp/request
// @desc    Generate and email a 6-digit cryptographically secure OTP for super admin verification
// @access  Public (Rate-limited)
router.post('/admin-otp/request', otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, role: { $in: ['admin', 'super_admin'] } });

    if (!user) {
      return res.json({
        success: true,
        message: 'If the credentials are valid, a secure verification code has been dispatched.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        accountDisabled: true,
        message: 'Your administrator account has been deactivated. Please contact the Super Administrator.'
      });
    }

    console.log(`[AUTH] Administrator detected: ${normalizedEmail} (Role: ${user.role})`);
    if (user.role === 'super_admin') {
      console.log(`[AUTH] Super Admin detected: ${normalizedEmail}`);
    }

    // Rate-limit consecutive OTP requests (minimum 60 seconds interval)
    if (user.adminOtpLastSent && Date.now() - user.adminOtpLastSent.getTime() < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - user.adminOtpLastSent.getTime())) / 1000);
      console.log(`[AUTH] OTP request throttled for ${normalizedEmail}: wait ${waitSeconds}s`);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting another code.`
      });
    }

    console.log(`[AUTH] Generating OTP for: ${normalizedEmail}`);
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    console.log(`[AUTH] OTP generated for: ${normalizedEmail} (Expires: ${expiryDate.toISOString()})`);

    user.adminOtp = hashedOtp;
    user.adminOtpExpires = expiryDate;
    user.adminLoginCode = hashedOtp;
    user.adminLoginCodeExpire = expiryDate;
    user.adminOtpAttempts = 0;
    user.adminOtpLastSent = new Date();
    await user.save();

    console.log(`[AUTH] Sending OTP to ${user.email}`);
    const emailRes = await sendEmail({
      to: user.email,
      subject: 'KHRONIQ Security - Admin Authentication Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1f4d3a; margin-top: 0;">KHRONIQ Atelier Security</h2>
          <p>Hello ${user.name},</p>
          <p>Your one-time administrative verification code is:</p>
          <div style="background-color: #f7f7f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111; border-radius: 4px;">
            ${rawOtp}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 15px;">This code is valid for 10 minutes. If you did not request this, please secure your account immediately.</p>
        </div>
      `
    });

    console.log(`[AUTH] OTP email send result: ${emailRes?.success ? 'SUCCESS' : 'FAILED'}`);
    if (emailRes?.messageId) {
      console.log(`[AUTH] OTP message ID / accepted recipient: ${emailRes.messageId} -> ${user.email}`);
    }

    if (!emailRes || !emailRes.success) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'A verification code has been dispatched to your email.'
    });
  } catch (error) {
    console.error('Admin OTP request error:', error);
    res.status(500).json({ success: false, message: 'Error processing admin verification request.' });
  }
});

// @route   POST /api/auth/admin-otp/verify
// @desc    Verify admin 6-digit OTP and issue admin JWT
// @access  Public (Rate-limited)
router.post('/admin-otp/verify', otpLimiter, async (req, res) => {
  const { email, otp, code } = req.body;
  const candidateCode = otp || code;

  if (!email || !candidateCode) {
    return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, role: { $in: ['admin', 'super_admin'] } });

    const userOtpHash1 = user?.adminOtp;
    const userOtpHash2 = user?.adminLoginCode;
    const userOtpExpires = user?.adminOtpExpires || user?.adminLoginCodeExpire;

    if (!user || (!userOtpHash1 && !userOtpHash2) || !userOtpExpires) {
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Invalid or expired verification code', 'Password + OTP');
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, accountDisabled: true, message: 'Account has been disabled. Please contact the administrator.' });
    }

    // Check expiration
    if (userOtpExpires < Date.now()) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminLoginCode = undefined;
      user.adminLoginCodeExpire = undefined;
      user.adminOtpAttempts = 0;
      await user.save();
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Verification code expired', 'Password + OTP');
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Check maximum failed attempts (max 3)
    if (user.adminOtpAttempts >= 3) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminLoginCode = undefined;
      user.adminLoginCodeExpire = undefined;
      user.adminOtpAttempts = 0;
      await user.save();
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Maximum verification attempts exceeded', 'Password + OTP');
      return res.status(423).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Code invalidated. Please request a new one.'
      });
    }

    // Hash candidate OTP and compare
    const candidateHash = crypto.createHash('sha256').update(candidateCode.trim()).digest('hex');

    if (candidateHash !== userOtpHash1 && candidateHash !== userOtpHash2) {
      user.adminOtpAttempts = (user.adminOtpAttempts || 0) + 1;
      await user.save();
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Invalid verification code', 'Password + OTP');
      const attemptsRemaining = 3 - user.adminOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`
      });
    }

    // Successful OTP verification -> Invalidate OTP immediately and generate token
    user.adminOtp = undefined;
    user.adminOtpExpires = undefined;
    user.adminLoginCode = undefined;
    user.adminLoginCodeExpire = undefined;
    user.adminOtpAttempts = 0;
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const sessionId = await createAdminLoginSession(req, user, 'Password + OTP');
    const token = generateToken(user, sessionId);

    res.json({
      success: true,
      token,
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        location: user.location || 'Main Store',
        locationId: user.locationId || 'loc-flagship'
      }
    });
  } catch (error) {
    console.error('Admin OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

// Aliases for compatibility with /admin/request-code and /admin/verify-code
router.post('/admin/request-code', otpLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please enter your email.' });
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, role: { $in: ['admin', 'super_admin'] } });

    if (!user) {
      return res.json({ success: true, message: 'If that email belongs to an admin account, a code has been sent.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        accountDisabled: true,
        message: 'Your administrator account has been deactivated. Please contact the Super Administrator.'
      });
    }

    console.log(`[AUTH] Administrator detected: ${normalizedEmail} (Role: ${user.role})`);
    if (user.role === 'super_admin') {
      console.log(`[AUTH] Super Admin detected: ${normalizedEmail}`);
    }

    if (user.adminOtpLastSent && Date.now() - user.adminOtpLastSent.getTime() < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - user.adminOtpLastSent.getTime())) / 1000);
      console.log(`[AUTH] OTP request throttled for ${normalizedEmail}: wait ${waitSeconds}s`);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting another code.`
      });
    }

    console.log(`[AUTH] Generating OTP for: ${normalizedEmail}`);
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    console.log(`[AUTH] OTP generated for: ${normalizedEmail} (Expires: ${expiryTime.toISOString()})`);

    user.adminOtp = hashedOtp;
    user.adminOtpExpires = expiryTime;
    user.adminLoginCode = hashedOtp;
    user.adminLoginCodeExpire = expiryTime;
    user.adminOtpAttempts = 0;
    user.adminOtpLastSent = new Date();
    await user.save();

    console.log(`[AUTH] Sending OTP to ${user.email}`);
    const emailRes = await sendEmail({
      to: user.email,
      subject: 'KHRONIQ Admin - Your Sign-In Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;">
          <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
            <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;">KHRONIQ</span>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#1a1a1a;margin-top:0;">Your admin sign-in code</h2>
            <p style="color:#444;font-size:14px;line-height:1.6;">Hello ${user.name},</p>
            <p style="color:#444;font-size:14px;line-height:1.6;">
              Use this code to sign in to the KHRONIQ admin panel. This code is valid for <strong>10 minutes</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <span style="background:#f6f6f6;color:#1a1a1a;padding:14px 32px;font-size:24px;font-weight:bold;letter-spacing:6px;border-radius:2px;display:inline-block;">
                ${rawOtp}
              </span>
            </div>
            <p style="color:#999;font-size:12px;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="background:#f6f6f6;padding:16px 32px;text-align:center;">
            <p style="color:#999;font-size:11px;margin:0;">© ${new Date().getFullYear()} KHRONIQ Watches. All rights reserved.</p>
          </div>
        </div>
      `
    });

    console.log(`[AUTH] OTP email send result: ${emailRes?.success ? 'SUCCESS' : 'FAILED'}`);
    if (emailRes?.messageId) {
      console.log(`[AUTH] OTP message ID / accepted recipient: ${emailRes.messageId} -> ${user.email}`);
    }

    if (!emailRes || !emailRes.success) {
      return res.status(500).json({
        success: false,
        message: 'Unable to send OTP. Please try again.'
      });
    }

    res.json({ success: true, message: 'A verification code has been dispatched to your email.' });
  } catch (error) {
    console.error('Admin code request error:', error);
    res.status(500).json({ success: false, message: 'Server error processing admin code request.' });
  }
});

router.post('/admin/verify-code', otpLimiter, async (req, res) => {
  const { email, code, otp } = req.body;
  const candidateCode = code || otp;

  if (!email || !candidateCode) {
    return res.status(400).json({ success: false, message: 'Please enter the code sent to your email.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, role: { $in: ['admin', 'super_admin'] } });

    const userOtpHash1 = user?.adminOtp;
    const userOtpHash2 = user?.adminLoginCode;
    const userOtpExpires = user?.adminOtpExpires || user?.adminLoginCodeExpire;

    if (!user || (!userOtpHash1 && !userOtpHash2) || !userOtpExpires) {
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Invalid or expired code', 'Password + OTP');
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, accountDisabled: true, message: 'Account has been disabled.' });
    }

    if (userOtpExpires < Date.now()) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminLoginCode = undefined;
      user.adminLoginCodeExpire = undefined;
      user.adminOtpAttempts = 0;
      await user.save();
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Verification code expired', 'Password + OTP');
      return res.status(401).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }

    if (user.adminOtpAttempts >= 3) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminLoginCode = undefined;
      user.adminLoginCodeExpire = undefined;
      user.adminOtpAttempts = 0;
      await user.save();
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Maximum verification attempts exceeded', 'Password + OTP');
      return res.status(423).json({ success: false, message: 'Maximum verification attempts exceeded. Code invalidated.' });
    }

    const hashedCandidate = crypto.createHash('sha256').update(candidateCode.trim()).digest('hex');
    if (hashedCandidate !== userOtpHash1 && hashedCandidate !== userOtpHash2) {
      user.adminOtpAttempts = (user.adminOtpAttempts || 0) + 1;
      await user.save();
      await recordFailedLoginAttempt(req, user, normalizedEmail, 'Invalid verification code', 'Password + OTP');
      return res.status(401).json({ success: false, message: `Invalid code. ${3 - user.adminOtpAttempts} attempt(s) remaining.` });
    }

    user.adminOtp = undefined;
    user.adminOtpExpires = undefined;
    user.adminLoginCode = undefined;
    user.adminLoginCodeExpire = undefined;
    user.adminOtpAttempts = 0;
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const sessionId = await createAdminLoginSession(req, user, 'Password + OTP');
    const token = generateToken(user, sessionId);
    res.json({
      success: true,
      token,
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        location: user.location || 'Main Store',
        locationId: user.locationId || 'loc-flagship'
      }
    });
  } catch (error) {
    console.error('Admin code verify error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -adminOtp');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.shippingAddress?.phone || '',
        role: user.role,
        permissions: user.permissions || [],
        location: user.location || 'Main Store',
        locationId: user.locationId || 'loc-flagship',
        isActive: user.isActive !== false,
        shippingAddress: user.shippingAddress
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile details and default shipping address
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { name, email, shippingAddress } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email address already in use.' });
      }
      user.email = normalizedEmail;
    }

    if (shippingAddress) {
      user.shippingAddress = {
        houseNumber: shippingAddress.houseNumber !== undefined ? shippingAddress.houseNumber : (user.shippingAddress?.houseNumber || ''),
        streetAddress: shippingAddress.streetAddress !== undefined ? shippingAddress.streetAddress : (user.shippingAddress?.streetAddress || ''),
        landmark: shippingAddress.landmark !== undefined ? shippingAddress.landmark : (user.shippingAddress?.landmark || ''),
        city: shippingAddress.city !== undefined ? shippingAddress.city : (user.shippingAddress?.city || ''),
        state: shippingAddress.state !== undefined ? shippingAddress.state : (user.shippingAddress?.state || ''),
        postalCode: shippingAddress.postalCode !== undefined ? shippingAddress.postalCode : (user.shippingAddress?.postalCode || ''),
        country: shippingAddress.country !== undefined ? shippingAddress.country : (user.shippingAddress?.country || ''),
        phone: shippingAddress.phone !== undefined ? shippingAddress.phone : (user.shippingAddress?.phone || '')
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        location: user.location || 'Main Store',
        locationId: user.locationId || 'loc-flagship',
        isActive: user.isActive !== false,
        shippingAddress: user.shippingAddress
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset link to user's email
// @access  Public
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[AUTH] Password reset requested for: ${normalizedEmail}`);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`[AUTH] Password reset request: no user account found in DB for '${normalizedEmail}' (returning generic response)`);
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const configuredUrl = (process.env.FRONTEND_URL || '').trim();
    let frontendBase = configuredUrl;
    if (!frontendBase || frontendBase.includes('khroniq-sage.vercel.app')) {
      frontendBase = 'https://www.khroniq.com';
    } else if (frontendBase.includes(',')) {
      // Local development may configure comma-separated origins for LAN testing; use the first valid origin
      frontendBase = frontendBase.split(',')[0].trim();
    }
    frontendBase = frontendBase.replace(/\/+$/, '');
    const resetUrl = `${frontendBase}/reset-password/${rawToken}`;

    console.log(`[AUTH] Sending password reset email to: ${user.email}`);
    const emailRes = await sendEmail({
      to: user.email,
      subject: 'KHRONIQ Watches - Password Reset Request',
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password. This link expires in 15 minutes.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    if (emailRes?.success) {
      console.log(`[AUTH] Password reset email successfully dispatched to ${user.email} (Message ID: ${emailRes.messageId})`);
    } else {
      console.error(`[AUTH] Password reset email dispatch failed for ${user.email}:`, emailRes?.error || emailRes?.message || 'Unknown SMTP error');
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using a valid token
// @access  Public
router.post('/reset-password/:token', authLimiter, async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
});

// ─── ADMIN SESSION MANAGEMENT & LOGIN ACTIVITY ─────────────────────────────

// @route   GET /api/auth/sessions
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
    console.error('Fetch sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active sessions.' });
  }
});

// @route   GET /api/auth/login-activity
// @desc    Get recent login activity logs (successful and failed attempts)
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
        role: a.role || 'admin',
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
    console.error('Fetch login activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch login activity.' });
  }
});

// @route   POST /api/auth/sessions/:sessionId/revoke
// @desc    Revoke/logout a specific session
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
    console.error('Revoke session error:', error);
    res.status(500).json({ success: false, message: 'Unable to revoke this session.' });
  }
});

// @route   POST /api/auth/sessions/revoke-others
// @desc    Revoke/logout all active sessions except current
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
    console.error('Revoke other sessions error:', error);
    res.status(500).json({ success: false, message: 'Unable to revoke other sessions.' });
  }
});

export default router;
