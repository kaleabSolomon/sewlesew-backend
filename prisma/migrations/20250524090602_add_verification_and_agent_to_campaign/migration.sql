-- AlterTable
ALTER TABLE `campaigns` ADD COLUMN `closeCampaignVerificationCode` INTEGER NULL,
    ADD COLUMN `closeCampaignVerificationCodeExpiresAt` DATETIME(3) NULL;
