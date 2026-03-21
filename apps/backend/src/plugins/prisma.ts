import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { db } from '../lib/db';

async function prismaPlugin(app: FastifyInstance): Promise<void> {
  app.decorate('db', db);

  app.addHook('onClose', async () => {
    await app.db.$disconnect();
  });
}

export default fp(prismaPlugin, {
  name: 'prisma-plugin',
});
