import express from 'express';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  createComplaint,
  getComplaints,
  getNearby,
  getComplaintById,
  upvoteComplaint,
  getHeatmap,
  updateStatus,
  resolveComplaint,
} from '../controllers/complaintController.js';

const router = express.Router();

// POST with single/multiple image upload
router.post('/', authMiddleware.auth, upload.array('photos', 5), createComplaint);
router.get('/', getComplaints);
router.get('/nearby', getNearby);
router.get('/heatmap', getHeatmap);
router.get('/:id', getComplaintById);
router.post('/:id/upvote', authMiddleware.auth, upvoteComplaint);
router.put('/:id/status', authMiddleware.auth, authMiddleware.adminOnly, updateStatus);
// Resolve with multiple resolution photos
router.post('/:id/resolve', authMiddleware.auth, authMiddleware.adminOnly, upload.array('resolutionPhotos', 5), resolveComplaint);

export default router;
