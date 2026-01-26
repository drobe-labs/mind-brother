// User Risk Tracking System
// Monitors user behavior patterns to identify escalating crisis situations

import { supabase } from './supabase';

export interface UserRiskProfile {
  userId: string;
  username?: string;
  recentPosts: PostRiskData[];
  crisisKeywordCount: number;
  escalationScore: number; // 0-100
  riskTrend: 'improving' | 'stable' | 'escalating' | 'critical';
  lastCrisisPost: Date | null;
  positiveInteractions: number;
  lastUpdated: Date;
  flaggedForReview: boolean;
  interventionSuggested: boolean;
}

export interface PostRiskData {
  postId: string;
  timestamp: Date;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  crisisKeywords: number;
  positiveIndicators: number;
}

export interface RiskAlert {
  userId: string;
  username?: string;
  alertType: 'multiple_crisis_posts' | 'escalating_behavior' | 'coordinated_harm' | 'severe_decline';
  severity: 'medium' | 'high' | 'critical';
  reason: string;
  recommendedAction: string;
  timestamp: Date;
  data: any;
}

// In-memory storage (cached locally, syncs with Supabase)
const userRiskProfiles = new Map<string, UserRiskProfile>();
const riskAlerts: RiskAlert[] = [];

// ============================================================================
// CONFIGURATION
// ============================================================================

const RISK_THRESHOLDS = {
  HIGH_RISK_POST_COUNT: 3,        // 3+ high/critical posts in 24hrs
  CRISIS_KEYWORD_THRESHOLD: 5,     // 5+ crisis keywords in 24hrs
  ESCALATION_WINDOW_HOURS: 24,     // Time window for tracking
  CRITICAL_SCORE_THRESHOLD: 75,    // Score that triggers immediate alert
  HIGH_SCORE_THRESHOLD: 50,        // Score that triggers review
};

const PATTERN_WEIGHTS: Record<string, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  none: 0,
  
  // Pattern-specific weights
  disguised_harmful: 20,
  impersonation: 10,
  coordinated_harm: 20,
  toxic_positivity: 5,
  positive_indicator: -5, // Reduces score
};

// ============================================================================
// TRACK USER BEHAVIOR
// ============================================================================

export function trackUserBehavior(
  userId: string,
  username: string | undefined,
  postId: string,
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical',
  detectedPatterns: string[],
  crisisKeywords: number = 0,
  positiveIndicators: number = 0
): UserRiskProfile {
  // Get or create user profile
  let profile = userRiskProfiles.get(userId);
  
  if (!profile) {
    profile = {
      userId,
      username,
      recentPosts: [],
      crisisKeywordCount: 0,
      escalationScore: 0,
      riskTrend: 'stable',
      lastCrisisPost: null,
      positiveInteractions: 0,
      lastUpdated: new Date(),
      flaggedForReview: false,
      interventionSuggested: false,
    };
  }

  // Add new post data
  const postData: PostRiskData = {
    postId,
    timestamp: new Date(),
    riskLevel,
    detectedPatterns,
    crisisKeywords,
    positiveIndicators,
  };

  profile.recentPosts.push(postData);
  profile.lastUpdated = new Date();

  // Remove posts older than 24 hours
  const cutoffTime = new Date(Date.now() - RISK_THRESHOLDS.ESCALATION_WINDOW_HOURS * 60 * 60 * 1000);
  profile.recentPosts = profile.recentPosts.filter(post => post.timestamp > cutoffTime);

  // Update crisis tracking
  if (riskLevel === 'high' || riskLevel === 'critical') {
    profile.lastCrisisPost = new Date();
    profile.crisisKeywordCount += crisisKeywords;
  }

  // Update positive interactions
  profile.positiveInteractions += positiveIndicators;

  // Calculate escalation score
  profile.escalationScore = calculateEscalationScore(profile);

  // Determine risk trend
  profile.riskTrend = determineRiskTrend(profile);

  // Check for alerts
  checkForRiskAlerts(profile);

  // Save updated profile
  userRiskProfiles.set(userId, profile);

  // Sync to Supabase (async, non-blocking)
  syncProfileToSupabase(profile).catch(err => {
    console.warn('⚠️ Failed to sync risk profile to Supabase:', err);
  });

  return profile;
}

