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
      },
    },
    handler: async () => ({ status: 'ok' as const, service: 'backend' }),
  });
};

export default internalRoutes;
