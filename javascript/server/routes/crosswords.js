import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  const { clues } = req.body;

  if (!Array.isArray(clues) || clues.length !== 10) {
    return res.status(400).json({
      error: 'Please provide exactly 10 clues as an array (e.g. ["h1. presented", ...])',
    });
  }

  res.json({
    status: 'ok',
    message: '5x5 Crosswords (ToT) — stub',
    received: { clues },
  });
});

export default router;
