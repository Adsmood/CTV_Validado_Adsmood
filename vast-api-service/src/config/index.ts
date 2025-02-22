import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  vast: {
    defaultVersion: '4.2',
    defaultWrapper: process.env.VAST_WRAPPER_URL,
    trackingDomain: process.env.TRACKING_DOMAIN || 'https://tracking.adsmood.com',
  },
} as const; 