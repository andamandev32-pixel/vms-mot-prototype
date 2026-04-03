-- AlterTable
ALTER TABLE `appointment_groups` ADD COLUMN `approver_group_id` INTEGER NULL,
    ADD COLUMN `send_visitor_email` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `staff_notify_config` TEXT NULL;

-- CreateIndex
CREATE INDEX `appointment_groups_approver_group_id_idx` ON `appointment_groups`(`approver_group_id`);

-- AddForeignKey
ALTER TABLE `appointment_groups` ADD CONSTRAINT `appointment_groups_approver_group_id_fkey` FOREIGN KEY (`approver_group_id`) REFERENCES `approver_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
