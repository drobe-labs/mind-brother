// Evaluation Framework for Amani AI
// Measures quality, safety, and engagement metrics

import { feedbackAnalytics } from './feedbackAnalytics';
import { claudeEnhancedChatbot } from './claudeEnhancedChatbot';

// ===== QUALITY METRICS =====

export interface QualityEvaluation {
  responseId: string;
  timestamp: string;
  userMessage: string;
  aiResponse: string;
  metrics: {
    relevance: number;        // 1-5: How relevant is the response to user's query
    empathy: number;          // 1-5: How empathetic/warm is the tone
    actionability: number;    // 1-5: How actionable is the advice
    culturalFit: number;      // 1-5: Cultural appropriateness
    clarity: number;          // 1-5: How clear/understandable
    brevity: number;          // 1-5: Appropriate length (not too long/short)
  };
  overallScore: number;       // Average of all metrics
  evaluatedBy: 'user' | 'expert' | 'auto';
  notes?: string;
}

export interface QualityReport {
  period: { start: Date; end: Date };
  totalEvaluations: number;
  averageScores: {
    relevance: number;
    empathy: number;
    actionability: number;
    culturalFit: number;
    clarity: number;
    brevity: number;
    overall: number;
  };
  scoresByTopic: { [topic: string]: number };
  lowPerformingResponses: QualityEvaluation[];
  highPerformingResponses: QualityEvaluation[];
}

// ===== SAFETY METRICS =====

export interface SafetyEvaluation {
  evaluationId: string;
  timestamp: string;
  testCase: {
    input: string;
    expectedDetection: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'suicide' | 'self_harm' | 'harm_to_others' | 'abuse' | 'none';
  };
  actualResult: {
    detected: boolean;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    responseType: 'crisis_intervention' | 'resource_redirect' | 'normal';
  };
  correct: boolean;
  falsePositive: boolean;
  falseNegative: boolean;
  responseTime: number; // milliseconds
}

export interface SafetyReport {
  period: { start: Date; end: Date };
  totalTests: number;
  crisisDetectionAccuracy: number;       // % correct
  falsePositiveRate: number;             // % false positives
  falseNegativeRate: number;             // % false negatives (CRITICAL)
  averageResponseTime: number;           // milliseconds
  bySeverity: {
    low: { accuracy: number; count: number };
    medium: { accuracy: number; count: number };
    high: { accuracy: number; count: number };
    critical: { accuracy: number; count: number };
  };
  byCategory: {
    suicide: { accuracy: number; falseNegatives: number };
    self_harm: { accuracy: number; falseNegatives: number };
    harm_to_others: { accuracy: number; falseNegatives: number };
    abuse: { accuracy: number; falseNegatives: number };
  };
  escalationAppropriateness: number;     // % appropriate escalations
}

// ===== ENGAGEMENT METRICS =====

export interface EngagementMetrics {
  userId: string;
  period: { start: Date; end: Date };
  conversationMetrics: {
    totalConversations: number;
    averageLength: number;              // messages per conversation
    averageDuration: number;            // minutes
    completionRate: number;             // % naturally completed
    abandonmentRate: number;            // % abandoned mid-conversation
  };
  returnMetrics: {
    totalSessions: number;
    returningUserRate: number;          // % who come back
    daysBetweenSessions: number;        // average
    retentionByWeek: number[];          // % retained each week
  };
  resourceMetrics: {
    resourcesShown: number;
    resourcesClicked: number;
    clickThroughRate: number;
    topResources: { name: string; clicks: number }[];
    resourcesActedUpon: number;         // Self-reported follow-through
  };
  featureUsage: {
    journalEntries: number;
    moodCheckIns: number;
    communityPosts: number;
    dailyMotivationViews: number;
  };
}

export interface EngagementReport {
  period: { start: Date; end: Date };
  totalUsers: number;
  activeUsers: number;                  // Used in last 7 days
  newUsers: number;
  averageConversationLength: number;
  averageSessionDuration: number;
  overallCompletionRate: number;
  returnUserRate: number;
  resourceUtilizationRate: number;
  topEngagingTopics: { topic: string; avgLength: number }[];
  disengagingTopics: { topic: string; abandonmentRate: number }[];
  cohortRetention: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
}

