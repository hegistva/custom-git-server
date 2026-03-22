import crypto from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it, beforeAll } from 'vitest';

const shouldRun = process.env.RUN_GIT_HTTP_INTEGRATION === 'true';
const describeIf = shouldRun ? describe : describe.skip;

interface IntegrationContext {
  username: string;
  repositoryName: string;
  pat: string;
}

interface InfoRefsResult {
  statusCode: number | null;
  exitCode: number | null;
  output: string;
}

const apiBaseUrl = process.env.GIT_HTTP_INTEGRATION_BASE_URL ?? 'https://localhost';
const repoRoot = path.resolve(__dirname, '../../../../');

function makeBasicAuth(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

async function createIntegrationContext(): Promise<IntegrationContext> {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const suffix = crypto.randomBytes(4).toString('hex');
  const username = `gitpat_${suffix}`;
  const password = 'Password123!';
  const repositoryName = `repo-${suffix}`;

  const registerRes = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username,
      email: `${username}@example.com`,
      password,
      confirmPassword: password,
    }),
  });

  if (!registerRes.ok) {
    throw new Error(`registration failed with status ${registerRes.status}`);
  }

  const loginRes = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!loginRes.ok) {
    throw new Error(`login failed with status ${loginRes.status}`);
  }

  const loginBody = (await loginRes.json()) as { accessToken: string };
  const accessToken = loginBody.accessToken;

  const repoRes = await fetch(`${apiBaseUrl}/api/repositories`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: repositoryName, description: 'integration', isPrivate: true }),
  });

  if (!repoRes.ok) {
    throw new Error(`repository creation failed with status ${repoRes.status}`);
  }

  const tokenRes = await fetch(`${apiBaseUrl}/api/tokens`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ label: 'integration-pat' }),
  });

  if (!tokenRes.ok) {
    throw new Error(`token creation failed with status ${tokenRes.status}`);
  }

  const tokenBody = (await tokenRes.json()) as { rawToken: string };

  return {
    username,
    repositoryName,
    pat: tokenBody.rawToken,
  };
}

function parseLastHttpStatus(output: string): number | null {
  const matches = [...output.matchAll(/HTTP\/\d\.\d\s+(\d{3})/g)];
  const last = matches.at(-1);
  if (!last) {
    return null;
  }
  return Number(last[1]);
}

function requestInfoRefs(ctx: IntegrationContext, authHeader?: string): InfoRefsResult {
  const url = `http://127.0.0.1/${ctx.username}/${ctx.repositoryName}.git/info/refs?service=git-upload-pack`;

  const args = ['compose', 'exec', '-T', 'git-server', 'wget', '-q', '-S', '-O', '/dev/null'];
  if (authHeader) {
    args.push('--header', `Authorization: ${authHeader}`);
  }
  args.push(url);

  const result = spawnSync('docker', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });

  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  return {
    statusCode: parseLastHttpStatus(output),
    exitCode: result.status,
    output,
  };
}

describeIf('git-server info/refs auth integration', () => {
  let ctx: IntegrationContext;

  beforeAll(async () => {
    ctx = await createIntegrationContext();
  });

  it('valid PAT returns 200 on info/refs', () => {
    const authHeader = makeBasicAuth(ctx.username, ctx.pat);
    const res = requestInfoRefs(ctx, authHeader);

    expect(res.exitCode, res.output).toBe(0);
    expect(res.statusCode, res.output).toBe(200);
  });

  it('invalid PAT returns 401 on info/refs', () => {
    const authHeader = makeBasicAuth(ctx.username, 'invalid-token');
    const res = requestInfoRefs(ctx, authHeader);

    expect(res.statusCode, res.output).toBe(401);
  });

  it('missing auth header returns 401 on info/refs', () => {
    const res = requestInfoRefs(ctx);

    expect(res.statusCode, res.output).toBe(401);
  });
});
