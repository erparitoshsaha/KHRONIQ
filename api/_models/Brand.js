import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

brandSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);
export default Brand;