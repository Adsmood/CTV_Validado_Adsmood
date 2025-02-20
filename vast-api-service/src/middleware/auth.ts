import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';

export const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    return res.status(401).json({
      error: 'API Key no proporcionada'
    });
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        apiKey
      }
    });

    if (!project) {
      return res.status(401).json({
        error: 'API Key inválida'
      });
    }

    // Almacenar el proyecto en el request para uso posterior
    req.project = project;
    next();
  } catch (error) {
    console.error('Error al validar API Key:', error);
    res.status(500).json({
      error: 'Error al validar API Key',
      details: error instanceof Error ? error.message : undefined
    });
  }
}; 