import 'dotenv/config';
import mongoose from 'mongoose';

/**
 * Global Mongoose connection cache for Serverless (Vercel) & VPS environments.
 * Prevents multiple connections during hot-reloads and serverless invocations.
 */
let cached = global.mongooseConnectionCache;

if (!cached) {
  cached = global.mongooseConnectionCache = { conn: null, promise: null };
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log('MongoDB successfully connected.');
      return mongooseInstance;
    }).catch((err) => {
      console.error('MongoDB connection error:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
