import express from 'express';
import authMiddleware from '../middleware/auth.js';
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

router.post('/', authMiddleware.auth, createComplaint); // Resident only check in controller
router.get('/', getComplaints);
router.get('/nearby', getNearby);
router.get('/heatmap', getHeatmap);
router.get('/:id', getComplaintById);
router.post('/:id/upvote', authMiddleware.auth, upvoteComplaint);
router.put('/:id/status', authMiddleware.auth, authMiddleware.adminOnly, updateStatus);
router.post('/:id/resolve', authMiddleware.auth, authMiddleware.adminOnly, resolveComplaint);

export default router;
