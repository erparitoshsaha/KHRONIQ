import express from 'express';
import BrandUpdate from '../_models/BrandUpdate.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/brand-updates
// @desc    Get all approved brand updates for public homepage
// @access  Public
router.get('/', async (req, res) => {
  try {
    const allApproved = await BrandUpdate.find({ approved: true }).sort({ createdAt: -1 });
    let updates = allApproved.filter(u => {
      const createdDate = u.createdAt ? new Date(u.createdAt) : new Date();
      const timeMs = isNaN(createdDate.getTime()) ? Date.now() : createdDate.getTime();
      const durationMs = (u.durationHours || 24) * 60 * 60 * 1000;
      const expiryTime = timeMs + durationMs;
      return expiryTime > Date.now();
    });

    // Fallback: if no active updates exist, return the 3 most recent approved updates
    if (updates.length === 0 && allApproved.length > 0) {
      updates = allApproved.slice(0, 3);
    }

    // Secondary fallback: if database is completely empty, provide premium mock updates
    if (updates.length === 0) {
      updates = [
        {
          _id: "mock-update-1",
          title: "Khroniq Professional Launch",
          detail: "The all-new Khronomaster Professional series is now officially live. Crafted with precision in India, featuring high-frequency chronograph movements and anti-reflective sapphire crystal.",
          createdAt: new Date()
        },
        {
          _id: "mock-update-2",
          title: "Swadeshi Warranty Activation",
          detail: "You can now verify the authenticity of your timepiece online. Register your watch using the claim code and serial number to activate your 2-year manufacturer warranty.",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          _id: "mock-update-3",
          title: "Bespoke Customizer Live",
          detail: "Tailor your watch to match your individual style. Our bespoke online customizer is active. Choose your custom strap, dial, and hand color combinations today.",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ];
    }

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
  const { title, detail, approved, durationHours } = req.body;

  try {
    if (!title || !detail) {
      return res.status(400).json({ success: false, message: 'Title and details are required.' });
    }

    const update = new BrandUpdate({
      title: title.trim(),
      detail: detail.trim(),
      approved: approved !== undefined ? approved : true,
      durationHours: durationHours !== undefined ? Number(durationHours) : 24
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
  const { title, detail, approved, durationHours } = req.body;

  try {
    const update = await BrandUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ success: false, message: 'Brand update not found' });
    }

    if (title !== undefined) update.title = title.trim();
    if (detail !== undefined) update.detail = detail.trim();
    if (approved !== undefined) update.approved = approved;
    if (durationHours !== undefined) update.durationHours = Number(durationHours);

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
