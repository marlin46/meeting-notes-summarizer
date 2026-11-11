import OpenAI from 'openai';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Not found.'));
}

// Express recognizes error handlers by their 4 arguments, so _next must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Problems with the request body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // OpenAI API errors: log details server-side, return a safe message.
  if (err instanceof OpenAI.APIError) {
    console.error(`OpenAI API error ${err.status ?? ''}:`, err.message);
    if (err.status === 429) {
      return res.status(503).json({ error: 'The AI service is busy or out of quota. Try again shortly.' });
    }
    if (err.status === 401 || err.status === 403) {
      return res.status(502).json({ error: 'The AI service rejected the server credentials.' });
    }
    return res.status(502).json({ error: 'The AI service returned an error. Please try again.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
