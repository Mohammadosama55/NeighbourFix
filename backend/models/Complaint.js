// models/Complaint.js
import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['road', 'water', 'garbage', 'drainage', 'power', 'other'],
    required: true 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: { type: String }, // human-readable address
  wardNumber: { type: String, required: true },
  
  // Media
  photos: [{ type: String }], // URLs to uploaded images
  
  // Voting System
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Status Tracking
  status: {
    type: String,
    enum: ['reported', 'in_progress', 'resolved', 'rejected'],
    default: 'reported'
  },
  
  // Escalation
  escalated: { type: Boolean, default: false },
  escalationEmailSent: { type: Boolean, default: false },
  escalationDate: { type: Date },
  
  // Relations
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ward admin
  
  // Resolution
  resolutionNotes: { type: String },
  resolvedAt: { type: Date },
  resolutionPhotos: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// CRITICAL: Create 2dsphere index for geospatial queries
complaintSchema.index({ location: '2dsphere' });

export default mongoose.model('Complaint', complaintSchema);