/*
  Warnings:

  - You are about to drop the column `emailVerificationCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationCodeExpiresAt` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `emailVerificationCode`,
    DROP COLUMN `emailVerificationCodeExpiresAt`,
    ADD COLUMN `verificationCode` INTEGER NULL,
    ADD COLUMN `verificationCodeExpiresAt` DATETIME(3) NULL;
