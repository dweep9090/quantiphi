import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { AppError } from './utils/AppError.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use(generalLimiter);
app.use('/api', routes);
app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'The requested endpoint does not exist.')));
app.use(errorHandler);
export default app;
