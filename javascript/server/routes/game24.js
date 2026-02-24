import express from 'express';
import { solveGameOf24 } from '../services/tot.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { numbers } = req.body;

  if (!Array.isArray(numbers) || numbers.length !== 4) {
    return res.status(400).json({
      error: 'Please provide exactly 4 numbers as an array',
    });
  }

  try {
    const result = await solveGameOf24(numbers, 5, 4);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;