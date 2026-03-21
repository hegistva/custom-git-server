import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './lib/env';
import { registerCorePlugins } from './plugins/core';
import prismaPlugin from './plugins/prisma';
import routes from './routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.nodeEnv === 'development',
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(registerCorePlugins);
  await app.register(prismaPlugin);
  await app.register(routes);

  return app;
}
