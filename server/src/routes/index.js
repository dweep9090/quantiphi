import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import * as controller from '../controllers/api.controller.js';

const router = Router();
const userParams = validate(schemas.params, 'params');
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.get('/health', controller.health);
router.get('/profile/:username', userParams, asyncRoute(controller.profile));
router.get('/profile/:username/repos', userParams, validate(schemas.reposQuery, 'query'), asyncRoute(controller.repos));
router.get('/profile/:username/contributions', userParams, asyncRoute(controller.contributions));
router.post('/profile/:username/refresh', userParams, asyncRoute(controller.refresh));
router.post('/compatibility/:username', userParams, validate(schemas.compatibility), asyncRoute(controller.compatibility));
router.get('/compatibility/:username/latest', userParams, asyncRoute(controller.latest));
router.post('/chat/:username', aiLimiter, userParams, validate(schemas.chat), asyncRoute(controller.chat));
router.get('/chat/:username/history', userParams, asyncRoute(controller.history));
router.post('/coach/:username', aiLimiter, userParams, validate(schemas.coach), asyncRoute(controller.coach));
export default router;
