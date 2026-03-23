import { execSync } from 'child_process';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { createTestUser, truncateAuthTables } from '../fixtures/user.factory';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Extract a cookie value from a Fastify inject response set-cookie header */
function extractCookie(header: string | string[] | undefined, name: string): string | undefined {
  const raw = Array.isArray(header) ? header.join('\n') : (header ?? '');
  const match = raw.match(new RegExp(`(?:^|\\n)${name}=([^;]+)`));
  return match?.[1];
}

/** Format a cookie header string from name=value pairs */
function makeCookieHeader(name: string, value: string): string {
  return `${name}=${value}`;
}

// ─── Shared app instance ──────────────────────────────────────────────────────
// A single app is reused across all auth test suites to keep tests fast.
// Tables are truncated between each describe block's tests via afterEach.

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

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user and returns 201 with accessToken and user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'newuser', email: 'new@example.com', password: 'SecurePass1!' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{
      accessToken: string;
      user: { id: string; username: string; email: string };
    }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.username).toBe('newuser');
    expect(body.user.email).toBe('new@example.com');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('sets an httpOnly refresh_token cookie on register', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'cookietest', email: 'cookie@example.com', password: 'SecurePass1!' },
    });
    expect(res.statusCode).toBe(201);
    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie ?? '');
    expect(cookieStr).toMatch(/refresh_token=/);
    expect(cookieStr).toMatch(/HttpOnly/i);
  });

  it('returns 409 when username is already taken', async () => {
    await createTestUser({ username: 'duplicate', email: 'orig@example.com' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'duplicate', email: 'other@example.com', password: 'SecurePass1!' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json<{ field: string }>().field).toBe('username');
  });

  it('returns 409 when email is already taken', async () => {
    await createTestUser({ username: 'origuser', email: 'dupe@example.com' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'newuser2', email: 'dupe@example.com', password: 'SecurePass1!' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json<{ field: string }>().field).toBe('email');
  });

  it('returns 400 when username is too short', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'ab', email: 'short@example.com', password: 'SecurePass1!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'validname', email: 'valid@example.com', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { username: 'validname', email: 'not-an-email', password: 'SecurePass1!' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 200 with accessToken and user on valid credentials', async () => {
    const { username, rawPassword } = await createTestUser();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string; user: { username: string } }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.user.username).toBe(username);
  });

  it('sets a refresh_token httpOnly cookie on login', async () => {
    const { username, rawPassword } = await createTestUser();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie ?? '');
    expect(cookieStr).toMatch(/refresh_token=/);
    expect(cookieStr).toMatch(/HttpOnly/i);
  });

  it('returns 401 on wrong password', async () => {
    const { username } = await createTestUser();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: 'WrongPassword!' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 on unknown username', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'nobody', password: 'SomePass1!' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when body is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  async function loginAndGetRefreshCookie(username: string, password: string): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password },
    });
    if (res.statusCode !== 200) throw new Error(`Login failed: ${res.statusCode} ${res.body}`);
    const tokenValue = extractCookie(res.headers['set-cookie'], 'refresh_token');
    if (!tokenValue) throw new Error('No refresh_token cookie in login response');
    return makeCookieHeader('refresh_token', tokenValue);
  }

  it('returns 200 with new accessToken on valid refresh token', async () => {
    const { username, rawPassword } = await createTestUser();
    const cookieHeader = await loginAndGetRefreshCookie(username, rawPassword);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: cookieHeader },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(body.accessToken).toBeTruthy();
  });

  it('rotates the refresh_token cookie on successful refresh', async () => {
    const { username, rawPassword } = await createTestUser();
    const origCookieHeader = await loginAndGetRefreshCookie(username, rawPassword);
    const origTokenValue = extractCookie(origCookieHeader, 'refresh_token');

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: origCookieHeader },
    });
    expect(res.statusCode).toBe(200);
    const newTokenValue = extractCookie(res.headers['set-cookie'], 'refresh_token');
    expect(newTokenValue).toBeTruthy();
    expect(newTokenValue).not.toBe(origTokenValue);
  });

  it('returns 401 when no refresh_token cookie is present', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when refresh_token is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: 'refresh_token=invalidtoken' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when a previously-rotated token is reused (revoked)', async () => {
    const { username, rawPassword } = await createTestUser();
    const origCookieHeader = await loginAndGetRefreshCookie(username, rawPassword);

    // First refresh (valid)
    await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: origCookieHeader },
    });

    // Reuse old token — should now be revoked
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: origCookieHeader },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  async function loginFull(
    username: string,
    password: string,
  ): Promise<{ accessToken: string; cookieHeader: string }> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password },
    });
    if (res.statusCode !== 200) throw new Error(`Login failed: ${res.statusCode} ${res.body}`);
    const body = res.json<{ accessToken: string }>();
    const tokenValue = extractCookie(res.headers['set-cookie'], 'refresh_token') ?? '';
    return {
      accessToken: body.accessToken,
      cookieHeader: makeCookieHeader('refresh_token', tokenValue),
    };
  }

  it('returns 204 and clears refresh_token cookie on logout', async () => {
    const { username, rawPassword } = await createTestUser();
    const { accessToken, cookieHeader } = await loginFull(username, rawPassword);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: cookieHeader,
      },
    });
    expect(res.statusCode).toBe(204);
  });

  it('returns 401 without a valid JWT', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });
    expect(res.statusCode).toBe(401);
  });

  it('after logout the old refresh token is revoked and refresh returns 401', async () => {
    const { username, rawPassword } = await createTestUser();
    const { accessToken, cookieHeader } = await loginFull(username, rawPassword);

    await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { authorization: `Bearer ${accessToken}`, cookie: cookieHeader },
    });

    // Refresh with old token — should fail
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: cookieHeader },
    });
    expect(refreshRes.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns 200 with current user info when authenticated', async () => {
    const { username, rawPassword, email } = await createTestUser();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username, password: rawPassword },
    });
    expect(loginRes.statusCode).toBe(200);
    const { accessToken } = loginRes.json<{ accessToken: string }>();

    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: string; username: string; email: string }>();
    expect(body.username).toBe(username);
    expect(body.email).toBe(email);
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('returns 401 when no JWT is provided', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when JWT is invalid', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer thisisinvalid' },
    });
    expect(res.statusCode).toBe(401);
  });
});
