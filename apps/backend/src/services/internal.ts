import bcrypt from 'bcrypt';
import { db } from '../lib/db.js';

export async function verifyGitAuth(username: string, token: string, originalUri: string) {
  const user = await db.user.findUnique({
    where: { username },
    include: { personalAccessTokens: true, repositories: true },
  });

  if (!user) {
    return false;
  }

  let validToken = false;
  let usedTokenId = null;

  for (const pat of user.personalAccessTokens) {
    if (pat.revokedAt) {
      continue;
    }
    const match = await bcrypt.compare(token, pat.tokenHash);
    if (match) {
      validToken = true;
      usedTokenId = pat.id;
      break;
    }
  }

  if (!validToken) {
    return false;
  }

  // Update last used at in background
  if (usedTokenId) {
    db.personalAccessToken.update({
      where: { id: usedTokenId },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});
  }

  // MVP: Extract repository name from URI `/<owner>/<repo>.git/...`
  const uriParts = originalUri.split('/').filter(Boolean);
  if (uriParts.length >= 2) {
    const owner = uriParts[0];

    const repoNameWithGit = uriParts[1];
    if (!repoNameWithGit) {
      return false; // Invalid URI
    }
    const repoName = repoNameWithGit.endsWith('.git') ? repoNameWithGit.slice(0, -4) : repoNameWithGit;

    // MVP: Must match owner username
    if (owner !== username) {
      return false; // Not owner
    }

    const repo = user.repositories.find((r) => r.name === repoName);
    if (!repo) {
      return false; // Repository does not exist
    }

    return true;
  }

  return false;
}
