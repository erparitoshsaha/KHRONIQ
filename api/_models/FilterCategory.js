import mongoose from 'mongoose';

const filterOptionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  value: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

filterOptionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const filterCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '', trim: true },
  type: { type: String, enum: ['single', 'multi', 'range'], default: 'multi' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  options: [filterOptionSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

filterCategorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const FilterCategory = mongoose.models.FilterCategory || mongoose.model('FilterCategory', filterCategorySchema);
export default FilterCategory;
