import { execSync } from 'child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';

describe('internal endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Apply any pending migrations to the test database before the suite runs
    execSync('pnpm prisma migrate deploy', {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: 'pipe',
    });

    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'backend',
    });
  });

  it('returns readiness status with db connection', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/internal/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'backend',
    });
  });
});
