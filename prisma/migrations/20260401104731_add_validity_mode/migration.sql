-- AlterTable
ALTER TABLE `access_groups` ADD COLUMN `validity_mode` VARCHAR(30) NOT NULL DEFAULT 'fixed-minutes';
