import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import healthRouter from './routes/health.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rutas
app.use('/health', healthRouter);

// Iniciar servidor
app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
  console.log('Environment:', config.server.nodeEnv);
  console.log('CORS origins:', config.cors.allowedOrigins);
}); 