import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import type { FastifyInstance } from 'fastify';

export async function registerCorePlugins(app: FastifyInstance): Promise<void> {
  await app.register(fastifySensible);
  await app.register(fastifyCors, { origin: true, credentials: true });
  await app.register(fastifyCookie);
  await app.register(fastifyHelmet);
}
