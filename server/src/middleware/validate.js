import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

const username = z.string().regex(/^[a-zA-Z0-9-]{1,39}$/);
export const schemas = {
  params: z.object({ username }),
  compatibility: z.object({ jobDescription: z.string().trim().min(50).max(10000) }),
  chat: z.object({ message: z.string().trim().min(1).max(1000) }),
  coach: z.object({ analysisId: z.number().int().positive().optional() }),
  reposQuery: z.object({
    sort: z.enum(['stars', 'updated', 'name']).optional(),
    language: z.string().max(80).optional()
  })
};

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(new AppError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message || 'Invalid request.'));
    if (source === 'query') req.validatedQuery = result.data;
    else req[source] = result.data;
    next();
  };
}
