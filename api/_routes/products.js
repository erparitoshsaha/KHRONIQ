import express from 'express';
import Product from '../_models/Product.js';
import Order from '../_models/Order.js';
import { protect, adminOnly } from '../_middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

const generateUnitCode = (productId, index) => {
  const serialNumber = `KHQ-${new Date().getFullYear()}-${String(productId).slice(-6).toUpperCase()}-${String(index).padStart(2, '0')}`;
  const claimCode = `CLM-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  return { serialNumber, claimCode };
};

// Derives a human-readable warranty period string directly from warrantyMonths,
// so specs.warrantyPeriod can never drift out of sync with the actual warrantyMonths value.
const formatWarrantyPeriod = (months) => {
  const m = Number(months) || 0;
  if (m <= 0) return 'No Warranty';
  if (m % 12 === 0) {
    const years = m / 12;
    return `${years} Year${years > 1 ? 's' : ''}`;
  }
  return `${m} Month${m > 1 ? 's' : ''}`;
};

const findDuplicateUnitCode = async (serialNumber, claimCode, excludeProductId) => {
  return Product.findOne({
    _id: { $ne: excludeProductId },
    $or: [
      { 'unitCodes.serialNumber': serialNumber },
      { 'unitCodes.claimCode': claimCode }
    ]
  });
};


// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: 1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {

const { name, price, stock, category, gender, description, image, specs, customizable, allowStrapCustomization, allowCaseCustomization, allowDialCustomization, warrantyMonths, discountPercent, badge, unitCodes } = req.body;

  try {
    const stockCount = Math.max(0, Number(stock) || 0);
    const incomingUnitCodes = Array.isArray(unitCodes) ? unitCodes : [];
    const resolvedWarrantyMonths = warrantyMonths !== undefined ? Number(warrantyMonths) : 6;

    const product = new Product({
      name,
      price: Number(price),
      stock: stockCount,
      warrantyMonths: resolvedWarrantyMonths,
      category,
      gender,
      description,
      image: image || '/placeholder.jpg',
      discountPercent: Number(discountPercent) || 0,
      badge: badge || '',
      specs: {
        movement: specs?.movement || 'Automatic',
        case: specs?.case || 'Stainless Steel',
        caseMaterial: specs?.caseMaterial || 'Stainless Steel',
        strap: specs?.strap || 'Leather Strap',
        waterResistance: specs?.waterResistance || '50m',
        glass: specs?.glass || 'Sapphire Crystal',
        dialColor: specs?.dialColor || 'Black',
        watchFunction: specs?.watchFunction || 'Hours, Minutes, Seconds',
        warrantyDetails: specs?.warrantyDetails || 'Manufacturer Warranty',
        collection: specs?.collection || 'Khronomaster',
        warrantyPeriod: formatWarrantyPeriod(resolvedWarrantyMonths)
      },
      customizable: customizable || false,
      allowStrapCustomization: allowStrapCustomization !== undefined ? allowStrapCustomization : true,
      allowCaseCustomization: allowCaseCustomization !== undefined ? allowCaseCustomization : true,
      allowDialCustomization: allowDialCustomization !== undefined ? allowDialCustomization : true,
      customizationOptions: req.body.customizationOptions,
      reviews: []
    });

    const finalUnitCodes = [];
    for (let i = 0; i < stockCount; i++) {
      const entry = incomingUnitCodes[i] || {};
      let serialNumber = entry.serialNumber?.trim();
      let claimCode = entry.claimCode?.trim();

      if (!serialNumber || !claimCode) {
        const generated = generateUnitCode(product._id, i + 1);
        serialNumber = serialNumber || generated.serialNumber;
        claimCode = claimCode || generated.claimCode;
      }

      const duplicate = await findDuplicateUnitCode(serialNumber, claimCode, product._id);
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Duplicate serial number or claim code: ${serialNumber} / ${claimCode}` });
      }

      finalUnitCodes.push({ serialNumber, claimCode, used: false });
    }
    product.unitCodes = finalUnitCodes;

    const createdProduct = await product.save();
    res.status(201).json({ success: true, product: createdProduct });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
