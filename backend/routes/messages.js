import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

router.get('/:wardNumber', async (req, res) => {
  const { wardNumber } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 60, 100);

  const messages = await Message.find({ wardNumber })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return res.json(messages.reverse());
});

export default router;
