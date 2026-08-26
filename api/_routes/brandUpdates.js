import express from 'express';
import BrandUpdate from '../_models/BrandUpdate.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/brand-updates
// @desc    Get all approved brand updates for public homepage
// @access  Public
router.get('/', async (req, res) => {
  try {
    const updates = await BrandUpdate.find({ approved: true }).sort({ createdAt: -1 });
    res.json({ success: true, updates });
  } catch (error) {
    console.error('Fetch brand updates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/brand-updates/admin
// @desc    Get all brand updates (approved and unapproved)
// @access  Private/Admin
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const updates = await BrandUpdate.find({}).sort({ createdAt: -1 });
    res.json({ success: true, updates });
  } catch (error) {
    console.error('Fetch admin brand updates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/brand-updates
// @desc    Add a brand update
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const { title, detail, approved } = req.body;

  try {
    if (!title || !detail) {
      return res.status(400).json({ success: false, message: 'Title and details are required.' });
    }

    const update = new BrandUpdate({
      title: title.trim(),
      detail: detail.trim(),
      approved: approved !== undefined ? approved : true
    });

    const createdUpdate = await update.save();
    res.status(201).json({ success: true, update: createdUpdate });
  } catch (error) {
    console.error('Create brand update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/brand-updates/:id
// @desc    Update a brand update
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { title, detail, approved } = req.body;

  try {
    const update = await BrandUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ success: false, message: 'Brand update not found' });
    }

    if (title !== undefined) update.title = title.trim();
    if (detail !== undefined) update.detail = detail.trim();
    if (approved !== undefined) update.approved = approved;

    const updatedUpdate = await update.save();
    res.json({ success: true, update: updatedUpdate });
  } catch (error) {
    console.error('Update brand update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/brand-updates/:id
// @desc    Delete a brand update
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const update = await BrandUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ success: false, message: 'Brand update not found' });
    }

    await BrandUpdate.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Brand update removed' });
  } catch (error) {
    console.error('Delete brand update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
