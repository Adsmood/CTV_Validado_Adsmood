import { Router } from 'express';
import { VastGenerator } from '../services/vastGenerator';
import { AdConfigSchema } from '../types/vast';
import { AppError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/vast/generate
router.post('/generate', async (req, res, next) => {
  try {
    // Validar el cuerpo de la petición
    const adConfig = AdConfigSchema.parse(req.body);

    // Generar el XML VAST
    const vastGenerator = new VastGenerator(adConfig);
    const vastXml = vastGenerator.generate();

    // Guardar en la base de datos
    const ad = await prisma.ad.create({
      data: {
        name: adConfig.name,
        description: adConfig.description,
        vastXml,
        config: adConfig,
        project: {
          connect: {
            id: req.body.projectId,
          },
        },
      },
    });

    // Devolver respuesta
    res.status(201).json({
      id: ad.id,
      vastXml,
      trackingUrls: {
        impression: adConfig.tracking.impressionUrls,
        start: adConfig.tracking.startUrls,
        complete: adConfig.tracking.completeUrls,
        click: adConfig.tracking.clickUrls,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vast/:id
router.get('/:id', async (req, res, next) => {
  try {
    const ad = await prisma.ad.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!ad) {
      throw new AppError(404, 'Anuncio no encontrado');
    }

    res.header('Content-Type', 'application/xml');
    res.send(ad.vastXml);
  } catch (error) {
    next(error);
  }
});

// GET /api/vast/:id/tracking/:type
router.get('/:id/tracking/:type', async (req, res, next) => {
  try {
    const { id, type } = req.params;

    // Registrar el evento de tracking
    await prisma.trackingEvent.create({
      data: {
        adId: id,
        type,
        url: req.url,
      },
    });

    // Enviar un pixel de tracking
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache',
    });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    next(error);
  }
});

export { router as vastRoutes }; 