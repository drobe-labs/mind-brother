-- Fix the foreign key relationship between discussion_replies and user_profiles
-- Run this in your Supabase SQL Editor

-- First, check if the user_id column exists and has the correct type
ALTER TABLE discussion_replies 
  ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'discussion_replies_user_id_fkey'
  ) THEN
    ALTER TABLE discussion_replies
      ADD CONSTRAINT discussion_replies_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Verify the relationship was created
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'discussion_replies' 
  AND tc.constraint_type = 'FOREIGN KEY';



