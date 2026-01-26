// moderationService.ts
// Frontend service for moderation features

import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://192.168.5.180:3001';

/**
 * AI-Powered Content Analysis
 */
export async function analyzeContentWithAI(content: string, contentType: 'topic' | 'reply' = 'topic') {
  try {
    const response = await fetch(`${BACKEND_URL}/api/moderation/analyze-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, contentType })
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      analysis: {
        riskLevel: 'medium',
        concerns: [],
        recommendedAction: 'flag'
      }
    };
  }
}

/**
 * Create a dispute for flagged/removed content
 */
export async function createContentDispute(
  userId: string,
  contentId: string,
  contentType: 'topic' | 'reply',
  reason: string
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/moderation/disputes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, contentId, contentType, reason })
    });
    return await response.json();
  } catch (error: any) {
    console.error('Create dispute error:', error);
    return { success: false, error: error?.message || 'Failed to create dispute' };
  }
}

/**
 * Check for duplicate content and rapid posting
 */
export async function checkContentPatterns(
  content: string,
  userId: string,
  recentHashes: string[] = [],
  postCount: number = 0,
  timeWindowMinutes: number = 60
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/moderation/check-patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        userId,
        recentHashes,
        postCount,
        timeWindowMinutes
      })
    });

    if (!response.ok) {
      throw new Error('Pattern check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Pattern check error:', error);
    return {
      success: false,
      duplicate: { isDuplicate: false },
      rapidPosting: { isRapid: false }
    };
  }
}

/**
 * Get Crisis Response Plan
 */
export async function getCrisisResponsePlan(riskLevel: 'critical' | 'high' | 'medium', detectedAt?: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/moderation/crisis-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riskLevel, detectedAt: detectedAt || new Date().toISOString() })
    });

    if (!response.ok) {
      throw new Error('Crisis response failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Crisis response error:', error);
    return null;
  }
}

/**
 * Track User Behavior
 */
export async function trackUserBehavior(userId: string, action: 'post' | 'reply', content: string) {
  try {
    // Get or create behavior tracking record
    const { data: existing, error: fetchError } = await supabase
      .from('user_behavior_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Create content hash for duplicate detection
    const { createContentHash } = await import('./communityModeration');
    const contentHash = createContentHash(content);

    if (existing) {
      // Update existing record
      const postsLastHour = (existing.last_post_at && new Date(existing.last_post_at) > oneHourAgo)
        ? existing.posts_in_last_hour + 1
        : 1;

      const postsLastDay = (existing.last_post_at && new Date(existing.last_post_at) > oneDayAgo)
        ? existing.posts_in_last_day + 1
        : 1;

      const recentHashes = existing.recent_post_hashes || [];
      const isDuplicate = recentHashes.includes(contentHash);
      const isRapid = postsLastHour >= 5;

      // Keep only last 10 hashes
      const updatedHashes = [contentHash, ...recentHashes].slice(0, 10);

      const { error: updateError } = await supabase
        .from('user_behavior_tracking')
        .update({
          posts_in_last_hour: postsLastHour,
          posts_in_last_day: postsLastDay,
          last_post_at: now.toISOString(),
          recent_post_hashes: updatedHashes,
          duplicate_content_detected: isDuplicate,
          rapid_posting_detected: isRapid,
          updated_at: now.toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return {
        postsInLastHour: postsLastHour,
        postsInLastDay: postsLastDay,
        isDuplicate,
        isRapid,
        shouldFlag: isDuplicate || isRapid
      };
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('user_behavior_tracking')
        .insert({
          user_id: userId,
          posts_in_last_hour: 1,
          posts_in_last_day: 1,
          last_post_at: now.toISOString(),
          recent_post_hashes: [contentHash],
          duplicate_content_detected: false,
          rapid_posting_detected: false
        });

      if (insertError) throw insertError;

      return {
        postsInLastHour: 1,
        postsInLastDay: 1,
        isDuplicate: false,
        isRapid: false,
        shouldFlag: false
      };
    }
  } catch (error) {
    console.error('Behavior tracking error:', error);
    return null;
  }
}

/**
 * Create Content Report
 */
export async function createContentReport(
  contentId: string,
  contentType: 'topic' | 'reply',
  reason: string,
  details?: string
) {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Get reporter history
    const { data: reporterHistory } = await supabase
      .from('content_reports')
      .select('status')
      .eq('reporter_id', user.user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Check for report abuse (more than 5 reports in 24 hours)
    if (reporterHistory && reporterHistory.length >= 5) {
      throw new Error('Daily report limit reached. Please try again tomorrow.');
    }

    // Get existing reports count for this content
    const { count: reportCount } = await supabase
      .from('content_reports')
      .select('*', { count: 'exact', head: true })
      .eq('reported_content_id', contentId)
      .eq('content_type', contentType);

    // Get user reputation if available
    const { data: userRep } = await supabase
      .from('user_reputation')
      .select('warnings_received, reports_received')
      .eq('user_id', user.user.id)
      .single();

    // Determine priority (simplified - in production, use the backend function)
    let priority = 'P3';
    if (reason === 'crisis' || (reportCount || 0) >= 3) {
      priority = 'P0';
    } else if (reason === 'harmful' || reason === 'harassment' || (reportCount || 0) >= 2) {
      priority = 'P1';
    } else if (reason === 'trigger_warning' || reason === 'spam') {
      priority = 'P2';
    }

    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.user.id,
        reported_content_id: contentId,
        content_type: contentType,
        report_reason: reason,
        report_details: details || null,
        priority_level: priority
      })
      .select()
      .single();

    if (error) throw error;

    // Update report count on content
    const tableName = contentType === 'topic' ? 'discussion_topics' : 'discussion_replies';
    await supabase
      .from(tableName)
      .update({ report_count: (reportCount || 0) + 1 })
      .eq('id', contentId);

    // Trigger automated moderation for high-priority reports
    if (priority === 'P0' || priority === 'P1') {
      // Import and trigger automated moderation (async, don't block)
      import('./automatedModeration').then(({ triggerAutomatedModeration }) => {
        triggerAutomatedModeration(data.id).catch(err => {
          console.error('Automated moderation trigger failed:', err);
          // Don't fail the report creation if auto-mod fails
        });
      });
    }

    return { success: true, report: data };
  } catch (error: any) {
    console.error('Create report error:', error);
    throw error;
  }
}

/**
 * Log Crisis Response
 */
export async function logCrisisResponse(
  userId: string,
  contentId: string,
  contentType: 'topic' | 'reply',
  riskLevel: 'moderate' | 'elevated' | 'high' | 'critical',
  action: string
) {
  try {
    const { data, error } = await supabase
      .from('crisis_response_log')
      .insert({
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
        risk_level: riskLevel,
        resolution_status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    // Update timestamps based on action
    const updates: any = {};
    if (action === 'add_resources') {
      updates.resources_added_at = new Date().toISOString();
    } else if (action === 'send_message') {
      updates.message_sent_at = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('crisis_response_log')
        .update(updates)
        .eq('id', data.id);
    }

    // Update user reputation crisis count
    await supabase
      .from('user_reputation')
      .update({
        crisis_posts_count: supabase.raw('crisis_posts_count + 1'),
        last_crisis_post_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return { success: true, logId: data.id };
  } catch (error) {
    console.error('Crisis response logging error:', error);
    return { success: false };
  }
}

/**
 * Get Moderation Queue
 */
export async function getModerationQueue(priority?: 'P0' | 'P1' | 'P2' | 'P3', limit: number = 50) {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    // Check if user is moderator
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.user.id)
      .single();

    if (!profile || !['admin', 'moderator'].includes(profile.user_type)) {
      throw new Error('Unauthorized: Moderator access required');
    }

    let query = supabase
      .from('content_reports')
      .select(`
        *,
        reporter:user_profiles!content_reports_reporter_id_fkey(user_id, first_name, last_name, username),
        reported_topic:discussion_topics!content_reports_reported_content_id_fkey(id, title, content, user_id),
        reported_reply:discussion_replies!content_reports_reported_content_id_fkey(id, content, user_id)
      `)
      .in('status', ['pending', 'reviewing'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (priority) {
      query = query.eq('priority_level', priority);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, reports: data || [] };
  } catch (error: any) {
    console.error('Get moderation queue error:', error);
    return { success: false, reports: [], error: error.message };
  }
}

