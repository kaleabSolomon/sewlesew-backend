/*
  Warnings:

  - You are about to alter the column `goalAmount` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(11,2)`.
  - You are about to alter the column `raisedAmount` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(11,2)`.

*/
-- AlterTable
ALTER TABLE `campaigns` MODIFY `goalAmount` DECIMAL(11, 2) NOT NULL,
    MODIFY `raisedAmount` DECIMAL(11, 2) NOT NULL DEFAULT 0.00;
