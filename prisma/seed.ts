import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'superadmin@sewlesew.com' },
    update: {},
    create: {
      email: 'superadmin@sewlesew.com',
      passwordHash:
        '$argon2i$v=19$m=16,t=2,p=1$cGNXR2g3RGZpWGl3V0RPdQ$y5LPhRM9nU0PXEm4YVxQ0A',
      firstName: 'super',
      lastName: 'admin',
      dateOfBirth: new Date('1999-09-10'),
      role: 'SUPERADMIN',
    },
  });
  const callCenterAgent = await prisma.admin.upsert({
    where: { email: 'callcenter@sewlesew.com' },
    update: {},
    create: {
      email: 'callcenter@sewlesew.com',
      passwordHash:
        '$argon2i$v=19$m=16,t=2,p=1$cGNXR2g3RGZpWGl3V0RPdQ$y5LPhRM9nU0PXEm4YVxQ0A',
      firstName: 'call ',
      lastName: 'cascauperdminenter',
      dateOfBirth: new Date('1999-09-10'),
      role: 'CALLCENTERAGENT',
    },
  });
  const campaignReviewer = await prisma.admin.upsert({
    where: { email: 'campaignreviewer@sewlesew.com' },
    update: {},
    create: {
      email: 'campaignreviewer@sewlesew.com',
      passwordHash:
        '$argon2i$v=19$m=16,t=2,p=1$cGNXR2g3RGZpWGl3V0RPdQ$y5LPhRM9nU0PXEm4YVxQ0A',
      firstName: 'campaign',
      lastName: 'reviewer',
      dateOfBirth: new Date('1999-09-10'),
      role: 'CAMPAIGNREVIEWER',
    },
  });
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      passwordHash:
        '$argon2i$v=19$m=16,t=2,p=1$cGNXR2g3RGZpWGl3V0RPdQ$y5LPhRM9nU0PXEm4YVxQ0A',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-05-10'),
      isActive: true,
      isVerified: true,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      passwordHash:
        '$argon2i$v=19$m=16,t=2,p=1$cGNXR2g3RGZpWGl3V0RPdQ$y5LPhRM9nU0PXEm4YVxQ0A',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1988-08-22'),
      isActive: true,
      isVerified: false,
      role: 'USER',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'alice.williams@example.com' },
    update: {},
    create: {
      email: 'alice.williams@example.com',
      passwordHash:
        '$argon2i$v=19$m=16,t=2,p=1$cGNXR2g3RGZpWGl3V0RPdQ$y5LPhRM9nU0PXEm4YVxQ0A',
      firstName: 'Alice',
      lastName: 'Williams',
      dateOfBirth: new Date('1995-12-15'),
      isActive: false,
      isVerified: false,
      profilePicture: 'https://example.com/profile/alice.jpg',
      role: 'USER',
    },
  });

  console.log('Seeding....\n', {
    user1,
    user2,
    user3,
    superAdmin,
    campaignReviewer,
    callCenterAgent,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
