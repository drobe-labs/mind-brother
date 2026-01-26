/**
 * Cultural Personalization Analytics
 * 
 * Track and measure the effectiveness of cultural personalization features
 * to ensure they're providing value to users.
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingStats {
  total: number;
  completed: number;
  skipped: number;
  noAction: number;
  completionRate: number;
  skipRate: number;
}

export interface CulturalBreakdown {
  [background: string]: number;
}

export interface ConcernStats {
  [concern: string]: number;
}

export interface CommunityStats {
  [community: string]: number;
}

export interface ContextDetectionStats {
  total: number;
  last7Days: number;
  last30Days: number;
  averageConfidence: number;
  byType: Record<string, number>;
  byInferredAttribute: Record<string, number>;
}

export interface EngagementStats {
  usersWithPersonalization: number;
  usersWithoutPersonalization: number;
  avgMessagesWithPersonalization: number;
  avgMessagesWithoutPersonalization: number;
}

export interface ContentUsageStats {
  totalContent: number;
  activeContent: number;
  byType: Record<string, number>;
  byBackground: Record<string, number>;
}

export interface FeedbackComparison {
  culturalPersonalized: {
    total: number;
    thumbsUp: number;
    thumbsDown: number;
    satisfactionRate: number;
  };
  generic: {
    total: number;
    thumbsUp: number;
    thumbsDown: number;
    satisfactionRate: number;
  };
  byBackground: Record<string, {
    total: number;
    thumbsUp: number;
    satisfactionRate: number;
  }>;
  improvement: number; // Percentage improvement from cultural personalization
}

export interface CulturalAnalyticsReport {
  generatedAt: string;
  onboarding: OnboardingStats;
  feedbackComparison: FeedbackComparison;
  culturalBreakdown: CulturalBreakdown;
  topConcerns: [string, number][];
  topCommunities: [string, number][];
  contextDetection: ContextDetectionStats;
  contentUsage: ContentUsageStats;
  communicationStyles: Record<string, number>;
  ageRanges: Record<string, number>;
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Get onboarding completion statistics
 */
export async function getOnboardingStats(): Promise<OnboardingStats> {
  const { data, error } = await supabase
    .from('user_cultural_profiles')
    .select('onboarding_completed, onboarding_skipped');

  if (error) {
    console.error('Error fetching onboarding stats:', error);
    return {
      total: 0,
      completed: 0,
      skipped: 0,
      noAction: 0,
      completionRate: 0,
      skipRate: 0,
    };
  }

  const total = data?.length || 0;
  const completed = data?.filter(p => p.onboarding_completed).length || 0;
  const skipped = data?.filter(p => p.onboarding_skipped).length || 0;
  const noAction = total - completed - skipped;

  return {
    total,
    completed,
    skipped,
    noAction,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    skipRate: total > 0 ? (skipped / total) * 100 : 0,
  };
}

/**
 * Get breakdown of cultural backgrounds
 */
export async function getCulturalBreakdown(): Promise<CulturalBreakdown> {
  const { data, error } = await supabase
    .from('user_cultural_profiles')
    .select('cultural_background')
    .not('cultural_background', 'is', null);

  if (error) {
    console.error('Error fetching cultural breakdown:', error);
    return {};
  }

  const breakdown: CulturalBreakdown = {};
  data?.forEach((profile) => {
    const bg = profile.cultural_background;
    if (bg) {
      breakdown[bg] = (breakdown[bg] || 0) + 1;
    }
  });

  return breakdown;
}

/**
 * Get statistics on primary concerns
 */
export async function getConcernStats(): Promise<ConcernStats> {
  const { data, error } = await supabase
    .from('user_cultural_profiles')
    .select('primary_concerns');

  if (error) {
    console.error('Error fetching concern stats:', error);
    return {};
  }

  const concernCounts: ConcernStats = {};
  data?.forEach((profile) => {
    if (profile.primary_concerns && Array.isArray(profile.primary_concerns)) {
      profile.primary_concerns.forEach((concern: string) => {
        concernCounts[concern] = (concernCounts[concern] || 0) + 1;
      });
    }
  });

  return concernCounts;
}

/**
 * Get statistics on community memberships
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  const { data, error } = await supabase
    .from('user_cultural_profiles')
    .select('communities');

  if (error) {
    console.error('Error fetching community stats:', error);
    return {};
  }

  const communityCounts: CommunityStats = {};
  data?.forEach((profile) => {
    if (profile.communities && Array.isArray(profile.communities)) {
      profile.communities.forEach((community: string) => {
        communityCounts[community] = (communityCounts[community] || 0) + 1;
      });
    }
  });

  return communityCounts;
}

/**
 * Get context signal detection statistics
 */
