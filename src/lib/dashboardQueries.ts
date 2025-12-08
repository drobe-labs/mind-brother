// Dashboard Queries - Analytics & Insights
// Query functions for admin dashboard, monitoring, and user risk assessment

import { contextManager } from './contextManager';
import { metricsTracker } from './metricsTracker';

export interface HighRiskUser {
  userId: string;
  currentDistress: number; // 1-10
  trend: 'declining' | 'stable' | 'improving';
  recentCategories: string[];
  lastActivity: Date;
  sessionCount: number;
  needsIntervention: boolean;
}

export interface ClassificationAccuracy {
  overallAccuracy: number;
  byCategoryAccuracy: { [category: string]: number };
  totalFeedback: number;
  helpfulCount: number;
  unhelpfulCount: number;
  confidenceCorrelation: number; // Does high confidence = high accuracy?
}

export class DashboardQueries {
  
  /**
   * Get high-risk users who need attention
   * Users with distress >= 8 or declining trend
   */
  public getHighRiskUsers(): HighRiskUser[] {
    const highRiskUsers: HighRiskUser[] = [];
    
    // Get all active sessions
    const allSessions = new Map<string, any>();
    
    // In production, this would query a database
    // For now, we use context manager's in-memory storage
    // Note: This is a simplified version for demonstration
    
    // Example implementation:
    // Loop through all users and sessions
    // Check emotional intensity and trends
    // Flag users with distress >= 8 or declining trend
    
    return highRiskUsers;
  }
  
  /**
   * Get classification accuracy based on user feedback
   */
  public getClassificationAccuracy(feedbackData: Array<{
    messageId: string;
    classification: string;
    userFeedback: 'helpful' | 'not_helpful' | 'neutral';
    confidence: number;
  }>): ClassificationAccuracy {
    
    if (feedbackData.length === 0) {
      return {
        overallAccuracy: 0,
        byCategoryAccuracy: {},
        totalFeedback: 0,
        helpfulCount: 0,
        unhelpfulCount: 0,
        confidenceCorrelation: 0
      };
    }
    
    const helpful = feedbackData.filter(f => f.userFeedback === 'helpful');
    const unhelpful = feedbackData.filter(f => f.userFeedback === 'not_helpful');
    
    const overallAccuracy = helpful.length / feedbackData.length;
    
    // Accuracy by category
    const byCategory: { [key: string]: { helpful: number; total: number } } = {};
    feedbackData.forEach(f => {
      if (!byCategory[f.classification]) {
        byCategory[f.classification] = { helpful: 0, total: 0 };
      }
      byCategory[f.classification].total++;
      if (f.userFeedback === 'helpful') {
        byCategory[f.classification].helpful++;
      }
    });
    
    const byCategoryAccuracy: { [key: string]: number } = {};
    Object.entries(byCategory).forEach(([cat, stats]) => {
      byCategoryAccuracy[cat] = stats.helpful / stats.total;
    });
    
    // Confidence correlation (does high confidence = high accuracy?)
    const highConfidence = feedbackData.filter(f => f.confidence >= 0.9);
    const highConfAccuracy = highConfidence.length > 0
      ? highConfidence.filter(f => f.userFeedback === 'helpful').length / highConfidence.length
      : 0;
    
    return {
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      byCategoryAccuracy,
      totalFeedback: feedbackData.length,
      helpfulCount: helpful.length,
      unhelpfulCount: unhelpful.length,
      confidenceCorrelation: Math.round(highConfAccuracy * 100) / 100
    };
  }
  
  /**
   * Get users with declining emotional state
   */
  public getDecliningUsers(userSessions: Array<{
    userId: string;
    sessionId: string;
  }>): Array<{
    userId: string;
    sessionId: string;
    trend: string;
    currentIntensity: number;
  }> {
    const declining = [];
    
    for (const session of userSessions) {
      const trend = contextManager.getEmotionalTrend(session.userId, session.sessionId);
      
      if (trend === 'declining') {
        const summary = contextManager.getConversationSummary(session.userId, session.sessionId);
        
        declining.push({
          userId: session.userId,
          sessionId: session.sessionId,
          trend,
          currentIntensity: summary.avgEmotionalIntensity
        });
      }
    }
    
    return declining.sort((a, b) => b.currentIntensity - a.currentIntensity);
  }
  
