/*
  Warnings:

  - The values [COMPLETED] on the enum `campaigns_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `campaigns` MODIFY `status` ENUM('PENDING', 'ACTIVE', 'CLOSED', 'REJECTED', 'DELETED', 'REMOVED') NOT NULL DEFAULT 'PENDING';
