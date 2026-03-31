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
  testEmailController,
} from '../controllers/complaintController.js';

const router = express.Router();

// Admin-only utility routes (must be before /:id routes to avoid param collision)
router.post('/admin/test-email', authMiddleware.auth, authMiddleware.adminOnly, testEmailController);

// Public routes
router.get('/', getComplaints);
router.get('/nearby', getNearby);
router.get('/heatmap', getHeatmap);

// POST with single/multiple image upload
router.post('/', authMiddleware.auth, upload.array('photos', 5), createComplaint);

// Param routes
router.get('/:id', getComplaintById);
router.post('/:id/upvote', authMiddleware.auth, upvoteComplaint);
router.put('/:id/status', authMiddleware.auth, authMiddleware.adminOnly, updateStatus);
router.post('/:id/resolve', authMiddleware.auth, authMiddleware.adminOnly, upload.array('resolutionPhotos', 5), resolveComplaint);

export default router;
