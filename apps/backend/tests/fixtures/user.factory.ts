import * as bcrypt from 'bcrypt';
import { db } from '../../src/lib/db';

interface UserOverrides {
  username?: string;
  email?: string;
  password?: string;
}

/**
 * Creates a test user and returns the user record plus the raw password.
 * bcrypt cost is set to 4 in the test setup file for speed.
 */
export async function createTestUser(overrides: UserOverrides = {}): Promise<{
  id: string;
  username: string;
  email: string;
  rawPassword: string;
}> {
  const username = overrides.username ?? `testuser_${Math.random().toString(36).slice(2, 8)}`;
  const email = overrides.email ?? `${username}@example.com`;
  const rawPassword = overrides.password ?? 'TestPass123!';
  const bcryptCost = Number(process.env.BCRYPT_COST ?? 4);
  const passwordHash = await bcrypt.hash(rawPassword, bcryptCost);

  const user = await db.user.create({
    data: { username, email, passwordHash },
    select: { id: true, username: true, email: true },
  });

  return { ...user, rawPassword };
}

/**
 * Truncate auth-related tables in dependency order.
 * Call in afterEach to isolate tests.
 */
export async function truncateAuthTables(): Promise<void> {
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE personal_access_tokens, refresh_tokens, ssh_keys, users RESTART IDENTITY CASCADE`,
  );
}
