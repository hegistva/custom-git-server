import type { FastifyPluginAsync } from 'fastify';
import authRoutes from './auth';
import internalRoutes from './internal';
import repositoriesRoutes from './repositories';
import sshKeysRoutes from './ssh-keys';
import tokensRoutes from './tokens';

const routes: FastifyPluginAsync = async (app) => {
  await app.register(internalRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(sshKeysRoutes, { prefix: '/api/ssh-keys' });
  await app.register(tokensRoutes, { prefix: '/api/tokens' });
  await app.register(repositoriesRoutes, { prefix: '/api/repositories' });
};

export default routes;
