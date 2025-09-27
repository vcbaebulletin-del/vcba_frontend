-- Debug script to check announcement data
-- Run these queries to understand the visibility filtering issue

-- 1. Check all announcements with is_alert = 1
SELECT 
    announcement_id,
    title,
    is_alert,
    visibility_start_at,
    visibility_end_at,
    created_at,
    status,
    CASE 
        WHEN visibility_start_at IS NULL THEN 'No start date'
        WHEN visibility_start_at <= NOW() THEN 'Started'
        ELSE 'Future start'
    END as start_status,
    CASE 
        WHEN visibility_end_at IS NULL THEN 'No end date'
        WHEN visibility_end_at >= NOW() THEN 'Not expired'
        ELSE 'Expired'
    END as end_status,
    CASE 
        WHEN (visibility_start_at IS NULL OR visibility_start_at <= NOW()) 
         AND (visibility_end_at IS NULL OR visibility_end_at >= NOW()) 
        THEN 'VISIBLE'
        ELSE 'HIDDEN'
    END as visibility_status
FROM announcements 
WHERE is_alert = 1
ORDER BY created_at DESC;

-- 2. Check all announcements (alert and non-alert) with visibility info
SELECT 
    announcement_id,
    title,
    is_alert,
    visibility_start_at,
    visibility_end_at,
    status,
    CASE 
        WHEN (visibility_start_at IS NULL OR visibility_start_at <= NOW()) 
         AND (visibility_end_at IS NULL OR visibility_end_at >= NOW()) 
        THEN 'VISIBLE'
        ELSE 'HIDDEN'
    END as visibility_status
FROM announcements 
WHERE status = 'published'
ORDER BY 
    is_alert DESC,
    visibility_start_at DESC
LIMIT 10;

-- 3. Count announcements by visibility status
SELECT 
    is_alert,
    CASE 
        WHEN (visibility_start_at IS NULL OR visibility_start_at <= NOW()) 
         AND (visibility_end_at IS NULL OR visibility_end_at >= NOW()) 
        THEN 'VISIBLE'
        ELSE 'HIDDEN'
    END as visibility_status,
    COUNT(*) as count
FROM announcements 
WHERE status = 'published'
GROUP BY is_alert, visibility_status
ORDER BY is_alert DESC, visibility_status;

-- 4. Show current time for reference
SELECT NOW() as current_time;
