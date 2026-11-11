import { HttpError } from './errors.js';

export const MIN_LENGTH = 50;
export const MAX_LENGTH = 100_000;

export function validateTranscript(req, _res, next) {
  const transcript = req.body?.transcript;

  if (typeof transcript !== 'string') {
    return next(new HttpError(400, 'Request body must include a "transcript" string.'));
  }

  const trimmed = transcript.trim();
  if (trimmed.length < MIN_LENGTH) {
    return next(new HttpError(400, `Transcript is too short (minimum ${MIN_LENGTH} characters).`));
  }
  if (trimmed.length > MAX_LENGTH) {
    return next(
      new HttpError(400, `Transcript is too long (maximum ${MAX_LENGTH.toLocaleString('en-US')} characters).`)
    );
  }

  req.body.transcript = trimmed;
  next();
}
