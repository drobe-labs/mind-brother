-- ============================================
-- FIX RLS POLICIES FOR USER_BEHAVIOR_TRACKING TABLE
-- This adds missing INSERT and UPDATE policies
-- ============================================

-- Users can insert their own behavior tracking
DROP POLICY IF EXISTS "Users can insert own behavior" ON user_behavior_tracking;
CREATE POLICY "Users can insert own behavior" ON user_behavior_tracking
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own behavior tracking
DROP POLICY IF EXISTS "Users can update own behavior" ON user_behavior_tracking;
CREATE POLICY "Users can update own behavior" ON user_behavior_tracking
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Moderators can insert behavior tracking for any user (for moderation purposes)
DROP POLICY IF EXISTS "Moderators can insert behavior" ON user_behavior_tracking;
CREATE POLICY "Moderators can insert behavior" ON user_behavior_tracking
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

-- Moderators can update behavior tracking for any user
DROP POLICY IF EXISTS "Moderators can update behavior" ON user_behavior_tracking;
CREATE POLICY "Moderators can update behavior" ON user_behavior_tracking
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

-- Grant permissions
GRANT ALL ON user_behavior_tracking TO authenticated;
GRANT ALL ON user_behavior_tracking TO service_role;


