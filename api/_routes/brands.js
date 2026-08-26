import express from 'express';
import Brand from '../_models/Brand.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

const toSlug = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// @route   GET /api/brands
// @desc    Get all brands
// @access  Public
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 });
    res.json({ success: true, brands });
  } catch (error) {
    console.error('Fetch brands error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/brands
// @desc    Create a brand
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const { name, logo, description } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Brand name is required' });
  }

  try {
    const slug = toSlug(name);
    const existing = await Brand.findOne({ $or: [{ name }, { slug }] });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Brand already exists' });
    }

    const brand = new Brand({ name, slug, logo, description });
    const createdBrand = await brand.save();
    res.status(201).json({ success: true, brand: createdBrand });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/brands/:id
// @desc    Update a brand
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { name, logo, description } = req.body;

  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    if (name !== undefined) {
      brand.name = name;
      brand.slug = toSlug(name);
    }
    if (logo !== undefined) brand.logo = logo;
    if (description !== undefined) brand.description = description;

    const updatedBrand = await brand.save();
    res.json({ success: true, brand: updatedBrand });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/brands/:id
// @desc    Delete a brand
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    await Brand.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Brand removed' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;