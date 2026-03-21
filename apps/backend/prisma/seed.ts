import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed must not run in production');
}

const db = new PrismaClient();

async function main(): Promise<void> {
  const username = process.env.SEED_USER_USERNAME ?? 'devuser';
  const email = process.env.SEED_USER_EMAIL ?? 'dev@example.com';
  const password = process.env.SEED_USER_PASSWORD ?? 'devpassword';
  const bcryptCost = Number(process.env.BCRYPT_COST ?? 12);

  const passwordHash = await bcrypt.hash(password, bcryptCost);

  await db.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email,
      passwordHash,
    },
  });

  console.log(`Seed complete — dev user "${username}" (${email}) ready`);
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
