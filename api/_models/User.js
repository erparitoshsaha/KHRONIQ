import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'super_admin'], default: 'customer' },
  permissions: [{ type: String }],
  location: { type: String, default: 'Main Store' },
  locationId: { type: String, default: 'loc-flagship' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  adminOtp: { type: String },
  adminOtpExpires: { type: Date },
  adminOtpAttempts: { type: Number, default: 0 },
  adminOtpLastSent: { type: Date },
  adminLoginCode: { type: String },
  adminLoginCodeExpire: { type: Date },
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  shippingAddress: {
    houseNumber: { type: String, default: '' },
    streetAddress: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
    phone: { type: String, default: '' }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Pre-save hook to hash password
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
