import express from 'express';
import mongoose from 'mongoose';
import ContentSection from '../_models/ContentSection.js';
import FilterCategory from '../_models/FilterCategory.js';
import { protect, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

import { DEFAULT_CONTENT_SECTIONS } from '../_constants/defaultContent.js';
export { DEFAULT_CONTENT_SECTIONS };

// Flexible section finder by ObjectId or sectionKey
export const findSectionFlexible = async (idOrKey, body = {}) => {
  if (idOrKey && mongoose.Types.ObjectId.isValid(idOrKey)) {
    const sec = await ContentSection.findById(idOrKey);
    if (sec) return sec;
  }
  return await ContentSection.findOne({
    $or: [
      { sectionKey: idOrKey },
      { sectionKey: body.sectionKey, page: body.page }
    ]
  });
};

// Helper: Seed defaults safely and idempotently without overriding administrator customizations
export async function seedDefaultContentSafe() {
  try {
    for (const def of DEFAULT_CONTENT_SECTIONS) {
      let existing = await ContentSection.findOne({ page: def.page, sectionKey: def.sectionKey });
      if (!existing) {
        existing = new ContentSection(def);
        await existing.save();
      } else if (Array.isArray(def.items) && def.items.length > 0 && (!existing.items || existing.items.length === 0)) {
        existing.items = def.items;
        if (def.type && existing.type !== def.type) {
          existing.type = def.type;
        }
        await existing.save();
      }
    }
  } catch (err) {
    console.error('Error seeding default content sections:', err);
  }
}

// ----------------------------------------------------
// PUBLIC ROUTES
// ----------------------------------------------------

// @route   GET /api/content
// @desc    Get active content sections (all or filtered by page)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.query.page) {
      query.page = String(req.query.page).toLowerCase().trim();
    }
    const sections = await ContentSection.find(query).sort({ order: 1 });

    // Filter inactive items for customer-facing output
    const sanitized = sections.map(sec => {
      const obj = sec.toObject();
      if (Array.isArray(obj.items)) {
        obj.items = obj.items.filter(it => it.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      return obj;
    });

    res.json({ success: true, sections: sanitized });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/content/:page
// @desc    Get active content sections for a specific page
// @access  Public
router.get('/:page', async (req, res, next) => {
  try {
    const page = String(req.params.page).toLowerCase().trim();
    const sections = await ContentSection.find({ page, isActive: true }).sort({ order: 1 });

    const sanitized = sections.map(sec => {
      const obj = sec.toObject();
      if (Array.isArray(obj.items)) {
        obj.items = obj.items.filter(it => it.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      return obj;
    });

    res.json({ success: true, sections: sanitized });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// ADMIN PROTECTED ROUTES
// ----------------------------------------------------

// @route   GET /api/content/admin/all
// @desc    Get all content sections (including inactive and full item data)
// @access  Private/Admin
router.get('/admin/all', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const query = {};
    if (req.query.page) {
      query.page = String(req.query.page).toLowerCase().trim();
    }
    let sections = await ContentSection.find(query).sort({ page: 1, order: 1 });
    if (sections.length === 0) {
      await seedDefaultContentSafe();
      sections = await ContentSection.find(query).sort({ page: 1, order: 1 });
    }
    res.json({ success: true, sections });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/content/sections
// @desc    Create a new content section
// @access  Private/Admin
router.post('/sections', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const {
      page,
      sectionKey,
      name,
      title,
      subtitle,
      description,
      label,
      buttonText,
      buttonLink,
      image,
      mobileImage,
      secondaryImage,
      video,
      order,
      isActive,
      type,
      items,
      metadata
    } = req.body;

    if (!page || !sectionKey || !name) {
      return res.status(400).json({
        success: false,
        message: 'Page, sectionKey, and section name are required.'
      });
    }

    const cleanPage = String(page).toLowerCase().trim();
    const cleanKey = String(sectionKey).toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '_');

    const existing = await ContentSection.findOne({ page: cleanPage, sectionKey: cleanKey });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Section with key '${cleanKey}' already exists for page '${cleanPage}'.`
      });
    }

    const newSection = new ContentSection({
      page: cleanPage,
      sectionKey: cleanKey,
      name: name.trim(),
      title: title || '',
      subtitle: subtitle || '',
      description: description || '',
      label: label || '',
      buttonText: buttonText || '',
      buttonLink: buttonLink || '',
      image: image || '',
      mobileImage: mobileImage || '',
      secondaryImage: secondaryImage || '',
      video: video || '',
      order: typeof order === 'number' ? order : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      type: type || 'standard',
      items: Array.isArray(items) ? items : [],
      metadata: metadata || {}
    });

    await newSection.save();
    res.status(201).json({ success: true, section: newSection });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/content/sections/:id
// @desc    Update an existing section
// @access  Private/Admin
router.put('/sections/:id', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    let section = await findSectionFlexible(req.params.id, req.body);
    if (!section) {
      // If not found, create new section
      section = new ContentSection({
        page: req.body.page || 'home',
        sectionKey: req.body.sectionKey || req.params.id,
        name: req.body.name || req.body.sectionKey,
        ...req.body
      });
      await section.save();
      return res.status(201).json({ success: true, section });
    }

    const allowed = [
      'name', 'title', 'subtitle', 'description', 'label',
      'buttonText', 'buttonLink', 'image', 'mobileImage',
      'secondaryImage', 'video', 'order', 'isActive', 'type', 'metadata'
    ];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        section[field] = req.body[field];
      }
    });

    await section.save();
    res.json({ success: true, section });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/content/sections/:id/toggle
// @desc    Toggle active state of a section
// @access  Private/Admin
router.patch('/sections/:id/toggle', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const section = await findSectionFlexible(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Content section not found.' });
    }

    section.isActive = !section.isActive;
    await section.save();
    res.json({ success: true, section, isActive: section.isActive });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/content/sections/:id
// @desc    Delete a section
// @access  Private/Admin
router.delete('/sections/:id', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const section = await findSectionFlexible(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Content section not found.' });
    }

    await ContentSection.findByIdAndDelete(section._id);
    res.json({ success: true, message: 'Section deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/content/sections/reorder
// @desc    Reorder sections for a page
// @access  Private/Admin
router.put('/sections/reorder', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const { sectionIds } = req.body;
    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ success: false, message: 'sectionIds array is required.' });
    }

    for (let i = 0; i < sectionIds.length; i++) {
      await ContentSection.findByIdAndUpdate(sectionIds[i], { order: i + 1 });
    }

    res.json({ success: true, message: 'Sections reordered successfully.' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// SECTION ITEMS MANAGEMENT
// ----------------------------------------------------

// @route   POST /api/content/sections/:id/items
// @desc    Add a content item to a section
// @route   POST /api/content/sections/:id/items
// @desc    Add a content item to a section
// @access  Private/Admin
router.post('/sections/:id/items', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const section = await findSectionFlexible(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Content section not found.' });
    }

    const {
      title,
      subtitle,
      description,
      label,
      buttonText,
      buttonLink,
      image,
      mobileImage,
      secondaryImage,
      video,
      price,
      order,
      isActive,
      metadata
    } = req.body;

    const nextOrder = typeof order === 'number' ? order : (section.items.length + 1);

    section.items.push({
      title: title || '',
      subtitle: subtitle || '',
      description: description || '',
      label: label || '',
      buttonText: buttonText || '',
      buttonLink: buttonLink || '',
      image: image || '',
      mobileImage: mobileImage || '',
      secondaryImage: secondaryImage || '',
      video: video || '',
      price: typeof price === 'number' ? price : (Number(price) || 0),
      order: nextOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      metadata: metadata || {}
    });

    await section.save();
    const createdItem = section.items[section.items.length - 1];
    res.status(201).json({ success: true, section, item: createdItem });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/content/sections/:id/items/:itemId
// @desc    Update a content item
// @access  Private/Admin
router.put('/sections/:id/items/:itemId', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const section = await findSectionFlexible(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Content section not found.' });
    }

    const item = section.items.id(req.params.itemId) || section.items.find(i => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Content item not found.' });
    }

    const allowed = [
      'title', 'subtitle', 'description', 'label', 'buttonText',
      'buttonLink', 'image', 'mobileImage', 'secondaryImage',
      'video', 'price', 'order', 'isActive', 'metadata'
    ];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'price') {
          item.price = Number(req.body.price) || 0;
        } else {
          item[field] = req.body[field];
        }
      }
    });

    await section.save();
    res.json({ success: true, section, item });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/content/sections/:id/items/:itemId/toggle
// @desc    Toggle active state of a content item
// @access  Private/Admin
router.patch('/sections/:id/items/:itemId/toggle', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const section = await findSectionFlexible(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Content section not found.' });
    }

    const item = section.items.id(req.params.itemId) || section.items.find(i => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Content item not found.' });
    }

    item.isActive = !item.isActive;
    await section.save();
    res.json({ success: true, section, item, isActive: item.isActive });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/content/sections/:id/items/:itemId
// @desc    Delete a content item from a section
// @access  Private/Admin
router.delete('/sections/:id/items/:itemId', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const section = await findSectionFlexible(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Content section not found.' });
    }

    const item = section.items.id(req.params.itemId);
    if (item) {
      section.items.pull(req.params.itemId);
    } else {
      section.items = section.items.filter(i => i.id !== req.params.itemId && i._id?.toString() !== req.params.itemId);
    }
    await section.save();
    res.json({ success: true, section, message: 'Item deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/content/sections/:id/items/reorder
// @desc    Reorder items within a section
// @access  Private/Admin
router.put('/sections/:id/items/reorder', protect, requirePermission('website_content'), async (req, res, next) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ success: false, message: 'itemIds array is required.' });
    }

    const section = await findSectionFlexible(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Content section not found.' });
    }

    itemIds.forEach((id, index) => {
      const item = section.items.id(id) || section.items.find(i => i.id === id);
      if (item) {
        item.order = index + 1;
      }
    });

    section.items.sort((a, b) => (a.order || 0) - (b.order || 0));
    await section.save();
    res.json({ success: true, section });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/content/seed-defaults
// @desc    Manually re-trigger safe seeding of defaults
// @access  Public or Admin (Safe & Idempotent)
router.post('/seed-defaults', async (req, res, next) => {
  try {
    await seedDefaultContentSafe();
    const sections = await ContentSection.find().sort({ page: 1, order: 1 });
    res.json({ success: true, message: 'Existing website content verified and migrated.', sections });
  } catch (err) {
    next(err);
  }
});

export default router;
