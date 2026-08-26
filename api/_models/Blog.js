import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: 'KHRONIQ Editorial' },
  image: { type: String, default: '/assets/media__1782899491225.jpg' },
  category: { type: String, default: 'Horology' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

blogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
export default Blog;
