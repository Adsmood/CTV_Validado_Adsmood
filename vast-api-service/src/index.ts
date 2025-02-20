import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import router from './routes/index.js';
import { prisma } from './services/prisma.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rutas
app.use('/api', router);

// Manejo de errores global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    details: err.message
  });
});

// Inicialización
const start = async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('Base de datos conectada');

    // Iniciar servidor
    app.listen(config.server.port, () => {
      console.log(`Servidor iniciado en puerto ${config.server.port}`);
      console.log('Ambiente:', config.server.nodeEnv);
      console.log('CORS habilitado para:', config.cors.allowedOrigins);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start(); 