import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  wardNumber: { type: String, required: true, index: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:   { type: String, required: true },
  text:       { type: String, required: true, maxlength: 1000 },
  type:       { type: String, enum: ['text', 'system'], default: 'text' },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
