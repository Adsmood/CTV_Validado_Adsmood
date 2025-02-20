import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { vastService } from '../services/vastService.js';
import { analyticsService } from '../services/analyticsService.js';
import type { Campaign, ErrorResponse, SuccessResponse } from '../types/index.js';

export const getCampaigns = async (_req: Request, res: Response<SuccessResponse<Campaign[]> | ErrorResponse>) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        project: true,
        analytics: true
      }
    });

    res.json({
      data: campaigns
    });
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    res.status(500).json({
      error: 'Error al obtener las campañas',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const getCampaign = async (req: Request, res: Response<SuccessResponse<Campaign> | ErrorResponse>) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        project: true,
        analytics: true
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaña no encontrada'
      });
    }

    res.json({
      data: campaign
    });
  } catch (error) {
    console.error('Error al obtener campaña:', error);
    res.status(500).json({
      error: 'Error al obtener la campaña',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const createCampaign = async (req: Request, res: Response<SuccessResponse<Campaign> | ErrorResponse>) => {
  try {
    const { projectId, name, videoUrl, vastConfig, status, startDate, endDate } = req.body;

    // Validaciones básicas
    if (!projectId || !name || !videoUrl || !vastConfig) {
      return res.status(400).json({
        error: 'Faltan campos requeridos'
      });
    }

    // Validar configuración VAST
    const vastValidation = vastService.validateVastConfig(vastConfig);
    if (!vastValidation.isValid) {
      return res.status(400).json({
        error: 'Configuración VAST inválida',
        details: vastValidation.errors
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        projectId,
        name,
        videoUrl,
        vastConfig,
        status: status || 'draft',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        project: true,
        analytics: true
      }
    });

    res.status(201).json({
      data: campaign,
      message: 'Campaña creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear campaña:', error);
    res.status(500).json({
      error: 'Error al crear la campaña',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const updateCampaign = async (req: Request, res: Response<SuccessResponse<Campaign> | ErrorResponse>) => {
  try {
    const { id } = req.params;
    const { name, videoUrl, vastConfig, status, startDate, endDate } = req.body;

    if (vastConfig) {
      const vastValidation = vastService.validateVastConfig(vastConfig);
      if (!vastValidation.isValid) {
        return res.status(400).json({
          error: 'Configuración VAST inválida',
          details: vastValidation.errors
        });
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        videoUrl,
        vastConfig,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      },
      include: {
        project: true,
        analytics: true
      }
    });

    res.json({
      data: campaign,
      message: 'Campaña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar campaña:', error);
    res.status(500).json({
      error: 'Error al actualizar la campaña',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const deleteCampaign = async (req: Request, res: Response<SuccessResponse<void> | ErrorResponse>) => {
  try {
    const { id } = req.params;

    await prisma.campaign.delete({
      where: { id }
    });

    res.json({
      data: undefined,
      message: 'Campaña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar campaña:', error);
    res.status(500).json({
      error: 'Error al eliminar la campaña',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const getCampaignVast = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaña no encontrada'
      });
    }

    // Registrar impresión
    await analyticsService.trackEvent(id, 'impression');

    // Generar VAST XML
    const vastXml = vastService.generateVastXml(campaign);

    // Configurar headers
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'no-cache');
    res.send(vastXml);
  } catch (error) {
    console.error('Error al generar VAST:', error);
    res.status(500).json({
      error: 'Error al generar VAST',
      details: error instanceof Error ? error.message : undefined
    });
  }
};

export const getCampaignStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await analyticsService.getCampaignStats(id);
    res.json({ data: stats });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error instanceof Error ? error.message : undefined
    });
  }
}; 