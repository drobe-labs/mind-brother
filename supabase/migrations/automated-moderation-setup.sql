-- ============================================
-- AUTOMATED MODERATION SETUP
-- Functions and triggers for automated moderation
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. UPDATE REPUTATION ON WARNING
-- ============================================
CREATE OR REPLACE FUNCTION update_reputation_on_warning()
RETURNS TRIGGER AS $$
DECLARE
  current_warnings INTEGER := 0;
  current_reports INTEGER := 0;
  new_score INTEGER;
  new_trust_level VARCHAR(20);
BEGIN
  -- Get current counts (handle case where user_reputation doesn't exist yet)
  SELECT 
    COALESCE(warnings_received, 0),
    COALESCE(reports_received, 0)
  INTO current_warnings, current_reports
  FROM user_reputation
  WHERE user_id = NEW.target_user_id;
  
  -- If no record exists, defaults to 0 (already set above)

  -- Calculate new score
  new_score := 100 - (current_warnings * 10) - (current_reports * 5);
  new_score := GREATEST(0, LEAST(200, new_score));

  -- Determine trust level
  IF new_score < 30 OR NEW.action_type = 'ban' THEN
    new_trust_level := 'restricted';
  ELSIF new_score < 50 OR current_warnings >= 3 THEN
    new_trust_level := 'at-risk';
  ELSIF new_score >= 150 THEN
    new_trust_level := 'trusted';
  ELSIF current_warnings >= 1 THEN
    new_trust_level := 'member';
  ELSE
    new_trust_level := 'new';
  END IF;

  -- Update reputation
  INSERT INTO user_reputation (
    user_id,
    warnings_received,
    reports_received,
    reputation_score,
    trust_level
  )
  VALUES (
    NEW.target_user_id,
    CASE WHEN NEW.action_type = 'warning' THEN 1 ELSE 0 END,
    CASE WHEN NEW.action_type = 'warning' THEN 0 ELSE 1 END,
    new_score,
    new_trust_level
  )
  ON CONFLICT (user_id) DO UPDATE SET
    warnings_received = user_reputation.warnings_received + 
      CASE WHEN NEW.action_type = 'warning' THEN 1 ELSE 0 END,
    reports_received = user_reputation.reports_received + 
      CASE WHEN NEW.action_type != 'warning' THEN 1 ELSE 0 END,
    reputation_score = new_score,
    trust_level = new_trust_level,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_reputation_on_warning ON moderation_log;
CREATE TRIGGER trigger_update_reputation_on_warning
AFTER INSERT ON moderation_log
FOR EACH ROW
WHEN (NEW.action_type IN ('warning', 'suspension', 'ban'))
EXECUTE FUNCTION update_reputation_on_warning();

-- ============================================
-- 2. AUTO-ESCALATE HIGH-PRIORITY REPORTS
-- ============================================
CREATE OR REPLACE FUNCTION auto_escalate_reports()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-escalate P0 reports immediately
  IF NEW.priority_level = 'P0' THEN
    NEW.status := 'reviewing';
    -- You can add notification logic here
  END IF;

  -- Auto-escalate if multiple reports on same content (not including this one)
  IF (SELECT COUNT(*) FROM content_reports 
      WHERE reported_content_id = NEW.reported_content_id 
      AND content_type = NEW.content_type
      AND id != NEW.id) >= 2 THEN
    NEW.priority_level := 'P0';
    NEW.status := 'reviewing';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_escalate_reports ON content_reports;
CREATE TRIGGER trigger_auto_escalate_reports
BEFORE INSERT ON content_reports
FOR EACH ROW
EXECUTE FUNCTION auto_escalate_reports();

-- ============================================
-- 3. CHECK USER SUSPENSION STATUS
-- ============================================
CREATE OR REPLACE FUNCTION check_user_suspension_status()
RETURNS TRIGGER AS $$
DECLARE
  user_banned BOOLEAN := FALSE;
  user_ban_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is currently suspended
  SELECT is_banned, ban_expires_at
  INTO user_banned, user_ban_expires
  FROM user_reputation
  WHERE user_id = NEW.user_id;

  -- If user is banned and ban hasn't expired, prevent posting
  IF user_banned = TRUE AND 
     user_ban_expires IS NOT NULL AND
     user_ban_expires > NOW() THEN
    RAISE EXCEPTION 'User account is currently suspended. Please check your account status.';
  END IF;

  -- If ban has expired, remove ban
  IF user_banned = TRUE AND 
     user_ban_expires IS NOT NULL AND
     user_ban_expires <= NOW() THEN
    UPDATE user_reputation
    SET is_banned = FALSE,
        ban_expires_at = NULL,
        ban_reason = NULL,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for both tables
DROP TRIGGER IF EXISTS trigger_check_suspension_topics ON discussion_topics;
CREATE TRIGGER trigger_check_suspension_topics
BEFORE INSERT ON discussion_topics
FOR EACH ROW
EXECUTE FUNCTION check_user_suspension_status();

DROP TRIGGER IF EXISTS trigger_check_suspension_replies ON discussion_replies;
CREATE TRIGGER trigger_check_suspension_replies
BEFORE INSERT ON discussion_replies
FOR EACH ROW
EXECUTE FUNCTION check_user_suspension_status();

-- ============================================
-- 4. AUTO-CLOSE EXPIRED BANS
-- ============================================
CREATE OR REPLACE FUNCTION auto_close_expired_bans()
RETURNS void AS $$
BEGIN
  UPDATE user_reputation
  SET is_banned = FALSE,
      ban_expires_at = NULL,
      ban_reason = NULL,
      updated_at = NOW()
  WHERE is_banned = TRUE
    AND ban_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can call this function periodically (e.g., via cron job)
-- Or create a scheduled job in Supabase

-- ============================================
-- 5. VERIFICATION
-- ============================================
SELECT 
  'Automated Moderation Setup Complete!' as status,
  (SELECT COUNT(*) FROM user_reputation WHERE is_banned = TRUE) as currently_banned,
  (SELECT COUNT(*) FROM user_reputation WHERE trust_level = 'at-risk') as at_risk_users,
  (SELECT COUNT(*) FROM content_reports WHERE status = 'pending') as pending_reports;

