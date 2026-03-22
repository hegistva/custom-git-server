import crypto from 'node:crypto';

export interface ParsedSshKey {
  type: string;
  fingerprint: string;
  publicKey: string;
}

export function parseSshPublicKey(keyString: string): ParsedSshKey {
  const parts = keyString.trim().split(/\s+/);
  if (parts.length < 2) {
    throw new Error('Invalid SSH public key format');
  }

  const type = parts[0] as string;
  const b64 = parts[1] as string;

  if (!type.match(/^(ssh-|ecdsa-)/)) {
    throw new Error(`Invalid SSH public key type: ${type}`);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
    if (buffer.toString('base64') !== b64) {
      throw new Error();
    }
  } catch {
    throw new Error('Invalid SSH public key: not valid base64');
  }

  const digest = crypto.createHash('sha256').update(buffer).digest('base64');
  const fingerprint = 'SHA256:' + digest.replace(/=+$/, '');

  const publicKey = `${type} ${b64}`;

  return { type, fingerprint, publicKey };
}
