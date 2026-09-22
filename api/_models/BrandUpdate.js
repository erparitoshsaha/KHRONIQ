import mongoose from 'mongoose';

const brandUpdateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  detail: { type: String, required: true },
  approved: { type: Boolean, default: true },
  durationHours: { type: Number, default: 24 },
  image: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

brandUpdateSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const BrandUpdate = mongoose.models.BrandUpdate || mongoose.model('BrandUpdate', brandUpdateSchema);
export default BrandUpdate;
