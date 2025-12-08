-- Add Missing Columns for Mind Brother (FIXED VERSION)
-- This adds any columns that might be missing from user_profiles
-- Run this in your Supabase SQL Editor
-- Date: 2025-01-04

-- Function to add column only if it doesn't exist (with fixed parameter names)
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    p_table_name text,
    p_column_name text,
    p_column_type text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = p_table_name
        AND column_name = p_column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_type);
        RAISE NOTICE 'Added column %.%', p_table_name, p_column_name;
    ELSE
        RAISE NOTICE 'Column %.% already exists', p_table_name, p_column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add notification columns (used by SignIn.tsx and other components)
SELECT add_column_if_not_exists('user_profiles', 'notifications_enabled', 'BOOLEAN DEFAULT TRUE');
SELECT add_column_if_not_exists('user_profiles', 'morning_notifications', 'BOOLEAN DEFAULT TRUE');
SELECT add_column_if_not_exists('user_profiles', 'checkin_notifications', 'BOOLEAN DEFAULT TRUE');
SELECT add_column_if_not_exists('user_profiles', 'discussion_notifications', 'BOOLEAN DEFAULT TRUE');
SELECT add_column_if_not_exists('user_profiles', 'mention_notifications', 'BOOLEAN DEFAULT TRUE');
SELECT add_column_if_not_exists('user_profiles', 'notification_time_morning', 'TIME DEFAULT ''08:00:00''');
SELECT add_column_if_not_exists('user_profiles', 'notification_time_checkin', 'TIME DEFAULT ''13:00:00''');

-- Add basic user profile columns (might be missing)
SELECT add_column_if_not_exists('user_profiles', 'username', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'profile_image_url', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'is_verified', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'is_active', 'BOOLEAN DEFAULT TRUE');

-- Add professional columns (for new professional signup)
SELECT add_column_if_not_exists('user_profiles', 'professional_title', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'primary_credential', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'license_expiration_date', 'DATE');
SELECT add_column_if_not_exists('user_profiles', 'npi_number', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'practice_type', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'years_in_practice', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'age_groups_served', 'TEXT[]');
SELECT add_column_if_not_exists('user_profiles', 'cultural_specialties', 'TEXT[]');
SELECT add_column_if_not_exists('user_profiles', 'therapeutic_approach', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'accepts_insurance', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'session_fee_min', 'INTEGER');
SELECT add_column_if_not_exists('user_profiles', 'session_fee_max', 'INTEGER');
SELECT add_column_if_not_exists('user_profiles', 'offers_sliding_scale', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'accepts_medicaid', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'accepts_medicare', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'accepting_new_clients', 'BOOLEAN DEFAULT TRUE');
SELECT add_column_if_not_exists('user_profiles', 'waitlist_length', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'languages_spoken', 'TEXT[]');
SELECT add_column_if_not_exists('user_profiles', 'evening_availability', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'weekend_availability', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'city', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'state', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'zip_code', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'has_liability_insurance', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'insurance_provider', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'insurance_policy_number', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'insurance_expiration_date', 'DATE');
SELECT add_column_if_not_exists('user_profiles', 'consented_to_background_check', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_not_exists('user_profiles', 'license_document_url', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'insurance_certificate_url', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'government_id_url', 'TEXT');
SELECT add_column_if_not_exists('user_profiles', 'verification_status', 'TEXT DEFAULT ''pending''');
SELECT add_column_if_not_exists('user_profiles', 'verification_submitted_at', 'TIMESTAMP WITH TIME ZONE');
SELECT add_column_if_not_exists('user_profiles', 'verification_completed_at', 'TIMESTAMP WITH TIME ZONE');
SELECT add_column_if_not_exists('user_profiles', 'verification_notes', 'TEXT');

-- Clean up helper function
DROP FUNCTION IF EXISTS add_column_if_not_exists(text, text, text);

-- Show summary of what columns exist now
SELECT 
    '✅ user_profiles column check complete!' as status,
    count(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'user_profiles';

-- List all user_profiles columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;



