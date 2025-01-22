/*
  Warnings:

  - You are about to drop the column `logo` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `charities` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNumber` on the `charities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[licenseNumber]` on the table `charities` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `charities_registrationNumber_key` ON `charities`;

-- AlterTable
ALTER TABLE `businesses` DROP COLUMN `logo`;

-- AlterTable
ALTER TABLE `charities` DROP COLUMN `logo`,
    DROP COLUMN `registrationNumber`,
    ADD COLUMN `licenseNumber` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `charities_licenseNumber_key` ON `charities`(`licenseNumber`);
