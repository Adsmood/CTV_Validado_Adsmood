import { Request, Response } from 'express';
import { b2Service } from '../services/b2Service.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const file = req.file;
    console.log('Archivo recibido:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      bufferSize: file.buffer.length
    });

    if (file.size === 0 || file.buffer.length === 0) {
      return res.status(400).json({ error: 'El archivo está vacío' });
    }

    if (!file.mimetype.startsWith('video/')) {
      return res.status(400).json({ error: 'El archivo debe ser un video' });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    console.log('Iniciando subida a B2:', {
      fileName,
      size: file.size,
      mimetype: file.mimetype
    });

    const url = await b2Service.uploadFile(
      file.buffer,
      fileName,
      file.mimetype
    );

    console.log('Subida completada:', { url });
    res.json({ url });
  } catch (error) {
    console.error('Error detallado en uploadFile:', error);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
}; 