-- Fix foreign key relationships for discussions
-- Run this in your Supabase SQL Editor

-- First, check if discussion_topics exists and what its user_id references
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
WHERE tc.table_name = 'discussion_topics' 
    AND tc.constraint_type = 'FOREIGN KEY';

-- If user_id references auth.users instead of user_profiles, we need to fix the query
-- Most likely the foreign key is: user_id -> auth.users(id)
-- So we need to join through auth.users to get to user_profiles

-- Check what the foreign key actually references
\d discussion_topics;







