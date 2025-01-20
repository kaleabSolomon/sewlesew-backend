/*
  Warnings:

  - You are about to drop the column `campaignId` on the `campaignDocs` table. All the data in the column will be lost.
  - You are about to drop the `_CampaignCategories` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[businessId]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[charityId]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `campaignDocs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `charityId` to the `campaignDocs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docType` to the `campaignDocs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageType` to the `campaignMedias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_CampaignCategories` DROP FOREIGN KEY `_CampaignCategories_A_fkey`;

-- DropForeignKey
ALTER TABLE `_CampaignCategories` DROP FOREIGN KEY `_CampaignCategories_B_fkey`;

-- DropForeignKey
ALTER TABLE `campaignDocs` DROP FOREIGN KEY `campaignDocs_campaignId_fkey`;

-- DropForeignKey
ALTER TABLE `campaignMedias` DROP FOREIGN KEY `campaignMedias_campaignId_fkey`;

-- DropIndex
DROP INDEX `campaignDocs_campaignId_fkey` ON `campaignDocs`;

-- DropIndex
DROP INDEX `campaignMedias_campaignId_fkey` ON `campaignMedias`;

-- AlterTable
ALTER TABLE `campaignDocs` DROP COLUMN `campaignId`,
    ADD COLUMN `businessId` VARCHAR(191) NOT NULL,
    ADD COLUMN `charityId` VARCHAR(191) NOT NULL,
    ADD COLUMN `docType` ENUM('TIN_CERTIFICATE', 'REGISTRATION_CERTIFICATE', 'SUPPORTING_DOCUMENT') NOT NULL;

-- AlterTable
ALTER TABLE `campaignMedias` ADD COLUMN `imageType` ENUM('COVER_IMAGE', 'SUPPORTING_IMAGE') NOT NULL;

-- AlterTable
ALTER TABLE `campaigns` ADD COLUMN `businessId` VARCHAR(191) NULL,
    ADD COLUMN `categoryId` VARCHAR(191) NOT NULL,
    ADD COLUMN `charityId` VARCHAR(191) NULL,
    ADD COLUMN `deadline` DATETIME(3) NULL;

-- DropTable
DROP TABLE `_CampaignCategories`;

-- CreateTable
CREATE TABLE `bank_details` (
    `id` VARCHAR(191) NOT NULL,
    `holderName` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `bank_details_campaignId_key`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `businesses` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NULL,
    `sector` ENUM('AGRICULTURE', 'CONSTRUCTION', 'EDUCATION', 'ENERGY', 'MANUFACTURING', 'MEDIA', 'MINING', 'TECHNOLOGY', 'TEXTILE', 'TOURISM', 'TRANSPORT', 'OTHER') NOT NULL,
    `tinNumber` VARCHAR(191) NOT NULL,
    `licenseNumber` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `publicEmail` VARCHAR(191) NULL,
    `publicPhoneNumber` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `relativeLocation` VARCHAR(191) NULL,
    `tinCertificateId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `charities` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `isOrganization` BOOLEAN NOT NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `tinNumber` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `publicEmail` VARCHAR(191) NOT NULL,
    `publicPhoneNumber` VARCHAR(191) NOT NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `relativeLocation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `campaigns_businessId_key` ON `campaigns`(`businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `campaigns_charityId_key` ON `campaigns`(`charityId`);

-- AddForeignKey
ALTER TABLE `bank_details` ADD CONSTRAINT `bank_details_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_charityId_fkey` FOREIGN KEY (`charityId`) REFERENCES `charities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaignMedias` ADD CONSTRAINT `campaignMedias_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaignDocs` ADD CONSTRAINT `campaignDocs_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaignDocs` ADD CONSTRAINT `campaignDocs_charityId_fkey` FOREIGN KEY (`charityId`) REFERENCES `charities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