export async function getContextDetectionStats(): Promise<ContextDetectionStats> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all signals
  const { data: allSignals, error: allError } = await supabase
    .from('user_context_signals')
    .select('signal_type, confidence, inferred_attribute, created_at');

  if (allError) {
    console.error('Error fetching context signals:', allError);
    return {
      total: 0,
      last7Days: 0,
      last30Days: 0,
      averageConfidence: 0,
      byType: {},
      byInferredAttribute: {},
    };
  }

  const signals = allSignals || [];
  const last7DaysSignals = signals.filter(s => new Date(s.created_at) >= sevenDaysAgo);
  const last30DaysSignals = signals.filter(s => new Date(s.created_at) >= thirtyDaysAgo);

  // Calculate average confidence
  const avgConfidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + (parseFloat(s.confidence) || 0), 0) / signals.length
    : 0;

  // Count by type
  const byType: Record<string, number> = {};
  signals.forEach(s => {
    const type = s.signal_type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });

  // Count by inferred attribute
  const byInferredAttribute: Record<string, number> = {};
  signals.forEach(s => {
    if (s.inferred_attribute) {
      byInferredAttribute[s.inferred_attribute] = (byInferredAttribute[s.inferred_attribute] || 0) + 1;
    }
  });

  return {
    total: signals.length,
    last7Days: last7DaysSignals.length,
    last30Days: last30DaysSignals.length,
    averageConfidence: avgConfidence,
    byType,
    byInferredAttribute,
  };
}

/**
 * Get content usage statistics
 */
export async function getContentUsageStats(): Promise<ContentUsageStats> {
  const { data, error } = await supabase
    .from('cultural_content')
    .select('content_type, target_cultural_backgrounds, is_active');

  if (error) {
    console.error('Error fetching content stats:', error);
    return {
      totalContent: 0,
      activeContent: 0,
      byType: {},
      byBackground: {},
    };
  }

  const content = data || [];
  const activeContent = content.filter(c => c.is_active);

  // Count by type
  const byType: Record<string, number> = {};
  content.forEach(c => {
    const type = c.content_type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });

  // Count by target background
  const byBackground: Record<string, number> = {};
  content.forEach(c => {
    if (c.target_cultural_backgrounds && Array.isArray(c.target_cultural_backgrounds)) {
      c.target_cultural_backgrounds.forEach((bg: string) => {
        byBackground[bg] = (byBackground[bg] || 0) + 1;
      });
    }
  });

  return {
    totalContent: content.length,
    activeContent: activeContent.length,
    byType,
    byBackground,
  };
}

/**
 * Get communication style preferences
 */
export async function getCommunicationStyleStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('user_cultural_profiles')
    .select('communication_style')
    .not('communication_style', 'is', null);

  if (error) {
    console.error('Error fetching communication style stats:', error);
    return {};
  }

  const styleCounts: Record<string, number> = {};
  data?.forEach(profile => {
    const style = profile.communication_style;
    if (style) {
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    }
  });

  return styleCounts;
}

/**
 * Get age range distribution
 */
export async function getAgeRangeStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('user_cultural_profiles')
    .select('age_range')
    .not('age_range', 'is', null);

  if (error) {
    console.error('Error fetching age range stats:', error);
    return {};
  }

  const ageCounts: Record<string, number> = {};
  data?.forEach(profile => {
    const age = profile.age_range;
    if (age) {
      ageCounts[age] = (ageCounts[age] || 0) + 1;
    }
  });

  return ageCounts;
}

/**
 * Track user engagement with cultural personalization enabled vs disabled
 */
export async function getEngagementComparison(): Promise<EngagementStats> {
  // Get profiles with personalization enabled
  const { data: enabledProfiles } = await supabase
    .from('user_cultural_profiles')
    .select('user_id')
    .eq('allows_personalization', true);

  // Get profiles with personalization disabled
  const { data: disabledProfiles } = await supabase
    .from('user_cultural_profiles')
    .select('user_id')
    .eq('allows_personalization', false);

  return {
    usersWithPersonalization: enabledProfiles?.length || 0,
    usersWithoutPersonalization: disabledProfiles?.length || 0,
    avgMessagesWithPersonalization: 0, // Would need message counting logic
    avgMessagesWithoutPersonalization: 0,
  };
}

