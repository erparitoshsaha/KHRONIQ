import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../_models/User.js';
import { protect } from '../_middleware/auth.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Password validation
  if (!password || password.length < 8) {
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
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

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
      // Increment login attempts
      user.loginAttempts += 1;
      
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
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

    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email address already in use.' });
      }
      user.email = email;
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
// @route   POST /api/auth/forgot-password
// @desc    Send password reset link to user's email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

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

    const resetUrl = `${process.env.VERCEL ? 'https://zenith-sigma-ruby.vercel.app' : (process.env.FRONTEND_URL || 'http://localhost:5173')}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'KHRONIQ Watches - Reset Your Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;">
          <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
            <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:2px;">KHRONIQ</span>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#1a1a1a;margin-top:0;">Reset your password</h2>
            <p style="color:#444;font-size:14px;line-height:1.6;">Hello ${user.name},</p>
            <p style="color:#444;font-size:14px;line-height:1.6;">
              We received a request to reset the password for your KHRONIQ account. Click the button below to choose a new password. This link is valid for <strong>15 minutes</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetUrl}" style="background:#93744d;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;border-radius:2px;display:inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color:#888;font-size:12px;line-height:1.6;">
              If the button above doesn't work, copy and paste this link into your browser:<br/>
              <a href="${resetUrl}" style="color:#93744d;word-break:break-all;">${resetUrl}</a>
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
            <p style="color:#999;font-size:12px;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged. For your security, never share this link with anyone.
            </p>
          </div>
          <div style="background:#f6f6f6;padding:16px 32px;text-align:center;">
            <p style="color:#999;font-size:11px;margin:0;">© ${new Date().getFullYear()} KHRONIQ Watches. All rights reserved.</p>
          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using a valid token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/check-admin
// @desc    Check whether an email belongs to an admin account (no data revealed beyond that)
// @access  Public
router.post('/check-admin', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: true, isAdmin: false });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    res.json({ success: true, isAdmin: !!(user && user.role === 'admin') });
  } catch (error) {
    console.error('Check admin error:', error);
    res.json({ success: true, isAdmin: false });
  }
});

// @route   POST /api/auth/admin/request-code
// @desc    Email a one-time login code to an admin account
// @access  Public
router.post('/admin/request-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please enter your email.' });
  }

  try {
    const user = await User.findOne({ email });

    // Don't reveal whether the account exists or is an admin
    if (!user || user.role !== 'admin') {
      return res.json({ success: true, message: 'If that email belongs to an admin account, a code has been sent.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    user.adminLoginCode = hashedCode;
    user.adminLoginCodeExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail({
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
                ${code}
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

    res.json({ success: true, message: 'If that email belongs to an admin account, a code has been sent.' });
  } catch (error) {
    console.error('Admin code request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/admin/verify-code
// @desc    Verify an admin's emailed code and log them in
// @access  Public
router.post('/admin/verify-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Please enter the code sent to your email.' });
  }

  try {
    const user = await User.findOne({ email, role: 'admin' });

    if (!user || !user.adminLoginCode || !user.adminLoginCodeExpire) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    if (user.adminLoginCodeExpire < Date.now()) {
      return res.status(401).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (hashedCode !== user.adminLoginCode) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    user.adminLoginCode = undefined;
    user.adminLoginCodeExpire = undefined;
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;