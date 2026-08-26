import express from 'express';
import Blog from '../_models/Blog.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/blogs
// @desc    Get all blogs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (error) {
    console.error('Fetch blogs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/blogs
// @desc    Create a blog post
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const { title, content, author, image, category } = req.body;

  try {
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const blog = new Blog({
      title,
      content,
      author: author || 'KHRONIQ Editorial',
      image: image || '/assets/media__1782899491225.jpg',
      category: category || 'Horology'
    });

    const createdBlog = await blog.save();
    res.status(201).json({ success: true, blog: createdBlog });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog post
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    await Blog.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Blog post removed' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog post
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { title, content, author, image, category } = req.body;

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.author = author || blog.author;
    blog.image = image || blog.image;
    blog.category = category || blog.category;

    const updatedBlog = await blog.save();
    res.json({ success: true, blog: updatedBlog });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
