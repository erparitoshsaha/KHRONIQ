import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  publicId: { type: String },
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  section: { type: String, required: true },
  title: { type: String, default: '' },
  altText: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Media', MediaSchema);