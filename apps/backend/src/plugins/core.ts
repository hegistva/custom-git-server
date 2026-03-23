import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fp from 'fastify-plugin';
import type { FastifyError, FastifyInstance } from 'fastify';
import { env } from '../lib/env';

async function corePlugins(app: FastifyInstance): Promise<void> {
  await app.register(fastifySensible);
  await app.register(fastifyCors, { origin: true, credentials: true });
  await app.register(fastifyCookie);
  await app.register(fastifyHelmet);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Unexpected server error');
    }

    const message =
      statusCode >= 500 && env.nodeEnv === 'production' ? 'Internal server error' : error.message;

    return reply.code(statusCode).send({ message });
  });
}

// fp() makes decorations from child plugins escape to the parent scope
export const registerCorePlugins = fp(corePlugins, { name: 'core-plugins' });
