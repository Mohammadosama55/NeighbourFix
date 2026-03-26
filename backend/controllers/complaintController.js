import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { sendEscalationEmail } from '../utils/emailService.js';
import { generateComplaintPDF } from '../utils/pdfGenerator.js';

// Resident-only create with file upload support
export const createComplaint = async (req, res) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ message: 'Only residents can create complaints' });
  }

  const { title, description, category, location, address, wardNumber } = req.body;

  // Parse location if it comes as a string from form data
  let parsedLocation = location;
  if (typeof location === 'string') {
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid location format' });
    }
  }

  if (!title || !description || !category || !parsedLocation || !parsedLocation.coordinates || !wardNumber) {
    return res.status(400).json({ message: 'Missing required fields for complaint' });
  }

  // Get uploaded file paths if any
  const photos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  const complaint = await Complaint.create({
    title,
    description,
    category,
    location: { type: 'Point', coordinates: parsedLocation.coordinates },
    address,
    wardNumber,
    photos,
    reportedBy: req.user.id,
  });

  return res.status(201).json(complaint);
};

export const getComplaints = async (req, res) => {
  const { category, status, wardNumber } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (wardNumber) filter.wardNumber = wardNumber;

  const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
  return res.json(complaints);
};

export const getNearby = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius || 5000);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ message: 'lat and lng query parameters are required' });
  }

  const complaints = await Complaint.find({
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  });

  return res.json(complaints);
};

export const getComplaintById = async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id).populate('reportedBy', 'name email');

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  return res.json(complaint);
};

export const upvoteComplaint = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  if (complaint.upvotedBy.includes(userId)) {
    return res.status(400).json({ message: 'You already upvoted this complaint' });
  }

  complaint.upvotedBy.push(userId);
  complaint.upvotes = complaint.upvotedBy.length;
  await complaint.save();

  // Trigger escalation email if upvotes reach threshold (e.g., 5 upvotes)
  if (complaint.upvotes >= 5 && !complaint.escalated) {
    try {
      const user = await User.findById(complaint.reportedBy);
      const pdfPath = await generateComplaintPDF(complaint, user);
      await sendEscalationEmail(complaint, pdfPath);
      
      complaint.escalated = true;
      complaint.escalationEmailSent = true;
      complaint.escalationDate = new Date();
      await complaint.save();
    } catch (error) {
      console.error('Error in escalation:', error.message);
      // Don't fail the upvote if email fails
    }
  }

  return res.json({ upvotes: complaint.upvotes });
};

export const getHeatmap = async (req, res) => {
  const stats = await Complaint.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const formatted = stats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return res.json({ heatmap: formatted });
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['reported', 'in_progress', 'resolved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const complaint = await Complaint.findByIdAndUpdate(
    id,
    { status, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  return res.json(complaint);
};

export const resolveComplaint = async (req, res) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  // Get uploaded resolution photos if any
  const resolutionPhotos = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  complaint.status = 'resolved';
  complaint.resolutionNotes = resolutionNotes || complaint.resolutionNotes;
  complaint.resolutionPhotos = resolutionPhotos.length > 0 ? resolutionPhotos : complaint.resolutionPhotos;
  complaint.resolvedAt = new Date();
  complaint.updatedAt = new Date();

  await complaint.save();

  return res.json(complaint);
};