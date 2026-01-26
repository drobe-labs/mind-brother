-- Peer Support Matching System for Mind Brother
-- Connects users with similar cultural backgrounds for community support
-- Privacy-first design with explicit consent requirements

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Peer support preferences - stores user opt-in status and privacy settings
CREATE TABLE IF NOT EXISTS peer_support_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Opt-in status
  opted_in BOOLEAN DEFAULT FALSE,
  
  -- Display settings
  display_name TEXT, -- Anonymous name/nickname for peer interactions
  
  -- Privacy controls - what to show to potential matches
  show_cultural_background BOOLEAN DEFAULT TRUE,
  show_communities BOOLEAN DEFAULT TRUE,
  show_concerns BOOLEAN DEFAULT FALSE, -- Default false for privacy
  show_age_range BOOLEAN DEFAULT TRUE,
  
  -- Support preferences
  available_for TEXT[] DEFAULT '{}', -- Types of support willing to provide
  preferred_contact_method TEXT DEFAULT 'in_app_only' CHECK (preferred_contact_method IN ('in_app_only', 'anonymous_chat')),
  max_connections_per_week INTEGER DEFAULT 3 CHECK (max_connections_per_week BETWEEN 1 AND 10),
  
  -- Language preference for matching
  language_preference TEXT DEFAULT 'english',
  
  -- Activity tracking
  last_active TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer connections - tracks connection requests and accepted connections
CREATE TABLE IF NOT EXISTS peer_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Connection parties
  initiator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Connection status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  
  -- Initial message (optional)
  initial_message TEXT,
  
  -- Block tracking
  blocked_by UUID REFERENCES auth.users(id),
  
  -- Activity tracking
  message_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT no_self_connection CHECK (initiator_id != recipient_id),
  CONSTRAINT unique_connection UNIQUE (initiator_id, recipient_id)
);

-- Peer messages - anonymous messaging between connected peers
CREATE TABLE IF NOT EXISTS peer_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Connection reference
  connection_id UUID REFERENCES peer_connections(id) ON DELETE CASCADE NOT NULL,
  
  -- Message details
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  
  -- Read status
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderation
  flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer support activity log - for safety monitoring
CREATE TABLE IF NOT EXISTS peer_support_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Activity details
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'connection_request', 'message_sent', 'block', 'report'
  related_user_id UUID REFERENCES auth.users(id),
  connection_id UUID REFERENCES peer_connections(id),
  
  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

-- Peer support preferences indexes
CREATE INDEX IF NOT EXISTS idx_peer_support_prefs_opted_in 
  ON peer_support_preferences(opted_in) WHERE opted_in = TRUE;
CREATE INDEX IF NOT EXISTS idx_peer_support_prefs_user 
  ON peer_support_preferences(user_id);

-- Peer connections indexes
CREATE INDEX IF NOT EXISTS idx_peer_connections_initiator 
  ON peer_connections(initiator_id);
CREATE INDEX IF NOT EXISTS idx_peer_connections_recipient 
  ON peer_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_peer_connections_status 
  ON peer_connections(status);
CREATE INDEX IF NOT EXISTS idx_peer_connections_pending 
  ON peer_connections(recipient_id, status) WHERE status = 'pending';

-- Peer messages indexes
CREATE INDEX IF NOT EXISTS idx_peer_messages_connection 
  ON peer_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_peer_messages_sender 
  ON peer_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_peer_messages_unread 
  ON peer_messages(connection_id, read_at) WHERE read_at IS NULL;

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_peer_activity_user 
  ON peer_support_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_activity_type 
  ON peer_support_activity_log(activity_type);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE peer_support_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_support_activity_log ENABLE ROW LEVEL SECURITY;

-- Peer support preferences policies
CREATE POLICY "Users can view their own peer preferences"
  ON peer_support_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own peer preferences"
  ON peer_support_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own peer preferences"
  ON peer_support_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Limited view for matching - only show opted-in users with privacy controls
CREATE POLICY "Users can view opted-in peers for matching"
  ON peer_support_preferences FOR SELECT
  USING (
    opted_in = TRUE 
    AND EXISTS (
      SELECT 1 FROM peer_support_preferences 
      WHERE user_id = auth.uid() AND opted_in = TRUE
    )
  );

-- Peer connections policies
CREATE POLICY "Users can view their own connections"
  ON peer_connections FOR SELECT
  USING (auth.uid() IN (initiator_id, recipient_id));

CREATE POLICY "Users can create connection requests"
  ON peer_connections FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update connections they're part of"
  ON peer_connections FOR UPDATE
  USING (auth.uid() IN (initiator_id, recipient_id));

-- Peer messages policies
CREATE POLICY "Users can view messages in their connections"
  ON peer_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM peer_connections
      WHERE id = peer_messages.connection_id
        AND auth.uid() IN (initiator_id, recipient_id)
        AND status = 'accepted'
    )
  );