// ============================================================================
// CALCULATE ESCALATION SCORE
// ============================================================================

function calculateEscalationScore(profile: UserRiskProfile): number {
  let score = 0;

  // Base score from recent posts
  for (const post of profile.recentPosts) {
    score += PATTERN_WEIGHTS[post.riskLevel] || 0;

    // Add pattern-specific weights
    for (const pattern of post.detectedPatterns) {
      if (pattern.startsWith('disguised_')) {
        score += PATTERN_WEIGHTS.disguised_harmful;
      } else if (pattern.startsWith('impersonation_')) {
        score += PATTERN_WEIGHTS.impersonation;
      } else if (pattern.startsWith('coordinated_')) {
        score += PATTERN_WEIGHTS.coordinated_harm;
      } else if (pattern.startsWith('toxic_positivity_')) {
        score += PATTERN_WEIGHTS.toxic_positivity;
      } else if (pattern.startsWith('positive_')) {
        score += PATTERN_WEIGHTS.positive_indicator;
      }
    }

    // Crisis keyword multiplier
    score += post.crisisKeywords * 2;
  }

  // Temporal escalation bonus
  const highRiskPosts = profile.recentPosts.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
  if (highRiskPosts.length >= 2) {
    const timeSpan = highRiskPosts[highRiskPosts.length - 1].timestamp.getTime() - highRiskPosts[0].timestamp.getTime();
    const hoursBetween = timeSpan / (1000 * 60 * 60);
    
    // Bonus if posts are getting more frequent
    if (hoursBetween < 6) {
      score += 20; // Rapid escalation
    } else if (hoursBetween < 12) {
      score += 10;
    }
  }

  // Positive interactions reduce score
  score -= profile.positiveInteractions * 3;

  // Cap score at 0-100
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// DETERMINE RISK TREND
// ============================================================================

function determineRiskTrend(profile: UserRiskProfile): 'improving' | 'stable' | 'escalating' | 'critical' {
  if (profile.escalationScore >= RISK_THRESHOLDS.CRITICAL_SCORE_THRESHOLD) {
    return 'critical';
  }

  // Compare recent posts to older posts
  const recentPosts = profile.recentPosts.slice(-3); // Last 3 posts
  const olderPosts = profile.recentPosts.slice(0, -3); // Earlier posts

  if (recentPosts.length < 2) {
    return 'stable';
  }

  const recentAvgRisk = calculateAverageRiskLevel(recentPosts);
  const olderAvgRisk = olderPosts.length > 0 ? calculateAverageRiskLevel(olderPosts) : 0;

  if (recentAvgRisk > olderAvgRisk + 1) {
    return 'escalating';
  } else if (recentAvgRisk < olderAvgRisk - 1) {
    return 'improving';
  } else {
    return 'stable';
  }
}

function calculateAverageRiskLevel(posts: PostRiskData[]): number {
  const riskValues: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
  const sum = posts.reduce((acc, post) => acc + riskValues[post.riskLevel], 0);
  return sum / posts.length;
}

// ============================================================================
// CHECK FOR RISK ALERTS
// ============================================================================

function checkForRiskAlerts(profile: UserRiskProfile): void {
  const now = new Date();

  // Alert 1: Multiple crisis posts in 24 hours
  const highRiskPosts = profile.recentPosts.filter(
    p => p.riskLevel === 'high' || p.riskLevel === 'critical'
  );

  if (highRiskPosts.length >= RISK_THRESHOLDS.HIGH_RISK_POST_COUNT && !profile.flaggedForReview) {
    createAlert({
      userId: profile.userId,
      username: profile.username,
      alertType: 'multiple_crisis_posts',
      severity: 'high',
      reason: `User has posted ${highRiskPosts.length} high-risk messages in the last 24 hours`,
      recommendedAction: 'Review user activity, consider direct outreach with crisis resources',
      timestamp: now,
      data: {
        postCount: highRiskPosts.length,
        escalationScore: profile.escalationScore,
        posts: highRiskPosts.map(p => p.postId),
      },
    });
    
    profile.flaggedForReview = true;
  }

  // Alert 2: Escalating behavior
  if (profile.riskTrend === 'escalating' && profile.escalationScore >= RISK_THRESHOLDS.HIGH_SCORE_THRESHOLD) {
    createAlert({
      userId: profile.userId,
      username: profile.username,
      alertType: 'escalating_behavior',
      severity: 'high',
      reason: 'User showing escalating crisis behavior patterns',
      recommendedAction: 'Monitor closely, crisis resources may be needed',
      timestamp: now,
      data: {
        escalationScore: profile.escalationScore,
        riskTrend: profile.riskTrend,
        recentPatterns: profile.recentPosts.slice(-3).flatMap(p => p.detectedPatterns),
      },
    });
  }

  // Alert 3: Critical score threshold
  if (profile.escalationScore >= RISK_THRESHOLDS.CRITICAL_SCORE_THRESHOLD && !profile.interventionSuggested) {
    createAlert({
      userId: profile.userId,
      username: profile.username,
      alertType: 'severe_decline',
      severity: 'critical',
      reason: 'User reached critical escalation score - immediate attention needed',
      recommendedAction: 'URGENT: Consider immediate crisis intervention, display crisis resources prominently',
      timestamp: now,
      data: {
        escalationScore: profile.escalationScore,
        crisisKeywordCount: profile.crisisKeywordCount,
        lastCrisisPost: profile.lastCrisisPost,
      },
    });
    
    profile.interventionSuggested = true;
  }

  // Alert 4: Coordinated harm patterns
  const coordinatedPatterns = profile.recentPosts.flatMap(p => p.detectedPatterns)
    .filter(p => p.startsWith('coordinated_'));
  
  if (coordinatedPatterns.length >= 2) {
    createAlert({
      userId: profile.userId,
      username: profile.username,
      alertType: 'coordinated_harm',
      severity: 'critical',
      reason: 'User involved in potential coordinated harm activity',
      recommendedAction: 'URGENT: Review thread, consider locking, check for other participants',
      timestamp: now,
      data: {
        patterns: coordinatedPatterns,
        postIds: profile.recentPosts.filter(p => 
          p.detectedPatterns.some(d => d.startsWith('coordinated_'))
        ).map(p => p.postId),
      },
    });
  }
}

// ============================================================================
// CREATE ALERT
// ============================================================================

function createAlert(alert: RiskAlert): void {
  // Check if similar alert already exists (avoid duplicates)
  const existingAlert = riskAlerts.find(a => 
    a.userId === alert.userId && 
    a.alertType === alert.alertType &&
    (Date.now() - a.timestamp.getTime()) < 3600000 // Within last hour
  );

  if (existingAlert) {
    console.log('⚠️ Duplicate alert suppressed for user:', alert.username || alert.userId);
    return;
  }

  riskAlerts.push(alert);
  
  console.log('🚨 RISK ALERT CREATED:', {
    user: alert.username || alert.userId,
    type: alert.alertType,
    severity: alert.severity,
    reason: alert.reason,
  });

  // Save alert to Supabase (async)
  saveAlertToSupabase(alert).catch(err => {
    console.warn('⚠️ Failed to save alert to Supabase:', err);
  });

  // Send push notification to moderators for critical alerts
  if (alert.severity === 'critical') {
    notifyModerators(alert).catch(err => {
      console.warn('⚠️ Failed to notify moderators:', err);
    });
  }
}

// ============================================================================
// SUPABASE INTEGRATION
// ============================================================================

async function syncProfileToSupabase(profile: UserRiskProfile): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_risk_profiles')
      .upsert({
        user_id: profile.userId,
        username: profile.username,
        escalation_score: profile.escalationScore,
        risk_trend: profile.riskTrend,
        crisis_keyword_count: profile.crisisKeywordCount,
        positive_interactions: profile.positiveInteractions,
        last_crisis_post: profile.lastCrisisPost?.toISOString() || null,
        flagged_for_review: profile.flaggedForReview,
        intervention_suggested: profile.interventionSuggested,
        recent_posts_json: JSON.stringify(profile.recentPosts),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      // Table might not exist yet - that's okay
      if (!error.message.includes('does not exist')) {
        console.warn('⚠️ Error syncing risk profile:', error);
      }
    }
  } catch (err) {
    // Silently fail if table doesn't exist
    console.debug('Risk profile sync skipped:', err);
  }
}

