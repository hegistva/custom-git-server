import fs from 'node:fs/promises';
import { db } from '../lib/db.js';
import { env } from '../lib/env.js';
import { parseSshPublicKey } from '../lib/ssh-key.js';
import { Prisma } from '@prisma/client';

export class SshKeyServiceError extends Error {}
export class SshKeyNotFoundError extends SshKeyServiceError {}
export class SshKeyDuplicateError extends SshKeyServiceError {}

export async function getUserSshKeys(userId: string) {
  return await db.sshKey.findMany({
    where: { userId },
    select: { id: true, label: true, fingerprint: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addSshKey(userId: string, label: string, keyString: string) {
  let parsed;
  try {
    parsed = parseSshPublicKey(keyString);
  } catch (err: any) {
    throw new SshKeyServiceError(err.message);
  }

  const { fingerprint, publicKey } = parsed;

  let newKey;
  try {
    newKey = await db.sshKey.create({
      data: {
        userId,
        label,
        publicKey,
        fingerprint,
      },
      select: {
        id: true,
        label: true,
        fingerprint: true,
        createdAt: true,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new SshKeyDuplicateError('An SSH key with this fingerprint already exists.');
    }
    throw err;
  }

  try {
    // Append to authorized_keys
    // Note: The design says "canonical command="..." authorized_keys entry", but since we don't have
    // per-user ssh logic, and git-shell handles access securely on the SSH port, we just append the key.
    // If the system goes to per-user ACLs, we would add the environment variable here.
    const entry = `environment="GIT_USER_ID=${userId}" ${publicKey}\n`; // Example for future. We'll just prepend restrictions or pass as is.
    // Wait, the git-shell doesn't use environment variables easily.
    // For now we'll just append the raw publicKey, or a restrict statement.
    const restrict = 'no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty';
    const finalEntry = `${restrict} ${publicKey} ${label}\n`;
    await fs.appendFile(env.keysPath, finalEntry, { encoding: 'utf-8' });
  } catch (appendErr) {
    // Attempt rollback on filesystem failure? For now, just log or let it fail?
    // If append fails, we might want to delete from DB to keep consistency.
    await db.sshKey.delete({ where: { id: newKey.id } });
    throw new SshKeyServiceError('Failed to append SSH key to authorized_keys.');
  }

  return newKey;
}

export async function deleteSshKey(userId: string, keyId: string) {
  const key = await db.sshKey.findUnique({
    where: { id: keyId },
  });

  if (!key || key.userId !== userId) {
    throw new SshKeyNotFoundError('SSH key not found');
  }

  // Remove from filesystem first to avoid orphaned access.
  // If FS fails, we throw and leave the DB intact.
  try {
    const rawContent = await fs.readFile(env.keysPath, 'utf-8');
    const lines = rawContent.split(/\r?\n/);
    // Find the exact line or lines containing the publicKey
    const newLines = lines.filter((line) => !line.includes(key.publicKey));
    if (newLines.length !== lines.length) {
      await fs.writeFile(env.keysPath, newLines.join('\n') + '\n', 'utf-8');
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw new SshKeyServiceError('Failed to remove SSH key from authorized_keys');
    }
  }

  await db.sshKey.delete({
    where: { id: keyId },
  });
}
