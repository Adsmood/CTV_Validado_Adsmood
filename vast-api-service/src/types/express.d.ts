import { Request } from 'express';

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
    }
  }
} 