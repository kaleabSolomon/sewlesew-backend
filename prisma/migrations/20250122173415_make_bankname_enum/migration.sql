/*
  Warnings:

  - You are about to alter the column `bankName` on the `bank_details` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `bank_details` MODIFY `bankName` ENUM('AWASH_BANK', 'ABAY_BANK', 'COMMERCIAL_BANK_OF_ETHIOPIA', 'ABYSSINIA_BANK', 'ZEMEN_BANK') NOT NULL;
