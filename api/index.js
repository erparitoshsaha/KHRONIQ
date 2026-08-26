import 'dotenv/config';
import dns from 'dns';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Fix Node.js DNS SRV lookup (querySrv ECONNREFUSED) across environments (local & serverless)
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore fallback errors
}

// Import Models
import Product from './_models/Product.js';
import User from './_models/User.js';
import Coupon from './_models/Coupon.js';
import brandUpdateModel from './_models/BrandUpdate.js'; // Let's keep it clean
import Blog from './_models/Blog.js';

// Import Routes
import authRoutes from './_routes/auth.js';
import productRoutes from './_routes/products.js';
import orderRoutes from './_routes/orders.js';
import couponRoutes from './_routes/coupons.js';
import cartRoutes from './_routes/cart.js';
import wishlistRoutes from './_routes/wishlist.js';
import brandRoutes from './_routes/brands.js';
import categoryRoutes from './_routes/categories.js';
import uploadRoutes from './_routes/upload.js';
import mediaRoutes from './_routes/media.js';
import paymentRoutes from './_routes/payments.js';
import adminRoutes from './_routes/admin.js';
import brandUpdateRoutes from './_routes/brandUpdates.js';
import warrantyRoutes from './_routes/warranty.js';
import blogRoutes from './_routes/blogs.js';

const app = express();

// Database Connection Status Variables
let dbConnectionError = null;
const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_FALLBACK_URI;

let dbConnectingPromise = null;

const connectDb = async () => {
  if (!mongoURI) {
    console.error('MONGODB_URI is not defined in environment variables.');
    return;
  }
  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.warn('MongoDB connection retry...', err.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore disconnect error
    }
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
  }
};

const ensureDb = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  try {
    if (!dbConnectingPromise) {
      dbConnectingPromise = connectDb().then(async () => {
        dbConnectionError = null;
        await seedDatabase();
      }).catch((err) => {
        dbConnectingPromise = null;
        throw err;
      });
    }
    await dbConnectingPromise;
    next();
  } catch (err) {
    console.error('DB not ready:', err);
    dbConnectionError = err.message || err.toString();
    return res.status(503).json({ success: false, message: 'Database connection failed. Check MONGODB_URI env variable.' });
  }
};

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Diagnostics Endpoint (Before DB)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: {
      has_mongodb_uri: !!process.env.MONGODB_URI,
      has_jwt_secret: !!process.env.JWT_SECRET,
      has_cloudinary_cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      cloudinary_cloud_name_value: process.env.CLOUDINARY_CLOUD_NAME,
      has_cloudinary_api_key: !!process.env.CLOUDINARY_API_KEY,
      cloudinary_api_key_value: process.env.CLOUDINARY_API_KEY,
      cloudinary_api_key_length: (process.env.CLOUDINARY_API_KEY || '').length,
      cloudinary_api_key_has_whitespace: (process.env.CLOUDINARY_API_KEY || '') !== (process.env.CLOUDINARY_API_KEY || '').trim(),
      has_cloudinary_api_secret: !!process.env.CLOUDINARY_API_SECRET,
      node_env: process.env.NODE_ENV
    },
    mongoose: {
      readyState: mongoose.connection.readyState,
      error: dbConnectionError
    }
  });
});

app.use(ensureDb);

// Vercel Serverless Routing URL Restorer
app.use((req, res, next) => {
  if (req.headers['x-now-route-asis'] || process.env.VERCEL) {
    req.url = req.originalUrl;
  }
  next();
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/media', mediaRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/brand-updates', brandUpdateRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/blogs', blogRoutes);


// Base Endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the KHRONIQ API' });
});

// Database Seed Function
const seedDatabase = async () => {
  try {
    // Startup seeding is completed. Product persistence is fully managed by admin dashboard.
    
    // Seed Default Blogs (only on first initialization)
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      const initialBlogs = [
        {
          title: "The Art of Swadeshi Horology",
          content: "Behind the scenes of KHRONIQ's Le Locle and Indian assembly processes, bringing high-precision chronometer watches to modern watch enthusiasts. Discover how we balance heritage design with modern components.",
          author: "Vikram R. Mehta",
          image: "/assets/gentleman_lifestyle.png",
          category: "Horology"
        },
        {
          title: "Choosing the Right Case Finish",
          content: "A guide on selecting between polished stainless steel, rose gold PVD, and matte ceramic finishes for your bespoke timepiece. Learn which finish best suits your daily attire and lifestyle.",
          author: "Ananya Sharma",
          image: "/assets/aurex_lifestyle.png",
          category: "Guides"
        }
      ];
      await Blog.insertMany(initialBlogs);
      console.log('Database Seeding: Default Blogs successfully seeded!');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Connect on startup in non-Vercel mode (local dev)
if (!process.env.VERCEL) {
  mongoose.connect(mongoURI).then(async () => {
    console.log('Successfully connected to MongoDB');
    await seedDatabase();
  }).catch((err) => {
    console.error('MongoDB connection error:', err);
  });
}

const PORT = process.env.PORT || 5000;

// Only listen when running locally
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;