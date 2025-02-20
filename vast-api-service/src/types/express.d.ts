import { Request } from 'express';
import { Project } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        isAuthenticated: boolean;
        authMethod?: string;
      };
      vastToken?: {
        timestamp: number;
        campaignId: string;
        hash: string;
      };
      project?: Project;
    }
  }
} 