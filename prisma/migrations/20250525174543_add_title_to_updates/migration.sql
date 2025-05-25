/*
  Warnings:

  - Added the required column `title` to the `campaign_updates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `campaign_updates` ADD COLUMN `title` VARCHAR(191) NOT NULL;
