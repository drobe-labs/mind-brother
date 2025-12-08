// automatedModeration.ts
// Frontend service for automated moderation features

import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Trigger automated moderation for a report
 */
export async function triggerAutomatedModeration(reportId: string) {
  try {
    // Get the report details
    const { data: report, error: reportError } = await supabase
      .from('content_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // Get the actual content author (not reporter)
    let contentAuthorId = null;
    if (report.content_type === 'topic') {
      const { data: topic } = await supabase
        .from('discussion_topics')
        .select('user_id')
        .eq('id', report.reported_content_id)
        .single();
      contentAuthorId = topic?.user_id;
    } else {
      const { data: reply } = await supabase
        .from('discussion_replies')
        .select('user_id')
        .eq('id', report.reported_content_id)
        .single();
      contentAuthorId = reply?.user_id;
    }

    if (!contentAuthorId) {
      throw new Error('Content author not found');
    }

    // Call backend to process
    const response = await fetch(`${BACKEND_URL}/api/moderation/process-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId,
        report: {
          ...report,
          content_author_id: contentAuthorId
        }
      })
    });

    if (!response.ok) {
      throw new Error('Automated moderation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Trigger automated moderation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Trigger automated moderation for auto-detected violation
 */
export async function triggerAutoViolation(
  contentId: string,
  contentType: 'topic' | 'reply',
  userId: string,
  violationType: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/moderation/process-violation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId,
        contentType,
        userId,
        violationType,
        riskLevel
      })
    });

    if (!response.ok) {
      throw new Error('Automated moderation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Trigger auto violation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get User Warning History
 */
export async function getUserWarningHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Get recent moderation log entries for this user
    const { data: moderationLog, error: logError } = await supabase
      .from('moderation_log')
      .select('*')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      success: true,
      reputation: data,
      recentActions: moderationLog || [],
      warningsRemaining: Math.max(0, 3 - (data?.warnings_received || 0))
    };
  } catch (error: any) {
    console.error('Get warning history error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if User is Suspended/Banned
 */
export async function checkUserStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_reputation')
      .select('is_banned, ban_expires_at, ban_reason, trust_level')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const isBanned = data?.is_banned || false;
    const banExpiresAt = data?.ban_expires_at ? new Date(data.ban_expires_at) : null;
    const isCurrentlyBanned = isBanned && banExpiresAt && banExpiresAt > new Date();

    return {
      success: true,
      isBanned: isCurrentlyBanned,
      banExpiresAt: banExpiresAt?.toISOString(),
      banReason: data?.ban_reason,
      trustLevel: data?.trust_level || 'member'
    };
  } catch (error: any) {
    console.error('Check user status error:', error);
    return {
      success: false,
      isBanned: false,
      error: error.message
    };
  }
}






