/*
  Warnings:

  - Added the required column `idBack` to the `agents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idFront` to the `agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `agents` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `idBack` VARCHAR(191) NOT NULL,
    ADD COLUMN `idFront` VARCHAR(191) NOT NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `street` VARCHAR(191) NULL;
