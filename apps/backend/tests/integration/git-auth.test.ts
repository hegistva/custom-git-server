import { execSync } from 'child_process';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { createTestUser, truncateAuthTables } from '../fixtures/user.factory';
import { db } from '../../src/lib/db';

let app: FastifyInstance;

beforeAll(async () => {
  execSync('pnpm prisma migrate deploy', {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: 'pipe',
  });
  app = await buildApp();
  await app.ready();
});

afterEach(async () => {
  await truncateAuthTables();
});

afterAll(async () => {
  await app.close();
});

describe('GET /internal/git-auth', () => {
  it('returns false/401 for unknown user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/internal/git-auth',
      headers: {
        authorization: `Basic ${Buffer.from('nobody:invalid').toString('base64')}`,
        'x-original-uri': '/nobody/repo.git/info/refs',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns missing auth header -> 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/internal/git-auth',
    });
    expect(res.statusCode).toBe(401);
  });

  it('valid PAT against correct repo owner returns 200 with X-Auth-Username', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const auth = loginRes.json().accessToken;

    const addRes = await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${auth}` },
      payload: { label: 'Git Token' },
    });
    const rawToken = addRes.json().rawToken;

    const userInDb = await db.user.findUniqueOrThrow({ where: { username } });
    await db.repository.create({
      data: { ownerId: userInDb.id, name: 'my-repo', diskPath: 'mock' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/internal/git-auth',
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${rawToken}`).toString('base64')}`,
        'x-original-uri': `/${username}/my-repo.git/info/refs`,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-auth-username']).toBe(username);
  });

  it('wrong PAT returns 401', async () => {
    const { username, rawPassword } = await createTestUser();

    const userInDb = await db.user.findUniqueOrThrow({ where: { username } });
    await db.repository.create({
      data: { ownerId: userInDb.id, name: 'my-repo', diskPath: 'mock' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/internal/git-auth',
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:wrong-token`).toString('base64')}`,
        'x-original-uri': `/${username}/my-repo.git/info/refs`,
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('revoked PAT returns 401', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const auth = loginRes.json().accessToken;

    const addRes = await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${auth}` },
      payload: { label: 'Git Token' },
    });
    const rawToken = addRes.json().rawToken;
    const tokenId = addRes.json().token.id;

    const userInDb = await db.user.findUniqueOrThrow({ where: { username } });
    await db.repository.create({
      data: { ownerId: userInDb.id, name: 'my-repo', diskPath: 'mock' },
    });

    await app.inject({
      method: 'DELETE',
      url: `/api/tokens/${tokenId}`,
      headers: { authorization: `Bearer ${auth}` },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/internal/git-auth',
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${rawToken}`).toString('base64')}`,
        'x-original-uri': `/${username}/my-repo.git/info/refs`,
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('valid PAT but wrong repo owner returns 401', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const auth = loginRes.json().accessToken;

    const addRes = await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${auth}` },
      payload: { label: 'Git Token' },
    });
    const rawToken = addRes.json().rawToken;

    // otherperson
    await db.user.create({
      data: { username: 'otherperson', email: 'other@example.com', passwordHash: 'mock' },
    });
    const otherInDb = await db.user.findUniqueOrThrow({ where: { username: 'otherperson' } });
    await db.repository.create({
      data: { ownerId: otherInDb.id, name: 'repo', diskPath: 'mock' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/internal/git-auth',
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${rawToken}`).toString('base64')}`,
        'x-original-uri': `/otherperson/repo.git/info/refs`,
      },
    });
    expect(res.statusCode).toBe(401);
  });
});
