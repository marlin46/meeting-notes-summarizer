import { Router } from 'express';
import { validateTranscript } from '../middleware/validate.js';
import { summarizeTranscript } from '../services/claude.js';

export const summarizeRouter = Router();

// Express 5 forwards rejected promises to the error handler automatically.
summarizeRouter.post('/', validateTranscript, async (req, res) => {
  const summary = await summarizeTranscript(req.body.transcript);
  res.json(summary);
});
