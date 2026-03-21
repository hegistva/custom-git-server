import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { env } from '../../lib/env';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  UserConflictError,
  createRefreshToken,
  getUserById,
  loginUser,
  registerUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../../services/auth';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RegisterBodySchema = Type.Object({
  username: Type.String({ minLength: 3, maxLength: 39, pattern: '^[a-zA-Z0-9_-]+$' }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
});

const LoginBodySchema = Type.Object({
  username: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
});

const UserResponseSchema = Type.Object({
  id: Type.String(),
  username: Type.String(),
  email: Type.String(),
});

const AuthResponseSchema = Type.Object({
  accessToken: Type.String(),
  user: UserResponseSchema,
});

const RefreshResponseSchema = Type.Object({
  accessToken: Type.String(),
});

const ErrorSchema = Type.Object({ message: Type.String() });
const ConflictErrorSchema = Type.Object({ message: Type.String(), field: Type.String() });

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: true,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60,
};

// ─── Route plugin ─────────────────────────────────────────────────────────────

const authRoutes: FastifyPluginAsync = async (app) => {
  // Rate-limit the entire /api/auth/* scope (disabled in test environment)
  if (env.nodeEnv !== 'test') {
    await app.register(rateLimit, {
      max: 20,
      timeWindow: '1 minute',
      keyGenerator: (req) => req.ip,
      errorResponseBuilder: () => ({
        message: 'Too many requests, please try again later.',
      }),
    });
  }

  // ── POST /api/auth/register ────────────────────────────────────────────────
  app.post(
    '/register',
    {
      schema: {
        body: RegisterBodySchema,
        response: {
          201: AuthResponseSchema,
          400: ErrorSchema,
          409: ConflictErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { username, email, password } = request.body as {
        username: string;
        email: string;
        password: string;
      };

      try {
        const user = await registerUser({ username, email, password });
        const accessToken = app.generateAccessToken({ sub: user.id, username: user.username });
        const rawRefresh = await createRefreshToken(user.id);

        reply.setCookie(REFRESH_COOKIE, rawRefresh, COOKIE_OPTIONS).code(201);
        return { accessToken, user };
      } catch (err) {
        if (err instanceof UserConflictError) {
          return reply.code(409).send({ message: err.message, field: err.field });
        }
        throw err;
      }
    },
  );

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  app.post(
    '/login',
    {
      schema: {
        body: LoginBodySchema,
        response: {
          200: AuthResponseSchema,
          401: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { username, password } = request.body as { username: string; password: string };

      try {
        const user = await loginUser(username, password);
        const accessToken = app.generateAccessToken({ sub: user.id, username: user.username });
        const rawRefresh = await createRefreshToken(user.id);

        reply.setCookie(REFRESH_COOKIE, rawRefresh, COOKIE_OPTIONS);
        return { accessToken, user };
      } catch (err) {
        if (err instanceof InvalidCredentialsError) {
          return reply.code(401).send({ message: 'Invalid username or password' });
        }
        throw err;
      }
    },
  );

  // ── POST /api/auth/refresh ─────────────────────────────────────────────────
  app.post(
    '/refresh',
    {
      schema: {
        response: {
          200: RefreshResponseSchema,
          401: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const rawToken = request.cookies[REFRESH_COOKIE];

      if (!rawToken) {
        return reply.code(401).send({ message: 'Missing refresh token' });
      }

      try {
        const { newRawToken, user } = await rotateRefreshToken(rawToken);
        const accessToken = app.generateAccessToken({ sub: user.id, username: user.username });

        reply.setCookie(REFRESH_COOKIE, newRawToken, COOKIE_OPTIONS);
        return { accessToken };
      } catch (err) {
        if (err instanceof InvalidRefreshTokenError) {
          reply.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
          return reply.code(401).send({ message: 'Invalid or expired session' });
        }
        throw err;
      }
    },
  );

  // ── POST /api/auth/logout ──────────────────────────────────────────────────
  app.post(
    '/logout',
    {
      onRequest: [app.authenticate],
      schema: {
        response: {
          204: Type.Null(),
          401: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const rawToken = request.cookies[REFRESH_COOKIE];

      if (rawToken) {
        await revokeRefreshToken(rawToken);
      }

      reply.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      return reply.code(204).send();
    },
  );

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  app.get(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        response: {
          200: UserResponseSchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await getUserById(request.user.sub);

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return user;
    },
  );
};

export default authRoutes;
