-- Store free-text "ชื่อผู้ที่ต้องการพบ" for cases where the host is not in the Staff DB.
-- Snapshot from Appointment → VisitEntry at check-in (parallels host_staff_id).

ALTER TABLE `appointments`
  ADD COLUMN `host_contact_name` VARCHAR(120) NULL AFTER `host_staff_id`;

ALTER TABLE `visit_entries`
  ADD COLUMN `host_contact_name` VARCHAR(120) NULL AFTER `host_staff_id`;
