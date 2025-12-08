// Feedback Collection System
// Collects user feedback for continuous improvement

class FeedbackCollector {
  constructor() {
    this.feedbackStore = new Map(); // In-memory for now, should be DB
    this.classificationErrors = new Map();
    this.feedbackStats = {
      helpful: 0,
      not_helpful: 0,
      wrong_category: 0,
      tone_off: 0,
      total: 0
    };
  }
  
  /**
   * Get feedback options to include in response
   */
  getFeedbackOptions() {
    return [
      { id: 'helpful', label: '👍 Helpful', emoji: '👍' },
      { id: 'not_helpful', label: '👎 Not helpful', emoji: '👎' },
      { id: 'wrong_category', label: '🏷️ Wrong topic', emoji: '🏷️' },
      { id: 'tone_off', label: '🗣️ Tone was off', emoji: '🗣️' }
    ];
  }
  
  /**
   * Record user feedback
   */
  async recordFeedback(messageId, userId, sessionId, feedbackType, details = {}) {
    const feedback = {
      messageId,
      userId,
      sessionId,
      feedbackType,
      details,
      timestamp: new Date()
    };
    
    // Store feedback
    this.feedbackStore.set(messageId, feedback);
    
    // Update stats
    if (this.feedbackStats[feedbackType] !== undefined) {
      this.feedbackStats[feedbackType]++;
    }
    this.feedbackStats.total++;
    
    console.log(`📝 Feedback recorded: ${feedbackType} for message ${messageId}`);
    
    // Handle specific feedback types
    if (feedbackType === 'wrong_category') {
      await this.recordClassificationError(messageId, details);
    }
    
    if (feedbackType === 'tone_off') {
      await this.recordToneIssue(messageId, details);
    }
    
    // TODO: Insert to database
    // await db.feedback.insert(feedback);
    
    return feedback;
  }
  
  /**
   * Record classification error for training
   */
  async recordClassificationError(messageId, details) {
    const error = {
      messageId,
      originalMessage: details.message || '',
      predictedCategory: details.predicted || '',
      actualCategory: details.actual || '',
      predictedSubcategory: details.predictedSubcategory || null,
      actualSubcategory: details.actualSubcategory || null,
      confidence: details.confidence || 0,
      method: details.method || 'unknown',
      timestamp: new Date(),
      userId: details.userId,
      sessionId: details.sessionId
    };
    
    this.classificationErrors.set(messageId, error);
    
    console.warn(`⚠️  Classification error logged:`);
    console.warn(`   Message: "${error.originalMessage.substring(0, 50)}..."`);
    console.warn(`   Predicted: ${error.predictedCategory} (${error.confidence})`);
    console.warn(`   Actual: ${error.actualCategory}`);
    
    // TODO: Insert to database
    // await db.classificationErrors.insert(error);
    
    return error;
  }
  
  /**
   * Record tone issue for improvement
   */
  async recordToneIssue(messageId, details) {
    const issue = {
      messageId,
      originalMessage: details.message || '',
      responseText: details.responseText || '',
      category: details.category || '',
      emotionalIntensity: details.emotionalIntensity || 0,
      userComment: details.userComment || '',
      timestamp: new Date(),
      userId: details.userId,
      sessionId: details.sessionId
    };
    
    console.warn(`⚠️  Tone issue logged:`);
    console.warn(`   Category: ${issue.category}`);
    console.warn(`   Intensity: ${issue.emotionalIntensity}`);
    if (issue.userComment) {
      console.warn(`   User comment: ${issue.userComment}`);
    }
    
    // TODO: Insert to database
    // await db.toneIssues.insert(issue);
    
    return issue;
  }
  
  /**
   * Get feedback statistics
   */
  getFeedbackStats() {
    const total = this.feedbackStats.total;
    
    return {
      ...this.feedbackStats,
      helpfulRate: total > 0 ? (this.feedbackStats.helpful / total * 100).toFixed(1) : 0,
      errorRate: total > 0 ? ((this.feedbackStats.wrong_category + this.feedbackStats.tone_off) / total * 100).toFixed(1) : 0,
      classificationErrors: this.classificationErrors.size,
      totalFeedback: this.feedbackStore.size
    };
  }
  
