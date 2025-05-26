-- AlterTable
ALTER TABLE `businesses` ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT 'Ethiopia';

-- AlterTable
ALTER TABLE `charities` ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT 'Ethiopia';
