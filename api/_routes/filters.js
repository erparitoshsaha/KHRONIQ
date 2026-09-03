import express from 'express';
import FilterCategory from '../_models/FilterCategory.js';
import { protect, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

export const toSlug = (str) => {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const DEFAULT_FILTER_DEFINITIONS = [
  {
    name: 'Gender',
    slug: 'gender',
    type: 'multi',
    order: 1,
    isActive: true,
    options: [
      { name: "Men's Watches", slug: 'men', value: 'men', order: 1, isActive: true },
      { name: "Women's Watches", slug: 'women', value: 'women', order: 2, isActive: true }
    ]
  },
  {
    name: 'Collection',
    slug: 'collection',
    type: 'multi',
    order: 2,
    isActive: true,
    options: [
      { name: 'Deevaaz', slug: 'deevaaz', value: 'deevaaz', order: 1, isActive: true },
      { name: 'Classic', slug: 'classic', value: 'classic', order: 2, isActive: true }
    ]
  },
  {
    name: 'Movement',
    slug: 'movement',
    type: 'multi',
    order: 3,
    isActive: true,
    options: [
      { name: 'Automatic', slug: 'automatic', value: 'automatic', order: 1, isActive: true },
      { name: 'Digital', slug: 'digital', value: 'digital', order: 2, isActive: true },
      { name: 'Quartz', slug: 'quartz', value: 'quartz', order: 3, isActive: true }
    ]
  },
  {
    name: 'Strap',
    slug: 'strap',
    type: 'multi',
    order: 4,
    isActive: true,
    options: [
      { name: 'Leather Strap', slug: 'leather-strap', value: 'leather-strap', order: 1, isActive: true },
      { name: 'Chain Strap', slug: 'chain-strap', value: 'chain-strap', order: 2, isActive: true },
      { name: 'Stainless Steel', slug: 'stainless-steel', value: 'stainless-steel', order: 3, isActive: true },
      { name: 'Brass/Alloy', slug: 'brass-alloy', value: 'brass-alloy', order: 4, isActive: true }
    ]
  },
  {
    name: 'Dial',
    slug: 'dial',
    type: 'multi',
    order: 5,
    isActive: true,
    options: [
      { name: 'Analog', slug: 'analog', value: 'analog', order: 1, isActive: true },
      { name: 'Digital', slug: 'digital', value: 'digital', order: 2, isActive: true },
      { name: 'Digital Analog', slug: 'digital-analog', value: 'digital-analog', order: 3, isActive: true }
    ]
  },
  {
    name: 'Case',
    slug: 'case',
    type: 'multi',
    order: 6,
    isActive: true,
    options: [
      { name: 'Stainless Steel', slug: 'stainless-steel', value: 'stainless-steel', order: 1, isActive: true },
      { name: 'Brass/Alloy', slug: 'brass-alloy', value: 'brass-alloy', order: 2, isActive: true }
    ]
  }
];

// Helper: Seed default filters safely & idempotently without wiping existing categories/options
export async function seedDefaultFiltersSafe() {
  for (const def of DEFAULT_FILTER_DEFINITIONS) {
    let existingCat = await FilterCategory.findOne({ slug: def.slug });
    if (!existingCat) {
      existingCat = new FilterCategory({
        name: def.name,
        slug: def.slug,
        type: def.type || 'multi',
        order: def.order || 0,
        isActive: def.isActive !== undefined ? def.isActive : true,
        options: def.options || []
      });
      await existingCat.save();
    } else {
      // Check for missing default options
      let modified = false;
      for (const optDef of def.options) {
        const hasOpt = existingCat.options.some(o => o.slug === optDef.slug);
        if (!hasOpt) {
          existingCat.options.push(optDef);
          modified = true;
        }
      }
      if (modified) {
        await existingCat.save();
      }
    }
  }
}

// @route   GET /api/filters
// @desc    Public Read-Only: Get active filter categories and their active options
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const rawCategories = await FilterCategory.find({ isActive: true }).sort({ order: 1, name: 1 });

    const categories = rawCategories.map(cat => {
      const activeOptions = (cat.options || [])
        .filter(opt => opt.isActive)
        .sort((a, b) => a.order - b.order)
        .map(opt => ({
          id: opt._id ? opt._id.toString() : opt.id,
          name: opt.name,
          slug: opt.slug,
          value: opt.value || opt.slug,
          order: opt.order,
          isActive: opt.isActive
        }));

      return {
        id: cat._id ? cat._id.toString() : cat.id,
        name: cat.name,
        slug: cat.slug,
        type: cat.type || 'multi',
        order: cat.order || 0,
        isActive: cat.isActive,
        options: activeOptions
      };
    });

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Fetch public filters error:', error);
    next(error);
  }
});

// @route   GET /api/filters/admin
// @desc    Get all filter categories & options (including inactive) for Admin Panel
// @access  Private/Admin
router.get('/admin', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const categories = await FilterCategory.find({}).sort({ order: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Fetch admin filters error:', error);
    next(error);
  }
});

// @route   POST /api/filters/seed-defaults
// @desc    Idempotently seed default filter categories & options
// @access  Private/Admin
router.post('/seed-defaults', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    await seedDefaultFiltersSafe();
    const categories = await FilterCategory.find({}).sort({ order: 1, name: 1 });
    res.json({ success: true, message: 'Default filter categories verified and seeded.', categories });
  } catch (error) {
    console.error('Seed default filters error:', error);
    next(error);
  }
});

