-- Fix Missing evening_notifications Column
-- Run this in your Supabase SQL Editor to add the missing column
-- Error: Could not find the 'evening_notifications' column

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS evening_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_time_evening VARCHAR(5) DEFAULT '20:00';

-- Update existing users to have evening notifications disabled by default
UPDATE user_profiles 
SET evening_notifications = false, notification_time_evening = '20:00'
WHERE evening_notifications IS NULL OR notification_time_evening IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('evening_notifications', 'notification_time_evening');


