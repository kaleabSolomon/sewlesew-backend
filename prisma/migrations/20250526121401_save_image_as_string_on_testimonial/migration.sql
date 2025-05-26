/*
  Warnings:

  - You are about to drop the `TestimonialImage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `coverImageUrl` to the `Testimonial` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Testimonial` DROP FOREIGN KEY `Testimonial_testimonialImageId_fkey`;

-- DropIndex
DROP INDEX `Testimonial_testimonialImageId_fkey` ON `Testimonial`;

-- AlterTable
ALTER TABLE `Testimonial` ADD COLUMN `coverImageUrl` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `TestimonialImage`;
