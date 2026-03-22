import { db } from '../lib/db';
import { getRepoDiskPath, isValidRepoName } from '../lib/repo';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';

const execAsync = promisify(exec);

export class RepositoryNotFoundError extends Error {
  constructor(message = 'Repository not found') {
    super(message);
    this.name = 'RepositoryNotFoundError';
  }
}

export class DuplicateRepositoryError extends Error {
  constructor(message = 'Repository already exists') {
    super(message);
    this.name = 'DuplicateRepositoryError';
  }
}

export class RepositoryAccessDeniedError extends Error {
  constructor(message = 'Repository access denied') {
    super(message);
    this.name = 'RepositoryAccessDeniedError';
  }
}

export class InvalidRepositoryNameError extends Error {
  constructor(message = 'Invalid repository name format') {
    super(message);
    this.name = 'InvalidRepositoryNameError';
  }
}

export async function listRepositories(ownerId: string) {
  return db.repository.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRepository(options: {
  ownerId: string;
  ownerUsername: string;
  name: string;
  description?: string | null;
  isPrivate?: boolean;
}) {
  const { ownerId, ownerUsername, name, description, isPrivate = true } = options;

  if (!isValidRepoName(ownerUsername) || !isValidRepoName(name)) {
    throw new InvalidRepositoryNameError();
  }

  const diskPath = getRepoDiskPath(ownerUsername, name);

  // Check if DB already has it
  const existing = await db.repository.findUnique({
    where: {
      ownerId_name: { ownerId, name },
    },
  });

  if (existing) {
    throw new DuplicateRepositoryError();
  }

  // Check if dir already exists
  try {
    const stats = await fs.stat(diskPath);
    if (stats.isDirectory()) {
      throw new DuplicateRepositoryError('Repository directory already exists on disk');
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    // ENOENT means it doesn't exist, which is what we want
  }

  // Create repository record in DB
  const repo = await db.repository.create({
    data: {
      ownerId,
      name,
      description: description ?? null,
      isPrivate,
      diskPath,
    },
  });

  try {
    await fs.mkdir(diskPath, { recursive: true });
    try {
      await execAsync('git init --bare', { cwd: diskPath });
    } catch (gitErr) {
      console.warn(`Could not run git init --bare in ${diskPath}`, gitErr);
    }
  } catch (err) {
    // If disk creation fails, rollback DB
    await db.repository.delete({ where: { id: repo.id } });
    throw err;
  }

  return repo;
}

export async function getRepository(ownerUsername: string, name: string, requesterUserId?: string) {
  const owner = await db.user.findUnique({ where: { username: ownerUsername } });
  if (!owner) {
    throw new RepositoryNotFoundError();
  }

  const repo = await db.repository.findUnique({
    where: {
      ownerId_name: { ownerId: owner.id, name },
    },
    include: { owner: true }
  });

  if (!repo) {
    throw new RepositoryNotFoundError();
  }

  if (repo.isPrivate) {
    if (!requesterUserId || repo.ownerId !== requesterUserId) {
      throw new RepositoryAccessDeniedError();
    }
  }

  return repo;
}

export async function deleteRepository(ownerId: string, name: string) {
  const repo = await db.repository.findUnique({
    where: { ownerId_name: { ownerId, name } },
    include: { owner: true }
  });

  if (!repo) {
    throw new RepositoryNotFoundError();
  }

  if (repo.ownerId !== ownerId) {
    throw new RepositoryAccessDeniedError();
  }

  const diskPath = repo.diskPath;

  await db.repository.delete({
    where: { id: repo.id },
  });

  // delete dir from disk
  try {
    await fs.rm(diskPath, { recursive: true, force: true });
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to delete repository directory on disk:', diskPath, err);
      // We don't throw to not break the API just because of disk cleanup failure
    }
  }
}