  /**
   * Get classification errors for review
   */
  getClassificationErrors(limit = 50) {
    const errors = Array.from(this.classificationErrors.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return errors;
  }
  
  /**
   * Get category confusion matrix
   */
  getCategoryConfusionMatrix() {
    const matrix = {};
    
    for (const error of this.classificationErrors.values()) {
      const key = `${error.predictedCategory} → ${error.actualCategory}`;
      if (!matrix[key]) {
        matrix[key] = {
          predicted: error.predictedCategory,
          actual: error.actualCategory,
          count: 0,
          examples: []
        };
      }
      matrix[key].count++;
      if (matrix[key].examples.length < 3) {
        matrix[key].examples.push({
          message: error.originalMessage.substring(0, 100),
          confidence: error.confidence
        });
      }
    }
    
    // Sort by frequency
    return Object.values(matrix).sort((a, b) => b.count - a.count);
  }
  
  /**
   * Get feedback by message ID
   */
  getFeedbackByMessageId(messageId) {
    return this.feedbackStore.get(messageId);
  }
  
  /**
   * Get insights for improvement
   */
  getImprovementInsights() {
    const stats = this.getFeedbackStats();
    const confusionMatrix = this.getCategoryConfusionMatrix();
    const errors = this.getClassificationErrors(10);
    
    const insights = [];
    
    // Low helpful rate
    if (parseFloat(stats.helpfulRate) < 70) {
      insights.push({
        type: 'warning',
        title: 'Low helpful rate',
        description: `Only ${stats.helpfulRate}% of responses marked as helpful`,
        action: 'Review response templates and improve empathy'
      });
    }
    
    // High error rate
    if (parseFloat(stats.errorRate) > 20) {
      insights.push({
        type: 'critical',
        title: 'High error rate',
        description: `${stats.errorRate}% of responses have issues`,
        action: 'Review classification accuracy and tone settings'
      });
    }
    
    // Common classification errors
    if (confusionMatrix.length > 0) {
      const topError = confusionMatrix[0];
      if (topError.count >= 5) {
        insights.push({
          type: 'improvement',
          title: 'Common classification error',
          description: `"${topError.predicted}" often confused with "${topError.actual}" (${topError.count} times)`,
          action: 'Improve pattern detection for this category',
          examples: topError.examples
        });
      }
    }
    
    // Recent errors needing review
    if (errors.length > 0) {
      insights.push({
        type: 'info',
        title: 'Recent classification errors',
        description: `${errors.length} errors need review`,
        action: 'Review and update classification patterns',
        errors: errors.slice(0, 5).map(e => ({
          message: e.originalMessage.substring(0, 100),
          predicted: e.predictedCategory,
          actual: e.actualCategory
        }))
      });
    }
    
    return insights;
  }
  
  /**
   * Export feedback for analysis (CSV format)
   */
  exportFeedbackCSV() {
    const headers = ['timestamp', 'userId', 'sessionId', 'messageId', 'feedbackType', 'details'];
    const rows = Array.from(this.feedbackStore.values()).map(f => [
      f.timestamp.toISOString(),
      f.userId,
      f.sessionId,
      f.messageId,
      f.feedbackType,
      JSON.stringify(f.details)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  /**
   * Export classification errors for training
   */
  exportClassificationErrorsJSON() {
    return Array.from(this.classificationErrors.values());
  }
  
  /**
   * Evaluate classification accuracy based on feedback
   */
  async evaluateClassificationAccuracy(limit = 100) {
    // Get recent feedback
    const recentFeedback = Array.from(this.feedbackStore.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    if (recentFeedback.length === 0) {
      return {
        accuracy: 0,
        totalFeedback: 0,
        helpful: 0,
        notHelpful: 0,
        wrongCategory: 0,
        toneOff: 0,
        errorPatterns: [],
        message: 'No feedback data available'
      };
    }
    
    // Calculate accuracy (helpful / total)
    const helpful = recentFeedback.filter(f => f.feedbackType === 'helpful').length;
    const accuracy = (helpful / recentFeedback.length) * 100;
    
    // Count feedback types
    const counts = {
      helpful: 0,
      not_helpful: 0,
      wrong_category: 0,
      tone_off: 0
    };
    
    for (const feedback of recentFeedback) {
      if (counts[feedback.feedbackType] !== undefined) {
        counts[feedback.feedbackType]++;
      }
    }
    
    // Analyze error patterns
    const errors = recentFeedback.filter(f => f.feedbackType === 'wrong_category');
    const errorPatterns = {};
    
    for (const error of errors) {
      const predicted = error.details.predicted || 'UNKNOWN';
      const actual = error.details.actual || 'UNKNOWN';
      const key = `${predicted} → ${actual}`;
      
      if (!errorPatterns[key]) {
        errorPatterns[key] = {
          pattern: key,
          predicted: predicted,
          actual: actual,
          count: 0,
          avgConfidence: 0,
          confidenceSum: 0
        };
      }
      
      errorPatterns[key].count++;
      errorPatterns[key].confidenceSum += error.details.confidence || 0;
    }
    
    // Calculate average confidence for each pattern
    const errorPatternsArray = Object.values(errorPatterns).map(p => ({
      pattern: p.pattern,
      predicted: p.predicted,
      actual: p.actual,
      count: p.count,
      avgConfidence: p.count > 0 ? (p.confidenceSum / p.count).toFixed(2) : 0
    })).sort((a, b) => b.count - a.count);
    
    const result = {
      accuracy: accuracy.toFixed(1),
      totalFeedback: recentFeedback.length,
      helpful: counts.helpful,
      notHelpful: counts.not_helpful,
      wrongCategory: counts.wrong_category,
      toneOff: counts.tone_off,
      errorPatterns: errorPatternsArray,
      timestamp: new Date().toISOString()
    };
    
    console.log(`\n📊 CLASSIFICATION ACCURACY EVALUATION`);
    console.log(`   Total feedback: ${result.totalFeedback}`);
    console.log(`   Accuracy: ${result.accuracy}%`);
    console.log(`   Helpful: ${result.helpful} (${((result.helpful / result.totalFeedback) * 100).toFixed(1)}%)`);
    console.log(`   Not helpful: ${result.notHelpful} (${((result.notHelpful / result.totalFeedback) * 100).toFixed(1)}%)`);
    console.log(`   Wrong category: ${result.wrongCategory} (${((result.wrongCategory / result.totalFeedback) * 100).toFixed(1)}%)`);
    console.log(`   Tone off: ${result.toneOff} (${((result.toneOff / result.totalFeedback) * 100).toFixed(1)}%)`);
    
    if (errorPatternsArray.length > 0) {
      console.log(`\n   ⚠️  Common misclassifications:`);
      errorPatternsArray.slice(0, 5).forEach(p => {
        console.log(`      • ${p.pattern}: ${p.count} times (avg confidence: ${p.avgConfidence})`);
      });
    }
    
    return result;
  }
  
  /**
   * Track accuracy over time (daily snapshots)
   */
  async trackAccuracyTrend(days = 7) {
    // This would require database with timestamps
    // For now, just return current evaluation
    const current = await this.evaluateClassificationAccuracy();
    
    return {
      currentAccuracy: parseFloat(current.accuracy),
      trend: 'stable', // Would calculate from historical data
      historicalData: [
        {
          date: new Date().toISOString().split('T')[0],
          accuracy: parseFloat(current.accuracy),
          totalFeedback: current.totalFeedback
        }
      ]
    };
  }
  
  /**
   * Get model health report
   */
  async getModelHealthReport() {
    const evaluation = await this.evaluateClassificationAccuracy(100);
    const insights = this.getImprovementInsights();
    const confusionMatrix = this.getCategoryConfusionMatrix();
    
    // Determine overall health
    const accuracy = parseFloat(evaluation.accuracy);
    const errorRate = ((evaluation.wrongCategory + evaluation.toneOff) / evaluation.totalFeedback) * 100;
    
    let health = 'excellent';
    if (accuracy < 70 || errorRate > 20) {
      health = 'critical';
    } else if (accuracy < 80 || errorRate > 10) {
      health = 'needs_improvement';
    } else if (accuracy < 90) {
      health = 'good';
    }
    
    return {
      health: health,
      accuracy: accuracy,
      errorRate: errorRate.toFixed(1),
      totalFeedback: evaluation.totalFeedback,
      topIssues: confusionMatrix.slice(0, 3),
      insights: insights,
      recommendations: this.generateRecommendations(evaluation, confusionMatrix),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Generate recommendations based on evaluation
   */
  generateRecommendations(evaluation, confusionMatrix) {
    const recommendations = [];
    const accuracy = parseFloat(evaluation.accuracy);
    
    // Low accuracy
    if (accuracy < 80) {
      recommendations.push({
        priority: 'high',
        category: 'accuracy',
        title: 'Improve Classification Accuracy',
        description: `Current accuracy is ${evaluation.accuracy}% (target: 80%+)`,
        actions: [
          'Review and update classification patterns',
          'Add more context detection rules',
          'Fine-tune Claude prompts with recent errors',
          'Consider A/B testing new classification approaches'
        ]
      });
    }
    
    // High error rate
    const errorRate = ((evaluation.wrongCategory + evaluation.toneOff) / evaluation.totalFeedback) * 100;
    if (errorRate > 10) {
      recommendations.push({
        priority: 'high',
        category: 'errors',
        title: 'Reduce Error Rate',
        description: `Error rate is ${errorRate.toFixed(1)}% (target: <10%)`,
        actions: [
          'Review classification errors endpoint',
          'Update disambiguation logic',
          'Add confidence thresholds',
          'Implement fallback strategies'
        ]
      });
    }
    
    // Common confusion patterns
    if (confusionMatrix.length > 0) {
      const topError = confusionMatrix[0];
      if (topError.count >= 5) {
        recommendations.push({
          priority: 'medium',
          category: 'patterns',
          title: `Fix ${topError.predicted} → ${topError.actual} Confusion`,
          description: `This pattern occurs ${topError.count} times`,
          actions: [
            `Add specific detection for ${topError.actual} category`,
            `Review examples: ${topError.examples.map(e => e.message.substring(0, 40)).join(', ')}`,
            `Update context keywords for ${topError.predicted}`,
            `Test with similar messages`
          ]
        });
      }
    }
    
    // Tone issues
    if (evaluation.toneOff > evaluation.totalFeedback * 0.05) {
      recommendations.push({
        priority: 'medium',
        category: 'tone',
        title: 'Improve Response Tone',
        description: `${evaluation.toneOff} tone issues reported`,
        actions: [
          'Review response templates',
          'Adjust empathy level settings',
          'Check for overly formal/informal language',
          'Test tone with different emotional intensities'
        ]
      });
    }
    
    return recommendations;
  }
}

// Singleton instance
let feedbackCollector = null;

/**
 * Get or create the feedback collector
 */
function getFeedbackCollector() {
  if (!feedbackCollector) {
    feedbackCollector = new FeedbackCollector();
  }
  return feedbackCollector;
}

/**
 * Record feedback
 */
async function recordFeedback(messageId, userId, sessionId, feedbackType, details) {
  return getFeedbackCollector().recordFeedback(messageId, userId, sessionId, feedbackType, details);
}

/**
 * Get feedback options
 */
function getFeedbackOptions() {
  return getFeedbackCollector().getFeedbackOptions();
}

module.exports = {
  FeedbackCollector,
  getFeedbackCollector,
  recordFeedback,
  getFeedbackOptions
};

