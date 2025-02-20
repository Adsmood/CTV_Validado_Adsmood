import { prisma } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export async function createTestProject() {
  return await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'A project for testing purposes',
      apiKey: uuidv4()
    }
  });
}

export async function clearTestData() {
  await prisma.analytics.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.project.deleteMany();
} 