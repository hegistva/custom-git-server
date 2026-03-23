import { execSync } from 'child_process';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { createTestUser, truncateAuthTables } from '../fixtures/user.factory';
import { db } from '../../src/lib/db';
import fs from 'node:fs/promises';
import path from 'node:path';

let app: FastifyInstance;
let testReposDir: string;

beforeAll(async () => {
  execSync('pnpm prisma migrate deploy', {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: 'pipe',
  });
  // Use a local tmp directory for tests instead of the env var which might be locked
  testReposDir = process.env.REPOS_PATH!;
  await fs.mkdir(testReposDir, { recursive: true });
  app = await buildApp();
  await app.ready();
});

afterEach(async () => {
  await truncateAuthTables();
  const dirs = await fs.readdir(testReposDir);
  for (const dir of dirs) {
    await fs.rm(path.join(testReposDir, dir), { recursive: true, force: true });
  }
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

describe('Repositories API', () => {
  it('GET /api/repositories returns empty list initially', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const auth = loginRes.json().accessToken;

    const res = await app.inject({
      method: 'GET',
      url: '/api/repositories',
      headers: { authorization: `Bearer ${auth}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('POST /api/repositories creates a repo', async () => {
    const { username, rawPassword, id: ownerId } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const auth = loginRes.json().accessToken;

    const res = await app.inject({
      method: 'POST',
      url: '/api/repositories',
      headers: { authorization: `Bearer ${auth}` },
      payload: { name: 'my-repo', description: 'desc', isPrivate: true },
    });
    if (res.statusCode !== 201) throw new Error(JSON.stringify(res.json()));

    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe('my-repo');

    // check db
    const repoInDb = await db.repository.findUnique({
      where: { ownerId_name: { ownerId, name: 'my-repo' } },
    });
    expect(repoInDb).not.toBeNull();

    // check disk
    const stats = await fs.stat(path.join(testReposDir, username, 'my-repo.git'));
    expect(stats.isDirectory()).toBe(true);
  });

  it('GET /api/repositories/:owner/:name returns repo metadata', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const auth = loginRes.json().accessToken;

    // Create repo
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/repositories',
      headers: { authorization: `Bearer ${auth}` },
      payload: { name: 'my-repo' },
    });
    if (createRes.statusCode !== 201) throw new Error(JSON.stringify(createRes.json()));

    const res = await app.inject({
      method: 'GET',
      url: `/api/repositories/${username}/my-repo`,
      headers: { authorization: `Bearer ${auth}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('my-repo');
  });

  it('DELETE /api/repositories/:owner/:name deletes a repo', async () => {
    const { username, rawPassword, id: ownerId } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const auth = loginRes.json().accessToken;

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/repositories',
      headers: { authorization: `Bearer ${auth}` },
      payload: { name: 'my-repo' },
    });
    if (createRes.statusCode !== 201) throw new Error(JSON.stringify(createRes.json()));

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/repositories/${username}/my-repo`,
      headers: { authorization: `Bearer ${auth}` },
    });

    expect(res.statusCode).toBe(204);

    const repoInDb = await db.repository.findUnique({
      where: { ownerId_name: { ownerId, name: 'my-repo' } },
    });
    expect(repoInDb).toBeNull();
  });
});
