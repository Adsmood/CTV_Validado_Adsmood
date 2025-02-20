import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import type { Analytics, ErrorResponse, SuccessResponse } from '../types/index.js';

export const trackEvent = async (req: Request, res: Response<SuccessResponse<Analytics> | ErrorResponse>) => {
  try {
    const { campaignId } = req.params;
    const { eventType, metadata } = req.body;

    if (!campaignId || !eventType) {
      return res.status(400).json({
        error: 'campaignId y eventType son requeridos'
      });
    }

    const event = await analyticsService.trackEvent(campaignId, eventType, metadata);

    res.json({
      data: event,
      message: 'Evento registrado exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar evento:', error);
    res.status(500).json({
      error: 'Error al registrar el evento',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const getRealTimeStats = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { interval = '1h' } = req.query;

    // Calcular rango de tiempo basado en el intervalo
    const now = new Date();
    const startDate = new Date(now);
    
    switch (interval) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '6h':
        startDate.setHours(now.getHours() - 6);
        break;
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      default:
        startDate.setHours(now.getHours() - 1);
    }

    const stats = await analyticsService.getTimelineStats(
      campaignId,
      startDate,
      now
    );

    res.json({
      data: stats,
      interval,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
  } catch (error) {
    console.error('Error al obtener estadísticas en tiempo real:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const verifyVastTag = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'URL del tag VAST es requerida'
      });
    }

    // Verificar que la URL sea válida
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'URL inválida',
        details: 'La URL proporcionada no es válida'
      });
    }

    // Intentar obtener el VAST XML
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({
        error: 'Error al obtener el VAST',
        details: `Status: ${response.status}`
      });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('xml')) {
      return res.status(400).json({
        error: 'Formato inválido',
        details: 'La respuesta no es un XML válido'
      });
    }

    const vastXml = await response.text();
    
    // Validar estructura básica del VAST
    if (!vastXml.includes('<VAST') || !vastXml.includes('</VAST>')) {
      return res.status(400).json({
        error: 'XML inválido',
        details: 'El documento no es un VAST válido'
      });
    }

    // TODO: Implementar validación más detallada del VAST

    res.json({
      data: {
        isValid: true,
        url,
        campaignId
      },
      message: 'VAST tag verificado exitosamente'
    });
  } catch (error) {
    console.error('Error al verificar VAST tag:', error);
    res.status(500).json({
      error: 'Error al verificar VAST tag',
      details: error instanceof Error ? error.message : undefined
    });
  }
}; 