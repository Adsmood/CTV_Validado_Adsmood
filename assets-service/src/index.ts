import express from 'express';
import multer from 'multer';
import cors from 'cors';
import compression from 'compression';
import { config } from './config.js';
import { uploadFile } from './controllers/uploadController.js';
import { generateDynamicVast } from './controllers/vastController.js';
import { b2Service } from './services/b2Service.js';

const app = express();

// Configuración de CORS
app.use(cors({
  origin: config.cors.allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Compresión GZIP
app.use(compression());

// Configuración de Multer para manejar archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB límite
  },
});

// Ruta de estado
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas
app.post('/api/assets/upload', upload.single('file'), uploadFile);

// Nueva ruta para VAST dinámico
app.get('/api/vast/:adId', generateDynamicVast);

// Inicialización
const start = async () => {
  try {
    // Inicializar B2
    try {
      await b2Service.initialize();
      console.log('B2 Service initialized successfully');
    } catch (error) {
      console.error('Warning: B2 Service initialization failed:', error);
      // Continuamos con la inicialización del servidor
    }

    // Iniciar servidor
    app.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();