import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  brand: { type: String, default: 'KHRONIQ' },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  warrantyMonths: { type: Number, required: true, default: 12 },
  category: { type: String, required: true },
  gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  description: { type: String, required: true },
  specs: {
    movement: { type: String, default: 'Automatic' },
    case: { type: String },
    strap: { type: String },
    waterResistance: { type: String },
    glass: { type: String }
  },
  customizable: { type: Boolean, default: true },
  allowStrapCustomization: { type: Boolean, default: true },
  allowCaseCustomization: { type: Boolean, default: true },
  allowDialCustomization: { type: Boolean, default: true },
  customizationOptions: {
    dialColors: [{ type: String }],
    strapMaterials: [{ type: String }],
    caseFinishes: [{ type: String }],
    engravingAllowed: { type: Boolean, default: false },
    customStrapName: { type: String, default: '' },
    customStrapImage: { type: String, default: '' },
    customCaseName: { type: String, default: '' },
    customCaseColor: { type: String, default: '' }
  },
  reviews: [reviewSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
