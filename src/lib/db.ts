import { PrismaClient } from '@prisma/client';

/**
 * Resolve PostgreSQL database URL.
 * During build/static generation (e.g. on Vercel before environment variables
 * or database servers are attached), fall back to a placeholder PostgreSQL URL
 * to avoid crashing Next.js module evaluation.
 */
function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/blushrose?schema=public'
  );
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