async function saveAlertToSupabase(alert: RiskAlert): Promise<void> {
  try {
    const { error } = await supabase
      .from('risk_alerts')
      .insert({
        user_id: alert.userId,
        username: alert.username,
        alert_type: alert.alertType,
        severity: alert.severity,
        reason: alert.reason,
        recommended_action: alert.recommendedAction,
        data: alert.data,
        created_at: alert.timestamp.toISOString(),
      });

    if (error) {
      // Table might not exist yet - that's okay
      if (!error.message.includes('does not exist')) {
        console.warn('⚠️ Error saving alert:', error);
      }
    }
  } catch (err) {
    // Silently fail if table doesn't exist
    console.debug('Alert save skipped:', err);
  }
}

async function notifyModerators(alert: RiskAlert): Promise<void> {
  try {
    // Get moderator user IDs
    const { data: moderators } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_type', 'moderator');

    if (!moderators || moderators.length === 0) {
      console.log('📭 No moderators to notify');
      return;
    }

    // Create notifications for each moderator
    const notifications = moderators.map(mod => ({
      user_id: mod.user_id,
      type: 'moderation',
      title: `🚨 ${alert.severity.toUpperCase()} Risk Alert`,
      message: `${alert.reason}\n\nUser: ${alert.username || alert.userId}\nAction: ${alert.recommendedAction}`,
      data: {
        alert_type: alert.alertType,
        target_user_id: alert.userId,
        ...alert.data
      },
      read: false,
    }));

    await supabase.from('notifications').insert(notifications);

    console.log(`📢 Notified ${moderators.length} moderator(s) of risk alert`);
  } catch (err) {
    console.warn('⚠️ Error notifying moderators:', err);
  }
}