/**
 * Compare feedback between culturally personalized vs generic responses
 * This is a key metric for measuring if personalization is actually helping
 */
export async function getFeedbackComparison(): Promise<FeedbackComparison> {
  // Get all feedback with user cultural profiles
  const { data: feedbackWithProfile, error: withProfileError } = await supabase
    .from('chatbot_feedback')
    .select(`
      id,
      user_id,
      feedback,
      created_at
    `);

  if (withProfileError) {
    console.error('Error fetching feedback:', withProfileError);
    return {
      culturalPersonalized: { total: 0, thumbsUp: 0, thumbsDown: 0, satisfactionRate: 0 },
      generic: { total: 0, thumbsUp: 0, thumbsDown: 0, satisfactionRate: 0 },
      byBackground: {},
      improvement: 0,
    };
  }

  // Get all cultural profiles
  const { data: culturalProfiles } = await supabase
    .from('user_cultural_profiles')
    .select('user_id, cultural_background, onboarding_completed, allows_personalization');

  // Create a map of user_id to cultural profile
  const profileMap = new Map<string, any>();
  culturalProfiles?.forEach(profile => {
    profileMap.set(profile.user_id, profile);
  });

  // Separate feedback into culturally personalized vs generic
  const personalizedFeedback: any[] = [];
  const genericFeedback: any[] = [];
  const byBackgroundMap: Record<string, { total: number; thumbsUp: number }> = {};

  feedbackWithProfile?.forEach(feedback => {
    const profile = profileMap.get(feedback.user_id);
    
    // Consider "personalized" if user has a cultural profile with:
    // 1. Onboarding completed OR cultural_background set
    // 2. AND allows_personalization is true (or not explicitly false)
    const isPersonalized = profile && 
      (profile.onboarding_completed || profile.cultural_background) &&
      profile.allows_personalization !== false;

    if (isPersonalized) {
      personalizedFeedback.push(feedback);
      
      // Track by cultural background
      const bg = profile.cultural_background || 'unspecified';
      if (!byBackgroundMap[bg]) {
        byBackgroundMap[bg] = { total: 0, thumbsUp: 0 };
      }
      byBackgroundMap[bg].total++;
      if (feedback.feedback === 'thumbs_up' || feedback.feedback === 'positive') {
        byBackgroundMap[bg].thumbsUp++;
      }
    } else {
      genericFeedback.push(feedback);
    }
  });

  // Calculate metrics
  const personalizedThumbsUp = personalizedFeedback.filter(
    f => f.feedback === 'thumbs_up' || f.feedback === 'positive'
  ).length;
  const personalizedThumbsDown = personalizedFeedback.filter(
    f => f.feedback === 'thumbs_down' || f.feedback === 'negative'
  ).length;
  const personalizedSatisfaction = personalizedFeedback.length > 0
    ? (personalizedThumbsUp / personalizedFeedback.length) * 100
    : 0;

  const genericThumbsUp = genericFeedback.filter(
    f => f.feedback === 'thumbs_up' || f.feedback === 'positive'
  ).length;
  const genericThumbsDown = genericFeedback.filter(
    f => f.feedback === 'thumbs_down' || f.feedback === 'negative'
  ).length;
  const genericSatisfaction = genericFeedback.length > 0
    ? (genericThumbsUp / genericFeedback.length) * 100
    : 0;

  // Calculate improvement percentage
  const improvement = genericSatisfaction > 0
    ? ((personalizedSatisfaction - genericSatisfaction) / genericSatisfaction) * 100
    : personalizedSatisfaction > 0 ? 100 : 0;

  // Convert byBackgroundMap to final format
  const byBackground: FeedbackComparison['byBackground'] = {};
  Object.entries(byBackgroundMap).forEach(([bg, stats]) => {
    byBackground[bg] = {
      total: stats.total,
      thumbsUp: stats.thumbsUp,
      satisfactionRate: stats.total > 0 ? (stats.thumbsUp / stats.total) * 100 : 0,
    };
  });

  return {
    culturalPersonalized: {
      total: personalizedFeedback.length,
      thumbsUp: personalizedThumbsUp,
      thumbsDown: personalizedThumbsDown,
      satisfactionRate: personalizedSatisfaction,
    },
    generic: {
      total: genericFeedback.length,
      thumbsUp: genericThumbsUp,
      thumbsDown: genericThumbsDown,
      satisfactionRate: genericSatisfaction,
    },
    byBackground,
    improvement,
  };
}

