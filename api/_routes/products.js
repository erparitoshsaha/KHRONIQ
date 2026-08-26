import express from 'express';
import Product from '../_models/Product.js';
import Order from '../_models/Order.js';
import { protect, adminOnly } from '../_middleware/auth.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
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
const { name, price, stock, category, gender, description, image, specs, customizable, allowStrapCustomization, allowCaseCustomization, allowDialCustomization, warrantyMonths } = req.body;
  try {
    const product = new Product({
      name,
      price: Number(price),
      stock: Number(stock),
      warrantyMonths: warrantyMonths !== undefined ? Number(warrantyMonths) : 6,
      category,
      gender,
      description,
      image: image || '/placeholder.jpg',
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
      customizationOptions: req.body.customizationOptions,
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
router.put('/:id', protect, adminOnly, async (req, res) => {
const { name, price, stock, category, gender, description, image, specs, customizable, allowStrapCustomization, allowCaseCustomization, allowDialCustomization, warrantyMonths } = req.body;
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
    if (req.body.customizationOptions !== undefined) {
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
