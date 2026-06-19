/**
 * Database seed (plain ESM so it runs in the production container with no
 * dev dependencies): loads the canonical Hénin-Beaumont dataset from
 * @mpc/engine plus one demo user per role.
 *
 *   npm run db:seed --workspace @mpc/api      # or: npx prisma db seed
 */
import prismaPkg from '@prisma/client';
import { MOLDS, PRESSES } from '@mpc/engine';

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

const DEMO_USERS = [
  { email: 'admin@forvia.local', name: 'Admin Demo', role: 'ADMINISTRATOR' },
  { email: 'engineer@forvia.local', name: 'Engineer Demo', role: 'ENGINEER' },
  { email: 'technician@forvia.local', name: 'Technician Demo', role: 'TECHNICIAN' },
  { email: 'viewer@forvia.local', name: 'Viewer Demo', role: 'READ_ONLY' },
];

async function main() {
  console.log(`Seeding ${PRESSES.length} presses...`);
  for (const p of PRESSES) {
    await prisma.press.upsert({ where: { id: p.id }, create: p, update: p });
  }

  console.log(`Seeding ${MOLDS.length} molds...`);
  for (const m of MOLDS) {
    await prisma.mold.upsert({ where: { id: m.id }, create: m, update: m });
  }

  console.log(`Seeding ${DEMO_USERS.length} demo users...`);
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: u,
      update: { name: u.name, role: u.role },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
