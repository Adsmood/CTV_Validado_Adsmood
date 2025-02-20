import { Router } from 'express';
import healthRouter from './health.js';
import projectRouter from './project.js';
import campaignRouter from './campaign.js';
import trackingRouter from './tracking.js';
import { requireAuth, optionalAuth, rateLimiter } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas de estado
router.use('/health', healthRouter);

// Rutas públicas con rate limiting
router.use('/tracking', rateLimiter(15 * 60 * 1000, 100), optionalAuth, trackingRouter);

// Rutas protegidas que requieren autenticación
router.use('/projects', requireAuth, projectRouter);
router.use('/campaigns', requireAuth, campaignRouter);

export default router; 