import { PrismaClient } from '@prisma/client';

/**
 * Require DATABASE_URL to be set. Fail clearly in production if missing.
 * Do not fall back to SQLite or dev.db.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Set it to your PostgreSQL connection string before starting the server.'
    );
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
