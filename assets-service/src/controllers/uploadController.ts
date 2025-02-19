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
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    const url = await b2Service.uploadFile(
      file.buffer,
      fileName,
      file.mimetype
    );

    res.json({ url });
  } catch (error) {
    console.error('Error en uploadFile:', error);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
}; 