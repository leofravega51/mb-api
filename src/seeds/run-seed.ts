import 'reflect-metadata';
import { config } from 'dotenv';
import dataSource from '@/database/data-source';
import { PlatformAdmin } from '@/database/entities/platform-admin.entity';
import * as bcrypt from 'bcryptjs';

config();

async function runSeed(): Promise<void> {
  await dataSource.initialize();
  const adminRepo = dataSource.getRepository(PlatformAdmin);
  const count = await adminRepo.count();

  if (count > 0) {
    console.log('Platform admin already exists — skipping seed.');
    await dataSource.destroy();
    return;
  }

  const email = (process.env.ADMIN_EMAIL ?? 'admin@mybusiness.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const name = process.env.ADMIN_NAME ?? 'Platform Admin';
  const passwordHash = await bcrypt.hash(password, 10);

  await adminRepo.save(
    adminRepo.create({ email, passwordHash, name }),
  );

  console.log(`Platform admin seeded: ${email}`);
  await dataSource.destroy();
}

runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
