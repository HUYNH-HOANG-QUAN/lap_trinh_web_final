-- Fix: user_id must be nullable for guest checkout
-- Run this in MySQL (phpMyAdmin, MySQL Workbench, or CLI)

ALTER TABLE `orders`
  MODIFY COLUMN `user_id` BIGINT NULL DEFAULT NULL;
