import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { rating, message, email, name } = req.body;
    if (!rating || !message) {
      return res.status(400).json({ message: 'Rating and message are required.' });
    }
    const fb = await Feedback.create({ rating, message, email, name });
    res.status(201).json({ success: true, id: fb._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).limit(50);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
