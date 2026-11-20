import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { dataStore, UserEntity } from '../repositories/dataStore.js';
import { Role } from '@prisma/client';

export async function seedAdminUser(): Promise<UserEntity> {
  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const existingAdmin = dataStore.users.find((u) => u.email.toLowerCase() === adminEmail);

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const now = new Date();

  if (existingAdmin) {
    existingAdmin.passwordHash = passwordHash;
    existingAdmin.role = Role.ADMIN;
    existingAdmin.name = env.ADMIN_NAME;
    existingAdmin.fullName = env.ADMIN_NAME;
    existingAdmin.updatedAt = now;
    console.log(`[Admin Seed] Updated existing admin user: ${adminEmail}`);
    return existingAdmin;
  }

  const newAdmin: UserEntity = {
    id: `usr-admin-${randomUUID()}`,
    email: adminEmail,
    passwordHash,
    name: env.ADMIN_NAME,
    fullName: env.ADMIN_NAME,
    phone: '+91 98200 11001',
    role: Role.ADMIN,
    createdAt: now,
    updatedAt: now,
  };

  dataStore.users.unshift(newAdmin);
  console.log(`[Admin Seed] Bootstrapped new admin user: ${adminEmail} (Role: ADMIN)`);
  return newAdmin;
}

if (process.argv[1] && process.argv[1].endsWith('seedAdmin.ts')) {
  seedAdminUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Admin Seed] Error bootstrapping admin:', err);
      process.exit(1);
    });
}
