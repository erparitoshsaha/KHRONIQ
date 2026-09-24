import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number },
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
  total: { type: Number, required: true },
  shippingDetails: {
    fullName: { type: String, required: true },
    houseNumber: { type: String, default: '' },
    streetAddress: { type: String, required: true },
    landmark: { type: String, default: '' },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    phone: { type: String },
    gstNumber: { type: String }
  },
  paymentDetails: {
    method: { type: String, required: true },
    last4: { type: String, required: true }
  },
  status: { type: String, enum: ['Paid', 'Pending', 'Processing', 'Cancelled', 'Shipped', 'Delivered', 'Exchange/Refund Requested'], default: 'Paid' },
  razorpayOrderId: { type: String, index: true, sparse: true, unique: true },
  razorpayPaymentId: { type: String, index: true, sparse: true, unique: true },
  razorpaySignature: { type: String },
  webhookProcessed: { type: Boolean, default: false },
  refundDetails: {
    refunded: { type: Boolean, default: false },
    refundId: { type: String },
    refundedAt: { type: Date },
    amount: { type: Number }
  },
  date: { type: String, default: () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
  time: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  giftingOptions: {
    isGifting: { type: Boolean, default: false },
    occasion: { type: String },
    note: { type: String },
    packaging: { type: String },
    packagingCost: { type: Number, default: 0 },
    includeGiftCard: { type: Boolean, default: false },
    giftCardCost: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
