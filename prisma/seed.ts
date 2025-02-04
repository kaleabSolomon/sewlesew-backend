import {
  BankName,
  BusinessSector,
  Category,
  DocType,
  ImageType,
  PrismaClient,
} from '@prisma/client';
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

  const business1 = await prisma.business.create({
    data: {
      fullName: 'Sample Business',
      website: 'https://example.com',
      sector: BusinessSector.TECHNOLOGY,
      tinNumber: '1234567812',
      licenseNumber: 'ABC1234sd56',
      publicEmail: 'business@example.com',
      publicPhoneNumber: '+1234567890',
      contactEmail: 'owner@example.com',
      contactPhone: '+0987654321',
      region: 'Amhara',
      city: 'bahirdar',
      relativeLocation: 'Near Landmark',
    },
  });
  await prisma.campaignDoc.createMany({
    data: [
      {
        businessId: business1.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.TIN_CERTIFICATE,
      },
      {
        businessId: business1.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.REGISTRATION_CERTIFICATE,
      },
      {
        businessId: business1.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.SUPPORTING_DOCUMENT,
      },
    ],
  });

  const campaign1 = await prisma.campaign.create({
    data: {
      userId: user1.id,
      businessId: business1.id,
      title: 'Save Our Startup',
      description: 'We are raising funds to expand our services.',
      goalAmount: 50000,
      deadline: new Date().toISOString(),
      category: Category.EDUCATION_SUPPORT,
    },
  });

  await prisma.campaignMedia.createMany({
    data: [
      {
        campaignId: campaign1.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.COVER_IMAGE,
      },
      {
        campaignId: campaign1.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.LOGO,
      },
      {
        campaignId: campaign1.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
      {
        campaignId: campaign1.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
    ],
  });

  await prisma.bankDetail.create({
    data: {
      holderName: 'John Doe',
      bankName: BankName.ABAY_BANK,
      accountNumber: '1234567890',
      campaignId: campaign1.id,
    },
  });
  const business2 = await prisma.business.create({
    data: {
      fullName: 'Sample Business',
      website: 'https://example.com',
      sector: BusinessSector.TECHNOLOGY,
      tinNumber: '123456781',
      licenseNumber: 'ABC1r3456',
      publicEmail: 'business@example.com',
      publicPhoneNumber: '+1234567890',
      contactEmail: 'owner@example.com',
      contactPhone: '+0987654321',
      region: 'Amhara',
      city: 'bahirdar',
      relativeLocation: 'Near Landmark',
    },
  });
  await prisma.campaignDoc.createMany({
    data: [
      {
        businessId: business2.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.TIN_CERTIFICATE,
      },
      {
        businessId: business2.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.REGISTRATION_CERTIFICATE,
      },
      {
        businessId: business2.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.SUPPORTING_DOCUMENT,
      },
    ],
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      userId: user1.id,
      businessId: business2.id,
      title: 'Save Our Startup',
      description: 'We are raising funds to expand our services.',
      goalAmount: 50000,
      deadline: new Date().toISOString(),
      category: Category.EDUCATION_SUPPORT,
    },
  });

  await prisma.campaignMedia.createMany({
    data: [
      {
        campaignId: campaign2.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.COVER_IMAGE,
      },
      {
        campaignId: campaign2.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.LOGO,
      },
      {
        campaignId: campaign2.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
      {
        campaignId: campaign2.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
    ],
  });

  await prisma.bankDetail.create({
    data: {
      holderName: 'John Doe',
      bankName: BankName.ABAY_BANK,
      accountNumber: '1234567890',
      campaignId: campaign2.id,
    },
  });
  const business3 = await prisma.business.create({
    data: {
      fullName: 'Sample Business',
      website: 'https://example.com',
      sector: BusinessSector.TECHNOLOGY,
      tinNumber: '123456783',
      licenseNumber: 'ABC12345',
      publicEmail: 'business@example.com',
      publicPhoneNumber: '+1234567890',
      contactEmail: 'owner@example.com',
      contactPhone: '+0987654321',
      region: 'Amhara',
      city: 'bahirdar',
      relativeLocation: 'Near Landmark',
    },
  });
  await prisma.campaignDoc.createMany({
    data: [
      {
        businessId: business3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.TIN_CERTIFICATE,
      },
      {
        businessId: business3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.REGISTRATION_CERTIFICATE,
      },
      {
        businessId: business3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.SUPPORTING_DOCUMENT,
      },
    ],
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      userId: user1.id,
      businessId: business3.id,
      title: 'Save Our Startup',
      description: 'We are raising funds to expand our services.',
      goalAmount: 50000,
      deadline: new Date().toISOString(),
      category: Category.EDUCATION_SUPPORT,
    },
  });

  await prisma.campaignMedia.createMany({
    data: [
      {
        campaignId: campaign3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.COVER_IMAGE,
      },
      {
        campaignId: campaign3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.LOGO,
      },
      {
        campaignId: campaign3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
      {
        campaignId: campaign3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
    ],
  });

  await prisma.bankDetail.create({
    data: {
      holderName: 'John Doe',
      bankName: BankName.ABAY_BANK,
      accountNumber: '1234567890',
      campaignId: campaign3.id,
    },
  });
  const business4 = await prisma.business.create({
    data: {
      fullName: 'Sample Business',
      website: 'https://example.com',
      sector: BusinessSector.TECHNOLOGY,
      tinNumber: '12345789',
      licenseNumber: 'ABC12356',
      publicEmail: 'business@example.com',
      publicPhoneNumber: '+1234567890',
      contactEmail: 'owner@example.com',
      contactPhone: '+0987654321',
      region: 'Amhara',
      city: 'bahirdar',
      relativeLocation: 'Near Landmark',
    },
  });
  await prisma.campaignDoc.createMany({
    data: [
      {
        businessId: business4.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.TIN_CERTIFICATE,
      },
      {
        businessId: business4.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.REGISTRATION_CERTIFICATE,
      },
      {
        businessId: business3.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737566206/bcddlpjaxk7nymy7vafx.jpg',
        docType: DocType.SUPPORTING_DOCUMENT,
      },
    ],
  });

  const campaign4 = await prisma.campaign.create({
    data: {
      userId: user1.id,
      businessId: business4.id,
      title: 'Save Our Startup',
      description: 'We are raising funds to expand our services.',
      goalAmount: 50000,
      deadline: new Date().toISOString(),
      category: Category.EDUCATION_SUPPORT,
    },
  });

  await prisma.campaignMedia.createMany({
    data: [
      {
        campaignId: campaign4.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.COVER_IMAGE,
      },
      {
        campaignId: campaign4.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.LOGO,
      },
      {
        campaignId: campaign4.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
      {
        campaignId: campaign4.id,
        url: 'http://res.cloudinary.com/dpn8xjbfu/image/upload/v1737570023/o5as6uzav2blrxjprgsp.jpg',
        imageType: ImageType.SUPPORTING_IMAGE,
      },
    ],
  });

  await prisma.bankDetail.create({
    data: {
      holderName: 'John Doe',
      bankName: BankName.ABAY_BANK,
      accountNumber: '1234567890',
      campaignId: campaign4.id,
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
