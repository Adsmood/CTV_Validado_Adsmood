import { Router } from 'express';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignVast,
  getCampaignStats
} from '../controllers/campaignController.js';

const router = Router();

// Obtener todas las campañas
router.get('/', getCampaigns);

// Obtener una campaña específica
router.get('/:id', getCampaign);

// Crear una nueva campaña
router.post('/', createCampaign);

// Actualizar una campaña
router.put('/:id', updateCampaign);

// Eliminar una campaña
router.delete('/:id', deleteCampaign);

// Obtener VAST XML de una campaña
router.get('/:id/vast', getCampaignVast);

// Obtener estadísticas de una campaña
router.get('/:id/stats', getCampaignStats);

export default router; 