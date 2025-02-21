-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PENDING', 'ACTIVE', 'CLOSED', 'REJECTED', 'DELETED', 'REMOVED');

-- CreateEnum
CREATE TYPE "AdminRoles" AS ENUM ('SUPERADMIN', 'CALLCENTERAGENT', 'CAMPAIGNREVIEWER');

-- CreateEnum
CREATE TYPE "AdminActions" AS ENUM ('CREATE', 'DELETE', 'UPDATE', 'APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "ModerationTarget" AS ENUM ('CAMPAIGN', 'TESTIMONIAL', 'USER', 'DONATION');

-- CreateEnum
CREATE TYPE "BusinessSector" AS ENUM ('AGRICULTURE', 'CONSTRUCTION', 'EDUCATION', 'ENERGY', 'MANUFACTURING', 'MEDIA', 'MINING', 'TECHNOLOGY', 'TEXTILE', 'TOURISM', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('MEDICAL', 'RELOCATION', 'REHABILITATION', 'DISASTER_RELIEF', 'LEGAL', 'CHILDCARE', 'EDUCATION', 'POVERTY_ALLEVIATION', 'EDUCATION_SUPPORT', 'ELDERLY_ASSISTANCE', 'HEALTHCARE_ASSISTANCE', 'HUMAN_RIGHTS', 'ENVIRONMENTAL_CONSERVATION', 'REFUGEE_AID', 'STARTUP_FUNDING', 'PRODUCT_LAUNCH', 'BUSINESS_EXPANSION', 'EVENT_SPONSORSHIP', 'RESEARCH_AND_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('TIN_CERTIFICATE', 'REGISTRATION_CERTIFICATE', 'PERSONAL_DOCUMENT', 'SUPPORTING_DOCUMENT');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('COVER_IMAGE', 'SUPPORTING_IMAGE', 'LOGO');

-- CreateEnum
CREATE TYPE "BankName" AS ENUM ('AWASH_BANK', 'ABAY_BANK', 'COMMERCIAL_BANK_OF_ETHIOPIA', 'ABYSSINIA_BANK', 'ZEMEN_BANK');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "passwordHash" TEXT,
    "rtHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" INTEGER,
    "verificationCodeExpiresAt" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpiresAt" TIMESTAMP(3),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "profilePicture" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authProviders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authProviders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_details" (
    "id" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "bankName" "BankName" NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "goalAmount" DECIMAL(11,2) NOT NULL,
    "category" "Category" NOT NULL,
    "raisedAmount" DECIMAL(11,2) NOT NULL DEFAULT 0.00,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT,
    "charityId" TEXT,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "website" TEXT,
    "sector" "BusinessSector" NOT NULL,
    "tinNumber" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "publicEmail" TEXT,
    "publicPhoneNumber" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "relativeLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charities" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isOrganization" BOOLEAN NOT NULL,
    "licenseNumber" TEXT,
    "tinNumber" TEXT,
    "website" TEXT,
    "publicEmail" TEXT,
    "publicPhoneNumber" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "relativeLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaignMedias" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageType" "ImageType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaignMedias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaignDocs" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docType" "DocType" NOT NULL,
    "businessId" TEXT,
    "charityId" TEXT,

    CONSTRAINT "campaignDocs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "rtHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resetPasswordToken" TEXT,
    "resetPasswordExpiresAt" TIMESTAMP(3),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "role" "AdminRoles" NOT NULL,
    "otlToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "otlTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mods" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminActions" NOT NULL,
    "target" "ModerationTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosedCampaign" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClosedCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "txRef" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "donorFirstName" TEXT,
    "donorLastName" TEXT,
    "email" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_campaignId_key" ON "bank_details"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_businessId_key" ON "campaigns"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_charityId_key" ON "campaigns"("charityId");

-- CreateIndex
CREATE INDEX "campaigns_businessId_charityId_idx" ON "campaigns"("businessId", "charityId");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_tinNumber_key" ON "businesses"("tinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_licenseNumber_key" ON "businesses"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "charities_licenseNumber_key" ON "charities"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "charities_tinNumber_key" ON "charities"("tinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClosedCampaign_campaignId_key" ON "ClosedCampaign"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_txRef_key" ON "Donation"("txRef");

-- AddForeignKey
ALTER TABLE "authProviders" ADD CONSTRAINT "authProviders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_details" ADD CONSTRAINT "bank_details_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "charities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaignMedias" ADD CONSTRAINT "campaignMedias_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaignDocs" ADD CONSTRAINT "campaignDocs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaignDocs" ADD CONSTRAINT "campaignDocs_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "charities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mods" ADD CONSTRAINT "mods_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosedCampaign" ADD CONSTRAINT "ClosedCampaign_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
