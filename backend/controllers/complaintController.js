import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

// Resident-only create
export const createComplaint = async (req, res) => {
  if (req.user.role !== 'resident') {
    return res.status(403).json({ message: 'Only residents can create complaints' });
  }

  const { title, description, category, location, address, wardNumber, photos } = req.body;

  if (!title || !description || !category || !location || !location.coordinates || !wardNumber) {
    return res.status(400).json({ message: 'Missing required fields for complaint' });
  }

  const complaint = await Complaint.create({
    title,
    description,
    category,
    location: { type: 'Point', coordinates: location.coordinates },
    address,
    wardNumber,
    photos: photos || [],
    reportedBy: req.user.id,
  });

  return res.status(201).json(complaint);
};

// Public list with simple filter
export const getComplaints = async (req, res) => {
  const { category, status, wardNumber } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (wardNumber) filter.wardNumber = wardNumber;

  const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
  return res.json(complaints);
};

// nearby search (lat, lng, radius in meters)
export const getNearby = async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius || 5000); // default 5km

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
  const { resolutionNotes, resolutionPhotos } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  complaint.status = 'resolved';
  complaint.resolutionNotes = resolutionNotes || complaint.resolutionNotes;
  complaint.resolutionPhotos = resolutionPhotos || complaint.resolutionPhotos;
  complaint.resolvedAt = new Date();
  complaint.updatedAt = new Date();

  await complaint.save();

  return res.json(complaint);
};
