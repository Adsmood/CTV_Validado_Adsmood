import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import router from './routes/index.js';
import { prisma } from './services/prisma.js';
import { app } from './app';

const PORT = process.env.PORT || 3000;

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

async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('Base de datos conectada');
    console.log('Puerto configurado:', PORT);
    console.log('Variables de entorno:', {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      allowedOrigins: process.env.ALLOWED_ORIGINS
    });

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en puerto ${PORT}`);
      console.log(`Ambiente: ${config.server.nodeEnv}`);
      console.log(`CORS habilitado para: [ '${config.cors.allowedOrigins.join("', '")}' ]`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer(); 