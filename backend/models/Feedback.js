import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  rating:    { type: Number, required: true, min: 1, max: 5 },
  message:   { type: String, required: true, trim: true, maxlength: 1000 },
  email:     { type: String, trim: true, default: '' },
  name:      { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Feedback', feedbackSchema);
