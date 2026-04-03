-- CreateTable
CREATE TABLE `kiosk_devices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `serial_number` VARCHAR(50) NOT NULL,
    `service_point_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `token_prefix` VARCHAR(10) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `last_seen_at` DATETIME(3) NULL,
    `last_ip_address` VARCHAR(45) NULL,
    `registered_by_id` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kiosk_devices_serial_number_key`(`serial_number`),
    INDEX `kiosk_devices_service_point_id_idx`(`service_point_id`),
    INDEX `kiosk_devices_status_idx`(`status`),
    INDEX `kiosk_devices_token_prefix_idx`(`token_prefix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kiosk_devices` ADD CONSTRAINT `kiosk_devices_service_point_id_fkey` FOREIGN KEY (`service_point_id`) REFERENCES `service_points`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kiosk_devices` ADD CONSTRAINT `kiosk_devices_registered_by_id_fkey` FOREIGN KEY (`registered_by_id`) REFERENCES `user_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
