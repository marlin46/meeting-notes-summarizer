import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { summarizeRouter } from './routes/summarize.js';
import { errorHandler, notFound } from './middleware/errors.js';

if (!process.env.CLAUDE_API_KEY) {
  console.error('Missing CLAUDE_API_KEY. Copy .env.example to .env and set it.');
  process.exit(1);
}

const app = express();

// Railway sits behind one proxy; needed so rate limiting sees real client IPs.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// CORS: comma-separated list of allowed frontend origins.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin (curl, health checks).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '200kb' }));

// Health checks
app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(
  '/api/summarize',
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a few minutes and try again.' },
  }),
  summarizeRouter
);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on port ${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});
