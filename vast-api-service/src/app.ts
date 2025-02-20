import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import router from './routes/index.js';
import healthRouter from './routes/health.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health Check route
app.use('/health', healthRouter);

// API routes
app.use('/api', router);

// Manejo de errores global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    details: err.message
  });
});

export { app }; 