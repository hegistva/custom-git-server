import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { db } from '../lib/db.js';
import { env } from '../lib/env.js';

export class TokenServiceError extends Error {}
export class TokenNotFoundError extends TokenServiceError {}

export async function getUserTokens(userId: string) {
  return await db.personalAccessToken.findMany({
    where: { userId },
    select: {
      id: true,
      label: true,
      tokenPrefix: true,
      expiresAt: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createToken(userId: string, label: string) {
  // Generate 32-byte crypto-random token equivalent to 43 chars in base64
  const rawToken = crypto.randomBytes(32).toString('base64url');

  // Hash the token using bcrypt
  const hash = await bcrypt.hash(rawToken, env.bcryptCost);

  // Extract a 8-character prefix for display
  const tokenPrefix = rawToken.slice(0, 8);

  const token = await db.personalAccessToken.create({
    data: {
      userId,
      label,
      tokenHash: hash,
      tokenPrefix,
      // MVP: no expiry for now
    },
  });

  return {
    tokenInfo: {
      id: token.id,
      label: token.label,
      tokenPrefix: token.tokenPrefix,
      expiresAt: token.expiresAt,
      lastUsedAt: token.lastUsedAt,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
    },
    rawToken, // Only returned once!
  };
}

export async function revokeToken(userId: string, tokenId: string) {
  const token = await db.personalAccessToken.findUnique({
    where: { id: tokenId },
  });

  if (!token || token.userId !== userId) {
    throw new TokenNotFoundError('Token not found');
  }

  if (token.revokedAt) {
    return; // Already revoked
  }

  await db.personalAccessToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}