/**
 * Track feedback trends over time for personalized vs generic responses
 */
export async function getFeedbackTrends(days: number = 30): Promise<{
  date: string;
  personalizedSatisfaction: number;
  genericSatisfaction: number;
  personalizedCount: number;
  genericCount: number;
}[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get feedback with timestamps
  const { data: feedback } = await supabase
    .from('chatbot_feedback')
    .select('user_id, feedback, created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  // Get cultural profiles
  const { data: profiles } = await supabase
    .from('user_cultural_profiles')
    .select('user_id, cultural_background, onboarding_completed, allows_personalization');

  const profileMap = new Map<string, any>();
  profiles?.forEach(p => profileMap.set(p.user_id, p));

  // Group by date
  const byDate: Record<string, {
    personalized: { positive: number; total: number };
    generic: { positive: number; total: number };
  }> = {};

  feedback?.forEach(f => {
    const date = new Date(f.created_at).toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = {
        personalized: { positive: 0, total: 0 },
        generic: { positive: 0, total: 0 },
      };
    }

    const profile = profileMap.get(f.user_id);
    const isPersonalized = profile && 
      (profile.onboarding_completed || profile.cultural_background) &&
      profile.allows_personalization !== false;
    const isPositive = f.feedback === 'thumbs_up' || f.feedback === 'positive';

    if (isPersonalized) {
      byDate[date].personalized.total++;
      if (isPositive) byDate[date].personalized.positive++;
    } else {
      byDate[date].generic.total++;
      if (isPositive) byDate[date].generic.positive++;
    }
  });

  return Object.entries(byDate).map(([date, stats]) => ({
    date,
    personalizedSatisfaction: stats.personalized.total > 0
      ? (stats.personalized.positive / stats.personalized.total) * 100
      : 0,
    genericSatisfaction: stats.generic.total > 0
      ? (stats.generic.positive / stats.generic.total) * 100
      : 0,
    personalizedCount: stats.personalized.total,
    genericCount: stats.generic.total,
  }));
}

/**
 * Get satisfaction rate by cultural background
 */
export async function getSatisfactionByBackground(): Promise<Record<string, {
  satisfactionRate: number;
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
}>> {
  const comparison = await getFeedbackComparison();
  
  const result: Record<string, {
    satisfactionRate: number;
    totalFeedback: number;
    thumbsUp: number;
    thumbsDown: number;
  }> = {};

  Object.entries(comparison.byBackground).forEach(([bg, stats]) => {
    result[bg] = {
      satisfactionRate: stats.satisfactionRate,
      totalFeedback: stats.total,
      thumbsUp: stats.thumbsUp,
      thumbsDown: stats.total - stats.thumbsUp,
    };
  });

  return result;
}

/**
 * Log a summary of feedback comparison to console
 */
export async function logFeedbackComparisonSummary(): Promise<void> {
  console.log('\n📊 FEEDBACK COMPARISON: Personalized vs Generic');
  console.log('================================================');

  const comparison = await getFeedbackComparison();

  console.log('\n🎯 PERSONALIZED RESPONSES (with cultural context):');
  console.log(`   Total Feedback: ${comparison.culturalPersonalized.total}`);
  console.log(`   👍 Thumbs Up: ${comparison.culturalPersonalized.thumbsUp}`);
  console.log(`   👎 Thumbs Down: ${comparison.culturalPersonalized.thumbsDown}`);
  console.log(`   ✅ Satisfaction Rate: ${comparison.culturalPersonalized.satisfactionRate.toFixed(1)}%`);

  console.log('\n📝 GENERIC RESPONSES (without cultural context):');
  console.log(`   Total Feedback: ${comparison.generic.total}`);
  console.log(`   👍 Thumbs Up: ${comparison.generic.thumbsUp}`);
  console.log(`   👎 Thumbs Down: ${comparison.generic.thumbsDown}`);
  console.log(`   ✅ Satisfaction Rate: ${comparison.generic.satisfactionRate.toFixed(1)}%`);

  console.log('\n📈 IMPACT:');
  if (comparison.improvement > 0) {
    console.log(`   🎉 Cultural personalization improved satisfaction by ${comparison.improvement.toFixed(1)}%!`);
  } else if (comparison.improvement < 0) {
    console.log(`   ⚠️ Generic responses performing ${Math.abs(comparison.improvement).toFixed(1)}% better`);
  } else {
    console.log(`   ➖ No significant difference detected`);
  }

  if (Object.keys(comparison.byBackground).length > 0) {
    console.log('\n🌍 SATISFACTION BY CULTURAL BACKGROUND:');
    Object.entries(comparison.byBackground)
      .sort(([, a], [, b]) => b.satisfactionRate - a.satisfactionRate)
      .forEach(([bg, stats]) => {
        console.log(`   ${bg}: ${stats.satisfactionRate.toFixed(1)}% (${stats.thumbsUp}/${stats.total})`);
      });
  }

  console.log('\n================================================\n');
}

