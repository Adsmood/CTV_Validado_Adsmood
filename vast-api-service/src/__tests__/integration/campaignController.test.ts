import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/database.js';
import { createTestProject } from '../setup/testData';

interface Campaign {
  name: string;
  videoUrl: string;
  projectId?: string;
  vastConfig: {
    version: string;
    adTitle: string;
    duration: number;
    impressionUrls: string[];
    trackingEvents?: {
      start?: string[];
      complete?: string[];
    };
    mediaFiles: {
      url: string;
      type: string;
      bitrate: number;
      width: number;
      height: number;
      delivery: string;
    }[];
  };
  startDate: Date;
  endDate: Date;
}

describe('Campaign Controller Integration Tests', () => {
  let projectId: string;
  let apiKey: string;

  beforeAll(async () => {
    const project = await createTestProject();
    projectId = project.id;
    apiKey = project.apiKey;
  });

  afterAll(async () => {
    await prisma.analytics.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.project.deleteMany();
  });

  describe('POST /api/campaigns', () => {
    const validCampaign = {
      name: 'Test Campaign',
      videoUrl: 'https://example.com/video.mp4',
      vastConfig: {
        version: '4.0',
        adTitle: 'Test Ad',
        duration: 30,
        impressionUrls: ['https://example.com/impression'],
        mediaFiles: [{
          url: 'https://example.com/video.mp4',
          type: 'video/mp4',
          bitrate: 2000,
          width: 1920,
          height: 1080,
          delivery: 'progressive'
        }]
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000) // mañana
    };

    it('debería crear una campaña con datos válidos', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .set('X-API-Key', apiKey)
        .send({ ...validCampaign, projectId });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(validCampaign.name);
    });

    it('debería rechazar una campaña con configuración VAST inválida', async () => {
      const invalidCampaign = {
        ...validCampaign,
        projectId,
        vastConfig: {
          ...validCampaign.vastConfig,
          mediaFiles: []
        }
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('X-API-Key', apiKey)
        .send(invalidCampaign);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('MediaFile: El archivo de video es demasiado pequeño');
    });

    it('debería rechazar una campaña sin projectId', async () => {
      const campaignWithoutProject = {
        ...validCampaign,
        projectId: undefined
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('X-API-Key', apiKey)
        .send(campaignWithoutProject);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain('El ID del proyecto es requerido');
    });
  });

  describe('GET /api/campaigns/:id/vast', () => {
    let campaignId: string;

    beforeAll(async () => {
      const campaign = await prisma.campaign.create({
        data: {
          name: 'Test Campaign for VAST',
          projectId,
          videoUrl: 'https://example.com/video.mp4',
          vastConfig: {
            version: '4.0',
            adTitle: 'Test Ad',
            duration: 30,
            impressionUrls: ['https://example.com/impression'],
            mediaFiles: [{
              url: 'https://example.com/video.mp4',
              type: 'video/mp4',
              bitrate: 2000,
              width: 1920,
              height: 1080,
              delivery: 'progressive'
            }]
          },
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000)
        }
      });
      campaignId = campaign.id;
    });

    it('debería devolver XML VAST válido', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${campaignId}/vast`)
        .set('X-API-Key', apiKey)
        .set('Accept', 'application/xml');

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/xml');
      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(response.text).toContain('version="4.0"');
      expect(response.text).toContain('<VAST');
      expect(response.text).toContain('</VAST>');
    });

    it('debería devolver 404 para una campaña inexistente', async () => {
      const response = await request(app)
        .get('/api/campaigns/non-existent-id/vast')
        .set('X-API-Key', apiKey)
        .set('Accept', 'application/xml');

      expect(response.status).toBe(404);
    });
  });
}); 