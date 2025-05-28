/*
  Warnings:

  - You are about to drop the column `cardType` on the `Donation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Donation` DROP COLUMN `cardType`,
    ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'ETB';
