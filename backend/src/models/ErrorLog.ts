import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  errorId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  message: { type: String },
  stack: { type: String },
  operation: { type: String },
  variables: { type: mongoose.Schema.Types.Mixed },
});

export default mongoose.model('ErrorLog', errorLogSchema);
