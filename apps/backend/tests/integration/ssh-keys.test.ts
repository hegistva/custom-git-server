import { execSync } from 'child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { createTestUser, truncateAuthTables } from '../fixtures/user.factory';
import { env } from '../../src/lib/env';

let app: FastifyInstance;
let tempKeysPath: string;

beforeAll(async () => {
  execSync('pnpm prisma migrate deploy', {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: 'pipe',
  });

  tempKeysPath = path.join(process.cwd(), 'temp-authorized-keys.txt');
  env.keysPath = tempKeysPath;

  app = await buildApp();
  await app.ready();
});

beforeEach(async () => {
  await fs.writeFile(tempKeysPath, '', 'utf-8');
});

afterEach(async () => {
  await truncateAuthTables();
  try {
    await fs.unlink(tempKeysPath);
  } catch {}
});

afterAll(async () => {
  await app.close();
});

const validKey =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGo2v2d+lH2mR1mG5F/H5z6N8F4b5W5C9+0T0g/O+H/T test@example.com';

describe('GET /api/ssh-keys', () => {
  it('returns an empty list when user has no keys', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const { accessToken } = loginRes.json();

    const res = await app.inject({
      method: 'GET',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns populated list when user has keys', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const { accessToken } = loginRes.json();

    await app.inject({
      method: 'POST',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { label: 'My Key', publicKey: validKey },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBe(1);
    expect(body[0].label).toBe('My Key');
    expect(body[0]).toHaveProperty('fingerprint');
  });
});

describe('POST /api/ssh-keys', () => {
  it('adds a key successfully', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const { accessToken } = loginRes.json();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { label: 'Laptop', publicKey: validKey },
    });

    expect(res.statusCode).toBe(201);
    const fileContent = await fs.readFile(tempKeysPath, 'utf-8');
    expect(fileContent).toContain('ssh-ed25519');
    expect(fileContent).toContain('Laptop');
  });

  it('returns 400 for invalid key format', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const { accessToken } = loginRes.json();

    const res = await app.inject({
      method: 'POST',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { label: 'Invalid', publicKey: 'ssh-foo not-base-64' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 409 for duplicate fingerprint', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const { accessToken } = loginRes.json();

    await app.inject({
      method: 'POST',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { label: 'Laptop', publicKey: validKey },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { label: 'Laptop 2', publicKey: validKey },
    });

    expect(res.statusCode).toBe(409);
  });
});

describe('DELETE /api/ssh-keys/:id', () => {
  it('deletes a key successfully and removes from file', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const { accessToken } = loginRes.json();

    const addRes = await app.inject({
      method: 'POST',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { label: 'To Delete', publicKey: validKey },
    });
    const keyId = addRes.json().id;

    let fileContent = await fs.readFile(tempKeysPath, 'utf-8');
    expect(fileContent).toContain('ssh-ed25519');

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/ssh-keys/${keyId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(204);
    fileContent = await fs.readFile(tempKeysPath, 'utf-8');
    expect(fileContent).not.toContain('ssh-ed25519');
  });

  it('returns 404 if key not found', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const { accessToken } = loginRes.json();

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/ssh-keys/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for wrong owner', async () => {
    const user1 = await createTestUser();
    const loginRes1 = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: user1.username, password: user1.rawPassword },
    });
    const token1 = loginRes1.json().accessToken;

    const addRes = await app.inject({
      method: 'POST',
      url: '/api/ssh-keys',
      headers: { authorization: `Bearer ${token1}` },
      payload: { label: 'Key', publicKey: validKey },
    });
    const keyId = addRes.json().id;

    const user2 = await createTestUser();
    const loginRes2 = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: user2.username, password: user2.rawPassword },
    });
    const token2 = loginRes2.json().accessToken;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/ssh-keys/${keyId}`,
      headers: { authorization: `Bearer ${token2}` },
    });

    expect(res.statusCode).toBe(404);
  });
});
