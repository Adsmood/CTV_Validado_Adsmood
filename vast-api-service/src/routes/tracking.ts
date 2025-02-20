import { Router } from 'express';
import {
  trackEvent,
  getRealTimeStats,
  verifyVastTag
} from '../controllers/trackingController.js';

const router = Router();

// Registrar un evento de tracking
router.post('/campaigns/:campaignId/events', trackEvent);

// Obtener estadísticas en tiempo real
router.get('/campaigns/:campaignId/realtime', getRealTimeStats);

// Verificar VAST tag
router.get('/campaigns/:campaignId/verify', verifyVastTag);

export default router; 