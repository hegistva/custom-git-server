import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import {
  SshKeyDuplicateError,
  SshKeyNotFoundError,
  SshKeyServiceError,
  addSshKey,
  deleteSshKey,
  getUserSshKeys,
} from '../../services/ssh-keys.js';

const sshKeysPlugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate);

  const SshKeyResponseSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    label: Type.String(),
    fingerprint: Type.String(),
    createdAt: Type.String({ format: 'date-time' }),
  });

  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: Type.Array(SshKeyResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const keys = await getUserSshKeys(request.user.sub);
      return keys.map((k) => ({
        ...k,
        createdAt: k.createdAt.toISOString(),
      }));
    },
  });

  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      body: Type.Object({
        label: Type.String({ minLength: 1, maxLength: 50 }),
        publicKey: Type.String({ minLength: 10, maxLength: 2000 }),
      }),
      response: {
        201: SshKeyResponseSchema,
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        409: Type.Object({ error: Type.String(), message: Type.String() }),
      },
    },
    handler: async (request, reply) => {
      const { label, publicKey } = request.body;

      try {
        const key = await addSshKey(request.user.sub, label, publicKey);
        return reply.status(201).send({
          ...key,
          createdAt: key.createdAt.toISOString(),
        });
      } catch (err: any) {
        if (err instanceof SshKeyDuplicateError) {
          throw fastify.httpErrors.conflict(err.message);
        }
        if (err instanceof SshKeyServiceError) {
          throw fastify.httpErrors.badRequest(err.message);
        }
        throw err;
      }
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
        await deleteSshKey(request.user.sub, id);
        return reply.status(204).send(null);
      } catch (err: any) {
        if (err instanceof SshKeyNotFoundError) {
          throw fastify.httpErrors.notFound(err.message);
        }
        throw err;
      }
    },
  });
};

export default sshKeysPlugin;
