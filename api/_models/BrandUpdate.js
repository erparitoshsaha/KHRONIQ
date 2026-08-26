import mongoose from 'mongoose';

const brandUpdateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  detail: { type: String, required: true },
  approved: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const BrandUpdate = mongoose.models.BrandUpdate || mongoose.model('BrandUpdate', brandUpdateSchema);
export default BrandUpdate;
