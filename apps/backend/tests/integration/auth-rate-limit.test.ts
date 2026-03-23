import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const ORIGINAL_ENV = { ...process.env };

async function createAppWithCurrentEnv(): Promise<FastifyInstance> {
  vi.resetModules();
  const { buildApp } = await import('../../src/app');
  const app = await buildApp();
  await app.ready();
  return app;
}

describe('auth rate limiting', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.NODE_ENV = 'development';
    process.env.DISABLE_AUTH_RATE_LIMIT = 'false';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns 429 after enough auth requests when rate limiting is enabled', async () => {
    const app = await createAppWithCurrentEnv();

    try {
      let sawTooManyRequests = false;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/refresh',
        });

        if (response.statusCode === 429) {
          sawTooManyRequests = true;
          expect(response.json<{ message: string }>().message).toBe(
            'Too many requests, please try again later.',
          );
          break;
        }

        expect(response.statusCode).toBe(401);
      }

      expect(sawTooManyRequests).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('keeps returning auth responses when rate limiting is explicitly disabled', async () => {
    process.env.DISABLE_AUTH_RATE_LIMIT = 'true';

    const app = await createAppWithCurrentEnv();

    try {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/refresh',
        });

        expect(response.statusCode).toBe(401);
      }
    } finally {
      await app.close();
    }
  });
});
