// Feedback & Analytics System for Continuous Improvement
// Tracks conversation quality, engagement, and user satisfaction

export interface ConversationRating {
  conversationId: string;
  userId: string;
  messageId: string;
  rating: 'thumbs_up' | 'thumbs_down';
  feedbackText?: string; // Optional user comment
  timestamp: string;
  topic?: string; // What the conversation was about
  aiResponseLength?: number;
  responseTime?: number; // milliseconds
}

export interface SessionMetrics {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  messageCount: number;
  completed: boolean; // Did user end naturally vs. abandon
  completionType?: 'natural' | 'crisis_redirect' | 'abandoned' | 'resource_redirect';
  topicsDiscussed: string[];
  averageSentiment?: 'positive' | 'neutral' | 'negative';
  disengagementPoint?: number; // Message number where user stopped
  userSatisfaction?: number; // 1-5 scale if asked
}

export interface ResourceClickThrough {
  resourceType: 'crisis' | 'therapy' | 'addiction' | 'trauma' | 'general';
  resourceName: string;
  userId: string;
  conversationContext: string; // What led to the recommendation
  clicked: boolean;
  timestamp: string;
  sessionId: string;
}

export interface DisengagementPattern {
  topic: string;
  messageNumber: number;
  lastUserMessage: string;
  lastAIResponse: string;
  totalOccurrences: number;
  averageMessageBeforeDisengagement: number;
}

export interface ABTestVariant {
  variantId: string;
  experimentName: string;
  variantType: 'greeting' | 'response_length' | 'question_advice_balance' | 'tone';
  description: string;
  active: boolean;
  samplePercentage: number; // 0-100
  metrics: {
    impressions: number;
    completedSessions: number;
    averageRating: number;
    resourceClickThroughs: number;
    disengagements: number;
  };
}

export class FeedbackAnalyticsService {
  private ratings: ConversationRating[] = [];
  private sessions: SessionMetrics[] = [];
  private resourceClicks: ResourceClickThrough[] = [];
  private abTests: Map<string, ABTestVariant> = new Map();
  
  constructor() {
    this.loadFromStorage();
    this.initializeABTests();
  }

  // ===== CONVERSATION RATINGS =====
  
  recordRating(rating: Omit<ConversationRating, 'timestamp'>): void {
    const fullRating: ConversationRating = {
      ...rating,
      timestamp: new Date().toISOString()
    };
    
    this.ratings.push(fullRating);
    this.saveToStorage();
    
    console.log(`📊 Rating recorded: ${rating.rating} for topic: ${rating.topic}`);
  }

  getRatingStats(timeRange?: { start: Date; end: Date }): {
    totalRatings: number;
    thumbsUp: number;
    thumbsDown: number;
    satisfactionRate: number;
    topRatedTopics: { topic: string; score: number }[];
    bottomRatedTopics: { topic: string; score: number }[];
  } {
    let filteredRatings = this.ratings;
    
    if (timeRange) {
      filteredRatings = this.ratings.filter(r => {
        const ratingDate = new Date(r.timestamp);
        return ratingDate >= timeRange.start && ratingDate <= timeRange.end;
      });
    }
    
    const thumbsUp = filteredRatings.filter(r => r.rating === 'thumbs_up').length;
    const thumbsDown = filteredRatings.filter(r => r.rating === 'thumbs_down').length;
    const total = filteredRatings.length;
    
    // Topic analysis
    const topicScores: { [topic: string]: { up: number; down: number } } = {};
    
    filteredRatings.forEach(r => {
      if (r.topic) {
        if (!topicScores[r.topic]) {
          topicScores[r.topic] = { up: 0, down: 0 };
        }
        if (r.rating === 'thumbs_up') topicScores[r.topic].up++;
        else topicScores[r.topic].down++;
      }
    });
    
    const topicRatings = Object.entries(topicScores).map(([topic, scores]) => ({
      topic,
      score: (scores.up / (scores.up + scores.down)) * 100
    }));
    
    return {
      totalRatings: total,
      thumbsUp,
      thumbsDown,
      satisfactionRate: total > 0 ? (thumbsUp / total) * 100 : 0,
      topRatedTopics: topicRatings.sort((a, b) => b.score - a.score).slice(0, 5),
      bottomRatedTopics: topicRatings.sort((a, b) => a.score - b.score).slice(0, 5)
    };
  }

