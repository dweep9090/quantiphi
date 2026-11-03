import { AppError } from '../utils/AppError.js';

export function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }
  console.error(error);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
}
