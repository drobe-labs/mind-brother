// User Insights Dashboard for Mind Brother
// Displays mental health journey insights in an engaging way

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  generateUserInsights,
  type UserInsights,
  type TopicInsight,
  type GrowthArea,
  type CulturalStressor,
  type Recommendation,
} from '../lib/userInsightsService';
import './UserInsightsDashboard.css';

interface UserInsightsDashboardProps {
  onBack?: () => void;
}

export default function UserInsightsDashboard({ onBack }: UserInsightsDashboardProps) {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'emotions' | 'growth' | 'recommendations'>('overview');

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadInsights();
    }
  }, [userId, timePeriod]);

  const loadInsights = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await generateUserInsights(userId, timePeriod);
      setInsights(data);
    } catch (err) {
      console.error('Error loading insights:', err);
      setError('Unable to generate insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="insights-container">
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your journey...</p>
          <span className="loading-subtext">This may take a moment</span>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="insights-container">
        <div className="insights-error">
          <span className="error-icon">📊</span>
          <h2>Not enough data yet</h2>
          <p>{error || 'Continue chatting with Amani to build your insights.'}</p>
          {onBack && (
            <button className="btn-primary" onClick={onBack}>
              Back to Chat
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="insights-container">
      {/* Header */}
      <header className="insights-header">
        <div className="header-content">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1>Your Journey</h1>
          <select 
            className="period-selector"
            value={timePeriod}
            onChange={(e) => setTimePeriod(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 3 months</option>
          </select>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="insights-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'topics' ? 'active' : ''}`}
          onClick={() => setActiveTab('topics')}
        >
          Topics
        </button>
        <button 
          className={`tab ${activeTab === 'emotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          Emotions
        </button>
        <button 
          className={`tab ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          Growth
        </button>
        <button 
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Next Steps
        </button>
      </nav>

      {/* Content */}
      <main className="insights-content">
        {activeTab === 'overview' && <OverviewTab insights={insights} />}
        {activeTab === 'topics' && <TopicsTab insights={insights} />}
        {activeTab === 'emotions' && <EmotionsTab insights={insights} />}
        {activeTab === 'growth' && <GrowthTab insights={insights} />}
        {activeTab === 'recommendations' && <RecommendationsTab insights={insights} />}
      </main>

      {/* Footer */}
      <footer className="insights-footer">
        <p className="privacy-note">
          🔒 Your insights are private and only visible to you
        </p>
        <p className="generated-at">
          Generated {new Date(insights.generatedAt).toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function OverviewTab({ insights }: { insights: UserInsights }) {
  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'needs_attention': return '💙';
      default: return '📊';
    }
  };

  const getConsistencyMessage = (consistency: string) => {
    switch (consistency) {
      case 'improving': return "You're checking in more often!";
      case 'stable': return "You're maintaining a steady rhythm.";
      case 'declining': return "Consider checking in more regularly.";
      default: return "";
    }
  };

  return (
    <div className="overview-tab">
      {/* Hero Stats */}
      <div className="hero-stats">
        <div className="stat-card engagement">
          <div className="stat-circle" style={{ '--progress': `${insights.engagementScore}%` } as React.CSSProperties}>
            <span className="stat-value">{insights.engagementScore}</span>
          </div>
          <span className="stat-label">Engagement Score</span>
        </div>
        
        <div className="stat-card mood">
          <div className="mood-display">
            <span className="mood-value">{insights.emotionalTrends.averageMood.toFixed(1)}</span>
            <span className="mood-max">/10</span>
          </div>
          <span className="stat-label">Average Mood</span>
          <span className="stat-trend">
            {getTrendEmoji(insights.emotionalTrends.overallTrend)} {insights.emotionalTrends.overallTrend.replace('_', ' ')}
          </span>
        </div>
        
        <div className="stat-card streak">
          <span className="stat-value">{insights.streakDays}</span>
          <span className="stat-label">Day Streak</span>
          <span className="stat-trend">{getConsistencyMessage(insights.checkInConsistency)}</span>
        </div>
      </div>

      {/* Quick Summary */}
      <section className="summary-section">
        <h2>Your Month at a Glance</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <span className="card-icon">💬</span>
            <div className="card-content">
              <span className="card-value">{insights.totalConversations}</span>
              <span className="card-label">Conversations</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="card-icon">📝</span>
            <div className="card-content">
              <span className="card-value">{insights.totalMessages}</span>
              <span className="card-label">Messages</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="card-icon">⏱️</span>
            <div className="card-content">
              <span className="card-value">{insights.averageSessionLength}</span>
              <span className="card-label">Avg. Minutes/Session</span>
            </div>
          </div>
        </div>
      </section>

      {/* Positive Shifts */}
      {insights.positiveShifts.length > 0 && (
        <section className="wins-section">
          <h2>🌟 Wins This Month</h2>
          <div className="wins-list">
            {insights.positiveShifts.slice(0, 3).map((shift, index) => (
              <div key={index} className="win-item">
                <span className="win-icon">✨</span>
                <div className="win-content">
                  <p className="win-description">{shift.description}</p>
                  <span className="win-date">
                    {new Date(shift.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strengths */}
      {insights.strengthsIdentified.length > 0 && (
        <section className="strengths-section">
          <h2>💪 Your Strengths</h2>
          <div className="strengths-list">
            {insights.strengthsIdentified.map((strength, index) => (
              <span key={index} className="strength-badge">{strength}</span>
            ))}
          </div>
        </section>
      )}

      {/* Cultural Strengths */}
      {insights.culturalStrengths.length > 0 && (
        <section className="cultural-strengths-section">
          <h2>🌍 Cultural Strengths</h2>
          <div className="cultural-list">
            {insights.culturalStrengths.map((strength, index) => (
              <div key={index} className="cultural-item">
                <span className="cultural-icon">🌱</span>
                <span className="cultural-text">{strength}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TopicsTab({ insights }: { insights: UserInsights }) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'mixed': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className="topics-tab">
      <h2>What You've Been Discussing</h2>
      
      {insights.mostDiscussedTopics.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💭</span>
          <p>Not enough conversations to identify topics yet.</p>
          <span className="empty-hint">Keep chatting to see your patterns!</span>
        </div>
      ) : (
        <>
          <div className="topics-chart">
            {insights.mostDiscussedTopics.map((topic, index) => (
              <TopicBar key={topic.topic} topic={topic} maxCount={insights.mostDiscussedTopics[0].mentionCount} rank={index + 1} />
            ))}
          </div>

          {/* Topic Details */}
          <div className="topics-details">
            {insights.mostDiscussedTopics.map((topic) => (
              <div key={topic.topic} className="topic-detail-card">
                <div className="topic-header">
                  <h3>{topic.displayName}</h3>
                  <span className="topic-trend">
                    {getTrendIcon(topic.trend)} {topic.trend}
                  </span>
                </div>
                <div className="topic-meta">
                  <span 
                    className="sentiment-badge"
                    style={{ backgroundColor: getSentimentColor(topic.sentiment) }}
                  >
                    {topic.sentiment}
                  </span>
                  <span className="mention-count">{topic.mentionCount} mentions</span>
                </div>
                {topic.relatedEmotions.length > 0 && (
                  <div className="related-emotions">
                    <span className="label">Related feelings:</span>
                    {topic.relatedEmotions.map((emotion, i) => (
                      <span key={i} className="emotion-tag">{emotion}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Emerging & Resolved */}
          <div className="topic-changes">
            {insights.emergingTopics.length > 0 && (
              <div className="topic-change-section emerging">
                <h3>📈 Emerging Topics</h3>
                <p>These are coming up more often:</p>
                <ul>
                  {insights.emergingTopics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.resolvedTopics.length > 0 && (
              <div className="topic-change-section resolved">
                <h3>✅ Topics Fading</h3>
                <p>These are coming up less:</p>
                <ul>
                  {insights.resolvedTopics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TopicBar({ topic, maxCount, rank }: { topic: TopicInsight; maxCount: number; rank: number }) {
  const percentage = (topic.mentionCount / maxCount) * 100;
  
  return (
    <div className="topic-bar">
      <span className="topic-rank">#{rank}</span>
      <span className="topic-name">{topic.displayName}</span>
      <div className="bar-container">
        <div 
          className="bar-fill"
          style={{ 
            width: `${percentage}%`,
            animationDelay: `${rank * 0.1}s`
          }}
        />
      </div>
      <span className="topic-count">{topic.mentionCount}</span>
    </div>
  );
}

function EmotionsTab({ insights }: { insights: UserInsights }) {
  const { emotionalTrends, moodDistribution } = insights;
  
  const totalMoods = Object.values(moodDistribution).reduce((a, b) => a + b, 0);
  
  const getMoodPercentage = (count: number) => {
    return totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0;
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'great': return '🌟';
      case 'good': return '😊';
      case 'okay': return '😐';
      case 'notGreat': return '😔';
      case 'struggling': return '💙';
      default: return '•';
    }
  };

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'great': return 'Great';
      case 'good': return 'Good';
      case 'okay': return 'Okay';
      case 'notGreat': return 'Not Great';
      case 'struggling': return 'Struggling';
      default: return mood;
    }
  };

  return (
    <div className="emotions-tab">
      <h2>Emotional Landscape</h2>
      
      {/* Mood Overview */}
      <div className="mood-overview">
        <div className="mood-metric">
          <span className="metric-label">Overall Trend</span>
          <span className={`metric-value trend-${emotionalTrends.overallTrend}`}>
            {emotionalTrends.overallTrend === 'improving' && '📈 Improving'}
            {emotionalTrends.overallTrend === 'stable' && '➡️ Stable'}
            {emotionalTrends.overallTrend === 'needs_attention' && '💙 Needs Care'}
          </span>
        </div>
        <div className="mood-metric">
          <span className="metric-label">Mood Variability</span>
          <span className="metric-value">
            {emotionalTrends.moodVariability === 'low' && '🎯 Steady'}
            {emotionalTrends.moodVariability === 'medium' && '🌊 Variable'}
            {emotionalTrends.moodVariability === 'high' && '🎢 Fluctuating'}
          </span>
        </div>
      </div>

      {/* Mood Distribution */}
      <section className="mood-distribution-section">
        <h3>Mood Distribution</h3>
        <div className="mood-bars">
          {Object.entries(moodDistribution).map(([mood, count]) => (
            <div key={mood} className="mood-bar-item">
              <div className="mood-bar-label">
                <span className="mood-emoji">{getMoodEmoji(mood)}</span>
                <span className="mood-name">{getMoodLabel(mood)}</span>
              </div>
              <div className="mood-bar-container">
                <div 
                  className={`mood-bar-fill mood-${mood}`}
                  style={{ width: `${getMoodPercentage(count)}%` }}
                />
              </div>
              <span className="mood-percentage">{getMoodPercentage(count)}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Best Days */}
      {emotionalTrends.bestDays.length > 0 && (
        <section className="best-days-section">
          <h3>🌞 Your Best Days</h3>
          <p>You tend to feel better on:</p>
          <div className="best-days-list">
            {emotionalTrends.bestDays.map((day, index) => (
              <span key={index} className="best-day-badge">{day}</span>
            ))}
          </div>
        </section>
      )}

      {/* Coping Strategies */}
      {insights.copingStrategiesUsed.length > 0 && (
        <section className="coping-section">
          <h3>🛠️ Coping Strategies You've Used</h3>
          <div className="coping-list">
            {insights.copingStrategiesUsed.map((strategy, index) => (
              <div key={index} className="coping-item">
                <span className="coping-icon">✓</span>
                <span className="coping-name">{strategy}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GrowthTab({ insights }: { insights: UserInsights }) {
  const getProgressIcon = (progress: string) => {
    switch (progress) {
      case 'significant': return '🌟';
      case 'moderate': return '📈';
      case 'beginning': return '🌱';
      case 'potential': return '💡';
      default: return '•';
    }
  };

  const getProgressLabel = (progress: string) => {
    switch (progress) {
      case 'significant': return 'Significant Progress';
      case 'moderate': return 'Growing';
      case 'beginning': return 'Just Starting';
      case 'potential': return 'Potential';
      default: return progress;
    }
  };

  return (
    <div className="growth-tab">
      <h2>Your Growth Journey</h2>
      
      {insights.growthAreas.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🌱</span>
          <p>Keep engaging to track your growth!</p>
          <span className="empty-hint">Every conversation plants seeds for change.</span>
        </div>
      ) : (
        <>
          {/* Growth Areas */}
          <div className="growth-areas">
            {insights.growthAreas.map((area, index) => (
              <GrowthAreaCard key={index} area={area} />
            ))}
          </div>

          {/* Cultural Stressors */}
          {insights.culturalStressors.length > 0 && (
            <section className="stressors-section">
              <h3>🌍 Cultural Factors</h3>
              <p>These cultural experiences have been showing up in your journey:</p>
              <div className="stressors-list">
                {insights.culturalStressors.map((stressor, index) => (
                  <div key={index} className="stressor-card">
                    <div className="stressor-header">
                      <span className="stressor-name">{stressor.stressor}</span>
                      <span className={`impact-badge impact-${stressor.impact}`}>
                        {stressor.impact} impact
                      </span>
                    </div>
                    <p className="stressor-context">{stressor.context}</p>
                    <span className={`frequency-badge frequency-${stressor.frequency}`}>
                      {stressor.frequency}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function GrowthAreaCard({ area }: { area: GrowthArea }) {
  const [expanded, setExpanded] = useState(false);

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'significant': return '#10b981';
      case 'moderate': return '#3b82f6';
      case 'beginning': return '#f59e0b';
      case 'potential': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div 
      className={`growth-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="growth-card-header">
        <div className="growth-info">
          <h4>{area.area}</h4>
          <span 
            className="progress-badge"
            style={{ backgroundColor: getProgressColor(area.progress) }}
          >
            {area.progress === 'significant' && '🌟'}
            {area.progress === 'moderate' && '📈'}
            {area.progress === 'beginning' && '🌱'}
            {area.progress === 'potential' && '💡'}
            {area.progress.charAt(0).toUpperCase() + area.progress.slice(1)}
          </span>
        </div>
        <span className="expand-icon">{expanded ? '−' : '+'}</span>
      </div>
      
      <p className="growth-description">{area.description}</p>
      
      {expanded && (
        <div className="growth-details">
          {area.evidence.length > 0 && (
            <div className="evidence-section">
              <h5>Evidence:</h5>
              <ul>
                {area.evidence.map((e, i) => (
                  <li key={i}>"{e}"</li>
                ))}
              </ul>
            </div>
          )}
          
          {area.nextSteps.length > 0 && (
            <div className="next-steps-section">
              <h5>Next Steps:</h5>
              <ul>
                {area.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationsTab({ insights }: { insights: UserInsights }) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '•';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return '⚡';
      case 'resource': return '📚';
      case 'reflection': return '💭';
      case 'goal': return '🎯';
      default: return '•';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return '📄';
      case 'exercise': return '🧘';
      case 'community': return '👥';
      case 'professional': return '👨‍⚕️';
      default: return '📌';
    }
  };

  return (
    <div className="recommendations-tab">
      <h2>Your Next Steps</h2>
      
      {insights.recommendations.length === 0 && insights.suggestedResources.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎯</span>
          <p>Keep chatting to get personalized recommendations!</p>
        </div>
      ) : (
        <>
          {/* Recommendations */}
          <div className="recommendations-list">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card priority-${rec.priority}`}>
                <div className="rec-header">
                  <span className="rec-type-icon">{getTypeIcon(rec.type)}</span>
                  <h4>{rec.title}</h4>
                  <span className="priority-indicator">{getPriorityIcon(rec.priority)}</span>
                </div>
                <p className="rec-description">{rec.description}</p>
                <p className="rec-reason">
                  <strong>Why:</strong> {rec.reason}
                </p>
                <div className="rec-action">
                  <span className="action-label">Try this:</span>
                  <span className="action-text">{rec.actionable}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested Resources */}
          {insights.suggestedResources.length > 0 && (
            <section className="resources-section">
              <h3>📚 Suggested Resources</h3>
              <div className="resources-list">
                {insights.suggestedResources.map((resource, index) => (
                  <div key={index} className="resource-card">
                    <span className="resource-icon">{getResourceTypeIcon(resource.type)}</span>
                    <div className="resource-content">
                      <h4>{resource.title}</h4>
                      <p>{resource.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Affirmation */}
      <div className="affirmation-section">
        <p className="affirmation">
          💙 Remember: Progress isn't linear. Every step forward, no matter how small, is meaningful.
        </p>
      </div>
    </div>
  );
}
