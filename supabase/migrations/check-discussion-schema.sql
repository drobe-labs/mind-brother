-- Check what columns actually exist in discussion_topics
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'discussion_topics' 
ORDER BY ordinal_position;