  // ===== SESSION TRACKING =====
  
  startSession(userId: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: SessionMetrics = {
      sessionId,
      userId,
      startTime: new Date().toISOString(),
      messageCount: 0,
      completed: false,
      topicsDiscussed: []
    };
    
    this.sessions.push(session);
    this.saveToStorage();
    
    return sessionId;
  }

  updateSession(sessionId: string, updates: Partial<SessionMetrics>): void {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      Object.assign(session, updates);
      this.saveToStorage();
    }
  }

  endSession(sessionId: string, completionType: SessionMetrics['completionType']): void {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      session.endTime = new Date().toISOString();
      session.completed = completionType !== 'abandoned';
      session.completionType = completionType;
      this.saveToStorage();
      
      console.log(`📊 Session ended: ${completionType}, ${session.messageCount} messages`);
    }
  }

  getSessionCompletionRate(timeRange?: { start: Date; end: Date }): {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    averageMessageCount: number;
    completionTypes: { [key: string]: number };
  } {
    let filteredSessions = this.sessions;
    
    if (timeRange) {
      filteredSessions = this.sessions.filter(s => {
        const startDate = new Date(s.startTime);
        return startDate >= timeRange.start && startDate <= timeRange.end;
      });
    }
    
    const completed = filteredSessions.filter(s => s.completed).length;
    const total = filteredSessions.length;
    
    const completionTypes: { [key: string]: number } = {};
    filteredSessions.forEach(s => {
      if (s.completionType) {
        completionTypes[s.completionType] = (completionTypes[s.completionType] || 0) + 1;
      }
    });
    
    const avgMessages = filteredSessions.reduce((sum, s) => sum + s.messageCount, 0) / total;
    
    return {
      totalSessions: total,
      completedSessions: completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageMessageCount: avgMessages || 0,
      completionTypes
    };
  }

  // ===== RESOURCE TRACKING =====
  
  recordResourceShown(resource: Omit<ResourceClickThrough, 'timestamp' | 'clicked'>): string {
    const resourceId = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const resourceClick: ResourceClickThrough = {
      ...resource,
      clicked: false,
      timestamp: new Date().toISOString()
    };
    
    this.resourceClicks.push(resourceClick);
    this.saveToStorage();
    
    return resourceId;
  }

  recordResourceClick(resourceName: string, sessionId: string): void {
    const resource = this.resourceClicks.find(
      r => r.resourceName === resourceName && r.sessionId === sessionId && !r.clicked
    );
    
    if (resource) {
      resource.clicked = true;
      this.saveToStorage();
      
      console.log(`📊 Resource clicked: ${resourceName}`);
    }
  }

  getResourceClickThroughRate(): {
    overall: number;
    byType: { [key: string]: { shown: number; clicked: number; rate: number } };
    topPerformers: { resource: string; rate: number }[];
    poorPerformers: { resource: string; rate: number }[];
  } {
    const totalShown = this.resourceClicks.length;
    const totalClicked = this.resourceClicks.filter(r => r.clicked).length;
    
    // By type
    const byType: { [key: string]: { shown: number; clicked: number; rate: number } } = {};
    
    this.resourceClicks.forEach(r => {
      if (!byType[r.resourceType]) {
        byType[r.resourceType] = { shown: 0, clicked: 0, rate: 0 };
      }
      byType[r.resourceType].shown++;
      if (r.clicked) byType[r.resourceType].clicked++;
    });
    
    Object.keys(byType).forEach(type => {
      byType[type].rate = (byType[type].clicked / byType[type].shown) * 100;
    });
    
    // By resource name
    const resourceStats: { [name: string]: { shown: number; clicked: number } } = {};
    
    this.resourceClicks.forEach(r => {
      if (!resourceStats[r.resourceName]) {
        resourceStats[r.resourceName] = { shown: 0, clicked: 0 };
      }
      resourceStats[r.resourceName].shown++;
      if (r.clicked) resourceStats[r.resourceName].clicked++;
    });
    
    const resourceRates = Object.entries(resourceStats)
      .map(([resource, stats]) => ({
        resource,
        rate: (stats.clicked / stats.shown) * 100
      }))
      .filter(r => resourceStats[r.resource].shown >= 5); // Min 5 impressions
    
    return {
      overall: totalShown > 0 ? (totalClicked / totalShown) * 100 : 0,
      byType,
      topPerformers: resourceRates.sort((a, b) => b.rate - a.rate).slice(0, 5),
      poorPerformers: resourceRates.sort((a, b) => a.rate - b.rate).slice(0, 5)
    };
  }

  // ===== DISENGAGEMENT ANALYSIS =====
  
  getDisengagementPatterns(): DisengagementPattern[] {
    const abandonedSessions = this.sessions.filter(s => s.completionType === 'abandoned');
    
    const patterns: { [key: string]: DisengagementPattern } = {};
    
    abandonedSessions.forEach(s => {
      s.topicsDiscussed.forEach(topic => {
        if (!patterns[topic]) {
          patterns[topic] = {
            topic,
            messageNumber: 0,
            lastUserMessage: '',
            lastAIResponse: '',
            totalOccurrences: 0,
            averageMessageBeforeDisengagement: 0
          };
        }
        
        patterns[topic].totalOccurrences++;
        patterns[topic].averageMessageBeforeDisengagement += s.disengagementPoint || s.messageCount;
      });
    });
    
    // Calculate averages
    Object.values(patterns).forEach(pattern => {
      pattern.averageMessageBeforeDisengagement /= pattern.totalOccurrences;
    });
    
    return Object.values(patterns).sort((a, b) => b.totalOccurrences - a.totalOccurrences);
  }

  // ===== A/B TESTING =====
  
  private initializeABTests(): void {
    // Default A/B tests
    this.createABTest({
      variantId: 'greeting_v1',
      experimentName: 'Greeting Style',
      variantType: 'greeting',
      description: 'Standard friendly greeting',
      active: true,
      samplePercentage: 50,
      metrics: { impressions: 0, completedSessions: 0, averageRating: 0, resourceClickThroughs: 0, disengagements: 0 }
    });
    
    this.createABTest({
      variantId: 'greeting_v2',
      experimentName: 'Greeting Style',
      variantType: 'greeting',
      description: 'Empathetic + transparent greeting',
      active: true,
      samplePercentage: 50,
      metrics: { impressions: 0, completedSessions: 0, averageRating: 0, resourceClickThroughs: 0, disengagements: 0 }
    });
  }

  createABTest(variant: ABTestVariant): void {
    this.abTests.set(variant.variantId, variant);
    this.saveToStorage();
  }

  assignVariant(experimentName: string, userId: string): ABTestVariant | null {
    const variants = Array.from(this.abTests.values()).filter(
      v => v.experimentName === experimentName && v.active
    );
    
    if (variants.length === 0) return null;
    
    // Use user ID hash for consistent assignment
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomValue = (hash % 100) / 100;
    
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.samplePercentage / 100;
      if (randomValue < cumulative) {
        variant.metrics.impressions++;
        this.saveToStorage();
        return variant;
      }
    }
    
    return variants[0];
  }

  recordABTestMetric(variantId: string, metricType: keyof ABTestVariant['metrics'], value: number = 1): void {
    const variant = this.abTests.get(variantId);
    if (variant) {
      if (metricType === 'averageRating') {
        // Calculate running average
        const currentAvg = variant.metrics.averageRating;
        const count = variant.metrics.completedSessions || 1;
        variant.metrics.averageRating = (currentAvg * (count - 1) + value) / count;
      } else {
        variant.metrics[metricType] += value;
      }
      this.saveToStorage();
    }
  }

  getABTestResults(experimentName: string): {
    variants: ABTestVariant[];
    winner?: string;
    confidence?: number;
  } {
    const variants = Array.from(this.abTests.values()).filter(
      v => v.experimentName === experimentName
    );
    
    if (variants.length < 2) {
      return { variants };
    }
    
    // Simple winner determination (in production, use proper statistical testing)
    const sorted = variants.sort((a, b) => {
      const scoreA = (a.metrics.completedSessions / Math.max(a.metrics.impressions, 1)) * 0.4 +
                     a.metrics.averageRating * 0.3 +
                     (a.metrics.resourceClickThroughs / Math.max(a.metrics.impressions, 1)) * 0.2 -
                     (a.metrics.disengagements / Math.max(a.metrics.impressions, 1)) * 0.1;
      
      const scoreB = (b.metrics.completedSessions / Math.max(b.metrics.impressions, 1)) * 0.4 +
                     b.metrics.averageRating * 0.3 +
                     (b.metrics.resourceClickThroughs / Math.max(b.metrics.impressions, 1)) * 0.2 -
                     (b.metrics.disengagements / Math.max(b.metrics.impressions, 1)) * 0.1;
      
      return scoreB - scoreA;
    });
    
    const winner = sorted[0].impressions >= 100 ? sorted[0].variantId : undefined;
    const confidence = winner ? Math.min((sorted[0].impressions / 100) * 100, 95) : 0;
    
    return { variants: sorted, winner, confidence };
  }

  // ===== EXPORT & REPORTING =====
  
  generateReport(timeRange?: { start: Date; end: Date }): {
    ratings: ReturnType<typeof this.getRatingStats>;
    sessions: ReturnType<typeof this.getSessionCompletionRate>;
    resources: ReturnType<typeof this.getResourceClickThroughRate>;
    disengagement: DisengagementPattern[];
    abTests: { [experimentName: string]: ReturnType<typeof this.getABTestResults> };
  } {
    const uniqueExperiments = [...new Set(Array.from(this.abTests.values()).map(v => v.experimentName))];
    const abTestResults: { [key: string]: ReturnType<typeof this.getABTestResults> } = {};
    
    uniqueExperiments.forEach(exp => {
      abTestResults[exp] = this.getABTestResults(exp);
    });
    
    return {
      ratings: this.getRatingStats(timeRange),
      sessions: this.getSessionCompletionRate(timeRange),
      resources: this.getResourceClickThroughRate(),
      disengagement: this.getDisengagementPatterns(),
      abTests: abTestResults
    };
  }

  exportData(): string {
    return JSON.stringify({
      ratings: this.ratings,
      sessions: this.sessions,
      resourceClicks: this.resourceClicks,
      abTests: Array.from(this.abTests.entries())
    }, null, 2);
  }

  // ===== PERSISTENCE =====
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('amani_feedback_analytics');
      if (stored) {
        const data = JSON.parse(stored);
        this.ratings = data.ratings || [];
        this.sessions = data.sessions || [];
        this.resourceClicks = data.resourceClicks || [];
        if (data.abTests) {
          this.abTests = new Map(data.abTests);
        }
      }
    } catch (error) {
      console.error('Error loading feedback analytics:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        ratings: this.ratings,
        sessions: this.sessions,
        resourceClicks: this.resourceClicks,
        abTests: Array.from(this.abTests.entries())
      };
      localStorage.setItem('amani_feedback_analytics', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving feedback analytics:', error);
    }
  }
}

export const feedbackAnalytics = new FeedbackAnalyticsService();