CREATE POLICY "Users can send messages in accepted connections"
  ON peer_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM peer_connections
      WHERE id = connection_id
        AND auth.uid() IN (initiator_id, recipient_id)
        AND status = 'accepted'
    )
  );

-- Activity log policies (users can only view their own)
CREATE POLICY "Users can view their own activity"
  ON peer_support_activity_log FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all activity for moderation
CREATE POLICY "Admins can view all peer activity"
  ON peer_support_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('professional', 'admin')
    )
  );

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Function to get peer support matches
CREATE OR REPLACE FUNCTION get_peer_matches(
  requesting_user_id UUID,
  match_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  cultural_background TEXT,
  communities TEXT[],
  available_for TEXT[],
  language_preference TEXT,
  age_range TEXT,
  show_cultural_background BOOLEAN,
  show_communities BOOLEAN,
  show_age_range BOOLEAN
) AS $$
BEGIN
  -- Check if requesting user is opted in
  IF NOT EXISTS (
    SELECT 1 FROM peer_support_preferences 
    WHERE peer_support_preferences.user_id = requesting_user_id AND opted_in = TRUE
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    c.cultural_background,
    c.communities,
    p.available_for,
    p.language_preference,
    c.age_range,
    p.show_cultural_background,
    p.show_communities,
    p.show_age_range
  FROM peer_support_preferences p
  JOIN user_cultural_profiles c ON p.user_id = c.user_id
  WHERE p.opted_in = TRUE
    AND p.user_id != requesting_user_id
    -- Exclude blocked connections
    AND NOT EXISTS (
      SELECT 1 FROM peer_connections pc
      WHERE pc.status = 'blocked'
        AND (
          (pc.initiator_id = requesting_user_id AND pc.recipient_id = p.user_id)
          OR (pc.initiator_id = p.user_id AND pc.recipient_id = requesting_user_id)
        )
    )
  ORDER BY 
    -- Prioritize users who were active recently
    p.last_active DESC NULLS LAST
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last active timestamp
CREATE OR REPLACE FUNCTION update_peer_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE peer_support_preferences
  SET last_active = NOW()
  WHERE user_id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last active on message send
CREATE TRIGGER trigger_update_peer_last_active
  AFTER INSERT ON peer_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_peer_last_active();

-- Function to get peer support statistics
CREATE OR REPLACE FUNCTION get_peer_support_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_opted_in', (
      SELECT COUNT(*) FROM peer_support_preferences WHERE opted_in = TRUE
    ),
    'total_connections', (
      SELECT COUNT(*) FROM peer_connections WHERE status = 'accepted'
    ),
    'total_messages', (
      SELECT COUNT(*) FROM peer_messages
    ),
    'pending_requests', (
      SELECT COUNT(*) FROM peer_connections WHERE status = 'pending'
    ),
    'connections_this_week', (
      SELECT COUNT(*) FROM peer_connections 
      WHERE status = 'accepted' 
        AND accepted_at >= NOW() - INTERVAL '7 days'
    ),
    'messages_this_week', (
      SELECT COUNT(*) FROM peer_messages 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    ),
    'support_types', (
      SELECT json_object_agg(support_type, count)
      FROM (
        SELECT unnest(available_for) as support_type, COUNT(*) as count
        FROM peer_support_preferences
        WHERE opted_in = TRUE
        GROUP BY support_type
      ) s
    ),
    'cultural_distribution', (
      SELECT json_object_agg(cultural_background, count)
      FROM (
        SELECT c.cultural_background, COUNT(*) as count
        FROM peer_support_preferences p
        JOIN user_cultural_profiles c ON p.user_id = c.user_id
        WHERE p.opted_in = TRUE AND c.cultural_background IS NOT NULL
        GROUP BY c.cultural_background
      ) cb
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_peer_matches TO authenticated;
GRANT EXECUTE ON FUNCTION get_peer_support_stats TO authenticated;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON TABLE peer_support_preferences IS 'User preferences for peer support matching and privacy settings';
COMMENT ON TABLE peer_connections IS 'Peer-to-peer connection requests and accepted connections';
COMMENT ON TABLE peer_messages IS 'Anonymous messages between connected peers';
COMMENT ON TABLE peer_support_activity_log IS 'Activity log for peer support interactions (for safety monitoring)';

COMMENT ON COLUMN peer_support_preferences.display_name IS 'Anonymous display name shown to other users';
COMMENT ON COLUMN peer_support_preferences.show_concerns IS 'Whether to reveal mental health concerns to matches (default false for privacy)';
COMMENT ON COLUMN peer_support_preferences.available_for IS 'Types of peer support user is willing to provide';
COMMENT ON COLUMN peer_connections.initial_message IS 'Optional message sent with connection request';
