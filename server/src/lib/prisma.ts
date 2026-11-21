import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

let cachedConnectionStatus: boolean | null = null;

/**
 * Health check helper to test active connection to the database.
 * Uses a 1-second timeout and caches result in memory to avoid repeated hang delays.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  if (cachedConnectionStatus !== null) {
    return cachedConnectionStatus;
  }

  try {
    const checkPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection check timed out')), 1000)
    );
    await Promise.race([checkPromise, timeoutPromise]);
    cachedConnectionStatus = true;
    return true;
  } catch {
    cachedConnectionStatus = false;
    return false;
  }
}

export default prisma;
