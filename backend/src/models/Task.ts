import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['TODO', 'DONE'], default: 'TODO' },
  dueDate: { type: String },
});

// virtual `.id` is provided automatically by Mongoose (string form of _id)

export default mongoose.model('Task', taskSchema);
