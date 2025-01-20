-- DropForeignKey
ALTER TABLE `mods` DROP FOREIGN KEY `mods_id_fkey`;

-- AddForeignKey
ALTER TABLE `mods` ADD CONSTRAINT `mods_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
