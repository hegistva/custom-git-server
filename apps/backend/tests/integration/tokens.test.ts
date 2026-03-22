import { execSync } from 'child_process';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { createTestUser, truncateAuthTables } from '../fixtures/user.factory';

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

describe('GET /api/tokens', () => {
  it('returns empty list for no tokens', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: rawPassword } });
    const token = loginRes.json().accessToken;

    const res = await app.inject({
      method: 'GET',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('returns populated list', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: rawPassword } });
    const token = loginRes.json().accessToken;

    await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${token}` },
      payload: { label: 'My token' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().length).toBe(1);
    expect(res.json()[0].label).toBe('My token');
  });
});

describe('POST /api/tokens', () => {
  it('returns 201 with raw token', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: rawPassword } });
    const token = loginRes.json().accessToken;

    const res = await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${token}` },
      payload: { label: 'My Token' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().rawToken).toBeTruthy();
    expect(res.json().token.label).toBe('My Token');
  });

  it('requires label', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: rawPassword } });
    const token = loginRes.json().accessToken;

    const res = await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${token}` },
      payload: {}, // Missing label
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/tokens/:id', () => {
  it('deletes token successfully (sets revokedAt)', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: rawPassword } });
    const auth = loginRes.json().accessToken;

    const addRes = await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${auth}` },
      payload: { label: 'To Delete' },
    });
    const tokenId = addRes.json().token.id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/tokens/${tokenId}`,
      headers: { authorization: `Bearer ${auth}` },
    });
    expect(res.statusCode).toBe(204);

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${auth}` },
    });
    expect(getRes.json()[0].revokedAt).not.toBeNull();
  });

  it('returns 404 for not found', async () => {
    const { username, rawPassword } = await createTestUser();
    const loginRes = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username, password: rawPassword } });
    const auth = loginRes.json().accessToken;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/tokens/00000000-0000-0000-0000-000000000000`,
      headers: { authorization: `Bearer ${auth}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for wrong owner', async () => {
    const u1 = await createTestUser();
    const l1 = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: u1.username, password: u1.rawPassword } });
    
    const addRes = await app.inject({
      method: 'POST',
      url: '/api/tokens',
      headers: { authorization: `Bearer ${l1.json().accessToken}` },
      payload: { label: 'T1' },
    });
    const tId = addRes.json().token.id;
    
    const u2 = await createTestUser();
    const l2 = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: u2.username, password: u2.rawPassword } });
    
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/tokens/${tId}`,
      headers: { authorization: `Bearer ${l2.json().accessToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
