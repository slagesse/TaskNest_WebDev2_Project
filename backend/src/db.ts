import mongoose from 'mongoose';
import Category from './models/Category';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
  } catch (err) {
    console.error('MongoDB initial connection failed:', err);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB disconnected — driver will auto-reconnect');
  });
}

export async function seedDefaultCategories(): Promise<void> {
  await Category.findOneAndUpdate(
    { isDefault: true },
    { title: 'Personal', isDefault: true },
    { upsert: true },
  );
}
