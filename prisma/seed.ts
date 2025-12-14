import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script to create the first Core member
 * 
 * Usage: npm run prisma:seed
 * 
 * Set these environment variables:
 * - SEED_EMAIL: Email for first Core member
 * - SEED_HANDLE: Handle for first Core member
 * - SEED_NAME: Name for first Core member
 * - SEED_PASSWORD: Password for first Core member
 */

async function main() {
  const email = process.env.SEED_EMAIL;
  const handle = process.env.SEED_HANDLE;
  const name = process.env.SEED_NAME;
  const password = process.env.SEED_PASSWORD;
  
  if (!email || !handle || !name || !password) {
    throw new Error(
      'Missing required environment variables:\n' +
      'SEED_EMAIL, SEED_HANDLE, SEED_NAME, SEED_PASSWORD'
    );
  }
  
  // Check if user already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { handle },
      ],
    },
  });
  
  if (existing) {
    console.log('First Core member already exists.');
    return;
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create first Core member
  const user = await prisma.user.create({
    data: {
      email,
      handle,
      name,
      passwordHash,
      level: 5, // Core
      invitedBy: null, // First user has no inviter
    },
  });
  
  // Set system mode to BOOTSTRAP
  await prisma.systemConfig.upsert({
    where: { key: 'system_mode' },
    create: {
      key: 'system_mode',
      value: 'BOOTSTRAP',
      updatedBy: handle,
    },
    update: {
      value: 'BOOTSTRAP',
      updatedBy: handle,
    },
  });
  
  console.log(`First Core member created: @${handle} (${name})`);
  console.log(`Email: ${email}`);
  console.log('System mode: BOOTSTRAP');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

