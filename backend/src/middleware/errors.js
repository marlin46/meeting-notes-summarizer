import Anthropic from '@anthropic-ai/sdk';

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

  // Claude API errors: log details server-side, return a safe message.
  // Checked most specific first.
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    console.error(`Claude API auth error ${err.status}:`, err.message);
    return res.status(502).json({ error: 'The AI service rejected the server credentials.' });
  }
  if (err instanceof Anthropic.RateLimitError) {
    console.error('Claude API rate limited:', err.message);
    return res.status(503).json({ error: 'The AI service is busy or out of quota. Try again shortly.' });
  }
  if (err instanceof Anthropic.APIConnectionError) {
    console.error('Claude API connection error:', err.message);
    return res.status(503).json({ error: 'Could not reach the AI service. Try again shortly.' });
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`Claude API error ${err.status ?? ''}:`, err.message);
    if (err.status === 529) {
      return res.status(503).json({ error: 'The AI service is overloaded. Try again shortly.' });
    }
    return res.status(502).json({ error: 'The AI service returned an error. Please try again.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
