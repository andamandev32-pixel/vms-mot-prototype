-- CreateTable
CREATE TABLE `user_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `user_type` VARCHAR(20) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `ref_id` INTEGER NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `line_user_id` VARCHAR(50) NULL,
    `line_display_name` VARCHAR(100) NULL,
    `line_linked_at` DATETIME(3) NULL,
    `reset_token` VARCHAR(255) NULL,
    `reset_token_expires` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_accounts_username_key`(`username`),
    UNIQUE INDEX `user_accounts_email_key`(`email`),
    UNIQUE INDEX `user_accounts_line_user_id_key`(`line_user_id`),
    INDEX `user_accounts_role_idx`(`role`),
    INDEX `user_accounts_user_type_idx`(`user_type`),
    INDEX `user_accounts_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` VARCHAR(20) NOT NULL,
    `resource` VARCHAR(50) NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    `scope` VARCHAR(20) NOT NULL DEFAULT 'own',
    `is_allowed` BOOLEAN NOT NULL DEFAULT true,

    INDEX `role_permissions_role_idx`(`role`),
    INDEX `role_permissions_resource_idx`(`resource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `first_name_en` VARCHAR(100) NULL,
    `last_name_en` VARCHAR(100) NULL,
    `name` VARCHAR(200) NOT NULL,
    `name_en` VARCHAR(200) NULL,
    `id_number` VARCHAR(20) NOT NULL,
    `id_type` VARCHAR(30) NOT NULL,
    `company` VARCHAR(150) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `line_user_id` VARCHAR(50) NULL,
    `line_display_name` VARCHAR(100) NULL,
    `line_linked_at` DATETIME(3) NULL,
    `photo` VARCHAR(255) NULL,
    `nationality` VARCHAR(50) NULL,
    `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visitors_line_user_id_key`(`line_user_id`),
    INDEX `visitors_id_number_idx`(`id_number`),
    INDEX `visitors_phone_idx`(`phone`),
    INDEX `visitors_is_blocked_idx`(`is_blocked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_code` VARCHAR(30) NOT NULL,
    `visitor_id` INTEGER NOT NULL,
    `host_staff_id` INTEGER NOT NULL,
    `visit_purpose_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `entry_mode` VARCHAR(20) NOT NULL DEFAULT 'single',
    `date_start` DATE NOT NULL,
    `date_end` DATE NULL,
    `time_start` TIME(0) NOT NULL,
    `time_end` TIME(0) NOT NULL,
    `purpose` VARCHAR(255) NOT NULL,
    `companions_count` INTEGER NOT NULL DEFAULT 0,
    `created_by` VARCHAR(20) NOT NULL,
    `created_by_staff_id` INTEGER NULL,
    `offer_wifi` BOOLEAN NOT NULL DEFAULT false,
    `wifi_requested` BOOLEAN NOT NULL DEFAULT false,
    `area` VARCHAR(100) NULL,
    `building` VARCHAR(100) NULL,
    `floor` VARCHAR(20) NULL,
    `room` VARCHAR(50) NULL,
    `vehicle_plate` VARCHAR(20) NULL,
    `notes` TEXT NULL,
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_at` DATETIME(3) NULL,
    `rejected_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `appointments_booking_code_key`(`booking_code`),
    INDEX `appointments_visitor_id_idx`(`visitor_id`),
    INDEX `appointments_host_staff_id_idx`(`host_staff_id`),
    INDEX `appointments_department_id_idx`(`department_id`),
    INDEX `appointments_status_idx`(`status`),
    INDEX `appointments_date_start_idx`(`date_start`),
    INDEX `appointments_visit_purpose_id_idx`(`visit_purpose_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entry_code` VARCHAR(30) NOT NULL,
    `appointment_id` INTEGER NULL,
    `visitor_id` INTEGER NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `purpose` VARCHAR(200) NULL,
    `visit_type` VARCHAR(30) NULL,
    `host_staff_id` INTEGER NULL,
    `department_id` INTEGER NULL,
    `checkin_at` DATETIME(3) NOT NULL,
    `checkin_channel` VARCHAR(20) NOT NULL,
    `checkout_at` DATETIME(3) NULL,
    `checkout_by` INTEGER NULL,
    `area` VARCHAR(100) NOT NULL,
    `building` VARCHAR(100) NOT NULL,
    `floor` VARCHAR(20) NOT NULL,
    `room` VARCHAR(50) NULL,
    `slip_printed` BOOLEAN NULL,
    `wifi_username` VARCHAR(50) NULL,
    `wifi_password` VARCHAR(50) NULL,
    `id_method` VARCHAR(30) NULL,
    `service_point_id` INTEGER NULL,
    `face_photo_path` VARCHAR(255) NULL,
    `companions_count` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `visit_entries_entry_code_key`(`entry_code`),
    INDEX `visit_entries_appointment_id_idx`(`appointment_id`),
    INDEX `visit_entries_visitor_id_idx`(`visitor_id`),
    INDEX `visit_entries_status_idx`(`status`),
    INDEX `visit_entries_checkin_at_idx`(`checkin_at`),
    INDEX `visit_entries_department_id_idx`(`department_id`),
    INDEX `visit_entries_service_point_id_idx`(`service_point_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_companions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `company` VARCHAR(150) NULL,
    `phone` VARCHAR(20) NULL,
    `is_checked_in` BOOLEAN NOT NULL DEFAULT false,
    `checkin_at` DATETIME(3) NULL,
    `is_blacklisted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `appointment_companions_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_equipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `serial_number` VARCHAR(100) NULL,
    `description` TEXT NULL,

    INDEX `appointment_equipment_appointment_id_idx`(`appointment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointment_status_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointment_id` INTEGER NOT NULL,
    `from_status` VARCHAR(30) NULL,
    `to_status` VARCHAR(30) NOT NULL,
    `changed_by` INTEGER NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `appointment_status_logs_appointment_id_idx`(`appointment_id`),
    INDEX `appointment_status_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_code` VARCHAR(30) NOT NULL,
    `visitor_id` INTEGER NOT NULL,
    `host_staff_id` INTEGER NULL,
    `visit_purpose_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `entry_mode` VARCHAR(20) NOT NULL DEFAULT 'single',
    `date_start` DATE NOT NULL,
    `date_end` DATE NULL,
    `time_start` TIME(0) NOT NULL,
    `time_end` TIME(0) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `created_channel` VARCHAR(20) NOT NULL,
    `checkin_channel` VARCHAR(20) NULL,
    `wifi_requested` BOOLEAN NOT NULL DEFAULT false,
    `wifi_accepted` BOOLEAN NULL,
    `wifi_ssid` VARCHAR(50) NULL,
    `wifi_password` VARCHAR(50) NULL,
    `wifi_valid_until` DATETIME(3) NULL,
    `line_linked` BOOLEAN NOT NULL DEFAULT false,
    `slip_printed` BOOLEAN NULL,
    `slip_number` VARCHAR(30) NULL,
    `companions_count` INTEGER NOT NULL DEFAULT 0,
    `vehicle_plate` VARCHAR(20) NULL,
    `face_photo_path` VARCHAR(255) NULL,
    `id_method` VARCHAR(30) NULL,
    `service_point_id` INTEGER NULL,
    `checkin_at` DATETIME(3) NULL,
    `checkout_at` DATETIME(3) NULL,
    `checkout_by` INTEGER NULL,
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `rejected_reason` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visit_records_booking_code_key`(`booking_code`),
    INDEX `visit_records_visitor_id_idx`(`visitor_id`),
    INDEX `visit_records_status_idx`(`status`),
    INDEX `visit_records_date_start_idx`(`date_start`),
    INDEX `visit_records_department_id_idx`(`department_id`),
    INDEX `visit_records_service_point_id_idx`(`service_point_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_purposes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(10) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `show_on_line` BOOLEAN NOT NULL DEFAULT true,
    `show_on_web` BOOLEAN NOT NULL DEFAULT true,
    `show_on_kiosk` BOOLEAN NOT NULL DEFAULT true,
    `show_on_counter` BOOLEAN NOT NULL DEFAULT true,
    `allowed_entry_modes` VARCHAR(50) NOT NULL DEFAULT 'single',
    `sort_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `visit_purposes_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_purpose_department_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_purpose_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `require_person_name` BOOLEAN NOT NULL DEFAULT false,
    `require_approval` BOOLEAN NOT NULL DEFAULT false,
    `approver_group_id` INTEGER NULL,
    `offer_wifi` BOOLEAN NOT NULL DEFAULT false,
    `accept_from_line` BOOLEAN NOT NULL DEFAULT true,
    `accept_from_web` BOOLEAN NOT NULL DEFAULT true,
    `accept_from_kiosk` BOOLEAN NOT NULL DEFAULT true,
    `accept_from_counter` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `visit_purpose_department_rules_visit_purpose_id_idx`(`visit_purpose_id`),
    INDEX `visit_purpose_department_rules_department_id_idx`(`department_id`),
    INDEX `visit_purpose_department_rules_approver_group_id_idx`(`approver_group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_purpose_channel_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visit_purpose_id` INTEGER NOT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `require_photo` BOOLEAN NOT NULL DEFAULT false,

    INDEX `visit_purpose_channel_configs_visit_purpose_id_idx`(`visit_purpose_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_purpose_channel_documents` (
    `channel_config_id` INTEGER NOT NULL,
    `identity_document_type_id` INTEGER NOT NULL,

    INDEX `visit_purpose_channel_documents_identity_document_type_id_idx`(`identity_document_type_id`),
    PRIMARY KEY (`channel_config_id`, `identity_document_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purpose_slip_mappings` (
    `visit_purpose_id` INTEGER NOT NULL,
    `slip_template_id` INTEGER NULL,

    INDEX `purpose_slip_mappings_slip_template_id_idx`(`slip_template_id`),
    PRIMARY KEY (`visit_purpose_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buildings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `total_floors` INTEGER NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `floors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `building_id` INTEGER NOT NULL,
    `floor_number` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `name_en` VARCHAR(150) NOT NULL,

    INDEX `floors_building_id_idx`(`building_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `name_en` VARCHAR(200) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `floor_departments` (
    `floor_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,

    INDEX `floor_departments_department_id_idx`(`department_id`),
    PRIMARY KEY (`floor_id`, `department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_zones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `floor_id` INTEGER NOT NULL,
    `building_id` INTEGER NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `hikvision_door_id` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `access_zones_hikvision_door_id_key`(`hikvision_door_id`),
    INDEX `access_zones_floor_id_idx`(`floor_id`),
    INDEX `access_zones_building_id_idx`(`building_id`),
    INDEX `access_zones_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `hikvision_group_id` VARCHAR(50) NOT NULL,
    `qr_code_prefix` VARCHAR(20) NOT NULL,
    `validity_minutes` INTEGER NOT NULL,
    `schedule_days_of_week` JSON NOT NULL,
    `schedule_start_time` TIME(0) NOT NULL,
    `schedule_end_time` TIME(0) NOT NULL,
    `color` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `access_groups_hikvision_group_id_key`(`hikvision_group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_group_zones` (
    `access_group_id` INTEGER NOT NULL,
    `access_zone_id` INTEGER NOT NULL,

    INDEX `access_group_zones_access_zone_id_idx`(`access_zone_id`),
    PRIMARY KEY (`access_group_id`, `access_zone_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_group_visit_types` (
    `access_group_id` INTEGER NOT NULL,
    `visit_type` VARCHAR(30) NOT NULL,

    PRIMARY KEY (`access_group_id`, `visit_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department_access_mappings` (
    `department_id` INTEGER NOT NULL,
    `default_access_group_id` INTEGER NOT NULL,

    INDEX `department_access_mappings_default_access_group_id_idx`(`default_access_group_id`),
    PRIMARY KEY (`department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department_additional_access_groups` (
    `department_id` INTEGER NOT NULL,
    `access_group_id` INTEGER NOT NULL,

    INDEX `department_additional_access_groups_access_group_id_idx`(`access_group_id`),
    PRIMARY KEY (`department_id`, `access_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `position` VARCHAR(150) NOT NULL,
    `department_id` INTEGER NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `line_user_id` VARCHAR(50) NULL,
    `line_display_name` VARCHAR(100) NULL,
    `line_linked_at` DATETIME(3) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `role` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `shift` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_employee_id_key`(`employee_id`),
    UNIQUE INDEX `staff_line_user_id_key`(`line_user_id`),
    INDEX `staff_department_id_idx`(`department_id`),
    INDEX `staff_role_idx`(`role`),
    INDEX `staff_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approver_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `name_en` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `department_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `approver_groups_department_id_idx`(`department_id`),
    INDEX `approver_groups_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approver_group_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `approver_group_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `can_approve` BOOLEAN NOT NULL DEFAULT false,
    `receive_notification` BOOLEAN NOT NULL DEFAULT true,

    INDEX `approver_group_members_approver_group_id_idx`(`approver_group_id`),
    INDEX `approver_group_members_staff_id_idx`(`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approver_group_purposes` (
    `approver_group_id` INTEGER NOT NULL,
    `visit_purpose_id` INTEGER NOT NULL,

    INDEX `approver_group_purposes_visit_purpose_id_idx`(`visit_purpose_id`),
    PRIMARY KEY (`approver_group_id`, `visit_purpose_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approver_group_notify_channels` (
    `approver_group_id` INTEGER NOT NULL,
    `channel` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`approver_group_id`, `channel`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_points` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'online',
    `location` VARCHAR(150) NOT NULL,
    `location_en` VARCHAR(150) NOT NULL,
    `building` VARCHAR(100) NOT NULL,
    `floor` VARCHAR(20) NOT NULL,
    `ip_address` VARCHAR(15) NOT NULL,
    `mac_address` VARCHAR(17) NOT NULL,
    `serial_number` VARCHAR(30) NOT NULL,
    `today_transactions` INTEGER NOT NULL DEFAULT 0,
    `last_online` DATETIME(3) NULL,
    `assigned_staff_id` INTEGER NULL,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `wifi_ssid` VARCHAR(50) NULL,
    `wifi_password_pattern` VARCHAR(50) NULL,
    `wifi_validity_mode` VARCHAR(30) NULL,
    `wifi_fixed_duration_min` INTEGER NULL,
    `pdpa_require_scroll` BOOLEAN NULL DEFAULT true,
    `pdpa_retention_days` INTEGER NULL DEFAULT 90,
    `slip_header_text` VARCHAR(200) NULL,
    `slip_footer_text` VARCHAR(200) NULL,
    `follow_business_hours` BOOLEAN NULL DEFAULT true,
    `id_masking_pattern` VARCHAR(30) NULL,
    `admin_pin` VARCHAR(5) NULL DEFAULT '10210',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_points_serial_number_key`(`serial_number`),
    INDEX `service_points_type_idx`(`type`),
    INDEX `service_points_status_idx`(`status`),
    INDEX `service_points_assigned_staff_id_idx`(`assigned_staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_point_purposes` (
    `service_point_id` INTEGER NOT NULL,
    `visit_purpose_id` INTEGER NOT NULL,

    INDEX `service_point_purposes_visit_purpose_id_idx`(`visit_purpose_id`),
    PRIMARY KEY (`service_point_id`, `visit_purpose_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_point_documents` (
    `service_point_id` INTEGER NOT NULL,
    `identity_document_type_id` INTEGER NOT NULL,

    INDEX `service_point_documents_identity_document_type_id_idx`(`identity_document_type_id`),
    PRIMARY KEY (`service_point_id`, `identity_document_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `counter_staff_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_point_id` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `counter_staff_assignments_service_point_id_idx`(`service_point_id`),
    INDEX `counter_staff_assignments_staff_id_idx`(`staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(50) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(200) NULL,
    `updated_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_hours_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `days_of_week` JSON NULL,
    `specific_date` DATE NULL,
    `open_time` TIME(0) NOT NULL,
    `close_time` TIME(0) NOT NULL,
    `allow_walkin` BOOLEAN NOT NULL DEFAULT true,
    `allow_kiosk` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `business_hours_rules_type_idx`(`type`),
    INDEX `business_hours_rules_specific_date_idx`(`specific_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `identity_document_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(10) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `category` VARCHAR(30) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `require_photo` BOOLEAN NOT NULL DEFAULT false,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_type_visit_types` (
    `document_type_id` INTEGER NOT NULL,
    `visit_type` VARCHAR(30) NOT NULL,

    PRIMARY KEY (`document_type_id`, `visit_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `trigger_event` VARCHAR(50) NOT NULL,
    `channel` VARCHAR(20) NOT NULL,
    `subject` VARCHAR(200) NULL,
    `body_th` TEXT NOT NULL,
    `body_en` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notification_templates_trigger_event_idx`(`trigger_event`),
    INDEX `notification_templates_channel_idx`(`channel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_template_variables` (
    `template_id` INTEGER NOT NULL,
    `variable_name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`template_id`, `variable_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_notification_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trigger_event` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `subject` VARCHAR(200) NOT NULL,
    `body_th` TEXT NOT NULL,
    `body_en` TEXT NULL,
    `variables` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_notification_templates_trigger_event_idx`(`trigger_event`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `smtp_host` VARCHAR(100) NOT NULL,
    `smtp_port` INTEGER NOT NULL,
    `encryption` VARCHAR(10) NOT NULL DEFAULT 'tls',
    `smtp_username` VARCHAR(100) NOT NULL,
    `smtp_password` VARCHAR(255) NOT NULL,
    `from_email` VARCHAR(100) NOT NULL,
    `from_display_name` VARCHAR(100) NOT NULL,
    `reply_to_email` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_test_at` DATETIME(3) NULL,
    `last_test_result` VARCHAR(255) NULL,
    `updated_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `line_oa_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channel_id` VARCHAR(50) NOT NULL,
    `channel_secret` VARCHAR(100) NOT NULL,
    `channel_access_token` TEXT NOT NULL,
    `bot_basic_id` VARCHAR(50) NULL,
    `liff_app_id` VARCHAR(50) NULL,
    `liff_endpoint_url` VARCHAR(255) NULL,
    `webhook_url` VARCHAR(255) NULL,
    `webhook_active` BOOLEAN NOT NULL DEFAULT false,
    `rich_menu_visitor_id` VARCHAR(50) NULL,
    `rich_menu_officer_id` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_test_at` DATETIME(3) NULL,
    `last_test_result` VARCHAR(255) NULL,
    `updated_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `line_flex_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `state_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `header_title` VARCHAR(200) NULL,
    `header_subtitle` VARCHAR(200) NULL,
    `header_color` VARCHAR(20) NOT NULL DEFAULT 'primary',
    `header_variant` VARCHAR(30) NOT NULL DEFAULT 'standard',
    `show_status_badge` BOOLEAN NOT NULL DEFAULT false,
    `status_badge_text` VARCHAR(50) NULL,
    `show_qr_code` BOOLEAN NOT NULL DEFAULT false,
    `qr_label` VARCHAR(100) NULL,
    `info_box_text` TEXT NULL,
    `info_box_color` VARCHAR(10) NULL,
    `info_box_enabled` BOOLEAN NOT NULL DEFAULT false,
    `updated_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `line_flex_templates_state_id_key`(`state_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `line_flex_template_rows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `variable` VARCHAR(50) NOT NULL,
    `preview_value` VARCHAR(200) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL,

    INDEX `line_flex_template_rows_template_id_idx`(`template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `line_flex_template_buttons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `variant` VARCHAR(20) NOT NULL DEFAULT 'primary',
    `action_url` VARCHAR(500) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL,

    INDEX `line_flex_template_buttons_template_id_idx`(`template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_slip_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `paper_size` VARCHAR(20) NOT NULL DEFAULT 'thermal-80mm',
    `paper_width_px` INTEGER NOT NULL DEFAULT 302,
    `org_name` VARCHAR(200) NOT NULL DEFAULT '',
    `org_name_en` VARCHAR(200) NOT NULL DEFAULT '',
    `slip_title` VARCHAR(100) NOT NULL DEFAULT 'VISITOR PASS',
    `footer_text_th` VARCHAR(200) NOT NULL DEFAULT '',
    `footer_text_en` VARCHAR(200) NOT NULL DEFAULT '',
    `show_org_logo` BOOLEAN NOT NULL DEFAULT true,
    `logo_url` VARCHAR(500) NULL,
    `logo_size_px` INTEGER NOT NULL DEFAULT 40,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_slip_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `section_key` VARCHAR(30) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `name_en` VARCHAR(80) NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL,

    INDEX `visit_slip_sections_template_id_idx`(`template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visit_slip_fields` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `section_id` INTEGER NOT NULL,
    `field_key` VARCHAR(30) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `label_en` VARCHAR(100) NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `is_editable` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL,

    INDEX `visit_slip_fields_section_id_idx`(`section_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pdpa_consent_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `text_th` TEXT NOT NULL,
    `text_en` TEXT NOT NULL,
    `retention_days` INTEGER NOT NULL DEFAULT 90,
    `require_scroll` BOOLEAN NOT NULL DEFAULT true,
    `display_channels` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER NOT NULL DEFAULT 1,
    `updated_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pdpa_consent_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `config_id` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `text_th` TEXT NOT NULL,
    `text_en` TEXT NOT NULL,
    `retention_days` INTEGER NOT NULL,
    `require_scroll` BOOLEAN NOT NULL DEFAULT true,
    `display_channels` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `effective_date` DATE NOT NULL,
    `changed_by` INTEGER NULL,
    `change_note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pdpa_consent_versions_config_id_idx`(`config_id`),
    INDEX `pdpa_consent_versions_version_idx`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pdpa_consent_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitor_id` INTEGER NOT NULL,
    `config_version` INTEGER NOT NULL,
    `consent_channel` VARCHAR(20) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `device_id` VARCHAR(100) NULL,
    `consented_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `pdpa_consent_logs_visitor_id_idx`(`visitor_id`),
    INDEX `pdpa_consent_logs_consent_channel_idx`(`consent_channel`),
    INDEX `pdpa_consent_logs_consented_at_idx`(`consented_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocklist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `company` VARCHAR(200) NULL,
    `visitor_id` INTEGER NULL,
    `reason` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `expiry_date` DATE NULL,
    `added_by` INTEGER NOT NULL,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `blocklist_visitor_id_idx`(`visitor_id`),
    INDEX `blocklist_is_active_idx`(`is_active`),
    INDEX `blocklist_type_idx`(`type`),
    INDEX `blocklist_first_name_last_name_idx`(`first_name`, `last_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocklist_check_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blocklist_id` INTEGER NOT NULL,
    `matched_name` VARCHAR(200) NOT NULL,
    `check_channel` VARCHAR(20) NOT NULL,
    `action_taken` VARCHAR(30) NOT NULL,
    `checked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checked_by` INTEGER NULL,

    INDEX `blocklist_check_logs_blocklist_id_idx`(`blocklist_id`),
    INDEX `blocklist_check_logs_checked_at_idx`(`checked_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_daily_summary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `total_visitors` INTEGER NOT NULL DEFAULT 0,
    `total_appointments` INTEGER NOT NULL DEFAULT 0,
    `walkin_count` INTEGER NOT NULL DEFAULT 0,
    `checked_in` INTEGER NOT NULL DEFAULT 0,
    `checked_out` INTEGER NOT NULL DEFAULT 0,
    `overstay_count` INTEGER NOT NULL DEFAULT 0,
    `avg_visit_duration_min` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `report_daily_summary_date_key`(`date`),
    INDEX `report_daily_summary_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_department_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `department_id` INTEGER NOT NULL,
    `department_name` VARCHAR(100) NOT NULL,
    `visitor_count` INTEGER NOT NULL DEFAULT 0,
    `appointment_count` INTEGER NOT NULL DEFAULT 0,

    INDEX `report_department_stats_date_idx`(`date`),
    INDEX `report_department_stats_department_id_idx`(`department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_visit_type_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `visit_type` VARCHAR(30) NOT NULL,
    `visitor_count` INTEGER NOT NULL DEFAULT 0,

    INDEX `report_visit_type_stats_date_idx`(`date`),
    INDEX `report_visit_type_stats_visit_type_idx`(`visit_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_host_staff_id_fkey` FOREIGN KEY (`host_staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_created_by_staff_id_fkey` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_entries` ADD CONSTRAINT `visit_entries_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_entries` ADD CONSTRAINT `visit_entries_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_entries` ADD CONSTRAINT `visit_entries_host_staff_id_fkey` FOREIGN KEY (`host_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_entries` ADD CONSTRAINT `visit_entries_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_entries` ADD CONSTRAINT `visit_entries_checkout_by_fkey` FOREIGN KEY (`checkout_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_entries` ADD CONSTRAINT `visit_entries_service_point_id_fkey` FOREIGN KEY (`service_point_id`) REFERENCES `service_points`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_companions` ADD CONSTRAINT `appointment_companions_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_equipment` ADD CONSTRAINT `appointment_equipment_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_status_logs` ADD CONSTRAINT `appointment_status_logs_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_status_logs` ADD CONSTRAINT `appointment_status_logs_changed_by_fkey` FOREIGN KEY (`changed_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_records` ADD CONSTRAINT `visit_records_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_records` ADD CONSTRAINT `visit_records_host_staff_id_fkey` FOREIGN KEY (`host_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_records` ADD CONSTRAINT `visit_records_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_records` ADD CONSTRAINT `visit_records_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_records` ADD CONSTRAINT `visit_records_service_point_id_fkey` FOREIGN KEY (`service_point_id`) REFERENCES `service_points`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_records` ADD CONSTRAINT `visit_records_checkout_by_fkey` FOREIGN KEY (`checkout_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_records` ADD CONSTRAINT `visit_records_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_purpose_department_rules` ADD CONSTRAINT `visit_purpose_department_rules_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_purpose_department_rules` ADD CONSTRAINT `visit_purpose_department_rules_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_purpose_department_rules` ADD CONSTRAINT `visit_purpose_department_rules_approver_group_id_fkey` FOREIGN KEY (`approver_group_id`) REFERENCES `approver_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_purpose_channel_configs` ADD CONSTRAINT `visit_purpose_channel_configs_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_purpose_channel_documents` ADD CONSTRAINT `visit_purpose_channel_documents_channel_config_id_fkey` FOREIGN KEY (`channel_config_id`) REFERENCES `visit_purpose_channel_configs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_purpose_channel_documents` ADD CONSTRAINT `visit_purpose_channel_documents_identity_document_type_id_fkey` FOREIGN KEY (`identity_document_type_id`) REFERENCES `identity_document_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purpose_slip_mappings` ADD CONSTRAINT `purpose_slip_mappings_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purpose_slip_mappings` ADD CONSTRAINT `purpose_slip_mappings_slip_template_id_fkey` FOREIGN KEY (`slip_template_id`) REFERENCES `visit_slip_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `floors` ADD CONSTRAINT `floors_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `floor_departments` ADD CONSTRAINT `floor_departments_floor_id_fkey` FOREIGN KEY (`floor_id`) REFERENCES `floors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `floor_departments` ADD CONSTRAINT `floor_departments_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_zones` ADD CONSTRAINT `access_zones_floor_id_fkey` FOREIGN KEY (`floor_id`) REFERENCES `floors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_zones` ADD CONSTRAINT `access_zones_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_group_zones` ADD CONSTRAINT `access_group_zones_access_group_id_fkey` FOREIGN KEY (`access_group_id`) REFERENCES `access_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_group_zones` ADD CONSTRAINT `access_group_zones_access_zone_id_fkey` FOREIGN KEY (`access_zone_id`) REFERENCES `access_zones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_group_visit_types` ADD CONSTRAINT `access_group_visit_types_access_group_id_fkey` FOREIGN KEY (`access_group_id`) REFERENCES `access_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department_access_mappings` ADD CONSTRAINT `department_access_mappings_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department_access_mappings` ADD CONSTRAINT `department_access_mappings_default_access_group_id_fkey` FOREIGN KEY (`default_access_group_id`) REFERENCES `access_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department_additional_access_groups` ADD CONSTRAINT `department_additional_access_groups_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department_additional_access_groups` ADD CONSTRAINT `department_additional_access_groups_access_group_id_fkey` FOREIGN KEY (`access_group_id`) REFERENCES `access_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approver_groups` ADD CONSTRAINT `approver_groups_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approver_group_members` ADD CONSTRAINT `approver_group_members_approver_group_id_fkey` FOREIGN KEY (`approver_group_id`) REFERENCES `approver_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approver_group_members` ADD CONSTRAINT `approver_group_members_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approver_group_purposes` ADD CONSTRAINT `approver_group_purposes_approver_group_id_fkey` FOREIGN KEY (`approver_group_id`) REFERENCES `approver_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approver_group_purposes` ADD CONSTRAINT `approver_group_purposes_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approver_group_notify_channels` ADD CONSTRAINT `approver_group_notify_channels_approver_group_id_fkey` FOREIGN KEY (`approver_group_id`) REFERENCES `approver_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_points` ADD CONSTRAINT `service_points_assigned_staff_id_fkey` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_point_purposes` ADD CONSTRAINT `service_point_purposes_service_point_id_fkey` FOREIGN KEY (`service_point_id`) REFERENCES `service_points`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_point_purposes` ADD CONSTRAINT `service_point_purposes_visit_purpose_id_fkey` FOREIGN KEY (`visit_purpose_id`) REFERENCES `visit_purposes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_point_documents` ADD CONSTRAINT `service_point_documents_service_point_id_fkey` FOREIGN KEY (`service_point_id`) REFERENCES `service_points`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_point_documents` ADD CONSTRAINT `service_point_documents_identity_document_type_id_fkey` FOREIGN KEY (`identity_document_type_id`) REFERENCES `identity_document_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `counter_staff_assignments` ADD CONSTRAINT `counter_staff_assignments_service_point_id_fkey` FOREIGN KEY (`service_point_id`) REFERENCES `service_points`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `counter_staff_assignments` ADD CONSTRAINT `counter_staff_assignments_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `system_settings` ADD CONSTRAINT `system_settings_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_type_visit_types` ADD CONSTRAINT `document_type_visit_types_document_type_id_fkey` FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_template_variables` ADD CONSTRAINT `notification_template_variables_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `notification_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_config` ADD CONSTRAINT `email_config_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `line_oa_config` ADD CONSTRAINT `line_oa_config_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `line_flex_templates` ADD CONSTRAINT `line_flex_templates_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `line_flex_template_rows` ADD CONSTRAINT `line_flex_template_rows_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `line_flex_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `line_flex_template_buttons` ADD CONSTRAINT `line_flex_template_buttons_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `line_flex_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_slip_sections` ADD CONSTRAINT `visit_slip_sections_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `visit_slip_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_slip_fields` ADD CONSTRAINT `visit_slip_fields_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `visit_slip_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pdpa_consent_configs` ADD CONSTRAINT `pdpa_consent_configs_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pdpa_consent_versions` ADD CONSTRAINT `pdpa_consent_versions_config_id_fkey` FOREIGN KEY (`config_id`) REFERENCES `pdpa_consent_configs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pdpa_consent_versions` ADD CONSTRAINT `pdpa_consent_versions_changed_by_fkey` FOREIGN KEY (`changed_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pdpa_consent_logs` ADD CONSTRAINT `pdpa_consent_logs_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocklist` ADD CONSTRAINT `blocklist_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocklist` ADD CONSTRAINT `blocklist_added_by_fkey` FOREIGN KEY (`added_by`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocklist_check_logs` ADD CONSTRAINT `blocklist_check_logs_blocklist_id_fkey` FOREIGN KEY (`blocklist_id`) REFERENCES `blocklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocklist_check_logs` ADD CONSTRAINT `blocklist_check_logs_checked_by_fkey` FOREIGN KEY (`checked_by`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_department_stats` ADD CONSTRAINT `report_department_stats_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
