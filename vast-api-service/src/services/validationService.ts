import type { VastConfig } from '../types/index.js';

interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    codec?: string;
    bitrate?: number;
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface UrlValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    statusCode?: number;
    contentType?: string;
    contentLength?: number;
  };
}

class ValidationService {
  private readonly SUPPORTED_VIDEO_FORMATS = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/x-m4v',
    'video/quicktime'
  ];

  private readonly SUPPORTED_VIDEO_CODECS = [
    'avc1', // H.264
    'hvc1', // H.265/HEVC
    'vp8',
    'vp9',
    'av01' // AV1
  ];

  private readonly MIN_VIDEO_BITRATE = 1000000; // 1 Mbps
  private readonly MAX_VIDEO_BITRATE = 20000000; // 20 Mbps
  private readonly MIN_VIDEO_WIDTH = 640;
  private readonly MIN_VIDEO_HEIGHT = 360;
  private readonly MAX_VIDEO_WIDTH = 3840;
  private readonly MAX_VIDEO_HEIGHT = 2160;

  async validateVideoFormat(url: string): Promise<VideoValidationResult> {
    const errors: string[] = [];
    const metadata: VideoValidationResult['metadata'] = {};

    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        errors.push(`Error al acceder al video: ${response.status}`);
        return { isValid: false, errors };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !this.SUPPORTED_VIDEO_FORMATS.includes(contentType)) {
        errors.push(`Formato de video no soportado: ${contentType}`);
      }

      const contentLength = response.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 1000000) { // 1MB mínimo
        errors.push('El archivo de video es demasiado pequeño');
      }

      // Si es posible, obtener metadatos del video
      try {
        const videoResponse = await fetch(url);
        const blob = await videoResponse.blob();
        const video = document.createElement('video');
        video.src = URL.createObjectURL(blob);

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            metadata.width = video.videoWidth;
            metadata.height = video.videoHeight;
            metadata.duration = video.duration;

            if (video.videoWidth < this.MIN_VIDEO_WIDTH || video.videoHeight < this.MIN_VIDEO_HEIGHT) {
              errors.push(`Resolución mínima requerida: ${this.MIN_VIDEO_WIDTH}x${this.MIN_VIDEO_HEIGHT}`);
            }

            if (video.videoWidth > this.MAX_VIDEO_WIDTH || video.videoHeight > this.MAX_VIDEO_HEIGHT) {
              errors.push(`Resolución máxima permitida: ${this.MAX_VIDEO_WIDTH}x${this.MAX_VIDEO_HEIGHT}`);
            }

            resolve(true);
          };
          video.onerror = () => reject(video.error);
        });

        URL.revokeObjectURL(video.src);
      } catch (error) {
        console.warn('No se pudieron obtener metadatos del video:', error);
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata
      };
    } catch (error) {
      errors.push(`Error al validar video: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return { isValid: false, errors };
    }
  }

  async validateTrackingUrl(url: string): Promise<UrlValidationResult> {
    const errors: string[] = [];
    const metadata: UrlValidationResult['metadata'] = {};

    try {
      // Validar formato de URL
      const urlObj = new URL(url);
      
      // Verificar protocolo
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('La URL debe usar protocolo HTTP o HTTPS');
      }

      // Verificar que la URL responde
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        metadata.statusCode = response.status;
        metadata.contentType = response.headers.get('content-type') || undefined;
        metadata.contentLength = parseInt(response.headers.get('content-length') || '0');

        if (!response.ok) {
          errors.push(`La URL no responde correctamente: ${response.status}`);
        }
      } catch (error) {
        errors.push('No se pudo acceder a la URL de tracking');
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata
      };
    } catch (error) {
      errors.push('URL inválida');
      return { isValid: false, errors };
    }
  }

  validateInteractiveElement(element: VastConfig['interactiveElements'][0]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar tipo
    if (!element.type) {
      errors.push('El tipo de elemento es requerido');
    }

    // Validar posición
    if (!element.position || 
        typeof element.position.x !== 'number' || 
        typeof element.position.y !== 'number' ||
        element.position.x < 0 || element.position.x > 100 ||
        element.position.y < 0 || element.position.y > 100) {
      errors.push('Posición inválida (debe estar entre 0 y 100)');
    }

    // Validar tamaño
    if (!element.size || 
        typeof element.size.width !== 'number' || 
        typeof element.size.height !== 'number' ||
        element.size.width <= 0 || element.size.width > 100 ||
        element.size.height <= 0 || element.size.height > 100) {
      errors.push('Tamaño inválido (debe estar entre 0 y 100)');
    }

    // Validar contenido según el tipo
    if (!element.content) {
      errors.push('El contenido es requerido');
    } else {
      switch (element.type) {
        case 'button':
          if (!element.content.text && !element.content.image) {
            errors.push('Los botones deben tener texto o imagen');
          }
          break;
        case 'image':
          if (!element.content.url) {
            errors.push('Las imágenes deben tener URL');
          }
          break;
        case 'video':
          if (!element.content.url) {
            errors.push('Los videos deben tener URL');
          }
          break;
        // Agregar más validaciones según los tipos soportados
      }
    }

    // Validar URL de click (si existe)
    if (element.clickThroughUrl) {
      try {
        new URL(element.clickThroughUrl);
      } catch (error) {
        errors.push('URL de click inválida');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async validateVastConfig(config: VastConfig): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar formatos de video
    for (const mediaFile of config.mediaFiles) {
      const videoValidation = await this.validateVideoFormat(mediaFile.url);
      if (!videoValidation.isValid) {
        errors.push(...videoValidation.errors.map(error => `MediaFile: ${error}`));
      }
    }

    // Validar URLs de tracking
    const trackingUrls = [
      ...config.impressionUrls,
      ...(config.trackingEvents.start || []),
      ...(config.trackingEvents.complete || []),
      ...(config.trackingEvents.firstQuartile || []),
      ...(config.trackingEvents.midpoint || []),
      ...(config.trackingEvents.thirdQuartile || [])
    ];

    for (const url of trackingUrls) {
      const urlValidation = await this.validateTrackingUrl(url);
      if (!urlValidation.isValid) {
        errors.push(...urlValidation.errors.map(error => `Tracking URL: ${error}`));
      }
    }

    // Validar elementos interactivos
    if (config.interactiveElements) {
      for (const element of config.interactiveElements) {
        const elementValidation = this.validateInteractiveElement(element);
        if (!elementValidation.isValid) {
          errors.push(...elementValidation.errors.map(error => `Interactive Element: ${error}`));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const validationService = new ValidationService(); 