import { Request, Response } from 'express';
import { b2Service } from '../services/b2Service.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    console.log('Iniciando proceso de subida...');
    
    if (!req.file) {
      console.error('No se proporcionó ningún archivo');
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const file = req.file;
    console.log('Archivo recibido:', {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      bufferSize: file.buffer.length,
      headers: req.headers
    });

    if (file.size === 0 || file.buffer.length === 0) {
      console.error('Archivo vacío recibido');
      return res.status(400).json({ error: 'El archivo está vacío' });
    }

    // Validar tamaño mínimo solo para videos
    if (file.mimetype.startsWith('video/') && file.size < 1000000) { // 1MB
      console.error('Video demasiado pequeño:', file.size);
      return res.status(400).json({ error: 'Los archivos de video deben ser al menos 1MB' });
    }

    // Para imágenes, solo verificar que no estén vacías
    if (file.mimetype.startsWith('image/') && file.size < 1024) { // 1KB
      console.error('Imagen demasiado pequeña:', file.size);
      return res.status(400).json({ error: 'Las imágenes deben ser al menos 1KB' });
    }

    if (!file.mimetype.startsWith('video/') && !file.mimetype.startsWith('image/')) {
      console.error('Tipo de archivo no válido:', file.mimetype);
      return res.status(400).json({ error: 'El archivo debe ser un video o una imagen' });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    console.log('Iniciando subida a B2:', {
      fileName,
      size: file.size,
      mimetype: file.mimetype
    });

    try {
      const url = await b2Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype
      );

      console.log('Subida completada:', { url });

      // Verificar que el archivo sea accesible
      const fileCheck = await fetch(url, { method: 'HEAD' });
      if (!fileCheck.ok) {
        throw new Error('El archivo subido no es accesible');
      }

      console.log('Archivo verificado:', {
        status: fileCheck.status,
        contentType: fileCheck.headers.get('content-type'),
        contentLength: fileCheck.headers.get('content-length')
      });

      res.json({ url });
    } catch (error) {
      console.error('Error al subir a B2:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error detallado en uploadFile:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error al subir el archivo',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}; 