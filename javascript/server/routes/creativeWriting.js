import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  const { sentences } = req.body;

  if (!Array.isArray(sentences) || sentences.length !== 4) {
    return res.status(400).json({
      error: 'Please provide exactly 4 sentences as an array',
    });
  }

  res.json({
    status: 'ok',
    message: 'Creative Writing (ToT) — stub',
    received: { sentences },
  });
});

export default router;
