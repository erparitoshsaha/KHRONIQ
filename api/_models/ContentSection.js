import mongoose from 'mongoose';

const ContentItemSchema = new mongoose.Schema({
  title: { type: String, default: '', trim: true },
  subtitle: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  label: { type: String, default: '', trim: true },
  buttonText: { type: String, default: '', trim: true },
  buttonLink: { type: String, default: '', trim: true },
  image: { type: String, default: '', trim: true },
  mobileImage: { type: String, default: '', trim: true },
  secondaryImage: { type: String, default: '', trim: true },
  video: { type: String, default: '', trim: true },
  price: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ContentItemSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const ContentSectionSchema = new mongoose.Schema({
  page: { type: String, required: true, trim: true, lowercase: true, index: true },
  sectionKey: { type: String, required: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  title: { type: String, default: '', trim: true },
  subtitle: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  label: { type: String, default: '', trim: true },
  buttonText: { type: String, default: '', trim: true },
  buttonLink: { type: String, default: '', trim: true },
  image: { type: String, default: '', trim: true },
  mobileImage: { type: String, default: '', trim: true },
  secondaryImage: { type: String, default: '', trim: true },
  video: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  type: {
    type: String,
    enum: ['standard', 'list', 'dynamic_collection', 'grid', 'marquee'],
    default: 'standard'
  },
  items: [ContentItemSchema],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ContentSectionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ContentSectionSchema.index({ page: 1, sectionKey: 1 }, { unique: true });

const ContentSection = mongoose.models.ContentSection || mongoose.model('ContentSection', ContentSectionSchema);
export default ContentSection;
