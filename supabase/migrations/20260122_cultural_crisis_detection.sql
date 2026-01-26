-- Cultural Crisis Detection System for Mind Brother
-- Enhances crisis detection with cultural context awareness
-- Helps avoid over-escalation while providing culturally relevant resources

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Cultural crisis assessment logs - audit trail for all crisis detections
CREATE TABLE IF NOT EXISTS cultural_crisis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User identification (hashed for privacy)
  user_id_hashed TEXT NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Crisis assessment details
  severity INTEGER NOT NULL CHECK (severity BETWEEN 0 AND 5),
  original_severity INTEGER, -- Before cultural adjustment
  crisis_type TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  
  -- Cultural context
  cultural_context TEXT, -- e.g., 'workplace_cultural_stress', 'police_fear'
  adjustment_reason TEXT, -- Why severity was adjusted
  cultural_considerations TEXT[], -- Array of considerations applied
  
  -- Resources provided
  resources_provided TEXT[] NOT NULL DEFAULT '{}',
  culturally_relevant_resources TEXT[] DEFAULT '{}',
  
  -- Review flags
  requires_human_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Retention (5 years for compliance)
  retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 years')
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_cultural_crisis_logs_created 
  ON cultural_crisis_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cultural_crisis_logs_severity 
  ON cultural_crisis_logs(severity DESC);
CREATE INDEX IF NOT EXISTS idx_cultural_crisis_logs_context 
  ON cultural_crisis_logs(cultural_context);
CREATE INDEX IF NOT EXISTS idx_cultural_crisis_logs_review 
  ON cultural_crisis_logs(requires_human_review) WHERE requires_human_review = TRUE;

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE cultural_crisis_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/professionals can view crisis logs
CREATE POLICY "Professionals can view cultural crisis logs"
  ON cultural_crisis_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('professional', 'admin')
    )
  );

-- Only the system can insert logs (via service role)
CREATE POLICY "Service role can insert cultural crisis logs"
  ON cultural_crisis_logs FOR INSERT
  WITH CHECK (TRUE);

-- Only admins can update (for review notes)
CREATE POLICY "Admins can update cultural crisis logs"
  ON cultural_crisis_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- 3. ANALYTICS FUNCTIONS
-- ============================================

-- Get cultural crisis statistics
CREATE OR REPLACE FUNCTION get_cultural_crisis_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_assessments', COUNT(*),
    'by_severity', (
      SELECT json_object_agg(severity, count)
      FROM (
        SELECT severity, COUNT(*) as count
        FROM cultural_crisis_logs
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY severity
      ) s
    ),
    'by_type', (
      SELECT json_object_agg(crisis_type, count)
      FROM (
        SELECT crisis_type, COUNT(*) as count
        FROM cultural_crisis_logs
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY crisis_type
      ) t
    ),
    'by_context', (
      SELECT json_object_agg(cultural_context, count)
      FROM (
        SELECT COALESCE(cultural_context, 'none') as cultural_context, COUNT(*) as count
        FROM cultural_crisis_logs
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY cultural_context
      ) c
    ),
    'adjustment_rate', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE adjustment_reason IS NOT NULL)::NUMERIC / 
         NULLIF(COUNT(*), 0)) * 100, 2
      )
      FROM cultural_crisis_logs
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'avg_severity_adjustment', (
      SELECT ROUND(AVG(original_severity - severity)::NUMERIC, 2)
      FROM cultural_crisis_logs
      WHERE created_at BETWEEN start_date AND end_date
        AND original_severity IS NOT NULL
        AND adjustment_reason IS NOT NULL
    ),
    'pending_review_count', (
      SELECT COUNT(*)
      FROM cultural_crisis_logs
      WHERE requires_human_review = TRUE
        AND reviewed_at IS NULL
    )
  ) INTO result
  FROM cultural_crisis_logs
  WHERE created_at BETWEEN start_date AND end_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get crisis logs that need human review
CREATE OR REPLACE FUNCTION get_pending_crisis_reviews()
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  severity INTEGER,
  crisis_type TEXT,
  cultural_context TEXT,
  adjustment_reason TEXT,
  cultural_considerations TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ccl.id,
    ccl.created_at,
    ccl.severity,
    ccl.crisis_type,
    ccl.cultural_context,
    ccl.adjustment_reason,
    ccl.cultural_considerations
  FROM cultural_crisis_logs ccl
  WHERE ccl.requires_human_review = TRUE
    AND ccl.reviewed_at IS NULL
  ORDER BY ccl.severity DESC, ccl.created_at ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark a crisis log as reviewed
CREATE OR REPLACE FUNCTION mark_crisis_reviewed(
  log_id UUID,
  reviewer_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE cultural_crisis_logs
  SET 
    reviewed_by = reviewer_id,
    reviewed_at = NOW(),
    review_notes = notes
  WHERE id = log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_cultural_crisis_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_crisis_reviews TO authenticated;
GRANT EXECUTE ON FUNCTION mark_crisis_reviewed TO authenticated;

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE cultural_crisis_logs IS 'Audit trail for crisis detections with cultural context awareness';
COMMENT ON COLUMN cultural_crisis_logs.cultural_context IS 'The detected cultural context (e.g., workplace_cultural_stress, police_fear, immigration_fear)';
COMMENT ON COLUMN cultural_crisis_logs.adjustment_reason IS 'Why the severity was adjusted based on cultural context';
COMMENT ON COLUMN cultural_crisis_logs.original_severity IS 'The initial severity before cultural context adjustment';
