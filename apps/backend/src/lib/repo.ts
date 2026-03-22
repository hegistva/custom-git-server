import path from 'node:path';
import { env } from './env';

export const REPO_NAME_REGEX = /^[a-zA-Z0-9.\-_]+$/;

export function isValidRepoName(name: string): boolean {
  return name.length >= 1 && name.length <= 100 && REPO_NAME_REGEX.test(name);
}

export function getRepoDiskPath(ownerName: string, repoName: string): string {
  if (!isValidRepoName(ownerName) || !isValidRepoName(repoName)) {
    throw new Error('Invalid repository or owner name format');
  }

  const reposRoot = path.resolve(env.reposPath);
  // Expected to be something like: /git-repos/owner/repo.git
  const targetPath = path.resolve(reposRoot, ownerName, `${repoName}.git`);

  if (!targetPath.startsWith(reposRoot + path.sep)) {
    throw new Error('Path traversal detected');
  }

  return targetPath;
}
