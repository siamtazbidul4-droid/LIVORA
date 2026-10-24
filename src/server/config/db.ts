import mongoose from 'mongoose';

// Disable query buffering so Mongoose fails fast with a clear error when disconnected
mongoose.set('bufferCommands', false);

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production.');
    }

    console.warn(
      '⚠️ [DATABASE NOTICE] MONGODB_URI is not set. MongoDB Atlas connection requires MONGODB_URI in environment variables.'
    );
    isConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ [DATABASE] Connected to MongoDB Atlas: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch {
    console.error('❌ [DATABASE ERROR] Failed to connect to MongoDB Atlas.');
    isConnected = false;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MongoDB connection failed. Check MONGODB_URI and database network access.');
    }
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
