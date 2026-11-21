import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

export async function seedAdminUser() {
  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const adminName = env.ADMIN_NAME;

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: Role.ADMIN,
      name: adminName,
      fullName: adminName,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      fullName: adminName,
      phone: '+91 98200 11001',
      role: Role.ADMIN,
    },
  });

  console.log(`[Admin Seed] Bootstrapped admin user: ${adminEmail} (Role: ADMIN)`);
  return admin;
}

if (process.argv[1] && process.argv[1].endsWith('seedAdmin.ts')) {
  seedAdminUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Admin Seed] Error bootstrapping admin:', err);
      process.exit(1);
    });
}