// ============================================================================
// GET USER RISK PROFILE
// ============================================================================

export function getUserRiskProfile(userId: string): UserRiskProfile | null {
  return userRiskProfiles.get(userId) || null;
}

// ============================================================================
// GET ALL ALERTS
// ============================================================================

export function getAllRiskAlerts(
  severity?: 'medium' | 'high' | 'critical',
  limit: number = 50
): RiskAlert[] {
  let alerts = [...riskAlerts];
  
  if (severity) {
    alerts = alerts.filter(a => a.severity === severity);
  }
  
  // Sort by timestamp (newest first)
  alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return alerts.slice(0, limit);
}

// ============================================================================
// GET HIGH-RISK USERS
// ============================================================================

export function getHighRiskUsers(minScore: number = 50): UserRiskProfile[] {
  return Array.from(userRiskProfiles.values())
    .filter(profile => profile.escalationScore >= minScore)
    .sort((a, b) => b.escalationScore - a.escalationScore);
}

// ============================================================================
// CLEAR ALERTS FOR USER (after review)
// ============================================================================

export function clearUserAlerts(userId: string): void {
  const profile = userRiskProfiles.get(userId);
  if (profile) {
    profile.flaggedForReview = false;
    profile.interventionSuggested = false;
    userRiskProfiles.set(userId, profile);
  }
  
  // Remove alerts for this user
  const indexesToRemove: number[] = [];
  riskAlerts.forEach((alert, index) => {
    if (alert.userId === userId) {
      indexesToRemove.push(index);
    }
  });
  
  indexesToRemove.reverse().forEach(index => {
    riskAlerts.splice(index, 1);
  });

  console.log(`✅ Cleared alerts for user: ${userId}`);
}

// ============================================================================
// GENERATE INTERVENTION MESSAGE
// ============================================================================

