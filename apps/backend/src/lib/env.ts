import dotenv from 'dotenv';
import path from 'path';

// Load from current directory (apps/backend/.env)
dotenv.config();

// Fallback to workspace root .env if running from apps/backend (which is the cwd during pnpm dev)
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parsePort = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
};

const parseBcryptCost = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 4 || parsed > 31) {
    throw new Error(`Invalid BCRYPT_COST value: ${value}. Must be between 4 and 31.`);
  }
  return parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT, 4000),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  bcryptCost: parseBcryptCost(process.env.BCRYPT_COST, 12),
  reposPath: requireEnv('REPOS_PATH'),
  keysPath: requireEnv('KEYS_PATH'),
};
