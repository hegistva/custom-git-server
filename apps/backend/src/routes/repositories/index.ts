import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  createRepository,
  deleteRepository,
  getRepository,
  listRepositories,
  DuplicateRepositoryError,
  InvalidRepositoryNameError,
  RepositoryAccessDeniedError,
  RepositoryNotFoundError,
} from '../../services/repositories';

const RepoOwnerSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  username: Type.String(),
});

const RepositorySchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  isPrivate: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  owner: Type.Optional(RepoOwnerSchema),
});

const repositoriesRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get(
    '/',
    {
      schema: {
        response: {
          200: Type.Array(RepositorySchema),
        },
      },
    },
    async (request) => {
      const repos = await listRepositories(request.user!.sub);
      return repos.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }));
    },
  );

  app.post(
    '/',
    {
      schema: {
        body: Type.Object({
          name: Type.String({ minLength: 1, maxLength: 100 }),
          description: Type.Optional(Type.String()),
          isPrivate: Type.Optional(Type.Boolean()),
        }),
        response: {
          201: RepositorySchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const repo = await createRepository({
          ownerId: request.user!.sub,
          ownerUsername: request.user!.username,
          name: request.body.name,
          description: request.body.description ?? null,
          isPrivate: request.body.isPrivate ?? true,
        });

        return reply.status(201).send({
          ...repo,
          createdAt: repo.createdAt.toISOString(),
        });
      } catch (error) {
        if (error instanceof InvalidRepositoryNameError) {
          throw app.httpErrors.badRequest(error.message);
        }
        if (error instanceof DuplicateRepositoryError) {
          throw app.httpErrors.conflict(error.message);
        }
        throw error;
      }
    },
  );

  app.get(
    '/:owner/:name',
    {
      schema: {
        params: Type.Object({
          owner: Type.String(),
          name: Type.String(),
        }),
        response: {
          200: RepositorySchema,
        },
      },
    },
    async (request) => {
      try {
        const repo = await getRepository(request.params.owner, request.params.name, request.user!.sub);
        return {
          ...repo,
          createdAt: repo.createdAt.toISOString(),
          owner: {
            id: repo.owner.id,
            username: repo.owner.username,
          }
        };
      } catch (error) {
        if (error instanceof RepositoryNotFoundError) {
          throw app.httpErrors.notFound(error.message);
        }
        if (error instanceof RepositoryAccessDeniedError) {
          throw app.httpErrors.forbidden(error.message);
        }
        throw error;
      }
    },
  );

  app.delete(
    '/:owner/:name',
    {
      schema: {
        params: Type.Object({
          owner: Type.String(),
          name: Type.String(),
        }),
        response: {
          204: Type.Null(),
        },
      },
    },
    async (request, reply) => {
      if (request.params.owner !== request.user!.username) {
        throw app.httpErrors.forbidden('Cannot delete repository of another user');
      }

      try {
        await deleteRepository(request.user!.sub, request.params.name);
        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof RepositoryNotFoundError) {
          throw app.httpErrors.notFound(error.message);
        }
        if (error instanceof RepositoryAccessDeniedError) {
          throw app.httpErrors.forbidden(error.message);
        }
        throw error;
      }
    },
  );
};

export default repositoriesRoutes;
