import { Router } from 'express';
import healthRouter from './health.js';
import projectRouter from './project.js';
import campaignRouter from './campaign.js';
import trackingRouter from './tracking.js';

const router = Router();

// Rutas de estado
router.use('/health', healthRouter);

// Rutas de proyectos
router.use('/projects', projectRouter);

// Rutas de campañas
router.use('/campaigns', campaignRouter);

// Rutas de tracking y estadísticas
router.use('/tracking', trackingRouter);

export default router; 