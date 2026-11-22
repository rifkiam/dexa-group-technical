import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/auth/password.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set before running the user seeder.');
}

const url = new URL(databaseUrl);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  }),
});

const users = [
  { name: 'Admin User', email: 'admin@example.com', employeeId: 'EMP-0001', role: 'admin' },
  { name: 'Adit', email: 'adit@example.com', employeeId: 'EMP-0002', role: 'user' },
  { name: 'Laura', email: 'laura@example.com', employeeId: 'EMP-0003', role: 'user' },
];

async function main() {
  const password = process.env.SEED_USER_PASSWORD ?? 'Password123!';
  const hashedPassword = await hashPassword(password);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, password: hashedPassword },
      create: { ...user, password: hashedPassword },
    });
  }

  console.log(`Seeded ${users.length} users.`);
  console.log(`Shared demo password: ${password}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
