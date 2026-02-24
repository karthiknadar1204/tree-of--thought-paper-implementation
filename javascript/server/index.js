import express from 'express';
import dotenv from 'dotenv';
import game24Router from './routes/game24.js';
import creativeWritingRouter from './routes/creativeWriting.js';
import crosswordsRouter from './routes/crosswords.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/game24', game24Router);
app.use('/api/creative-writing', creativeWritingRouter);
app.use('/api/crosswords', crosswordsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tree of Thoughts server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});