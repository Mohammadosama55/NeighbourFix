import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware.auth, getMe);
router.put('/profile', authMiddleware.auth, updateProfile);

export default router;
