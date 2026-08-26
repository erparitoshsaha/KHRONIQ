import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../_models/User.js';
import { protect } from '../_middleware/auth.js';
import { authLimiter, otpLimiter } from '../_middleware/rateLimiter.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'khroniq-jwt-secret-secure-key-2026';
  return jwt.sign(
    { id: user.id || user._id, name: user.name, email: user.email, role: user.role },
    secret,
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
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
  if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one special character.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'customer' // default role is customer
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
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

    // Check if account is currently locked
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
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

// @route   POST /api/auth/check-admin
// @desc    Check if an email belongs to an administrator account
// @access  Public (Rate-limited)
router.post('/check-admin', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    const isAdmin = Boolean(user && user.role === 'admin');

    return res.json({
      success: true,
      isAdmin
    });
  } catch (error) {
    console.error('Check admin error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error checking administrator status.' });
  }
});

// @route   POST /api/auth/admin-otp/request
// @desc    Generate and email a 6-digit cryptographically secure OTP for admin verification
// @access  Public (Rate-limited)
router.post('/admin-otp/request', otpLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Validate user credentials and admin role
    if (!user || user.role !== 'admin') {
      // Return generic response to avoid admin email enumeration
      return res.json({
        success: true,
        message: 'If the credentials are valid, a secure verification code has been dispatched.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.json({
        success: true,
        message: 'If the credentials are valid, a secure verification code has been dispatched.'
      });
    }

    // Rate-limit consecutive OTP requests (minimum 60 seconds interval)
    if (user.adminOtpLastSent && Date.now() - user.adminOtpLastSent.getTime() < 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: 'Please wait at least 60 seconds before requesting another code.'
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    user.adminOtp = hashedOtp;
    user.adminOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    user.adminOtpAttempts = 0;
    user.adminOtpLastSent = new Date();
    await user.save();

    // Send OTP via email
    await sendEmail({
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

    res.json({
      success: true,
      message: 'If the credentials are valid, a secure verification code has been dispatched.'
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
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.role !== 'admin' || !user.adminOtp || !user.adminOtpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // Check expiration
    if (user.adminOtpExpires < Date.now()) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    // Check maximum failed attempts (max 3)
    if (user.adminOtpAttempts >= 3) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminOtpAttempts = 0;
      await user.save();
      return res.status(423).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Code invalidated. Please request a new one.'
      });
    }

    // Hash candidate OTP and compare
    const candidateHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    if (candidateHash !== user.adminOtp) {
      user.adminOtpAttempts = (user.adminOtpAttempts || 0) + 1;
      await user.save();
      const attemptsRemaining = 3 - user.adminOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`
      });
    }

    // Successful OTP verification -> Invalidate OTP immediately and generate token
    user.adminOtp = undefined;
    user.adminOtpExpires = undefined;
    user.adminOtpAttempts = 0;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

// Aliases for compatibility with /admin/request-code and /admin/verify-code
router.post('/admin/request-code', otpLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please enter your email.' });
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.role !== 'admin') {
      return res.json({ success: true, message: 'If that email belongs to an admin account, a code has been sent.' });
    }

    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.json({ success: true, message: 'If that email belongs to an admin account, a code has been sent.' });
      }
    }

    if (user.adminOtpLastSent && Date.now() - user.adminOtpLastSent.getTime() < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait at least 60 seconds before requesting another code.' });
    }

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    user.adminOtp = hashedOtp;
    user.adminOtpExpires = expiryTime;
    user.adminLoginCode = hashedOtp;
    user.adminLoginCodeExpire = expiryTime;
    user.adminOtpAttempts = 0;
    user.adminOtpLastSent = new Date();
    await user.save();

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

    if (!emailRes || !emailRes.success) {
      return res.status(500).json({
        success: false,
        message: emailRes?.message || emailRes?.error || 'Email dispatch failed. Please check SMTP settings.'
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
    const user = await User.findOne({ email: normalizedEmail, role: 'admin' });

    const userOtpHash = user?.adminOtp || user?.adminLoginCode;
    const userOtpExpires = user?.adminOtpExpires || user?.adminLoginCodeExpire;

    if (!user || !userOtpHash || !userOtpExpires) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    if (userOtpExpires < Date.now()) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminLoginCode = undefined;
      user.adminLoginCodeExpire = undefined;
      await user.save();
      return res.status(401).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }

    if (user.adminOtpAttempts >= 3) {
      user.adminOtp = undefined;
      user.adminOtpExpires = undefined;
      user.adminLoginCode = undefined;
      user.adminLoginCodeExpire = undefined;
      await user.save();
      return res.status(423).json({ success: false, message: 'Maximum verification attempts exceeded. Code invalidated.' });
    }

    const hashedCandidate = crypto.createHash('sha256').update(candidateCode.trim()).digest('hex');
    if (hashedCandidate !== userOtpHash) {
      user.adminOtpAttempts = (user.adminOtpAttempts || 0) + 1;
      await user.save();
      return res.status(401).json({ success: false, message: `Invalid code. ${3 - user.adminOtpAttempts} attempt(s) remaining.` });
    }

    user.adminOtp = undefined;
    user.adminOtpExpires = undefined;
    user.adminLoginCode = undefined;
    user.adminLoginCodeExpire = undefined;
    user.adminOtpAttempts = 0;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
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
        role: user.role,
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
        streetAddress: shippingAddress.streetAddress !== undefined ? shippingAddress.streetAddress : user.shippingAddress.streetAddress,
        city: shippingAddress.city !== undefined ? shippingAddress.city : user.shippingAddress.city,
        state: shippingAddress.state !== undefined ? shippingAddress.state : user.shippingAddress.state,
        postalCode: shippingAddress.postalCode !== undefined ? shippingAddress.postalCode : user.shippingAddress.postalCode,
        country: shippingAddress.country !== undefined ? shippingAddress.country : user.shippingAddress.country,
        phone: shippingAddress.phone !== undefined ? shippingAddress.phone : user.shippingAddress.phone
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
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Don't reveal whether the email exists, for security
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate raw token (sent to user) and hashed version (stored in DB)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'KHRONIQ Watches - Password Reset Request',
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password. This link expires in 15 minutes.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

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

    user.password = password; // pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
});

export default router;
