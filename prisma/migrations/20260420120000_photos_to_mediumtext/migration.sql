-- Widen photo columns to store base64 data URLs instead of file paths.
-- VarChar(255) → MediumText (~16MB). Non-destructive: existing short values remain valid.

ALTER TABLE `visitors`
  MODIFY COLUMN `photo` MEDIUMTEXT NULL;

ALTER TABLE `visit_entries`
  MODIFY COLUMN `face_photo_path` MEDIUMTEXT NULL;

ALTER TABLE `visit_records`
  MODIFY COLUMN `face_photo_path` MEDIUMTEXT NULL;
