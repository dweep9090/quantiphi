import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false });
export const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
