import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: envLogConfig(process.env.NODE_ENV),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

function envLogConfig(nodeEnv: string | undefined): Array<'error' | 'warn' | 'query'> {
  if (nodeEnv === 'development') {
    return ['query', 'warn', 'error'];
  }

  return ['error'];
}
