import { z } from 'zod';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Esquema de validación
const configSchema = z.object({
  database: z.object({
    url: z.string().url(),
  }),
  server: z.object({
    port: z.coerce.number().int().positive(),
    nodeEnv: z.enum(['development', 'production']),
  }),
  services: z.object({
    assetsServiceUrl: z.string().url(),
  }),
  cors: z.object({
    allowedOrigins: z.array(z.string().url()),
  }),
});

// Tipo inferido del esquema
export type Config = z.infer<typeof configSchema>;

// Configuración
export const config = configSchema.parse({
  database: {
    url: process.env.DATABASE_URL,
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  services: {
    assetsServiceUrl: process.env.ASSETS_SERVICE_URL,
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  },
}); 