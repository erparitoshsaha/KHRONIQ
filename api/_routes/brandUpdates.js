import express from 'express';
import mongoose from 'mongoose';
import BrandUpdate from '../_models/BrandUpdate.js';
import { protect, adminOnly, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/brand-updates
// @desc    Get all active, approved brand updates for public display (not expired)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const allApproved = await BrandUpdate.find({ approved: true }).sort({ createdAt: -1 });
    const now = Date.now();
    const validUpdates = allApproved.filter(u => {
      const durationMs = (u.durationHours || 24) * 3600 * 1000;
      return (now - new Date(u.createdAt).getTime()) < durationMs;
    });

    res.json({ success: true, updates: validUpdates });
  } catch (error) {
    console.error('Fetch brand updates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/brand-updates/admin
// @desc    Get all brand updates (approved and unapproved, expired and active)
// @access  Private/Admin
router.get('/admin', protect, requirePermission('brand_updates'), async (req, res) => {
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
router.post('/', protect, requirePermission('brand_updates'), async (req, res) => {
  const { title, detail, approved, durationHours, image } = req.body;

  try {
    if (!title || !detail) {
      return res.status(400).json({ success: false, message: 'Title and details are required.' });
    }

    const update = new BrandUpdate({
      title: title.trim(),
      detail: detail.trim(),
      approved: approved !== undefined ? Boolean(approved) : true,
      durationHours: Number(durationHours) || 24,
      image: typeof image === 'string' ? image.trim() : ''
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
router.put('/:id', protect, requirePermission('brand_updates'), async (req, res) => {
  const { title, detail, approved, durationHours, image } = req.body;

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Brand update not found' });
    }

    const update = await BrandUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ success: false, message: 'Brand update not found' });
    }

    if (title !== undefined) update.title = title.trim();
    if (detail !== undefined) update.detail = detail.trim();
    if (approved !== undefined) update.approved = Boolean(approved);
    if (durationHours !== undefined) update.durationHours = Number(durationHours) || 24;
    if (image !== undefined) update.image = typeof image === 'string' ? image.trim() : '';

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
router.delete('/:id', protect, requirePermission('brand_updates'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Brand update not found' });
    }

    const update = await BrandUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ success: false, message: 'Brand update not found' });
    }

    await BrandUpdate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Brand update removed' });
  } catch (error) {
    console.error('Delete brand update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
