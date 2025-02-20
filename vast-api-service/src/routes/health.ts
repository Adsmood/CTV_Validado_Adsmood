import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router; 