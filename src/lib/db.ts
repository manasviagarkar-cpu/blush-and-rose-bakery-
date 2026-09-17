import { PrismaClient } from '@prisma/client';

import path from 'path';
import fs from 'fs';

function resolveDatabaseUrl(): string {
  // If remote Postgres / Turso / Supabase / Neon is configured, use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL;
  }

  const isVercelServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isVercelServerless) {
    const tmpPath = path.join('/tmp', 'dev.db');
    try {
      if (!fs.existsSync(/* turbopackIgnore: true */ tmpPath)) {
        const sourcePath = path.join(process.cwd(), 'prisma', 'dev.db');
        if (fs.existsSync(/* turbopackIgnore: true */ sourcePath)) {
          fs.copyFileSync(sourcePath, tmpPath);
        }
      }
    } catch (e) {
      console.warn('Could not copy dev.db to /tmp:', e);
    }
    return `file:${tmpPath}`;
  }

  // Local development
  const localDb = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(localDb)) {
    return `file:${localDb}`;
  }
  return process.env.DATABASE_URL || 'file:./dev.db';
}

const dbUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
