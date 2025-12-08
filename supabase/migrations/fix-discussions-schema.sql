-- Fix discussion_topics table schema
-- Run this in your Supabase SQL Editor

-- 1. Add description column if it doesn't exist
ALTER TABLE discussion_topics 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Ensure user_id column exists and has proper foreign key
-- First, check if the foreign key exists and drop it if needed
DO $$ 
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discussion_topics_user_id_fkey'
        AND table_name = 'discussion_topics'
    ) THEN
        ALTER TABLE discussion_topics
        ADD CONSTRAINT discussion_topics_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Ensure discussion_replies has proper foreign key too
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discussion_replies_user_id_fkey'
        AND table_name = 'discussion_replies'
    ) THEN
        ALTER TABLE discussion_replies
        ADD CONSTRAINT discussion_replies_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Verify the schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'discussion_topics' 
ORDER BY ordinal_position;







