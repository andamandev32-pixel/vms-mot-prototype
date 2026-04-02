-- DropForeignKey
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_host_staff_id_fkey`;

-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `group_id` INTEGER NULL,
    ADD COLUMN `notify_on_checkin` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `host_staff_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `appointment_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `name_en` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `visit_purpose_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `host_staff_id` INTEGER NULL,
    `entry_mode` VARCHAR(20) NOT NULL DEFAULT 'single',
    `date_start` DATE NOT NULL,
    `date_end` DATE NULL,
    `time_start` TIME(0) NOT NULL,
    `time_end` TIME(0) NOT NULL,
    `room` VARCHAR(50) NULL,
    `building` VARCHAR(100) NULL,
    `floor` VARCHAR(20) NULL,
    `total_expected` INTEGER NOT NULL DEFAULT 0,
    `notify_on_checkin` BOOLEAN NOT NULL DEFAULT false,
    `created_by_staff_id` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `appointment_groups_created_by_staff_id_idx`(`created_by_staff_id`),
    INDEX `appointment_groups_date_start_idx`(`date_start`),
    INDEX `appointment_groups_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_group_day_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `time_start` TIME(0) NOT NULL,
    `time_end` TIME(0) NOT NULL,
    `notes` VARCHAR(200) NULL,

    INDEX `appointment_group_day_schedules_group_id_idx`(`group_id`),
    INDEX `appointment_group_day_schedules_date_idx`(`date`),
    UNIQUE INDEX `appointment_group_day_schedules_group_id_date_key`(`group_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `appointments_group_id_idx` ON `appointments`(`group_id`);

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_host_staff_id_fkey` FOREIGN KEY (`host_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `appointment_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_groups` ADD CONSTRAINT `appointment_groups_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_groups` ADD CONSTRAINT `appointment_groups_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_groups` ADD CONSTRAINT `appointment_groups_host_staff_id_fkey` FOREIGN KEY (`host_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_groups` ADD CONSTRAINT `appointment_groups_created_by_staff_id_fkey` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_group_day_schedules` ADD CONSTRAINT `appointment_group_day_schedules_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `appointment_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