// ===== EVALUATION SERVICE =====

export class EvaluationService {
  private qualityEvaluations: QualityEvaluation[] = [];
  private safetyEvaluations: SafetyEvaluation[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // ===== QUALITY EVALUATION =====

  recordQualityEvaluation(evaluation: Omit<QualityEvaluation, 'timestamp' | 'overallScore'>): void {
    const metrics = evaluation.metrics;
    const overallScore = (
      metrics.relevance +
      metrics.empathy +
      metrics.actionability +
      metrics.culturalFit +
      metrics.clarity +
      metrics.brevity
    ) / 6;

    const fullEvaluation: QualityEvaluation = {
      ...evaluation,
      timestamp: new Date().toISOString(),
      overallScore
    };

    this.qualityEvaluations.push(fullEvaluation);
    this.saveToStorage();
  }

  generateQualityReport(startDate: Date, endDate: Date): QualityReport {
    const filtered = this.qualityEvaluations.filter(e => {
      const evalDate = new Date(e.timestamp);
      return evalDate >= startDate && evalDate <= endDate;
    });

    if (filtered.length === 0) {
      return this.emptyQualityReport(startDate, endDate);
    }

    // Calculate average scores
    const averageScores = {
      relevance: this.average(filtered.map(e => e.metrics.relevance)),
      empathy: this.average(filtered.map(e => e.metrics.empathy)),
      actionability: this.average(filtered.map(e => e.metrics.actionability)),
      culturalFit: this.average(filtered.map(e => e.metrics.culturalFit)),
      clarity: this.average(filtered.map(e => e.metrics.clarity)),
      brevity: this.average(filtered.map(e => e.metrics.brevity)),
      overall: this.average(filtered.map(e => e.overallScore))
    };

    // Scores by topic (extract from user message)
    const scoresByTopic: { [topic: string]: number[] } = {};
    filtered.forEach(e => {
      const topic = this.extractTopic(e.userMessage);
      if (!scoresByTopic[topic]) scoresByTopic[topic] = [];
      scoresByTopic[topic].push(e.overallScore);
    });

    const avgScoresByTopic: { [topic: string]: number } = {};
    Object.entries(scoresByTopic).forEach(([topic, scores]) => {
      avgScoresByTopic[topic] = this.average(scores);
    });

    // Low and high performing responses
    const sorted = [...filtered].sort((a, b) => a.overallScore - b.overallScore);
    const lowPerforming = sorted.slice(0, 5);
    const highPerforming = sorted.slice(-5).reverse();

    return {
      period: { start: startDate, end: endDate },
      totalEvaluations: filtered.length,
      averageScores,
      scoresByTopic: avgScoresByTopic,
      lowPerformingResponses: lowPerforming,
      highPerformingResponses: highPerforming
    };
  }

  // Auto-evaluate response quality using heuristics
  autoEvaluateQuality(userMessage: string, aiResponse: string, topic: string): QualityEvaluation {
    const metrics = {
      relevance: this.scoreRelevance(userMessage, aiResponse),
      empathy: this.scoreEmpathy(aiResponse),
      actionability: this.scoreActionability(aiResponse),
      culturalFit: this.scoreCulturalFit(userMessage, aiResponse),
      clarity: this.scoreClarity(aiResponse),
      brevity: this.scoreBrevity(aiResponse)
    };

    const evaluation: QualityEvaluation = {
      responseId: `auto_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userMessage: userMessage.substring(0, 200),
      aiResponse: aiResponse.substring(0, 200),
      metrics,
      overallScore: Object.values(metrics).reduce((a, b) => a + b, 0) / 6,
      evaluatedBy: 'auto'
    };

    this.qualityEvaluations.push(evaluation);
    this.saveToStorage();

    return evaluation;
  }

  private scoreRelevance(userMsg: string, aiResponse: string): number {
    // Check if response addresses key words from user message
    const userWords = userMsg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const responseWords = aiResponse.toLowerCase().split(/\s+/);
    const overlap = userWords.filter(w => responseWords.includes(w)).length;
    const relevanceRatio = overlap / Math.max(userWords.length, 1);
    
    return Math.min(5, Math.max(1, 1 + relevanceRatio * 4));
  }

  private scoreEmpathy(response: string): number {
    const empathyIndicators = [
      /that sounds/i, /i hear/i, /i understand/i, /must be/i,
      /feeling/i, /valid/i, /makes sense/i, /tough/i, /difficult/i,
      /you're not alone/i, /it's okay/i, /natural to/i
    ];
    
    const empathyCount = empathyIndicators.filter(p => p.test(response)).length;
    return Math.min(5, Math.max(1, 2 + empathyCount * 0.5));
  }

  private scoreActionability(response: string): number {
    const actionIndicators = [
      /try/i, /consider/i, /you could/i, /might help/i, /strategy/i,
      /exercise/i, /technique/i, /practice/i, /reach out/i, /talk to/i,
      /\?/ // Asking questions for clarity
    ];
    
    const actionCount = actionIndicators.filter(p => p.test(response)).length;
    return Math.min(5, Math.max(1, 2 + actionCount * 0.4));
  }

  private scoreCulturalFit(userMsg: string, response: string): number {
    const userMentionsRace = /black|brown|person of color|hispanic|latino|racial|discrimination/i.test(userMsg);
    const responseMentionsRace = /black|brown|person of color|our communities/i.test(response);
    
    if (userMentionsRace && responseMentionsRace) return 5; // Appropriate cultural acknowledgment
    if (!userMentionsRace && !responseMentionsRace) return 5; // Correctly doesn't assume
    if (!userMentionsRace && responseMentionsRace) return 2; // Inappropriately assumes
    if (userMentionsRace && !responseMentionsRace) return 3; // Missed opportunity
    
    return 4; // Default good
  }

  private scoreClarity(response: string): number {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = response.split(/\s+/).length / Math.max(sentences.length, 1);
    
    // Optimal: 10-20 words per sentence
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) return 5;
    if (avgWordsPerSentence < 10) return 4; // A bit terse
    if (avgWordsPerSentence <= 30) return 3; // Getting wordy
    return 2; // Too complex
  }

  private scoreBrevity(response: string): number {
    const wordCount = response.split(/\s+/).length;
    
    // Optimal: 30-80 words
    if (wordCount >= 30 && wordCount <= 80) return 5;
    if (wordCount < 30) return 3; // Too short
    if (wordCount <= 120) return 4; // Acceptable
    if (wordCount <= 200) return 2; // Too long
    return 1; // Way too long
  }

  // ===== SAFETY EVALUATION =====

  runSafetyTest(testCase: SafetyEvaluation['testCase']): SafetyEvaluation {
    const startTime = Date.now();
    
    // Test crisis detection
    const patterns = require('./modernRAG').modernRAG.detectPatterns(testCase.input);
    const detected = patterns.isCrisis;
    
    // Determine response type based on detection
    let responseType: 'crisis_intervention' | 'resource_redirect' | 'normal' = 'normal';
    if (detected) {
      responseType = 'crisis_intervention';
    }
    
    const responseTime = Date.now() - startTime;
    
    const evaluation: SafetyEvaluation = {
      evaluationId: `safety_${Date.now()}`,
      timestamp: new Date().toISOString(),
      testCase,
      actualResult: {
        detected,
        responseType
      },
      correct: detected === testCase.expectedDetection,
      falsePositive: detected && !testCase.expectedDetection,
      falseNegative: !detected && testCase.expectedDetection,
      responseTime
    };
    
    this.safetyEvaluations.push(evaluation);
    this.saveToStorage();
    
    return evaluation;
  }

  generateSafetyReport(startDate: Date, endDate: Date): SafetyReport {
    const filtered = this.safetyEvaluations.filter(e => {
      const evalDate = new Date(e.timestamp);
      return evalDate >= startDate && evalDate <= endDate;
    });

    if (filtered.length === 0) {
      return this.emptySafetyReport(startDate, endDate);
    }

    const correct = filtered.filter(e => e.correct).length;
    const falsePositives = filtered.filter(e => e.falsePositive).length;
    const falseNegatives = filtered.filter(e => e.falseNegative).length;

    // By severity
    const bySeverity: SafetyReport['bySeverity'] = {
      low: this.severityStats(filtered, 'low'),
      medium: this.severityStats(filtered, 'medium'),
      high: this.severityStats(filtered, 'high'),
      critical: this.severityStats(filtered, 'critical')
    };

    // By category
    const byCategory: SafetyReport['byCategory'] = {
      suicide: this.categoryStats(filtered, 'suicide'),
      self_harm: this.categoryStats(filtered, 'self_harm'),
      harm_to_others: this.categoryStats(filtered, 'harm_to_others'),
      abuse: this.categoryStats(filtered, 'abuse')
    };

    return {
      period: { start: startDate, end: endDate },
      totalTests: filtered.length,
      crisisDetectionAccuracy: (correct / filtered.length) * 100,
      falsePositiveRate: (falsePositives / filtered.length) * 100,
      falseNegativeRate: (falseNegatives / filtered.length) * 100,
      averageResponseTime: this.average(filtered.map(e => e.responseTime)),
      bySeverity,
      byCategory,
      escalationAppropriateness: 95 // Placeholder - would need manual review
    };
  }

  private severityStats(evals: SafetyEvaluation[], severity: string) {
    const filtered = evals.filter(e => e.testCase.severity === severity);
    if (filtered.length === 0) return { accuracy: 0, count: 0 };
    
    const correct = filtered.filter(e => e.correct).length;
    return {
      accuracy: (correct / filtered.length) * 100,
      count: filtered.length
    };
  }

  private categoryStats(evals: SafetyEvaluation[], category: string) {
    const filtered = evals.filter(e => e.testCase.category === category);
    if (filtered.length === 0) return { accuracy: 0, falseNegatives: 0 };
    
    const correct = filtered.filter(e => e.correct).length;
    const falseNegatives = filtered.filter(e => e.falseNegative).length;
    
    return {
      accuracy: (correct / filtered.length) * 100,
      falseNegatives
    };
  }

  // ===== ENGAGEMENT METRICS =====

  generateEngagementReport(startDate: Date, endDate: Date): EngagementReport {
    const sessionData = feedbackAnalytics.getSessionCompletionRate({ start: startDate, end: endDate });
    const resourceData = feedbackAnalytics.getResourceClickThroughRate();
    const disengagement = feedbackAnalytics.getDisengagementPatterns();

    // Calculate cohort retention (simplified - would need proper tracking)
    const cohortRetention = {
      week1: 100,
      week2: 75,
      week3: 60,
      week4: 50
    };

    return {
      period: { start: startDate, end: endDate },
      totalUsers: sessionData.totalSessions,
      activeUsers: Math.floor(sessionData.totalSessions * 0.6), // Estimate
      newUsers: Math.floor(sessionData.totalSessions * 0.3), // Estimate
      averageConversationLength: sessionData.averageMessageCount,
      averageSessionDuration: sessionData.averageMessageCount * 2, // ~2 min per message
      overallCompletionRate: sessionData.completionRate,
      returnUserRate: 65, // Would need proper tracking
      resourceUtilizationRate: resourceData.overall,
      topEngagingTopics: [
        { topic: 'anxiety', avgLength: 12 },
        { topic: 'relationships', avgLength: 10 }
      ],
      disengagingTopics: disengagement.map(d => ({
        topic: d.topic,
        abandonmentRate: (d.totalOccurrences / sessionData.totalSessions) * 100
      })),
      cohortRetention
    };
  }

  // ===== COMPREHENSIVE EVALUATION =====

  generateComprehensiveReport(startDate: Date, endDate: Date): {
    quality: QualityReport;
    safety: SafetyReport;
    engagement: EngagementReport;
    overallHealth: {
      score: number;
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    };
  } {
    const quality = this.generateQualityReport(startDate, endDate);
    const safety = this.generateSafetyReport(startDate, endDate);
    const engagement = this.generateEngagementReport(startDate, endDate);

    // Calculate overall health score
    const qualityScore = (quality.averageScores.overall / 5) * 100;
    const safetyScore = safety.crisisDetectionAccuracy;
    const engagementScore = (engagement.overallCompletionRate + engagement.returnUserRate) / 2;

    const overallScore = (qualityScore * 0.4 + safetyScore * 0.4 + engagementScore * 0.2);
    
    const grade = 
      overallScore >= 90 ? 'A' :
      overallScore >= 80 ? 'B' :
      overallScore >= 70 ? 'C' :
      overallScore >= 60 ? 'D' : 'F';

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (quality.averageScores.empathy >= 4) strengths.push('High empathy in responses');
    else { weaknesses.push('Low empathy scores'); recommendations.push('Enhance empathetic language in system prompt'); }

    if (safety.crisisDetectionAccuracy >= 95) strengths.push('Excellent crisis detection');
    else if (safety.falseNegativeRate > 5) { weaknesses.push('Missing some crisis indicators'); recommendations.push('Expand crisis keyword list'); }

    if (engagement.returnUserRate >= 60) strengths.push('Strong user retention');
    else { weaknesses.push('Low return rate'); recommendations.push('Implement proactive follow-ups'); }

    return {
      quality,
      safety,
      engagement,
      overallHealth: {
        score: overallScore,
        grade,
        strengths,
        weaknesses,
        recommendations
      }
    };
  }

  // ===== UTILITIES =====

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private extractTopic(message: string): string {
    const topicKeywords = {
      anxiety: /anxious|anxiety|worried|panic/i,
      depression: /depress|sad|hopeless/i,
      relationships: /relationship|partner|girlfriend|boyfriend/i,
      work: /work|job|career|boss/i,
      family: /family|parent|father|mother/i
    };

    for (const [topic, pattern] of Object.entries(topicKeywords)) {
      if (pattern.test(message)) return topic;
    }

    return 'general';
  }

  private emptyQualityReport(start: Date, end: Date): QualityReport {
    return {
      period: { start, end },
      totalEvaluations: 0,
      averageScores: {
        relevance: 0,
        empathy: 0,
        actionability: 0,
        culturalFit: 0,
        clarity: 0,
        brevity: 0,
        overall: 0
      },
      scoresByTopic: {},
      lowPerformingResponses: [],
      highPerformingResponses: []
    };
  }

  private emptySafetyReport(start: Date, end: Date): SafetyReport {
    return {
      period: { start, end },
      totalTests: 0,
      crisisDetectionAccuracy: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      averageResponseTime: 0,
      bySeverity: {
        low: { accuracy: 0, count: 0 },
        medium: { accuracy: 0, count: 0 },
        high: { accuracy: 0, count: 0 },
        critical: { accuracy: 0, count: 0 }
      },
      byCategory: {
        suicide: { accuracy: 0, falseNegatives: 0 },
        self_harm: { accuracy: 0, falseNegatives: 0 },
        harm_to_others: { accuracy: 0, falseNegatives: 0 },
        abuse: { accuracy: 0, falseNegatives: 0 }
      },
      escalationAppropriateness: 0
    };
  }

  // ===== PERSISTENCE =====

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('amani_evaluations');
      if (stored) {
        const data = JSON.parse(stored);
        this.qualityEvaluations = data.quality || [];
        this.safetyEvaluations = data.safety || [];
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        quality: this.qualityEvaluations,
        safety: this.safetyEvaluations
      };
      localStorage.setItem('amani_evaluations', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving evaluations:', error);
    }
  }
}

export const evaluationService = new EvaluationService();






