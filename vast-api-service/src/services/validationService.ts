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

export interface InteractiveElement {
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
  clickThroughUrl?: string;
}

export const validationService = {
  validateTrackingUrl: async (url: string) => {
    try {
      const urlObj = new URL(url);
      const isValid = urlObj.protocol === 'https:';
      return {
        isValid,
        errors: isValid ? [] : ['La URL debe usar protocolo HTTPS']
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['URL inválida']
      };
    }
  },

  validateInteractiveElement: (element: InteractiveElement) => {
    const errors = [];
    let isValid = true;

    if (!element.type) {
      errors.push('El tipo de elemento es requerido');
      isValid = false;
    }

    if (element.position) {
      const { x, y } = element.position;
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        errors.push('Posición inválida (debe estar entre 0 y 100)');
        isValid = false;
      }
    }

    return { isValid, errors };
  },

  validateVastConfig: async (config: VastConfig) => {
    const errors = [];
    let isValid = true;

    if (!config.mediaFiles || config.mediaFiles.length === 0) {
      errors.push('MediaFile: El archivo de video es demasiado pequeño');
      isValid = false;
    }

    if (config.interactiveElements) {
      for (const element of config.interactiveElements) {
        const elementValidation = validationService.validateInteractiveElement(element);
        if (!elementValidation.isValid) {
          errors.push(...elementValidation.errors);
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }
}; 