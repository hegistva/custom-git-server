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
        return reply.code(503).send({ status: 'error' as const, message: 'database not reachable' });
      }
    },
  });
};

export default internalRoutes;
