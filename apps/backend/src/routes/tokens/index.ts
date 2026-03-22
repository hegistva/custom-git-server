import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  TokenNotFoundError,
  createToken,
  getUserTokens,
  revokeToken,
} from '../../services/tokens.js';

const tokensPlugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate);

  const TokenResponseSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    label: Type.String(),
    tokenPrefix: Type.String(),
    expiresAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    lastUsedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    revokedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
  });

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: Type.Array(TokenResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const tokens = await getUserTokens(request.user.sub);
      return tokens.map((t) => ({
        ...t,
        expiresAt: t.expiresAt?.toISOString() ?? null,
        lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
        revokedAt: t.revokedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      }));
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      body: Type.Object({
        label: Type.String({ minLength: 1, maxLength: 50 }),
      }),
      response: {
        201: Type.Object({
          token: TokenResponseSchema,
          rawToken: Type.String(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { label } = request.body;
      const { tokenInfo, rawToken } = await createToken(request.user.sub, label);

      return reply.status(201).send({
        token: {
          ...tokenInfo,
          expiresAt: tokenInfo.expiresAt?.toISOString() ?? null,
          lastUsedAt: tokenInfo.lastUsedAt?.toISOString() ?? null,
          revokedAt: tokenInfo.revokedAt?.toISOString() ?? null,
          createdAt: tokenInfo.createdAt.toISOString(),
        },
        rawToken,
      });
    },
  });

  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      try {
        await revokeToken(request.user.sub, id);
        return reply.status(204).send(null);
      } catch (err: any) {
        if (err instanceof TokenNotFoundError) {
          throw fastify.httpErrors.notFound(err.message);
        }
        throw err;
      }
    },
  });
};

export default tokensPlugin;
