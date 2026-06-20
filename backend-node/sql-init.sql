-- Create otps table for OTP verification
CREATE TABLE IF NOT EXISTS `otps` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL,
  `otp_code` VARCHAR(10) NOT NULL,
  `action` ENUM('register', 'reset_password') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `attempts` INT DEFAULT 0,
  `is_used` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  INDEX `IDX_otps_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create typeorm_metadata table (required by TypeORM for generated columns)
-- Using only (type, name) as PK since schema/table can be NULL
CREATE TABLE IF NOT EXISTS `typeorm_metadata` (
  `type` VARCHAR(100) NOT NULL,
  `schema` VARCHAR(100) DEFAULT NULL,
  `table` VARCHAR(100) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `value` LONGTEXT DEFAULT NULL,
  PRIMARY KEY (`type`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
