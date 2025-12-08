-- Professional Signup Enhancement Migration (SAFE VERSION)
-- This version checks for existing columns before adding them
-- Run this in your Supabase SQL Editor
-- Date: 2025-01-04

-- Function to add column only if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name text,
    column_name text,
    column_type text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = table_name
        AND column_name = column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 1. Add new professional fields to user_profiles table (only if they don't exist)
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
SELECT add_column_if_not_exists('user_profiles', 'languages_spoken', 'TEXT[] DEFAULT ARRAY[''English'']');
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

-- 2. Add indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_status ON user_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_license_state ON user_profiles(license_state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_accepting_new_clients ON user_profiles(accepting_new_clients);
CREATE INDEX IF NOT EXISTS idx_user_profiles_specializations ON user_profiles USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city_state ON user_profiles(city, state);

-- 3. Create a storage bucket for professional documents (if doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Drop existing storage policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can upload their own professional documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own professional documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all professional documents" ON storage.objects;

-- 5. Create storage policies for professional documents
-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own professional documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to read their own documents
CREATE POLICY "Users can read their own professional documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

-- Allow admins to read all professional documents (if you have admin users)
-- Uncomment this if you have an admin system:
-- CREATE POLICY "Admins can read all professional documents"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'documents' 
--   AND EXISTS (
--     SELECT 1 FROM user_profiles 
--     WHERE user_id = auth.uid() 
--     AND user_type = 'admin'
--   )
-- );

-- 6. Create professional_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS professional_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  verification_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  verification_type TEXT NOT NULL CHECK (verification_type IN ('initial', 'renewal', 'update')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
  license_verified BOOLEAN DEFAULT FALSE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  background_check_completed BOOLEAN DEFAULT FALSE,
  id_verified BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add index for professional_verifications
CREATE INDEX IF NOT EXISTS idx_professional_verifications_user_id ON professional_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_verifications_status ON professional_verifications(status);

-- 7. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professional_verifications_updated_at ON professional_verifications;
CREATE TRIGGER update_professional_verifications_updated_at
  BEFORE UPDATE ON professional_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Create a view for professional profiles with verification status
CREATE OR REPLACE VIEW professional_profiles_with_verification AS
SELECT 
  up.*,
  pv.status as latest_verification_status,
  pv.verification_date as latest_verification_date,
  pv.license_verified,
  pv.insurance_verified,
  pv.background_check_completed,
  pv.id_verified
FROM user_profiles up
LEFT JOIN LATERAL (
  SELECT *
  FROM professional_verifications
  WHERE user_id = up.user_id
  ORDER BY created_at DESC
  LIMIT 1
) pv ON true
WHERE up.user_type = 'professional';

-- 10. Create RLS (Row Level Security) policies for professional_verifications
ALTER TABLE professional_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own verification records" ON professional_verifications;
DROP POLICY IF EXISTS "Admins can view all verification records" ON professional_verifications;
DROP POLICY IF EXISTS "Only admins can manage verifications" ON professional_verifications;

-- Users can view their own verification records
CREATE POLICY "Users can view their own verification records"
ON professional_verifications FOR SELECT
USING (auth.uid() = user_id);

-- Note: Admin policies commented out - uncomment if you have admin system
-- CREATE POLICY "Admins can view all verification records"
-- ON professional_verifications FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_profiles 
--     WHERE user_id = auth.uid() 
--     AND user_type = 'admin'
--   )
-- );

-- CREATE POLICY "Only admins can manage verifications"
-- ON professional_verifications FOR ALL
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_profiles 
--     WHERE user_id = auth.uid() 
--     AND user_type = 'admin'
--   )
-- );

-- 11. Create a function to automatically create verification record on professional signup
CREATE OR REPLACE FUNCTION create_verification_record()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type = 'professional' AND NEW.verification_submitted_at IS NOT NULL THEN
    -- Check if verification record doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM professional_verifications 
      WHERE user_id = NEW.user_id 
      AND verification_type = 'initial'
    ) THEN
      INSERT INTO professional_verifications (
        user_id,
        verification_type,
        status,
        license_verified,
        insurance_verified,
        background_check_completed,
        id_verified
      ) VALUES (
        NEW.user_id,
        'initial',
        'pending',
        false,
        false,
        false,
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create trigger to auto-create verification record
DROP TRIGGER IF EXISTS create_verification_record_trigger ON user_profiles;
CREATE TRIGGER create_verification_record_trigger
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (NEW.user_type = 'professional' AND NEW.verification_submitted_at IS NOT NULL)
  EXECUTE FUNCTION create_verification_record();

-- 13. Add helpful comments
COMMENT ON COLUMN user_profiles.professional_title IS 'Professional title (e.g., Licensed Clinical Psychologist)';
COMMENT ON COLUMN user_profiles.primary_credential IS 'Primary credential (e.g., PhD, LCSW, LPC)';
COMMENT ON COLUMN user_profiles.license_expiration_date IS 'Date when professional license expires';
COMMENT ON COLUMN user_profiles.npi_number IS 'National Provider Identifier (US only)';
COMMENT ON COLUMN user_profiles.verification_status IS 'Current verification status: pending, approved, rejected, needs_info';
COMMENT ON COLUMN user_profiles.license_document_url IS 'URL to uploaded professional license document';
COMMENT ON COLUMN user_profiles.insurance_certificate_url IS 'URL to uploaded liability insurance certificate';
COMMENT ON COLUMN user_profiles.government_id_url IS 'URL to uploaded government-issued ID for verification';

COMMENT ON TABLE professional_verifications IS 'Tracks verification history and status for professional accounts';

-- 14. Create helper function to get professional profile completeness
CREATE OR REPLACE FUNCTION get_profile_completeness(profile_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 0;
  completed_fields INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM user_profiles WHERE user_id = profile_user_id;
  
  IF profile_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Check required fields (30 total for comprehensive profile)
  total_fields := 30;
  
  IF profile_record.first_name IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.last_name IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.professional_title IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.primary_credential IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.phone_number IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.license_type IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.license_number IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.license_state IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.license_expiration_date IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.practice_type IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.years_in_practice IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.specialties IS NOT NULL AND array_length(profile_record.specialties, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.age_groups_served IS NOT NULL AND array_length(profile_record.age_groups_served, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.therapeutic_approach IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.bio IS NOT NULL AND length(profile_record.bio) >= 100 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.session_types IS NOT NULL AND array_length(profile_record.session_types, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.languages_spoken IS NOT NULL AND array_length(profile_record.languages_spoken, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.office_address IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.city IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.state IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.zip_code IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.has_liability_insurance = true THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.insurance_provider IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.insurance_policy_number IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.insurance_expiration_date IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.license_document_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.insurance_certificate_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.government_id_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.profile_image_url IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF profile_record.consented_to_background_check = true THEN completed_fields := completed_fields + 1; END IF;
  
  RETURN (completed_fields * 100 / total_fields);
END;
$$ LANGUAGE plpgsql;

-- 15. Grant necessary permissions
GRANT SELECT ON professional_profiles_with_verification TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_completeness(UUID) TO authenticated;

-- Clean up helper function
DROP FUNCTION IF EXISTS add_column_if_not_exists(text, text, text);

-- Migration complete!
SELECT 'Professional signup migration completed successfully!' as status,
       'Added ' || count(*) || ' new columns' as details
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN (
  'professional_title', 'primary_credential', 'license_expiration_date',
  'verification_status', 'license_document_url'
);



