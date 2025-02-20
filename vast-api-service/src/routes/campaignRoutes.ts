import { Router } from 'express';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignVast,
  getCampaignStats
} from '../controllers/campaignController';
import { validateApiKey } from '../middleware/auth';

const router = Router();

// Rutas protegidas por API Key
router.use(validateApiKey);

// Rutas CRUD
router.get('/', getCampaigns);
router.get('/:id', getCampaign);
router.post('/', createCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

// Rutas especiales
router.get('/:id/vast', getCampaignVast);
router.get('/:id/stats', getCampaignStats);

export default router; 