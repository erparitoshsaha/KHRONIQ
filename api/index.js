import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

// Import Utilities & Middlewares
import validateEnv from './utils/validateEnv.js';
import connectDB, { isDBConnected } from './utils/db.js';
import errorHandler from './_middleware/errorHandler.js';
import { apiLimiter } from './_middleware/rateLimiter.js';

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
import contactRoutes from './_routes/contact.js';
import newsletterRoutes from './_routes/newsletter.js';
import filterRoutes, { seedDefaultFiltersSafe } from './_routes/filters.js';
import footerRoutes, { seedDefaultFooterSafe } from './_routes/footer.js';
import contentRoutes, { seedDefaultContentSafe } from './_routes/content.js';
import ensureSuperAdminRoleIntegrity from './utils/ensureSuperAdmin.js';

// 1. Validate environment configuration on boot
validateEnv();

const app = express();

// Enable trust proxy for Vercel/reverse-proxy deployments to correctly resolve client IP
app.set('trust proxy', 1);

// 2. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://*.razorpay.com'],
        connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com', 'https://res.cloudinary.com'],
        frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// 3. Explicit CORS Whitelisting
const staticAllowedOrigins = [
  'https://www.khroniq.com',
  'https://khroniq.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://192.168.1.4:5173'
];

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...staticAllowedOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Allow any Vercel deployment domain (*.vercel.app)
      try {
        const parsedUrl = new URL(origin);
        if (parsedUrl.hostname.endsWith('.vercel.app') || parsedUrl.hostname === 'vercel.app') {
          return callback(null, true);
        }
      } catch (_) {}

      // Allow private LAN development origins (RFC 1918) on local dev ports during development
      if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
        try {
          const parsedUrl = new URL(origin);
          const isPrivateIp =
            parsedUrl.hostname === '192.168.1.4' ||
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname) ||
            /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname) ||
            parsedUrl.hostname === '127.0.0.1' ||
            parsedUrl.hostname === 'localhost';
          if (isPrivateIp && ['5173', '5174', '3000', '5000', '8080'].includes(parsedUrl.port || '')) {
            return callback(null, true);
          }
        } catch (_) {}
      }

      return callback(new Error('CORS policy does not allow access from this origin.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
  })
);

// 4. Request Body Limit (10MB JSON & URL-encoded)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Database Connection Middleware
let superAdminIntegrityEnsured = false;
const ensureDb = async (req, res, next) => {
  // Allow health check to evaluate DB without blocking
  if (req.path === '/api/health') return next();

  try {
    await connectDB();
    if (!superAdminIntegrityEnsured) {
      superAdminIntegrityEnsured = true;
      ensureSuperAdminRoleIntegrity().catch(() => {});
    }
    next();
  } catch (err) {
    console.error('Database connection failed during request processing:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please try again shortly.'
    });
  }
};

app.use(ensureDb);

// 6. Global API Rate Limiter
app.use('/api', apiLimiter);

// 7. Route Handlers
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
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/content', contentRoutes);

// Base Endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the KHRONIQ Atelier API' });
});

// Production-safe health endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (e) {
    // Log without crashing
  }

  if (mongoose.connection.readyState === 1) {
    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  }

  return res.status(503).json({
    status: 'degraded',
    database: 'unavailable'
  });
});

// 8. Global Express Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Listen when running directly on VPS or local Node process
if (!process.env.VERCEL) {
  connectDB()
    .then(async () => {
      try {
        await ensureSuperAdminRoleIntegrity();
        await seedDefaultFiltersSafe();
        await seedDefaultFooterSafe();
        await seedDefaultContentSafe();
      } catch (err) {
        console.error('Initial check error:', err.message);
      }
      app.listen(PORT, HOST, () => {
        console.log(`KHRONIQ API Server running on port ${PORT} (LAN reachable at http://192.168.1.4:${PORT})`);
      });
    })
    .catch((err) => {
      console.error('Initial database connection failed on boot:', err.message);
      app.listen(PORT, HOST, () => {
        console.log(`KHRONIQ API Server running on port ${PORT} (Database pending connection)`);
      });
    });
}

export default app;
