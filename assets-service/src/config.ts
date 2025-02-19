import dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
dotenv.config();

// Esquema de validación
const configSchema = z.object({
  b2: z.object({
    keyId: z.string().min(1),
    key: z.string().min(1),
    bucketId: z.string().min(1),
    fileUrl: z.string().url(),
  }),
  server: z.object({
    port: z.number().positive(),
    nodeEnv: z.enum(['development', 'production']).default('development'),
  }),
  cors: z.object({
    allowedOrigins: z.array(z.string().url()),
  }),
});

// Tipo inferido del esquema
export type Config = z.infer<typeof configSchema>;

// Logging para debug
console.log('Environment variables:', {
  B2_APPLICATION_KEY_ID: process.env.B2_APPLICATION_KEY_ID,
  B2_APPLICATION_KEY: '***hidden***',
  B2_BUCKET_ID: process.env.B2_BUCKET_ID,
  B2_FILE_URL: process.env.B2_FILE_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
});

// Configuración
const config: Config = {
  b2: {
    keyId: process.env.B2_APPLICATION_KEY_ID || '',
    key: process.env.B2_APPLICATION_KEY || '',
    bucketId: process.env.B2_BUCKET_ID || '',
    fileUrl: process.env.B2_FILE_URL || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .filter(Boolean)
      .map(origin => origin.trim()),
  },
};

let validatedConfig: Config;

try {
  // Validar la configuración
  validatedConfig = configSchema.parse(config);
  console.log('Configuration validated successfully');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:', JSON.stringify(error.errors, null, 2));
  }
  process.exit(1);
}

export { validatedConfig as config }; 