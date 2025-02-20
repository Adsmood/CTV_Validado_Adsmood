import { config } from '../config/config.js';
import { prisma } from '../services/prisma.js';

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.PORT = '10001'; // Puerto diferente para tests

// Función para limpiar la base de datos antes de cada test
export const clearDatabase = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }: { tablename: string }) => tablename)
    .filter((name: string) => name !== '_prisma_migrations')
    .map((name: string) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log('Error limpiando la base de datos:', error);
  }
};

// Función para crear datos de prueba
export const createTestData = async () => {
  // Crear un proyecto de prueba
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'Project for testing'
    }
  });

  // Crear una campaña de prueba
  const campaign = await prisma.campaign.create({
    data: {
      projectId: project.id,
      name: 'Test Campaign',
      videoUrl: 'https://example.com/test.mp4',
      vastConfig: {
        version: '4.0',
        adTitle: 'Test Ad',
        duration: 30,
        impressionUrls: ['https://example.com/impression'],
        mediaFiles: [{
          url: 'https://example.com/test.mp4',
          type: 'video/mp4',
          bitrate: 2000,
          width: 1920,
          height: 1080,
          delivery: 'progressive'
        }]
      },
      status: 'draft'
    }
  });

  // Crear algunos eventos de analytics
  await prisma.analytics.createMany({
    data: [
      {
        campaignId: campaign.id,
        eventType: 'impression',
        timestamp: new Date(),
        metadata: { userAgent: 'test' }
      },
      {
        campaignId: campaign.id,
        eventType: 'start',
        timestamp: new Date(),
        metadata: { userAgent: 'test' }
      }
    ]
  });

  return { project, campaign };
};

// Configurar y limpiar antes/después de los tests
beforeAll(async () => {
  // Conectar a la base de datos
  await prisma.$connect();
});

beforeEach(async () => {
  // Limpiar la base de datos antes de cada test
  await clearDatabase();
});

afterAll(async () => {
  // Desconectar de la base de datos
  await prisma.$disconnect();
}); 