import express from 'express';
import FooterSection from '../_models/FooterSection.js';
import { protect, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

export const toSlug = (str) => {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const DEFAULT_FOOTER_DEFINITIONS = [
  {
    title: 'Collections',
    slug: 'collections',
    type: 'dynamic_collection',
    order: 1,
    isActive: true,
    links: []
  },
  {
    title: 'Legal',
    slug: 'legal',
    type: 'custom',
    order: 2,
    isActive: true,
    links: [
      { label: 'Book an Appointment', page: 'static', args: { view: 'contact' }, order: 1, isActive: true },
      { label: 'Register My Watch', action: 'warranty', order: 2, isActive: true },
      { label: 'Boutique Contact', page: 'static', args: { view: 'contact' }, order: 3, isActive: true }
    ]
  },
  {
    title: 'Policies',
    slug: 'policies',
    type: 'custom',
    order: 3,
    isActive: true,
    links: [
      { label: 'Privacy Policy', page: 'static', args: { view: 'privacy' }, order: 1, isActive: true },
      { label: 'COD Policy', page: 'static', args: { view: 'cod' }, order: 2, isActive: true },
      { label: 'Cookie Policy', page: 'static', args: { view: 'cookie' }, order: 3, isActive: true },
      { label: 'Gifting Policy', page: 'static', args: { view: 'gifting' }, order: 4, isActive: true },
      { label: 'Repair & Service', page: 'static', args: { view: 'repair' }, order: 5, isActive: true },
      { label: 'Community Guidelines', page: 'static', args: { view: 'community' }, order: 6, isActive: true },
      { label: 'Cancellation Policy', page: 'static', args: { view: 'cancellation' }, order: 7, isActive: true },
      { label: 'Replacement Policy', page: 'static', args: { view: 'exchange' }, order: 8, isActive: true },
      { label: 'Refund Policy', page: 'static', args: { view: 'refund' }, order: 9, isActive: true },
      { label: 'Warranty Policy', page: 'static', args: { view: 'warranty' }, order: 10, isActive: true },
      { label: 'Shipping Policy', page: 'static', args: { view: 'shipping' }, order: 11, isActive: true }
    ]
  },
  {
    title: 'The Brand',
    slug: 'the-brand',
    type: 'custom',
    order: 4,
    isActive: true,
    links: [
      { label: 'Our History', page: 'static', args: { view: 'about' }, order: 1, isActive: true },
      { label: 'The Manufacture', page: 'static', args: { view: 'about' }, order: 2, isActive: true },
      { label: 'Sustainability', page: 'static', args: { view: 'about' }, order: 3, isActive: true },
      { label: 'Blogs & Editorial', page: 'static', args: { view: 'blogs' }, order: 4, isActive: true },
      { label: 'FAQ', page: 'static', args: { view: 'faq' }, order: 5, isActive: true }
    ]
  }
];

export async function seedDefaultFooterSafe() {
  for (const def of DEFAULT_FOOTER_DEFINITIONS) {
    let existingSec = await FooterSection.findOne({ slug: def.slug });
    if (!existingSec) {
      existingSec = new FooterSection({
        title: def.title,
        slug: def.slug,
        type: def.type || 'custom',
        order: def.order || 0,
        isActive: def.isActive !== undefined ? def.isActive : true,
        links: def.links || []
      });
      await existingSec.save();
    } else {
      let modified = false;
      for (const linkDef of def.links) {
        const hasLink = existingSec.links.some(l => l.label.toLowerCase() === linkDef.label.toLowerCase());
        if (!hasLink) {
          existingSec.links.push(linkDef);
          modified = true;
        }
      }
      if (modified) {
        await existingSec.save();
      }
    }
  }
}

// @route   GET /api/footer
// @desc    Public Read-Only: Get active footer sections and active links
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const rawSections = await FooterSection.find({ isActive: true }).sort({ order: 1, title: 1 });

    const sections = rawSections.map(sec => {
      const activeLinks = (sec.links || [])
        .filter(l => l.isActive)
        .sort((a, b) => a.order - b.order)
        .map(l => ({
          id: l._id ? l._id.toString() : l.id,
          label: l.label,
          page: l.page,
          url: l.url,
          args: l.args,
          action: l.action,
          order: l.order,
          isActive: l.isActive
        }));

      return {
        id: sec._id ? sec._id.toString() : sec.id,
        title: sec.title,
        slug: sec.slug,
        type: sec.type,
        order: sec.order,
        isActive: sec.isActive,
        links: activeLinks
      };
    });

    res.json({ success: true, sections });
  } catch (error) {
    console.error('Fetch public footer error:', error);
    next(error);
  }
});