export function generateInterventionMessage(profile: UserRiskProfile): string {
  if (profile.escalationScore >= RISK_THRESHOLDS.CRITICAL_SCORE_THRESHOLD) {
    return `
🆘 **We've Noticed You Might Be Struggling**

Your recent posts suggest you may be going through a really difficult time. We want you to know that:

✨ You are not alone
✨ Your feelings are valid
✨ Help is available right now

**Immediate Support:**

📞 **988 Suicide & Crisis Lifeline**
   Call or Text: 988 (24/7)

💬 **Crisis Text Line**
   Text HOME to 741741 (24/7)

🌐 **Online Chat**
   suicidepreventionlifeline.org/chat

**You matter. Please reach out.**
`;
  } else if (profile.escalationScore >= RISK_THRESHOLDS.HIGH_SCORE_THRESHOLD) {
    return `
💙 **Checking In**

We've noticed you've been sharing some heavy feelings lately. That takes courage, and we're glad you're here.

If you need immediate support:
📞 988 Suicide & Crisis Lifeline (Call/Text)
💬 Crisis Text Line: Text HOME to 741741

Remember: This community is here for you, but professional help can provide the support you deserve.
`;
  }
  
  return '';
}

// ============================================================================
// CHECK IF USER NEEDS CRISIS RESOURCES
// ============================================================================

export function shouldDisplayCrisisResources(userId: string): boolean {
  const profile = userRiskProfiles.get(userId);
  
  if (!profile) return false;
  
  return profile.escalationScore >= RISK_THRESHOLDS.HIGH_SCORE_THRESHOLD ||
         profile.riskTrend === 'critical' ||
         (profile.lastCrisisPost !== null && 
          (Date.now() - profile.lastCrisisPost.getTime()) < 3600000); // Within last hour
}

// ============================================================================
// EXPORT FOR ANALYTICS
// ============================================================================

export function getCommunityHealthMetrics() {
  const profiles = Array.from(userRiskProfiles.values());
  
  return {
    totalTrackedUsers: profiles.length,
    criticalUsers: profiles.filter(p => p.riskTrend === 'critical').length,
    escalatingUsers: profiles.filter(p => p.riskTrend === 'escalating').length,
    improvingUsers: profiles.filter(p => p.riskTrend === 'improving').length,
    stableUsers: profiles.filter(p => p.riskTrend === 'stable').length,
    activeAlerts: riskAlerts.length,
    criticalAlerts: riskAlerts.filter(a => a.severity === 'critical').length,
    highAlerts: riskAlerts.filter(a => a.severity === 'high').length,
    averageEscalationScore: profiles.length > 0 
      ? Math.round(profiles.reduce((sum, p) => sum + p.escalationScore, 0) / profiles.length)
      : 0,
    last24HoursPosts: profiles.reduce((sum, p) => sum + p.recentPosts.length, 0),
    flaggedForReview: profiles.filter(p => p.flaggedForReview).length,
    interventionsSuggested: profiles.filter(p => p.interventionSuggested).length,
  };
}

// ============================================================================
// LOAD PROFILES FROM SUPABASE (on startup)
// ============================================================================

export async function loadRiskProfilesFromSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('user_risk_profiles')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      if (!error.message.includes('does not exist')) {
        console.warn('⚠️ Error loading risk profiles:', error);
      }
      return;
    }

    if (data) {
      for (const row of data) {
        const profile: UserRiskProfile = {
          userId: row.user_id,
          username: row.username,
          recentPosts: JSON.parse(row.recent_posts_json || '[]'),
          crisisKeywordCount: row.crisis_keyword_count || 0,
          escalationScore: row.escalation_score || 0,
          riskTrend: row.risk_trend || 'stable',
          lastCrisisPost: row.last_crisis_post ? new Date(row.last_crisis_post) : null,
          positiveInteractions: row.positive_interactions || 0,
          lastUpdated: new Date(row.updated_at),
          flaggedForReview: row.flagged_for_review || false,
          interventionSuggested: row.intervention_suggested || false,
        };
        userRiskProfiles.set(profile.userId, profile);
      }
      console.log(`📊 Loaded ${data.length} risk profiles from Supabase`);
    }
  } catch (err) {
    console.debug('Risk profile load skipped:', err);
  }
}

// ============================================================================
// EXPORT THRESHOLDS FOR EXTERNAL USE
// ============================================================================

export { RISK_THRESHOLDS };


