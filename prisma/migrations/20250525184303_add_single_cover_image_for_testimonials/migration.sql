/*
  Warnings:

  - Added the required column `testimonialImageId` to the `Testimonial` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `TestimonialImage` DROP FOREIGN KEY `TestimonialImage_testimonialId_fkey`;

-- DropIndex
DROP INDEX `TestimonialImage_testimonialId_fkey` ON `TestimonialImage`;

-- AlterTable
ALTER TABLE `Testimonial` ADD COLUMN `testimonialImageId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_testimonialImageId_fkey` FOREIGN KEY (`testimonialImageId`) REFERENCES `TestimonialImage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
