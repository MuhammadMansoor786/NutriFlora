-- =============================================================================
-- NutriFlora MySQL schema (XAMPP / MariaDB compatible)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `fruit_veg_health_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `fruit_veg_health_db`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `users` (`full_name`, `email`, `password_hash`, `role`)
VALUES (
  'NutriFlora Admin',
  'admin@nutriflora.com',
  '$2b$10$GGETPyhxq9Kw9T1mTw/24epY4QJSeRK9vZwEZI7TTJ27LtC5akHBG',
  'admin'
);

CREATE TABLE IF NOT EXISTS `scan_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `item_name` VARCHAR(120) NOT NULL,
  `category` ENUM('Fruit', 'Vegetable', 'Other') NOT NULL DEFAULT 'Other',
  `scientific_name` VARCHAR(150) NULL,
  `origin` TEXT NULL,
  `growing_regions` TEXT NULL,
  `nutritional_values` JSON NULL,
  `health_benefits` JSON NULL,
  `precautions` JSON NULL,
  `confidence_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_scan_history_user_id` (`user_id`),
  INDEX `idx_scan_history_category` (`category`),
  INDEX `idx_scan_history_created_at` (`created_at`),
  CONSTRAINT `fk_scan_history_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `saved_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `scan_id` INT NOT NULL,
  `personal_note` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_saved_items_user_id` (`user_id`),
  INDEX `idx_saved_items_scan_id` (`scan_id`),
  UNIQUE KEY `uq_saved_user_scan` (`user_id`, `scan_id`),
  CONSTRAINT `fk_saved_items_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_saved_items_scan`
    FOREIGN KEY (`scan_id`) REFERENCES `scan_history` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `food_catalog` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL UNIQUE,
  `category` ENUM('Fruit', 'Vegetable') NOT NULL,
  `scientific_name` VARCHAR(150) NOT NULL,
  `origin` TEXT NULL,
  `season` VARCHAR(100) NULL,
  `calories_per_100g` INT NOT NULL DEFAULT 0,
  `nutritional_values` JSON NULL,
  `health_benefits` JSON NULL,
  `precautions` JSON NULL,
  `image_url` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_food_catalog_category` (`category`),
  INDEX `idx_food_catalog_season` (`season`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