// @route   POST /api/filters/categories
// @desc    Create a new filter category
// @access  Private/Admin
router.post('/categories', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const { name, slug, type, order, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const cleanName = name.trim();
    const cleanSlug = toSlug(slug || cleanName);
    if (!cleanSlug) {
      return res.status(400).json({ success: false, message: 'Valid category name is required.' });
    }

    const existing = await FilterCategory.findOne({
      $or: [
        { slug: cleanSlug },
        { name: { $regex: new RegExp(`^${cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${cleanName}" already exists. Please edit the existing category instead.`
      });
    }

    const newCategory = new FilterCategory({
      name: cleanName,
      slug: cleanSlug,
      type: type || 'multi',
      order: Number(order) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      options: []
    });

    const savedCategory = await newCategory.save();
    res.status(201).json({ success: true, category: savedCategory });
  } catch (error) {
    console.error('Create filter category error:', error);
    res.status(500).json({ success: false, message: 'Failed to save filter category.' });
  }
});

// @route   PUT /api/filters/categories/:id
// @desc    Update a filter category (name, slug, type, order, isActive)
// @access  Private/Admin
router.put('/categories/:id', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const { name, slug, type, order, isActive } = req.body;
    const category = await FilterCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Filter category not found.' });
    }

    if (name !== undefined && name.trim()) {
      const cleanName = name.trim();
      const newSlug = toSlug(slug || cleanName);
      
      const duplicate = await FilterCategory.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { slug: newSlug },
          { name: { $regex: new RegExp(`^${cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
        ]
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Category "${cleanName}" already exists. Please choose a different name.`
        });
      }

      category.name = cleanName;
      category.slug = newSlug;
    }

    if (type !== undefined) category.type = type;
    if (order !== undefined) category.order = Number(order) || 0;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    const updatedCategory = await category.save();
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Update filter category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update filter category.' });
  }
});

// @route   DELETE /api/filters/categories/:id
// @desc    Delete a filter category
// @access  Private/Admin
router.delete('/categories/:id', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const category = await FilterCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Filter category not found.' });
    }

    await FilterCategory.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Filter category deleted successfully.' });
  } catch (error) {
    console.error('Delete filter category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete filter category.' });
  }
});

// @route   POST /api/filters/categories/:categoryId/options
// @desc    Add an option to a filter category
// @access  Private/Admin
router.post('/categories/:categoryId/options', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const { name, slug, value, order, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Option name is required.' });
    }

    const category = await FilterCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Parent filter category not found.' });
    }

    const cleanName = name.trim();
    const cleanSlug = toSlug(slug || cleanName);
    const cleanVal = (value && value.trim()) ? value.trim() : cleanSlug;

    const existingOpt = (category.options || []).find(
      o => o.slug === cleanSlug || o.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (existingOpt) {
      return res.status(400).json({
        success: false,
        message: `Option "${cleanName}" already exists in this category.`
      });
    }

    const newOption = {
      name: cleanName,
      slug: cleanSlug,
      value: cleanVal,
      order: Number(order) || (category.options.length + 1),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };

    category.options.push(newOption);
    await category.save();

    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Add filter option error:', error);
    res.status(500).json({ success: false, message: 'Failed to add filter option.' });
  }
});

// @route   PUT /api/filters/categories/:categoryId/options/:optionId
// @desc    Update a filter option
// @access  Private/Admin
router.put('/categories/:categoryId/options/:optionId', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const { name, slug, value, order, isActive } = req.body;
    const category = await FilterCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Parent filter category not found.' });
    }

    const option = category.options.id(req.params.optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: 'Filter option not found.' });
    }

    if (name !== undefined && name.trim()) {
      const cleanName = name.trim();
      const newSlug = toSlug(slug || cleanName);

      const duplicate = category.options.find(
        o => (o.slug === newSlug || o.name.toLowerCase() === cleanName.toLowerCase()) &&
             o._id.toString() !== req.params.optionId
      );

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Option "${cleanName}" already exists in this category.`
        });
      }

      option.name = cleanName;
      option.slug = newSlug;
      if (value === undefined) {
        option.value = newSlug;
      }
    }

    if (value !== undefined) option.value = value.trim();
    if (order !== undefined) option.order = Number(order) || 0;
    if (isActive !== undefined) option.isActive = Boolean(isActive);

    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Update filter option error:', error);
    res.status(500).json({ success: false, message: 'Failed to update filter option.' });
  }
});

// @route   DELETE /api/filters/categories/:categoryId/options/:optionId
// @desc    Delete a filter option
// @access  Private/Admin
router.delete('/categories/:categoryId/options/:optionId', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const category = await FilterCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Parent filter category not found.' });
    }

    const optIndex = category.options.findIndex(o => o._id.toString() === req.params.optionId);
    if (optIndex === -1) {
      return res.status(404).json({ success: false, message: 'Filter option not found.' });
    }

    category.options.splice(optIndex, 1);
    await category.save();

    res.json({ success: true, message: 'Filter option deleted successfully.', category });
  } catch (error) {
    console.error('Delete filter option error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete filter option.' });
  }
});

export default router;
