import mongoose from 'mongoose';

const LoginActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['successful', 'failed'],
    required: true,
    index: true
  },
  failureReason: {
    type: String,
    default: null
  },
  sessionId: {
    type: String,
    default: null,
    index: true
  },
  deviceType: {
    type: String,
    enum: ['Desktop', 'Mobile', 'Tablet', 'Other'],
    default: 'Desktop'
  },
  browser: {
    type: String,
    default: 'Other'
  },
  os: {
    type: String,
    default: 'Other'
  },
  userAgent: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    default: '127.0.0.1'
  },
  location: {
    type: String,
    default: 'India / approximate location'
  },
  loginMethod: {
    type: String,
    default: 'Password + OTP'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  logoutAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

LoginActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const LoginActivity = mongoose.models.LoginActivity || mongoose.model('LoginActivity', LoginActivitySchema);
export default LoginActivity;
