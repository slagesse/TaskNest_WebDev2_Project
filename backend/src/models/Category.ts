import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  isDefault: { type: Boolean, default: false },
});

export default mongoose.model('Category', categorySchema);
