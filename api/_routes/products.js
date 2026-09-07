import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../_models/Product.js';
import Order from '../_models/Order.js';
import { protect, adminOnly, requirePermission } from '../_middleware/auth.js';

const router = express.Router();

const generateUniqueSerialNo = async (excludeId = null) => {
  let serialNo;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 20) {
    attempts++;
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    serialNo = `KHQ-${new Date().getFullYear()}-${randomHex}`;
    const query = { serialNo };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Product.findOne(query);
    if (!existing) isUnique = true;
  }
  return serialNo;
};

const generateUniqueClaimCode = async (excludeId = null) => {
  let uniqueCode;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 20) {
    attempts++;
    const randomHex = crypto.randomBytes(5).toString('hex').toUpperCase();
    uniqueCode = `CLM-${randomHex}`;
    const query = { uniqueCode };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Product.findOne(query);
    if (!existing) isUnique = true;
  }
  return uniqueCode;
};

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1, _id: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/products/:identifier
// @desc    Get single product by ID, modelNo, or serialNo
// @access  Public
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product = null;

    if (mongoose.isValidObjectId(identifier)) {
      product = await Product.findById(identifier);
    }

    if (!product) {
      const decoded = decodeURIComponent(identifier).trim();
      const escaped = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      product = await Product.findOne({
        $or: [
          { slug: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { modelNo: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { serialNo: { $regex: new RegExp(`^${escaped}$`, 'i') } }
        ]
      });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Fetch single product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', protect, requirePermission('products'), async (req, res) => {
  const { name, modelNo, serialNo, uniqueCode, price, stock, category, gender, description, image, images, specs, customizable, allowStrapCustomization, allowCaseCustomization, allowDialCustomization, warrantyMonths, customizationOptions } = req.body;
  try {
    const rawSerial = typeof serialNo === 'string' ? serialNo.trim() : '';
    const rawCode = typeof uniqueCode === 'string' ? uniqueCode.trim() : '';

    const cleanImage = typeof image === 'string' ? image.trim() : '';
    if (!cleanImage) {
      return res.status(400).json({ success: false, message: 'Primary watch image is required.' });
    }

    // Canonical images array: [primaryImage, ...additionalImages] without duplicates or empty values
    const rawAdditional = Array.isArray(images) ? images : [];
    const cleanAdditional = Array.from(
      new Set(
        rawAdditional
          .map(img => (typeof img === 'string' ? img.trim() : ''))
          .filter(img => Boolean(img) && img !== cleanImage)
      )
    );
    const finalImages = [cleanImage, ...cleanAdditional];

    let finalSerialNo = rawSerial;
    if (finalSerialNo) {
      const existingSerial = await Product.findOne({ serialNo: finalSerialNo });
      if (existingSerial) {
        return res.status(400).json({ success: false, message: `Serial No. "${finalSerialNo}" is already in use by another timepiece.` });
      }
    } else {
      finalSerialNo = await generateUniqueSerialNo();
    }

    let finalUniqueCode = rawCode;
    if (finalUniqueCode) {
      const existingCode = await Product.findOne({ uniqueCode: finalUniqueCode });
      if (existingCode) {
        return res.status(400).json({ success: false, message: `Unique Code "${finalUniqueCode}" is already in use by another timepiece.` });
      }
    } else {
      finalUniqueCode = await generateUniqueClaimCode();
    }

    const product = new Product({
      name,
      modelNo: modelNo || '',
      serialNo: finalSerialNo,
      uniqueCode: finalUniqueCode,
      price: Number(price),
      stock: Number(stock),
      warrantyMonths: warrantyMonths !== undefined ? Number(warrantyMonths) : 6,
      category,
      gender,
      description,
      image: cleanImage,
      images: finalImages,
      specs: {
        movement: specs?.movement || 'Automatic',
        case: specs?.case || 'Stainless Steel',
        strap: specs?.strap || 'Leather Strap',
        waterResistance: specs?.waterResistance || '50m',
        glass: specs?.glass || 'Sapphire Crystal'
      },
      customizable: customizable || false,
      allowStrapCustomization: allowStrapCustomization !== undefined ? allowStrapCustomization : true,
      allowCaseCustomization: allowCaseCustomization !== undefined ? allowCaseCustomization : true,
      allowDialCustomization: allowDialCustomization !== undefined ? allowDialCustomization : true,
      customizationOptions: customizationOptions || req.body.customizationOptions,
      reviews: []
    });

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
router.put('/:id', protect, requirePermission('products'), async (req, res) => {
  const { name, modelNo, serialNo, uniqueCode, price, stock, category, gender, description, image, images, specs, customizable, allowStrapCustomization, allowCaseCustomization, allowDialCustomization, warrantyMonths, customizationOptions } = req.body;
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.name = name !== undefined ? name : product.name;
    if (modelNo !== undefined) product.modelNo = modelNo;

    if (serialNo !== undefined) {
      const cleanSerial = typeof serialNo === 'string' ? serialNo.trim() : '';
      if (cleanSerial && cleanSerial !== product.serialNo) {
        const existingSerial = await Product.findOne({
          _id: { $ne: req.params.id },
          serialNo: cleanSerial
        });
        if (existingSerial) {
          return res.status(400).json({ success: false, message: `Serial No. "${cleanSerial}" is already in use by another timepiece.` });
        }
        product.serialNo = cleanSerial;
      }
    }

    if (uniqueCode !== undefined) {
      const cleanCode = typeof uniqueCode === 'string' ? uniqueCode.trim() : '';
      if (cleanCode && cleanCode !== product.uniqueCode) {
        const existingCode = await Product.findOne({
          _id: { $ne: req.params.id },
          uniqueCode: cleanCode
        });
        if (existingCode) {
          return res.status(400).json({ success: false, message: `Unique Code "${cleanCode}" is already in use by another timepiece.` });
        }
        product.uniqueCode = cleanCode;
      }
    }

    product.price = price !== undefined ? Number(price) : product.price;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.warrantyMonths = warrantyMonths !== undefined ? Number(warrantyMonths) : product.warrantyMonths;
    product.category = category !== undefined ? category : product.category;
    product.gender = gender !== undefined ? gender : product.gender;
    product.description = description !== undefined ? description : product.description;
    
    // Primary Image update
    let updatedPrimary = product.image;
    if (image !== undefined) {
      const cleanPrimary = typeof image === 'string' ? image.trim() : '';
      if (!cleanPrimary) {
        return res.status(400).json({ success: false, message: 'Primary watch image cannot be empty.' });
      }
      product.image = cleanPrimary;
      updatedPrimary = cleanPrimary;
    }

    // Additional images update: canonical structure is [product.image, ...additionalImages]
    if (images !== undefined) {
      const rawAdditional = Array.isArray(images) ? images : [];
      const cleanAdditional = Array.from(
        new Set(
          rawAdditional
            .map(img => (typeof img === 'string' ? img.trim() : ''))
            .filter(img => Boolean(img) && img !== updatedPrimary)
        )
      );
      product.images = updatedPrimary ? [updatedPrimary, ...cleanAdditional] : cleanAdditional;
    } else if (image !== undefined) {
      const existingAdditional = Array.from(
        new Set(
          (product.images || [])
            .map(img => (typeof img === 'string' ? img.trim() : ''))
            .filter(img => Boolean(img) && img !== updatedPrimary)
        )
      );
      product.images = updatedPrimary ? [updatedPrimary, ...existingAdditional] : existingAdditional;
    }
    
    if (specs) {
      product.specs = {
        movement: specs.movement !== undefined ? specs.movement : product.specs.movement,
        case: specs.case !== undefined ? specs.case : product.specs.case,
        strap: specs.strap !== undefined ? specs.strap : product.specs.strap,
        waterResistance: specs.waterResistance !== undefined ? specs.waterResistance : product.specs.waterResistance,
        glass: specs.glass !== undefined ? specs.glass : product.specs.glass
      };
    }

    if (customizable !== undefined) product.customizable = customizable;
    if (allowStrapCustomization !== undefined) product.allowStrapCustomization = allowStrapCustomization;
    if (allowCaseCustomization !== undefined) product.allowCaseCustomization = allowCaseCustomization;
    if (allowDialCustomization !== undefined) product.allowDialCustomization = allowDialCustomization;
    if (customizationOptions !== undefined) {
      product.customizationOptions = customizationOptions;
    } else if (req.body.customizationOptions !== undefined) {
      product.customizationOptions = req.body.customizationOptions;
    }

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
router.delete('/:id', protect, requirePermission('products'), async (req, res) => {
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
router.put('/:id/reviews/:reviewId', protect, requirePermission('reviews'), async (req, res) => {
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
