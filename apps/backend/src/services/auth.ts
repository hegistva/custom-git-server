import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { env } from '../lib/env';
import { db } from '../lib/db';

// ─── Domain errors ────────────────────────────────────────────────────────────

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password');
  }
}

export class UserConflictError extends Error {
  constructor(public readonly field: 'username' | 'email') {
    super(`${field} already in use`);
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a cryptographically random 32-byte hex token */
function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Hash a raw token with SHA-256 (for refresh tokens) */
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Register a new user account.
 * Throws UserConflictError if username or email is already taken.
 */
export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const passwordHash = await bcrypt.hash(input.password, env.bcryptCost);

  try {
    const user = await db.user.create({
      data: {
        username: input.username.toLowerCase(),
        email: input.email.toLowerCase(),
        passwordHash,
      },
      select: { id: true, username: true, email: true },
    });

    return user;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: unknown }).code === 'P2002' &&
      'meta' in err
    ) {
      const meta = (err as { meta: unknown }).meta;
      const target: unknown[] =
        typeof meta === 'object' && meta !== null && 'target' in meta
          ? ((meta as { target: unknown }).target as unknown[])
          : [];
      const fields = target.map((t) => String(t));
      if (fields.some((f) => f.includes('username'))) throw new UserConflictError('username');
      if (fields.some((f) => f.includes('email'))) throw new UserConflictError('email');
      throw new UserConflictError('username');
    }
    throw err;
  }
}

/**
 * Attempt login with username/password.
 * Returns AuthUser on success; throws InvalidCredentialsError otherwise.
 */
export async function loginUser(username: string, password: string): Promise<AuthUser> {
  const user = await db.user.findFirst({
    where: { username: username.toLowerCase(), deletedAt: null },
    select: { id: true, username: true, email: true, passwordHash: true },
  });

  if (!user) throw new InvalidCredentialsError();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  return { id: user.id, username: user.username, email: user.email };
}

/**
 * Create a refresh token record in the DB and return the raw token string.
 */
export async function createRefreshToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  const hash = hashToken(raw);

  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return raw;
}

/**
 * Validate a raw refresh token, rotate it (revoke old, issue new).
 * Returns the new raw refresh token and the user info.
 * Throws InvalidRefreshTokenError if token is invalid, expired, or revoked.
 */
export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ newRawToken: string; user: AuthUser }> {
  const hash = hashToken(rawToken);

  const stored = await db.refreshToken.findFirst({
    where: {
      tokenHash: hash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userId: true,
      user: { select: { id: true, username: true, email: true, deletedAt: true } },
    },
  });

  if (!stored || stored.user.deletedAt !== null) {
    throw new InvalidRefreshTokenError();
  }

  // Revoke old token and issue new one atomically
  const newRaw = generateRawToken();
  const newHash = hashToken(newRaw);

  await db.$transaction([
    db.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    db.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    }),
  ]);

  return {
    newRawToken: newRaw,
    user: {
      id: stored.user.id,
      username: stored.user.username,
      email: stored.user.email,
    },
  };
}

/**
 * Revoke a specific refresh token (logout).
 * Silently ignores tokens that don't exist or are already revoked.
 */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const hash = hashToken(rawToken);

  await db.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Get the current user by ID.
 * Returns null if not found or soft-deleted.
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await db.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, username: true, email: true },
  });

  return user ?? null;
}
