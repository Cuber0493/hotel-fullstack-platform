import { prisma, checkDatabaseConnection } from '../lib/prisma.js';
import { seedDatabase } from '../lib/seedDatabase.js';

let isDbAvailable: boolean | null = null;

export async function isTestDatabaseAvailable(): Promise<boolean> {
  if (isDbAvailable === null) {
    isDbAvailable = await checkDatabaseConnection();
  }
  return isDbAvailable;
}

export async function setupTestDatabase(): Promise<boolean> {
  const available = await isTestDatabaseAvailable();
  if (available) {
    await seedDatabase({ forceReset: true });
  }
  return available;
}

export { prisma };
