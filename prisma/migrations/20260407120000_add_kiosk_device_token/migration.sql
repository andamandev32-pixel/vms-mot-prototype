-- AlterTable: เพิ่ม column token สำหรับเก็บ raw device token ให้ admin ดูและ copy ได้
ALTER TABLE `kiosk_devices` ADD COLUMN `token` VARCHAR(255);
