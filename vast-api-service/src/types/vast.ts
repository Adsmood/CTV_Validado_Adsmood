import { z } from 'zod';

// Esquema para elementos interactivos
export const InteractiveElementSchema = z.object({
  id: z.string(),
  type: z.enum(['button', 'carousel', 'gallery', 'trivia', 'qr', 'choice']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  content: z.object({
    text: z.string().optional(),
    imageUrl: z.string().optional(),
    action: z.object({
      type: z.enum(['link', 'form', 'tracking']),
      url: z.string(),
    }).optional(),
  }),
  timeline: z.object({
    start: z.number(),
    end: z.number(),
  }),
});

// Esquema para la configuración del anuncio
export const AdConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  duration: z.number(),
  skipOffset: z.number().optional(),
  interactiveElements: z.array(InteractiveElementSchema),
  tracking: z.object({
    impressionUrls: z.array(z.string().url()),
    startUrls: z.array(z.string().url()),
    firstQuartileUrls: z.array(z.string().url()),
    midpointUrls: z.array(z.string().url()),
    thirdQuartileUrls: z.array(z.string().url()),
    completeUrls: z.array(z.string().url()),
    clickUrls: z.array(z.string().url()),
  }),
  dv360Macros: z.record(z.string()).optional(),
});

// Tipos inferidos
export type InteractiveElement = z.infer<typeof InteractiveElementSchema>;
export type AdConfig = z.infer<typeof AdConfigSchema>;

// Tipos para las respuestas de la API
export interface VastResponse {
  id: string;
  vastXml: string;
  trackingUrls: {
    impression: string[];
    start: string[];
    complete: string[];
    click: string[];
  };
}

// Tipos para los eventos de tracking
export type TrackingEventType =
  | 'impression'
  | 'start'
  | 'firstQuartile'
  | 'midpoint'
  | 'thirdQuartile'
  | 'complete'
  | 'click'; 