import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsync } from 'fastify';

const HealthResponseSchema = Type.Object({
  status: Type.Literal('ok'),
  service: Type.String(),
});

const internalRoutes: FastifyPluginAsync = async (app) => {
  app.get('/internal/health', {
    schema: {
      response: {
        200: HealthResponseSchema,
      },
    },
    handler: async () => ({ status: 'ok' as const, service: 'backend' }),
  });

  app.get('/internal/ready', {
    schema: {
      response: {
        200: HealthResponseSchema,
        503: Type.Object({ status: Type.Literal('error'), message: Type.String() }),
      },
    },
    handler: async (request, reply) => {
      try {
        await app.db.$queryRaw`SELECT 1`;
        return { status: 'ok' as const, service: 'backend' };
      } catch (err) {
        request.log.error({ err }, 'Readiness check: database not reachable');
        return reply
          .code(503)
          .send({ status: 'error' as const, message: 'database not reachable' });
      }
    },
  });

  app.get('/internal/git-auth', {
    handler: async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Basic ')) {
        return reply.code(401).send();
      }

      let decoded;
      try {
        decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
      } catch {
        return reply.code(401).send();
      }

      const [username, token] = decoded.split(':');
      if (!username || !token) {
        return reply.code(401).send();
      }

      // X-Original-URI from nginx auth_request or use raw URL for tests
      const originalUri = (request.headers['x-original-uri'] as string | undefined) || request.url;

      const { verifyGitAuth } = await import('../../services/internal.js');
      const valid = await verifyGitAuth(username, token, originalUri);

      if (!valid) {
        return reply.code(401).send();
      }

      return reply.code(200).header('X-Auth-Username', username).send();
    },
  });
};

export default internalRoutes;
