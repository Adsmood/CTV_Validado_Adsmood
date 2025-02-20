import { Router } from "express";
import campaignRoutes from './campaignRoutes';

const router = Router();

router.use('/campaigns', campaignRoutes);

// Aquí se agregarán las rutas específicas
// router.use("/campaigns", campaignRoutes);

export default router;
