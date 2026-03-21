import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../lib/env';

export interface JwtPayload {
  sub: string;
  username: string;
}

async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.jwtSecret,
    sign: { expiresIn: '15m', algorithm: 'HS256' },
  });

  /** Decorate with a helper to generate a short-lived access token */
  app.decorate('generateAccessToken', (payload: JwtPayload): string => {
    return app.jwt.sign({ sub: payload.sub, username: payload.username });
  });

  /** preHandler hook for protected routes */
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify<JwtPayload>();
      } catch {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
    },
  );
}

export default fp(authPlugin, { name: 'auth-plugin', dependencies: ['prisma-plugin'] });
