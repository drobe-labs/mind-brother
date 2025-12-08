-- Simple fix for discussion_topics table
-- Run this in your Supabase SQL Editor

-- Add description column if it doesn't exist
ALTER TABLE discussion_topics 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'discussion_topics' 
AND column_name = 'description';







