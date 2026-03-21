import type { PrismaClient } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { JwtPayload } from '../plugins/auth';

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
    generateAccessToken: (payload: JwtPayload) => string;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// Override @fastify/jwt's loose `user` typing with our known payload shape.
// @fastify/jwt declares `user: string | object | Buffer` — we narrow it here.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