// @route   GET /api/footer/admin
// @desc    Get all footer sections & links for Admin Panel
// @access  Private/Admin
router.get('/admin', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const sections = await FooterSection.find({}).sort({ order: 1, title: 1 });
    res.json({ success: true, sections });
  } catch (error) {
    console.error('Fetch admin footer error:', error);
    next(error);
  }
});

// @route   POST /api/footer/seed-defaults
// @desc    Seed default footer sections idempotently
// @access  Private/Admin
router.post('/seed-defaults', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    await seedDefaultFooterSafe();
    const sections = await FooterSection.find({}).sort({ order: 1, title: 1 });
    res.json({ success: true, message: 'Default footer sections verified and active.', sections });
  } catch (error) {
    console.error('Seed default footer error:', error);
    next(error);
  }
});

// @route   POST /api/footer/sections
// @desc    Create a new custom footer section
// @access  Private/Admin
router.post('/sections', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const { title, order, isActive } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Section title is required.' });
    }

    const cleanTitle = title.trim();
    const cleanSlug = toSlug(cleanTitle);

    const existing = await FooterSection.findOne({
      $or: [
        { slug: cleanSlug },
        { title: { $regex: new RegExp(`^${cleanTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Footer section "${cleanTitle}" already exists. Please edit the existing section instead.`
      });
    }

    const newSection = new FooterSection({
      title: cleanTitle,
      slug: cleanSlug,
      type: 'custom',
      order: Number(order) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      links: []
    });

    const savedSection = await newSection.save();
    res.status(201).json({ success: true, section: savedSection });
  } catch (error) {
    console.error('Create footer section error:', error);
    res.status(500).json({ success: false, message: 'Failed to create footer section.' });
  }
});

// @route   PUT /api/footer/sections/:id
// @desc    Update a footer section (title, order, isActive)
// @access  Private/Admin
router.put('/sections/:id', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const { title, order, isActive } = req.body;
    const section = await FooterSection.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ success: false, message: 'Footer section not found.' });
    }

    if (title !== undefined && title.trim()) {
      const cleanTitle = title.trim();
      const newSlug = toSlug(cleanTitle);

      const duplicate = await FooterSection.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { slug: newSlug },
          { title: { $regex: new RegExp(`^${cleanTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
        ]
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Section "${cleanTitle}" already exists. Please choose a different title.`
        });
      }

      section.title = cleanTitle;
      if (section.type !== 'dynamic_collection') {
        section.slug = newSlug;
      }
    }

    if (order !== undefined) section.order = Number(order) || 0;
    if (isActive !== undefined) section.isActive = Boolean(isActive);

    const updatedSection = await section.save();
    res.json({ success: true, section: updatedSection });
  } catch (error) {
    console.error('Update footer section error:', error);
    res.status(500).json({ success: false, message: 'Failed to update footer section.' });
  }
});

// @route   DELETE /api/footer/sections/:id
// @desc    Delete a footer section (custom only)
// @access  Private/Admin
router.delete('/sections/:id', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const section = await FooterSection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Footer section not found.' });
    }

    if (section.type === 'dynamic_collection' || section.slug === 'collections') {
      return res.status(400).json({
        success: false,
        message: 'The dynamic Collections section cannot be deleted. You can disable it instead.'
      });
    }

    await FooterSection.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Footer section deleted successfully.' });
  } catch (error) {
    console.error('Delete footer section error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete footer section.' });
  }
});

