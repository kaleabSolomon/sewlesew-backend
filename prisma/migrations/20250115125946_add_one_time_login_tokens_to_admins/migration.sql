-- AlterTable
ALTER TABLE `admins` ADD COLUMN `otlToken` VARCHAR(191) NULL,
    ADD COLUMN `otlTokenExpiresAt` DATETIME(3) NULL;
