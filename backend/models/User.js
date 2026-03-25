
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['resident', 'ward_admin'], 
    default: 'resident' 
  },
  wardNumber: { type: String }, 
  address: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);