const { name, price, stock, category, gender, description, image, specs, customizable, allowStrapCustomization, allowCaseCustomization, allowDialCustomization, warrantyMonths, discountPercent, badge, unitCodes  } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.name = name !== undefined ? name : product.name;
    product.price = price !== undefined ? Number(price) : product.price;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.warrantyMonths = warrantyMonths !== undefined ? Number(warrantyMonths) : product.warrantyMonths;
    product.category = category !== undefined ? category : product.category;
    product.gender = gender !== undefined ? gender : product.gender;
    product.description = description !== undefined ? description : product.description;
    product.image = image !== undefined ? image : product.image;

    if (stock !== undefined) {
      const newStockCount = Math.max(0, Number(stock));
      const existingUsed = product.unitCodes.filter(u => u.used);
      const existingUnused = product.unitCodes.filter(u => !u.used);

      let newUnused;
      if (newStockCount <= existingUnused.length) {
        newUnused = existingUnused.slice(0, newStockCount);
        if (newStockCount < existingUnused.length && existingUsed.length > 0 && newStockCount < 0) {
          return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
        }
      } else {
        newUnused = [...existingUnused];
        const additionalNeeded = newStockCount - existingUnused.length;
        const incomingUnitCodes = Array.isArray(req.body.unitCodes) ? req.body.unitCodes : [];
        for (let i = 0; i < additionalNeeded; i++) {
          const entry = incomingUnitCodes[i] || {};
          let serialNumber = entry.serialNumber?.trim();
          let claimCode = entry.claimCode?.trim();

          if (!serialNumber || !claimCode) {
            const generated = generateUnitCode(product._id, product.unitCodes.length + i + 1);
            serialNumber = serialNumber || generated.serialNumber;
            claimCode = claimCode || generated.claimCode;
          }

          const duplicate = await findDuplicateUnitCode(serialNumber, claimCode, product._id);
          if (duplicate) {
            return res.status(400).json({ success: false, message: `Duplicate serial number or claim code: ${serialNumber} / ${claimCode}` });
          }

          newUnused.push({ serialNumber, claimCode, used: false });
        }
      }

      product.unitCodes = [...existingUsed, ...newUnused];
      product.stock = newStockCount;
    }

    if (specs) {
      product.specs = {
        movement: specs.movement !== undefined ? specs.movement : product.specs.movement,
        case: specs.case !== undefined ? specs.case : product.specs.case,
        caseMaterial: specs.caseMaterial !== undefined ? specs.caseMaterial : product.specs.caseMaterial,
        strap: specs.strap !== undefined ? specs.strap : product.specs.strap,
        waterResistance: specs.waterResistance !== undefined ? specs.waterResistance : product.specs.waterResistance,
        glass: specs.glass !== undefined ? specs.glass : product.specs.glass,
        dialColor: specs.dialColor !== undefined ? specs.dialColor : product.specs.dialColor,
        watchFunction: specs.watchFunction !== undefined ? specs.watchFunction : product.specs.watchFunction,
        warrantyDetails: specs.warrantyDetails !== undefined ? specs.warrantyDetails : product.specs.warrantyDetails,
        collection: specs.collection !== undefined ? specs.collection : product.specs.collection,
        warrantyPeriod: product.specs.warrantyPeriod
      };
    }

    // Auto-sync warrantyPeriod text with warrantyMonths so they can never drift out of sync,
    // regardless of what was (or wasn't) sent in the specs object above.
    if (!product.specs) product.specs = {};
    product.specs.warrantyPeriod = formatWarrantyPeriod(product.warrantyMonths);

    if (customizable !== undefined) product.customizable = customizable;
    if (allowStrapCustomization !== undefined) product.allowStrapCustomization = allowStrapCustomization;
    if (allowCaseCustomization !== undefined) product.allowCaseCustomization = allowCaseCustomization;
if (allowDialCustomization !== undefined) product.allowDialCustomization = allowDialCustomization;
if (discountPercent !== undefined) product.discountPercent = Number(discountPercent) || 0;

    if (req.body.customizationOptions !== undefined) {
      product.customizationOptions = req.body.customizationOptions;
    }
    if (badge !== undefined) product.badge = badge;

    const updatedProduct = await product.save();
    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Create a review for a product
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const status = 'approved';

    const review = {
      userName: req.user.name || 'Anonymous User',
      rating: Number(rating),
      comment,
      status
    };

    product.reviews.unshift(review);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully!',
      reviews: product.reviews
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/products/:id/reviews/:reviewId
// @desc    Moderate (approve/reject/hide) a review
// @access  Private/Admin
router.put('/:id/reviews/:reviewId', protect, adminOnly, async (req, res) => {
  const { status } = req.body; // 'approved', 'rejected', or 'hidden'

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = product.reviews.id(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.status = status;
    await product.save();

    res.json({ success: true, message: `Review status updated to ${status}`, reviews: product.reviews });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;