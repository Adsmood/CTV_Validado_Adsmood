/// <reference types="jest" />
import { validationService } from '../../services/validationService';
import type { InteractiveElement } from '../../services/validationService';

describe('ValidationService', () => {
  describe('validateTrackingUrl', () => {
    it('debería validar una URL de tracking válida', async () => {
      const result = await validationService.validateTrackingUrl('https://example.com/track');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debería rechazar una URL inválida', async () => {
      const result = await validationService.validateTrackingUrl('invalid-url');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL inválida');
    });

    it('debería rechazar una URL no HTTPS', async () => {
      const result = await validationService.validateTrackingUrl('http://example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La URL debe usar protocolo HTTPS');
    });
  });

  describe('validateInteractiveElement', () => {
    it('debería validar un elemento interactivo válido', () => {
      const element: InteractiveElement = {
        type: 'button',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 50 },
        content: { text: 'Click me' }
      };

      const result = validationService.validateInteractiveElement(element);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debería rechazar un elemento sin tipo', () => {
      const element = {
        position: { x: 50, y: 50 },
        size: { width: 100, height: 50 },
        content: { text: 'Click me' }
      };

      const result = validationService.validateInteractiveElement(element as InteractiveElement);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El tipo de elemento es requerido');
    });

    it('debería rechazar posiciones inválidas', () => {
      const element: InteractiveElement = {
        type: 'button',
        position: { x: -10, y: 150 },
        size: { width: 100, height: 50 },
        content: { text: 'Click me' }
      };

      const result = validationService.validateInteractiveElement(element);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Posición inválida (debe estar entre 0 y 100)');
    });
  });

  describe('validateVastConfig', () => {
    const validConfig = {
      version: '4.0' as '4.0' | '2.0' | '3.0' | '4.1' | '4.2',
      adTitle: 'Test Ad',
      duration: 30,
      impressionUrls: ['https://example.com/impression'],
      trackingEvents: {
        start: ['https://example.com/start'],
        complete: ['https://example.com/complete']
      },
      mediaFiles: [{
        url: 'https://example.com/video.mp4',
        type: 'video/mp4',
        bitrate: 2000,
        width: 1920,
        height: 1080,
        delivery: 'progressive' as 'progressive' | 'streaming',
        codec: 'h264'
      }]
    };

    it('debería validar una configuración VAST válida', async () => {
      const result = await validationService.validateVastConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debería rechazar una configuración sin mediaFiles', async () => {
      const invalidConfig = { ...validConfig, mediaFiles: [] };
      const result = await validationService.validateVastConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MediaFile: El archivo de video es demasiado pequeño');
    });

    it('debería validar elementos interactivos', async () => {
      const configWithInteractive = {
        ...validConfig,
        interactiveElements: [{
          type: 'button',
          position: { x: 50, y: 50 },
          size: { width: 100, height: 50 },
          content: { text: 'Click me' },
          clickThroughUrl: 'https://example.com'
        }]
      };

      const result = await validationService.validateVastConfig(configWithInteractive);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});