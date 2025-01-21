/*
  Warnings:

  - You are about to drop the column `tinCertificateId` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `campaigns` DROP FOREIGN KEY `campaigns_categoryId_fkey`;

-- DropIndex
DROP INDEX `campaigns_categoryId_fkey` ON `campaigns`;

-- AlterTable
ALTER TABLE `businesses` DROP COLUMN `tinCertificateId`;

-- AlterTable
ALTER TABLE `campaignDocs` MODIFY `docType` ENUM('TIN_CERTIFICATE', 'REGISTRATION_CERTIFICATE', 'PERSONAL_DOCUMENT', 'SUPPORTING_DOCUMENT') NOT NULL;

-- AlterTable
ALTER TABLE `campaigns` DROP COLUMN `categoryId`,
    ADD COLUMN `category` ENUM('MEDICAL', 'RELOCATION', 'REHABILITATION', 'DISASTER_RELIEF', 'LEGAL', 'CHILDCARE', 'EDUCATION', 'STARTUP_FUNDING', 'PRODUCT_LAUNCH', 'BUSINESS_EXPANSION', 'EVENT_SPONSORSHIP') NOT NULL;

-- AlterTable
ALTER TABLE `charities` MODIFY `publicEmail` VARCHAR(191) NULL,
    MODIFY `publicPhoneNumber` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `categories`;
