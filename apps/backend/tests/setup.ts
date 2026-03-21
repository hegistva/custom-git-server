/**
 * Global test setup — runs before each test file.
 * Loads root .env and overrides DATABASE_URL with DATABASE_URL_TEST so tests
 * never accidentally touch the development database.
 */
import path from 'path';
import { config } from 'dotenv';

// Load root-level .env (three directories above tests/: tests/ -> backend/ -> apps/ -> root)
config({ path: path.resolve(__dirname, '../../../.env') });

// Prefer DATABASE_URL_TEST for all test runs
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

// Ensure required vars have safe test defaults if not already set
process.env.JWT_SECRET ??= 'test-jwt-secret-not-for-production';
process.env.BCRYPT_COST ??= '4'; // low cost for fast tests
process.env.REPOS_PATH ??= '/tmp/test-repos';
process.env.KEYS_PATH ??= '/tmp/test-keys/authorized_keys';
process.env.NODE_ENV ??= 'test';
