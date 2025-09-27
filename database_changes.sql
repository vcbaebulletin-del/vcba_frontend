-- Database Changes for NewsFeed Enhancement
-- Date: 2025-09-01
-- Purpose: Add is_alert column to school_calendar and announcements tables

-- =====================================================
-- BACKUP TABLES FIRST (IMPORTANT!)
-- =====================================================

-- Backup school_calendar table
CREATE TABLE school_calendar_backup AS SELECT * FROM school_calendar;

-- Backup announcements table  
CREATE TABLE announcements_backup AS SELECT * FROM announcements;

-- =====================================================
-- ALTER TABLE STATEMENTS
-- =====================================================

-- Add is_alert column to school_calendar table
ALTER TABLE `school_calendar`
  ADD COLUMN `is_alert` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether this event is marked as an alert/urgent' AFTER `end_date`;

-- Add is_alert column to announcements table (if it doesn't exist)
ALTER TABLE `announcements`
  ADD COLUMN `is_alert` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether this announcement is marked as an alert/urgent' AFTER `visibility_end_at`;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check school_calendar table structure
DESCRIBE school_calendar;

-- Check announcements table structure  
DESCRIBE announcements;

-- Sample data verification for school_calendar
SELECT id, title, event_date, end_date, is_alert 
FROM school_calendar 
ORDER BY event_date DESC 
LIMIT 10;

-- Sample data verification for announcements
SELECT announcement_id, title, visibility_start_at, visibility_end_at, is_alert 
FROM announcements 
ORDER BY visibility_start_at DESC 
LIMIT 10;

-- =====================================================
-- ROLLBACK STATEMENTS (if needed)
-- =====================================================

-- To rollback school_calendar changes:
-- ALTER TABLE `school_calendar` DROP COLUMN `is_alert`;
-- DROP TABLE school_calendar;
-- RENAME TABLE school_calendar_backup TO school_calendar;

-- To rollback announcements changes:
-- ALTER TABLE `announcements` DROP COLUMN `is_alert`;
-- DROP TABLE announcements;
-- RENAME TABLE announcements_backup TO announcements;

-- =====================================================
-- SAMPLE TEST DATA (optional)
-- =====================================================

-- Mark some announcements as alerts for testing
-- UPDATE announcements SET is_alert = 1 WHERE announcement_id IN (1, 2, 3);

-- Mark some calendar events as alerts for testing  
-- UPDATE school_calendar SET is_alert = 1 WHERE id IN (1, 2);
