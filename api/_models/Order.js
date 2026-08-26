import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true },
  serialNumber: { type: String },
  claimCode: { type: String },
  warrantyClaimed: { type: Boolean, default: false },
  warrantyClaimedAt: { type: Date },
  warrantyMonths: { type: Number, default: 12 },
  warrantyCountry: { type: String },
  warrantyState: { type: String },
  warrantyPhoneNumber: { type: String }
  
});

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Custom order ID, e.g., 'Z-123456'
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, required: true, default: 0 },
  couponCode: { type: String },
  total: { type: Number, required: true },
  shippingDetails: {
    fullName: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'United States' }
  },
  paymentDetails: {
    method: { type: String, required: true },
    last4: { type: String, required: true },
    razorpayPaymentId: { type: String }
  },
  refund: {
    status: { type: String, enum: ['none', 'processed', 'manual_required', 'failed'], default: 'none' },
    refundId: { type: String },
    amount: { type: Number },
    refundedAt: { type: Date },
    failureReason: { type: String }
  },
  status: { type: String, enum: ['Paid', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Exchange/Refund Requested'], default: 'Paid' },
  date: { type: String, default: () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
  time: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  giftingOptions: {
    isGifting: { type: Boolean, default: false },
    occasion: { type: String },
    note: { type: String },
    packaging: { type: String }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;