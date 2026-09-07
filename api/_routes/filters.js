import express from 'express';
import mongoose from 'mongoose';
import FilterCategory from '../_models/FilterCategory.js';
import { protect, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

// Helper: Slugify string safely
function toSlug(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// System baseline filter categories and options
export const DEFAULT_FILTER_DEFINITIONS = [
  {
    name: 'Gender',
    slug: 'gender',
    description: 'Target demographic and watch styling for clients',
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
    description: 'Signature Khroniq timepiece series and collections',
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
    description: 'Precision mechanical, automatic, and quartz caliber mechanisms',
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
    description: 'Handcrafted leather, stainless steel links, and premium bands',
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
    description: 'Analog, digital, and hybrid complication dials',
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
    description: 'Surgical stainless steel and artisan alloy case materials',
    type: 'multi',
    order: 6,
    isActive: true,
    options: [
      { name: 'Stainless Steel', slug: 'stainless-steel', value: 'stainless-steel', order: 1, isActive: true },
      { name: 'Brass/Alloy', slug: 'brass-alloy', value: 'brass-alloy', order: 2, isActive: true }
    ]
  }
];

// Helper: Seed default filters safely & idempotently without wiping existing customizations or creating duplicates
export async function seedDefaultFiltersSafe() {
  for (const def of DEFAULT_FILTER_DEFINITIONS) {
    let existingCat = await FilterCategory.findOne({ slug: def.slug });
    if (!existingCat) {
      existingCat = new FilterCategory({
        name: def.name,
        slug: def.slug,
        description: def.description || '',
        type: def.type || 'multi',
        order: def.order || 0,
        isActive: def.isActive !== undefined ? def.isActive : true,
        options: (def.options || []).map((o, idx) => ({
          _id: new mongoose.Types.ObjectId(),
          name: o.name,
          slug: o.slug,
          value: o.value || o.slug,
          order: o.order !== undefined ? o.order : idx + 1,
          isActive: o.isActive !== false
        }))
      });
      await existingCat.save();
    } else {
      let modified = false;

      // 1. Deduplicate existing options in database by normalized name & slug
      const seenNames = new Set();
      const seenSlugs = new Set();
      const cleanExistingOptions = [];

      for (const opt of (existingCat.options || [])) {
        const normName = String(opt.name || '').toLowerCase().trim();
        const cleanSlug = toSlug(opt.slug || opt.name);
        if (!seenNames.has(normName) && !seenSlugs.has(cleanSlug)) {
          seenNames.add(normName);
          seenSlugs.add(cleanSlug);
          cleanExistingOptions.push(opt);
        } else {
          modified = true;
        }
      }
      existingCat.options = cleanExistingOptions;

      // 2. Add missing default options without duplicate names or slugs
      for (const optDef of def.options) {
        const normDefName = String(optDef.name || '').toLowerCase().trim();
        const defSlug = toSlug(optDef.slug || optDef.name);
        const hasOpt = existingCat.options.some(
          o => toSlug(o.slug || o.name) === defSlug || String(o.name || '').toLowerCase().trim() === normDefName
        );
        if (!hasOpt) {
          existingCat.options.push({
            _id: new mongoose.Types.ObjectId(),
            name: optDef.name,
            slug: defSlug,
            value: optDef.value || defSlug,
            order: optDef.order || (existingCat.options.length + 1),
            isActive: optDef.isActive !== false
          });
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
        description: cat.description || '',
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
// @desc    Create a new filter category with optional initial options
// @access  Private/Admin
router.post('/categories', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const { name, slug, description, type, order, isActive, options } = req.body;
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
        message: `Category "${cleanName}" already exists. Please choose a different name.`
      });
    }

    // Process & deduplicate options if provided
    const cleanOptions = [];
    if (Array.isArray(options)) {
      const seenNames = new Set();
      const seenSlugs = new Set();

      options.forEach((opt, idx) => {
        const optName = String(opt.name || '').trim();
        if (!optName) return;
        const normName = optName.toLowerCase();
        const optSlug = toSlug(opt.slug || optName);

        if (!seenNames.has(normName) && !seenSlugs.has(optSlug)) {
          seenNames.add(normName);
          seenSlugs.add(optSlug);
          cleanOptions.push({
            _id: new mongoose.Types.ObjectId(),
            name: optName,
            slug: optSlug,
            value: (opt.value && String(opt.value).trim()) ? String(opt.value).trim() : optSlug,
            order: opt.order !== undefined ? Number(opt.order) : idx + 1,
            isActive: opt.isActive !== false
          });
        }
      });
    }

    const newCategory = new FilterCategory({
      name: cleanName,
      slug: cleanSlug,
      description: description ? String(description).trim() : '',
      type: type || 'multi',
      order: Number(order) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      options: cleanOptions
    });

    const savedCategory = await newCategory.save();
    res.status(201).json({ success: true, category: savedCategory });
  } catch (error) {
    console.error('Create filter category error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save filter category.' });
  }
});

// @route   PUT /api/filters/categories/:id
// @desc    Update a filter category and optionally its options atomically
// @access  Private/Admin
router.put('/categories/:id', protect, requirePermission('catalog_filters'), async (req, res, next) => {
  try {
    const { name, slug, description, type, order, isActive, options } = req.body;
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

    if (description !== undefined) category.description = String(description).trim();
    if (type !== undefined) category.type = type;
    if (order !== undefined) category.order = Number(order) || 0;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    // Support complete batch update of options inside category editor with ObjectId safety and deduplication
    if (Array.isArray(options)) {
      const seenNames = new Set();
      const seenSlugs = new Set();
      const cleanOptions = [];

      for (let idx = 0; idx < options.length; idx++) {
        const opt = options[idx];
        const optName = String(opt.name || '').trim();
        if (!optName) continue;
        const normName = optName.toLowerCase();
        const optSlug = toSlug(opt.slug || optName);

        // Deduplicate within the payload
        if (seenNames.has(normName) || seenSlugs.has(optSlug)) {
          continue;
        }
        seenNames.add(normName);
        seenSlugs.add(optSlug);

        // Safe ObjectId: preserve existing valid 24-char ObjectId, or generate new valid ObjectId
        const validId = (opt._id && mongoose.Types.ObjectId.isValid(opt._id))
          ? opt._id
          : ((opt.id && mongoose.Types.ObjectId.isValid(opt.id)) ? opt.id : new mongoose.Types.ObjectId());

        cleanOptions.push({
          _id: validId,
          name: optName,
          slug: optSlug,
          value: (opt.value && String(opt.value).trim()) ? String(opt.value).trim() : optSlug,
          order: opt.order !== undefined ? Number(opt.order) : cleanOptions.length + 1,
          isActive: opt.isActive !== false
        });
      }

      category.options = cleanOptions;
    }

    const updatedCategory = await category.save();
    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error('Update filter category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update filter category.',
      error: error.message
    });
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
// @desc    Add an option to a category with duplicate prevention
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
      o => o.slug === cleanSlug ||
           o.name.toLowerCase().trim() === cleanName.toLowerCase() ||
           toSlug(o.name) === cleanSlug
    );

    if (existingOpt) {
      return res.status(400).json({
        success: false,
        message: `This option already exists in ${category.name}.`
      });
    }

    const newOption = {
      _id: new mongoose.Types.ObjectId(),
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
    res.status(500).json({ success: false, message: error.message || 'Failed to add filter option.' });
  }
});

// @route   PUT /api/filters/categories/:categoryId/options/:optionId
// @desc    Update a filter option with duplicate prevention
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
        o => (o.slug === newSlug || o.name.toLowerCase().trim() === cleanName.toLowerCase() || toSlug(o.name) === newSlug) &&
             o._id.toString() !== req.params.optionId
      );

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `This option already exists in ${category.name}.`
        });
      }

      option.name = cleanName;
      option.slug = newSlug;
      if (value !== undefined) option.value = value.trim() || newSlug;
    }

    if (order !== undefined) option.order = Number(order) || 0;
    if (isActive !== undefined) option.isActive = Boolean(isActive);

    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Update filter option error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update filter option.' });
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

    const option = category.options.id(req.params.optionId);
    if (!option) {
      return res.status(404).json({ success: false, message: 'Filter option not found.' });
    }

    category.options.pull(req.params.optionId);
    await category.save();

    res.json({ success: true, message: 'Filter option deleted successfully.', category });
  } catch (error) {
    console.error('Delete filter option error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete filter option.' });
  }
});

export default router;
