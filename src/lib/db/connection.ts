import mongoose from 'mongoose';

// Get MongoDB URI, but don't throw error during build time
const MONGODB_URI = process.env.MONGODB_URI;

function validateMongoUri() {
  if (!MONGODB_URI) {
    // For Vercel deployment without database, return a dummy URI
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.warn('MongoDB URI not configured - database features will be disabled');
      return 'mongodb://localhost:27017/dummy'; // Dummy URI for build
    }
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  return MONGODB_URI;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Skip database connection in Vercel if MongoDB URI is not configured
  if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && !MONGODB_URI) {
    console.warn('Skipping database connection - MongoDB URI not configured');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = validateMongoUri(); // Validate URI at runtime, not build time
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(mongoUri, opts);
  }

  try {
    const connection = await cached.promise;
    cached.conn = connection;
  } catch (e) {
    cached.promise = null;
    // In production/Vercel, don't throw error if database is not available
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.warn('Database connection failed - continuing without database');
      return null;
    }
    throw e;
  }

  return cached.conn;
}

export default connectDB;