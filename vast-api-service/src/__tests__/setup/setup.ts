import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

beforeAll(async () => {
  // Configurar variables de entorno para pruebas
  process.env.NODE_ENV = 'test';
  process.env.API_KEY = 'test-api-key';
  
  // Conectar a la base de datos
  await prisma.$connect();
});

afterAll(async () => {
  // Limpiar la base de datos
  await prisma.analytics.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.project.deleteMany();
  
  // Desconectar de la base de datos
  await prisma.$disconnect();
}); 