/**
 * Generate a full analytics report
 */
export async function generateCulturalAnalyticsReport(): Promise<CulturalAnalyticsReport> {
  console.log('📊 Generating cultural personalization analytics report...');

  const [
    onboarding,
    culturalBreakdown,
    concernStats,
    communityStats,
    contextDetection,
    contentUsage,
    communicationStyles,
    ageRanges,
    feedbackComparison,
  ] = await Promise.all([
    getOnboardingStats(),
    getCulturalBreakdown(),
    getConcernStats(),
    getCommunityStats(),
    getContextDetectionStats(),
    getContentUsageStats(),
    getCommunicationStyleStats(),
    getAgeRangeStats(),
    getFeedbackComparison(),
  ]);

  // Sort concerns and communities by count
  const topConcerns = Object.entries(concernStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topCommunities = Object.entries(communityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const report: CulturalAnalyticsReport = {
    generatedAt: new Date().toISOString(),
    onboarding,
    feedbackComparison,
    culturalBreakdown,
    topConcerns,
    topCommunities,
    contextDetection,
    contentUsage,
    communicationStyles,
    ageRanges,
  };

  // Log summary
  console.log('\n📈 CULTURAL PERSONALIZATION ANALYTICS REPORT');
  console.log('============================================');
  console.log(`Generated: ${report.generatedAt}`);
  console.log('\n📝 ONBOARDING');
  console.log(`  Total Users: ${onboarding.total}`);
  console.log(`  Completed: ${onboarding.completed} (${onboarding.completionRate.toFixed(1)}%)`);
  console.log(`  Skipped: ${onboarding.skipped} (${onboarding.skipRate.toFixed(1)}%)`);
  console.log('\n🌍 CULTURAL BACKGROUNDS');
  Object.entries(culturalBreakdown)
    .sort(([, a], [, b]) => b - a)
    .forEach(([bg, count]) => {
      console.log(`  ${bg}: ${count}`);
    });
  console.log('\n💭 TOP CONCERNS');
  topConcerns.forEach(([concern, count]) => {
    console.log(`  ${concern}: ${count}`);
  });
  console.log('\n🤝 TOP COMMUNITIES');
  topCommunities.forEach(([community, count]) => {
    console.log(`  ${community}: ${count}`);
  });
  console.log('\n🔍 CONTEXT DETECTION');
  console.log(`  Total Signals: ${contextDetection.total}`);
  console.log(`  Last 7 Days: ${contextDetection.last7Days}`);
  console.log(`  Last 30 Days: ${contextDetection.last30Days}`);
  console.log(`  Avg Confidence: ${(contextDetection.averageConfidence * 100).toFixed(1)}%`);
  console.log('\n📚 CONTENT LIBRARY');
  console.log(`  Total Content: ${contentUsage.totalContent}`);
  console.log(`  Active: ${contentUsage.activeContent}`);
  console.log('\n💬 COMMUNICATION STYLES');
  Object.entries(communicationStyles)
    .sort(([, a], [, b]) => b - a)
    .forEach(([style, count]) => {
      console.log(`  ${style}: ${count}`);
    });
  console.log('\n👤 AGE RANGES');
  Object.entries(ageRanges)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([age, count]) => {
      console.log(`  ${age}: ${count}`);
    });
  console.log('\n⭐ FEEDBACK COMPARISON (Key Metric)');
  console.log(`  Personalized: ${feedbackComparison.culturalPersonalized.satisfactionRate.toFixed(1)}% satisfaction (${feedbackComparison.culturalPersonalized.total} responses)`);
  console.log(`  Generic: ${feedbackComparison.generic.satisfactionRate.toFixed(1)}% satisfaction (${feedbackComparison.generic.total} responses)`);
  if (feedbackComparison.improvement > 0) {
    console.log(`  🎉 Personalization Impact: +${feedbackComparison.improvement.toFixed(1)}% improvement!`);
  } else if (feedbackComparison.improvement < 0) {
    console.log(`  ⚠️ Personalization Impact: ${feedbackComparison.improvement.toFixed(1)}% (needs investigation)`);
  } else {
    console.log(`  ➖ Personalization Impact: No significant difference`);
  }
  console.log('\n============================================\n');

  return report;
}

/**
 * Track when cultural content is served to users
 */
export async function trackContentServed(
  userId: string,
  contentId: string,
  contentType: string,
  culturalBackground?: string
): Promise<void> {
  try {
    await supabase.from('cultural_content_analytics').insert({
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      cultural_background: culturalBackground,
      served_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking content served:', error);
  }
}

/**
 * Get daily/weekly trends for context signal detection
 */
export async function getContextDetectionTrends(days: number = 30): Promise<{
  date: string;
  count: number;
}[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('user_context_signals')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching trends:', error);
    return [];
  }

  // Group by date
  const byDate: Record<string, number> = {};
  data.forEach(signal => {
    const date = new Date(signal.created_at).toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });

  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}

/**
 * Calculate system health score (0-100)
 */
export async function calculateSystemHealthScore(): Promise<{
  score: number;
  breakdown: {
    onboardingHealth: number;
    contextDetectionHealth: number;
    contentHealth: number;
    diversityHealth: number;
  };
  recommendations: string[];
}> {
  const [onboarding, contextDetection, contentUsage, culturalBreakdown] = await Promise.all([
    getOnboardingStats(),
    getContextDetectionStats(),
    getContentUsageStats(),
    getCulturalBreakdown(),
  ]);

  const recommendations: string[] = [];

  // Onboarding health (25 points)
  // Goal: >50% completion rate
  const onboardingHealth = Math.min(25, (onboarding.completionRate / 50) * 25);
  if (onboarding.completionRate < 30) {
    recommendations.push('Low onboarding completion. Consider simplifying the process or adding incentives.');
  }

  // Context detection health (25 points)
  // Goal: Signals detected in last 7 days, avg confidence > 0.7
  const hasRecentSignals = contextDetection.last7Days > 0;
  const goodConfidence = contextDetection.averageConfidence >= 0.7;
  const contextDetectionHealth = (hasRecentSignals ? 15 : 0) + (goodConfidence ? 10 : contextDetection.averageConfidence * 10);
  if (!hasRecentSignals) {
    recommendations.push('No context signals detected recently. Check if detection is working properly.');
  }
  if (!goodConfidence && contextDetection.total > 0) {
    recommendations.push('Low confidence in context signals. Consider refining detection patterns.');
  }

  // Content health (25 points)
  // Goal: At least 20 active content items
  const contentScore = Math.min(25, (contentUsage.activeContent / 20) * 25);
  const contentHealth = contentScore;
  if (contentUsage.activeContent < 10) {
    recommendations.push('Limited cultural content. Add more resources, affirmations, and educational materials.');
  }

  // Diversity health (25 points)
  // Goal: Content covering multiple backgrounds
  const backgroundsWithContent = Object.keys(contentUsage.byBackground).length;
  const diversityHealth = Math.min(25, (backgroundsWithContent / 5) * 25);
  if (backgroundsWithContent < 3) {
    recommendations.push('Content is not diverse. Add resources for more cultural backgrounds.');
  }

  const score = Math.round(onboardingHealth + contextDetectionHealth + contentHealth + diversityHealth);

  return {
    score,
    breakdown: {
      onboardingHealth: Math.round(onboardingHealth),
      contextDetectionHealth: Math.round(contextDetectionHealth),
      contentHealth: Math.round(contentHealth),
      diversityHealth: Math.round(diversityHealth),
    },
    recommendations,
  };
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).culturalAnalytics = {
    generateReport: generateCulturalAnalyticsReport,
    getOnboardingStats,
    getCulturalBreakdown,
    getConcernStats,
    getCommunityStats,
    getContextDetectionStats,
    getContentUsageStats,
    getCommunicationStyleStats,
    getAgeRangeStats,
    getContextDetectionTrends,
    calculateSystemHealthScore,
    // Feedback comparison functions
    getFeedbackComparison,
    getFeedbackTrends,
    getSatisfactionByBackground,
    logFeedbackComparisonSummary,
  };
  
  console.log('📊 Cultural Analytics available. Run `culturalAnalytics.generateReport()` to see stats.');
  console.log('📊 Run `culturalAnalytics.logFeedbackComparisonSummary()` to compare personalized vs generic feedback.');
}