// @route   POST /api/footer/sections/:sectionId/links
// @desc    Add a link to a footer section
// @access  Private/Admin
router.post('/sections/:sectionId/links', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const { label, page, url, args, action, order, isActive } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ success: false, message: 'Link label is required.' });
    }

    const section = await FooterSection.findById(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Parent footer section not found.' });
    }

    if (section.type === 'dynamic_collection') {
      return res.status(400).json({
        success: false,
        message: 'Collections are dynamically managed through Catalog Filters.'
      });
    }

    const cleanLabel = label.trim();
    const existingLink = (section.links || []).find(
      l => l.label.toLowerCase() === cleanLabel.toLowerCase()
    );

    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: `Link "${cleanLabel}" already exists in this section.`
      });
    }

    const newLink = {
      label: cleanLabel,
      page: page ? page.trim() : 'static',
      url: url ? url.trim() : '',
      args: args || null,
      action: action ? action.trim() : '',
      order: Number(order) || (section.links.length + 1),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };

    section.links.push(newLink);
    await section.save();

    res.status(201).json({ success: true, section });
  } catch (error) {
    console.error('Add footer link error:', error);
    res.status(500).json({ success: false, message: 'Failed to add footer link.' });
  }
});

// @route   PUT /api/footer/sections/:sectionId/links/:linkId
// @desc    Update a footer link
// @access  Private/Admin
router.put('/sections/:sectionId/links/:linkId', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const { label, page, url, args, action, order, isActive } = req.body;
    const section = await FooterSection.findById(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Parent footer section not found.' });
    }

    const link = (section.links || []).find(
      l => (l._id && l._id.toString() === req.params.linkId) || (l.id && l.id === req.params.linkId)
    );
    if (!link) {
      return res.status(404).json({ success: false, message: 'Footer link not found.' });
    }

    if (label !== undefined && label.trim()) {
      const cleanLabel = label.trim();
      const duplicate = section.links.find(
        l => l.label.toLowerCase() === cleanLabel.toLowerCase() && 
             ((l._id && l._id.toString() !== req.params.linkId) || (l.id && l.id !== req.params.linkId))
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Link "${cleanLabel}" already exists in this section.`
        });
      }
      link.label = cleanLabel;
    }

    if (page !== undefined) link.page = page.trim();
    if (url !== undefined) link.url = url.trim();
    if (args !== undefined) link.args = args;
    if (action !== undefined) link.action = action.trim();
    if (order !== undefined) link.order = Number(order) || 0;
    if (isActive !== undefined) link.isActive = Boolean(isActive);

    await section.save();
    res.json({ success: true, section });
  } catch (error) {
    console.error('Update footer link error:', error);
    res.status(500).json({ success: false, message: 'Failed to update footer link.' });
  }
});

// @route   DELETE /api/footer/sections/:sectionId/links/:linkId
// @desc    Delete a footer link
// @access  Private/Admin
router.delete('/sections/:sectionId/links/:linkId', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const section = await FooterSection.findById(req.params.sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Parent footer section not found.' });
    }

    const linkIndex = (section.links || []).findIndex(
      l => (l._id && l._id.toString() === req.params.linkId) || (l.id && l.id === req.params.linkId)
    );
    if (linkIndex === -1) {
      return res.status(404).json({ success: false, message: 'Footer link not found.' });
    }

    section.links.splice(linkIndex, 1);
    await section.save();

    res.json({ success: true, message: 'Footer link deleted successfully.', section });
  } catch (error) {
    console.error('Delete footer link error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete footer link.' });
  }
});


// @route   PUT /api/footer/sections/:sourceSectionId/links/:linkId/move
// @desc    Move a link from one footer section to another
// @access  Private/Admin
router.put('/sections/:sourceSectionId/links/:linkId/move', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const { targetSectionId } = req.body;
    const { sourceSectionId, linkId } = req.params;

    if (!targetSectionId) {
      return res.status(400).json({ success: false, message: 'Destination section is required.' });
    }

    if (sourceSectionId === targetSectionId) {
      return res.status(400).json({ success: false, message: 'Target section must be different from source section.' });
    }

    const sourceSection = await FooterSection.findById(sourceSectionId);
    if (!sourceSection) {
      return res.status(404).json({ success: false, message: 'Source footer section not found.' });
    }

    const targetSection = await FooterSection.findById(targetSectionId);
    if (!targetSection) {
      return res.status(404).json({ success: false, message: 'Destination footer section not found.' });
    }

    if (targetSection.type === 'dynamic_collection' || targetSection.slug === 'collections') {
      return res.status(400).json({
        success: false,
        message: 'Cannot move links into the dynamic Collections section.'
      });
    }

    const linkIndex = (sourceSection.links || []).findIndex(
      l => (l._id && l._id.toString() === linkId) || (l.id && l.id === linkId)
    );

    if (linkIndex === -1) {
      return res.status(404).json({ success: false, message: 'Footer link not found in source section.' });
    }

    const [extractedLink] = sourceSection.links.splice(linkIndex, 1);

    // Check duplicate in target section
    const isDuplicate = (targetSection.links || []).some(
      l => l.label.toLowerCase() === extractedLink.label.toLowerCase()
    );

    if (isDuplicate) {
      // Restore in source
      sourceSection.links.splice(linkIndex, 0, extractedLink);
      return res.status(400).json({
        success: false,
        message: `A link with the name "${extractedLink.label}" already exists in "${targetSection.title}".`
      });
    }

    // Preserve all link properties and assign next order
    const movedLinkObj = {
      label: extractedLink.label,
      page: extractedLink.page,
      url: extractedLink.url,
      args: extractedLink.args,
      action: extractedLink.action,
      order: (targetSection.links?.length || 0) + 1,
      isActive: extractedLink.isActive !== undefined ? extractedLink.isActive : true
    };

    targetSection.links.push(movedLinkObj);

    await sourceSection.save();
    await targetSection.save();

    res.json({
      success: true,
      message: `Link "${extractedLink.label}" moved from "${sourceSection.title}" to "${targetSection.title}" successfully.`,
      sourceSection,
      targetSection
    });
  } catch (error) {
    console.error('Move footer link error:', error);
    res.status(500).json({ success: false, message: 'Failed to move footer link.' });
  }
});

// @route   POST /api/footer/sections/:sourceSectionId/move-all-links
// @desc    Move all links from source section to target section (for safe section deletion)
// @access  Private/Admin
router.post('/sections/:sourceSectionId/move-all-links', protect, requirePermission('footer_management'), async (req, res, next) => {
  try {
    const { targetSectionId } = req.body;
    const { sourceSectionId } = req.params;

    if (!targetSectionId) {
      return res.status(400).json({ success: false, message: 'Destination section is required.' });
    }

    if (sourceSectionId === targetSectionId) {
      return res.status(400).json({ success: false, message: 'Target section must be different from source section.' });
    }

    const sourceSection = await FooterSection.findById(sourceSectionId);
    if (!sourceSection) {
      return res.status(404).json({ success: false, message: 'Source footer section not found.' });
    }

    const targetSection = await FooterSection.findById(targetSectionId);
    if (!targetSection) {
      return res.status(404).json({ success: false, message: 'Destination footer section not found.' });
    }

    if (targetSection.type === 'dynamic_collection' || targetSection.slug === 'collections') {
      return res.status(400).json({
        success: false,
        message: 'Cannot move links into the dynamic Collections section.'
      });
    }

    let currentMaxOrder = targetSection.links?.length || 0;
    const linksToMove = sourceSection.links || [];

    for (const link of linksToMove) {
      const isDuplicate = (targetSection.links || []).some(
        l => l.label.toLowerCase() === link.label.toLowerCase()
      );
      if (!isDuplicate) {
        currentMaxOrder += 1;
        targetSection.links.push({
          label: link.label,
          page: link.page,
          url: link.url,
          args: link.args,
          action: link.action,
          order: currentMaxOrder,
          isActive: link.isActive
        });
      }
    }

    sourceSection.links = [];
    await sourceSection.save();
    await targetSection.save();

    res.json({
      success: true,
      message: `All links moved from "${sourceSection.title}" to "${targetSection.title}" successfully.`,
      sourceSection,
      targetSection
    });
  } catch (error) {
    console.error('Move all footer links error:', error);
    res.status(500).json({ success: false, message: 'Failed to move links.' });
  }
});

export default router;
