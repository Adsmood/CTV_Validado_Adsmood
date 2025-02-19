import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  b2: z.object({
    keyId: z.string(),
    key: z.string(),
    bucketId: z.string(),
    fileUrl: z.string(),
  }),
  server: z.object({
    port: z.number(),
  }),
  cors: z.object({
    allowedOrigins: z.array(z.string()),
  }),
});

export type Config = z.infer<typeof configSchema>;

const config: Config = {
  b2: {
    keyId: process.env.B2_APPLICATION_KEY_ID!,
    key: process.env.B2_APPLICATION_KEY!,
    bucketId: process.env.B2_BUCKET_ID!,
    fileUrl: process.env.B2_FILE_URL!,
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  },
};

try {
  configSchema.parse(config);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:', error.errors);
  }
  process.exit(1);
}

export { config }; 