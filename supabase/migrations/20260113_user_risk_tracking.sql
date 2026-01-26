-- User Risk Tracking Tables
-- Created: 2026-01-13
-- Purpose: Track user behavior patterns to identify escalating crisis situations

-- ============================================================================
-- USER RISK PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_risk_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT,
    escalation_score INTEGER DEFAULT 0 CHECK (escalation_score >= 0 AND escalation_score <= 100),
    risk_trend TEXT DEFAULT 'stable' CHECK (risk_trend IN ('improving', 'stable', 'escalating', 'critical')),
    crisis_keyword_count INTEGER DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    last_crisis_post TIMESTAMP WITH TIME ZONE,
    flagged_for_review BOOLEAN DEFAULT FALSE,
    intervention_suggested BOOLEAN DEFAULT FALSE,
    recent_posts_json JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_risk_profiles
CREATE INDEX IF NOT EXISTS idx_risk_profiles_user_id ON user_risk_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_escalation_score ON user_risk_profiles(escalation_score DESC);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_risk_trend ON user_risk_profiles(risk_trend);
CREATE INDEX IF NOT EXISTS idx_risk_profiles_flagged ON user_risk_profiles(flagged_for_review) WHERE flagged_for_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_risk_profiles_updated ON user_risk_profiles(updated_at DESC);

-- Enable RLS
ALTER TABLE user_risk_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_risk_profiles
DROP POLICY IF EXISTS "Users can view own risk profile" ON user_risk_profiles;
DROP POLICY IF EXISTS "System can insert risk profiles" ON user_risk_profiles;
DROP POLICY IF EXISTS "System can update risk profiles" ON user_risk_profiles;
DROP POLICY IF EXISTS "Moderators can view all risk profiles" ON user_risk_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own risk profile" ON user_risk_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Service role can insert/update (for the tracking system)
CREATE POLICY "System can insert risk profiles" ON user_risk_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update risk profiles" ON user_risk_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Moderators can view all profiles (check if user is moderator)
CREATE POLICY "Moderators can view all risk profiles" ON user_risk_profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'moderator'
        )
    );

-- ============================================================================
-- RISK ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    username TEXT,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('multiple_crisis_posts', 'escalating_behavior', 'coordinated_harm', 'severe_decline')),
    severity TEXT NOT NULL CHECK (severity IN ('medium', 'high', 'critical')),
    reason TEXT NOT NULL,
    recommended_action TEXT,
    data JSONB DEFAULT '{}',
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for risk_alerts
CREATE INDEX IF NOT EXISTS idx_risk_alerts_user_id ON risk_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_severity ON risk_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_alert_type ON risk_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_reviewed ON risk_alerts(reviewed) WHERE reviewed = FALSE;
CREATE INDEX IF NOT EXISTS idx_risk_alerts_created ON risk_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_alerts
DROP POLICY IF EXISTS "Moderators can view all alerts" ON risk_alerts;
DROP POLICY IF EXISTS "System can insert alerts" ON risk_alerts;
DROP POLICY IF EXISTS "Moderators can update alerts" ON risk_alerts;

-- Only moderators can view alerts
CREATE POLICY "Moderators can view all alerts" ON risk_alerts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'moderator'
        )
    );

-- Any authenticated user can insert alerts (the system does this)
CREATE POLICY "System can insert alerts" ON risk_alerts
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Only moderators can update alerts (mark as reviewed)
CREATE POLICY "Moderators can update alerts" ON risk_alerts
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'moderator'
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_risk_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS trigger_risk_profile_updated ON user_risk_profiles;
CREATE TRIGGER trigger_risk_profile_updated
    BEFORE UPDATE ON user_risk_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_risk_profile_timestamp();

-- ============================================================================
-- VIEWS FOR MODERATOR DASHBOARD
-- ============================================================================

-- View: High-risk users summary
CREATE OR REPLACE VIEW high_risk_users_summary AS
SELECT 
    urp.user_id,
    urp.username,
    urp.escalation_score,
    urp.risk_trend,
    urp.crisis_keyword_count,
    urp.last_crisis_post,
    urp.flagged_for_review,
    urp.intervention_suggested,
    urp.updated_at,
    COUNT(ra.id) as active_alerts,
    MAX(ra.severity) as highest_alert_severity
FROM user_risk_profiles urp
LEFT JOIN risk_alerts ra ON urp.user_id = ra.user_id AND ra.reviewed = FALSE
WHERE urp.escalation_score >= 50
GROUP BY urp.id
ORDER BY urp.escalation_score DESC;

-- View: Community health metrics
CREATE OR REPLACE VIEW community_health_metrics AS
SELECT 
    COUNT(*) as total_tracked_users,
    COUNT(*) FILTER (WHERE risk_trend = 'critical') as critical_users,
    COUNT(*) FILTER (WHERE risk_trend = 'escalating') as escalating_users,
    COUNT(*) FILTER (WHERE risk_trend = 'improving') as improving_users,
    COUNT(*) FILTER (WHERE risk_trend = 'stable') as stable_users,
    COUNT(*) FILTER (WHERE flagged_for_review = TRUE) as flagged_for_review,
    COUNT(*) FILTER (WHERE intervention_suggested = TRUE) as interventions_suggested,
    ROUND(AVG(escalation_score)) as avg_escalation_score,
    (SELECT COUNT(*) FROM risk_alerts WHERE reviewed = FALSE) as pending_alerts,
    (SELECT COUNT(*) FROM risk_alerts WHERE severity = 'critical' AND reviewed = FALSE) as critical_pending_alerts
FROM user_risk_profiles
WHERE updated_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to views for authenticated users (moderator check is in RLS)
GRANT SELECT ON high_risk_users_summary TO authenticated;
GRANT SELECT ON community_health_metrics TO authenticated;