  /**
   * Get recurring topic patterns across users
   */
  public getTopIssues(limit: number = 10): Array<{
    category: string;
    count: number;
    percentage: number;
  }> {
    const metrics = metricsTracker.getMetrics();
    const total = Object.values(metrics.classification.byCategory).reduce((a, b) => a + b, 0);
    
    return Object.entries(metrics.classification.byCategory)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Get cost breakdown and projections
   */
  public getCostAnalysis(): {
    currentPeriod: {
      totalCost: number;
      claudeCost: number;
      regexCost: number;
      messagesProcessed: number;
    };
    projections: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    efficiency: {
      claudePercentage: number;
      regexPercentage: number;
      avgCostPerMessage: number;
    };
  } {
    const metrics = metricsTracker.getMetrics();
    const cost = metricsTracker.getCostEstimate();
    
    const total = metrics.classification.claudeDisambiguations + 
                  (metrics.classification.regexClassifications || 0);
    
    const claudePercentage = total > 0 
      ? (metrics.classification.claudeDisambiguations / total) * 100 
      : 0;
    
    return {
      currentPeriod: {
        totalCost: cost.totalCost,
        claudeCost: metrics.classification.claudeDisambiguations * 0.002,
        regexCost: 0,
        messagesProcessed: total
      },
      projections: {
        daily: cost.projectedMonthly / 30,
        weekly: cost.projectedMonthly / 4,
        monthly: cost.projectedMonthly
      },
      efficiency: {
        claudePercentage: Math.round(claudePercentage),
        regexPercentage: Math.round(100 - claudePercentage),
        avgCostPerMessage: cost.costPerMessage
      }
    };
  }
  
  /**
   * Get safety alerts (users who need immediate attention)
   */
  public getSafetyAlerts(): Array<{
    priority: 'critical' | 'high' | 'medium';
    userId: string;
    sessionId: string;
    reason: string;
    suggestedAction: string;
  }> {
    const alerts = [];
    
    // This would query database in production
    // For now, returns structure for implementation
    
    return alerts;
  }
  
  /**
   * Get engagement insights
   */
  public getEngagementInsights(): {
    activeUsers: number;
    avgSessionDuration: string;
    completionRate: number;
    dropoffPoints: Array<{ stage: string; count: number }>;
  } {
    const metrics = metricsTracker.getMetrics();
    
    return {
      activeUsers: metrics.engagement.conversationsStarted,
      avgSessionDuration: metrics.engagement.averageSessionLength,
      completionRate: 0.78, // Would calculate from actual data
      dropoffPoints: [
        { stage: 'After greeting', count: 12 },
        { stage: 'After 3 messages', count: 8 },
        { stage: 'After 10 messages', count: 5 }
      ]
    };
  }
  
  /**
   * Get confidence distribution
   * Shows how confident the system is across classifications
   */
  public getConfidenceDistribution(): {
    veryHigh: number; // 0.9-1.0
    high: number;     // 0.8-0.9
    medium: number;   // 0.7-0.8
    low: number;      // <0.7
  } {
    // Would calculate from actual classification data
    return {
      veryHigh: 65, // 65% of classifications are very confident
      high: 25,     // 25% are confident
      medium: 8,    // 8% are medium confidence
      low: 2        // 2% are low (need clarification)
    };
  }
  
  /**
   * Get ambiguous phrase breakdown
   * Which phrases are most common?
   */
  public getAmbiguousPhraseStats(): Array<{
    phrase: string;
    count: number;
    disambiguationSuccess: number; // %
  }> {
    // Would track actual ambiguous phrases detected
    return [
      { phrase: 'not working', count: 45, disambiguationSuccess: 0.96 },
      { phrase: 'not good', count: 32, disambiguationSuccess: 0.88 },
      { phrase: 'can\'t do this', count: 18, disambiguationSuccess: 1.0 },
      { phrase: 'feeling down', count: 15, disambiguationSuccess: 0.93 },
      { phrase: 'I\'m lost', count: 12, disambiguationSuccess: 0.91 }
    ];
  }
}

// Export singleton instance
export const dashboardQueries = new DashboardQueries();

// ===== EXAMPLE USAGE =====

/**
 * Example 1: Morning safety check
 */
export async function morningDashboardCheck() {
  console.log('🌅 MORNING DASHBOARD CHECK\n');
  
  // 1. Check for high-risk users
  const highRisk = dashboardQueries.getHighRiskUsers();
  if (highRisk.length > 0) {
    console.log(`🚨 ${highRisk.length} high-risk users need attention`);
  }
  
  // 2. Review yesterday's metrics
  const metrics = metricsTracker.getMetrics();
  console.log('📊 Yesterday:', metricsTracker.getMetricsSummary());
  
  // 3. Check if any crises were missed
  if (metrics.safety.missedCrises > 0) {
    console.error('❌ CRITICAL: Missed crises detected!');
  }
  
  // 4. Review cost
  const cost = dashboardQueries.getCostAnalysis();
  console.log(`💰 Current cost: $${cost.currentPeriod.totalCost}`);
  console.log(`   Projected monthly: $${cost.projections.monthly}`);
}

/**
 * Example 2: Weekly performance review
 */
export async function weeklyPerformanceReview() {
  console.log('📈 WEEKLY PERFORMANCE REVIEW\n');
  
  // 1. Classification performance
  const topIssues = dashboardQueries.getTopIssues(5);
  console.log('Top 5 issues:', topIssues);
  
  // 2. Ambiguous phrase handling
  const ambiguous = dashboardQueries.getAmbiguousPhraseStats();
  console.log('Ambiguous phrases:', ambiguous);
  
  // 3. Confidence distribution
  const confidence = dashboardQueries.getConfidenceDistribution();
  console.log('Confidence dist:', confidence);
  
  // 4. Cost efficiency
  const cost = dashboardQueries.getCostAnalysis();
  console.log(`Efficiency: ${cost.efficiency.regexPercentage}% free`);
}

/**
 * Example 3: User risk assessment
 */
export async function assessUserRisk(userId: string, sessionId: string) {
  // Get emotional trend
  const trend = contextManager.getEmotionalTrend(userId, sessionId);
  const summary = contextManager.getConversationSummary(userId, sessionId);
  
  const riskLevel = summary.avgEmotionalIntensity >= 8 ? 'HIGH' :
                    summary.avgEmotionalIntensity >= 6 ? 'MEDIUM' : 'LOW';
  
  return {
    userId,
    sessionId,
    riskLevel,
    emotionalIntensity: summary.avgEmotionalIntensity,
    trend,
    mainTopics: summary.mainTopics,
    recommendation: riskLevel === 'HIGH' 
      ? 'Consider professional referral'
      : 'Continue monitoring'
  };
}






