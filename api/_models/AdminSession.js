import mongoose from 'mongoose';

const AdminSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  revokedAt: {
    type: Date,
    default: null
  },
  revokedReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

AdminSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AdminSession = mongoose.models.AdminSession || mongoose.model('AdminSession', AdminSessionSchema);
export default AdminSession;
