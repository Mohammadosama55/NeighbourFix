import express from 'express';
import { register, login, getMe, updateProfile, } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware.auth, getMe);
router.put('/profile', authMiddleware.auth, updateProfile);
// router.post('/logout', authMiddleware.auth, logout);

export default router;
