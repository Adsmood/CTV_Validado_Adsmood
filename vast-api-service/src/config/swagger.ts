import swaggerJsdoc from 'swagger-jsdoc';

const version = '1.0.0'; // Versión hardcodeada para evitar problemas con la importación del package.json

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Adsmood VAST API Service',
      version,
      description: 'API para la gestión de anuncios VAST y CTV',
      contact: {
        name: 'Adsmood Support',
        url: 'https://adsmood.com',
        email: 'support@adsmood.com'
      },
      license: {
        name: 'Privada',
        url: 'https://adsmood.com/license'
      }
    },
    servers: [
      {
        url: 'https://vast-api-service.onrender.com',
        description: 'Servidor de producción'
      },
      {
        url: 'http://localhost:10000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key para autenticación'
        },
        BasicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Autenticación básica con usuario y contraseña'
        }
      },
      schemas: {
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            campaigns: {
              type: 'array',
              items: { $ref: '#/components/schemas/Campaign' }
            }
          }
        },
        Campaign: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            videoUrl: { type: 'string', format: 'uri' },
            vastConfig: { type: 'object' },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'paused', 'completed']
            },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            analytics: {
              type: 'array',
              items: { $ref: '#/components/schemas/Analytics' }
            }
          }
        },
        Analytics: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            campaignId: { type: 'string', format: 'uuid' },
            eventType: {
              type: 'string',
              enum: [
                'impression',
                'start',
                'firstQuartile',
                'midpoint',
                'thirdQuartile',
                'complete',
                'click',
                'skip'
              ]
            },
            timestamp: { type: 'string', format: 'date-time' },
            metadata: {
              type: 'object',
              nullable: true
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string', nullable: true }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options); 