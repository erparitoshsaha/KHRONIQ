import mongoose from 'mongoose';

const FooterLinkSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  page: { type: String, default: 'static', trim: true },
  url: { type: String, default: '', trim: true },
  args: { type: mongoose.Schema.Types.Mixed, default: null },
  action: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const FooterSectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  type: { type: String, enum: ['dynamic_collection', 'custom'], default: 'custom' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  links: [FooterLinkSchema]
}, { timestamps: true });

const FooterSection = mongoose.models.FooterSection || mongoose.model('FooterSection', FooterSectionSchema);
export default FooterSection;
