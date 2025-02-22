import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { vastRoutes } from './routes/vast';
import { projectRoutes } from './routes/project';
import { prisma } from './services/prisma.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api/vast', vastRoutes);
app.use('/api/projects', projectRoutes);

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor VAST API corriendo en el puerto ${PORT}`);
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