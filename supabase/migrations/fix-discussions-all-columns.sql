-- Add all missing columns to discussion_topics table
-- Run this in your Supabase SQL Editor

-- Add missing columns one by one
ALTER TABLE discussion_topics 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify all columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'discussion_topics' 
ORDER BY ordinal_position;







