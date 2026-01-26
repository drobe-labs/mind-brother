import React, { useState, useEffect } from 'react';
import {
  generateCulturalAnalyticsReport,
  calculateSystemHealthScore,
  getContextDetectionTrends,
  type CulturalAnalyticsReport,
} from '../lib/culturalAnalytics';
import {
  CULTURAL_BACKGROUNDS,
  COMMUNITIES,
  PRIMARY_CONCERNS,
  COMMUNICATION_STYLES,
} from '../lib/culturalPersonalizationService';
import './CulturalAnalyticsDashboard.css';

interface CulturalAnalyticsDashboardProps {
  onClose?: () => void;
}

export default function CulturalAnalyticsDashboard({ onClose }: CulturalAnalyticsDashboardProps) {
  const [report, setReport] = useState<CulturalAnalyticsReport | null>(null);
  const [healthScore, setHealthScore] = useState<{
    score: number;
    breakdown: { onboardingHealth: number; contextDetectionHealth: number; contentHealth: number; diversityHealth: number };
    recommendations: string[];
  } | null>(null);
  const [trends, setTrends] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'signals'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [reportData, healthData, trendsData] = await Promise.all([
        generateCulturalAnalyticsReport(),
        calculateSystemHealthScore(),
        getContextDetectionTrends(30),
      ]);
      setReport(reportData);
      setHealthScore(healthData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (value: string, list: { value: string; label: string }[]) => {
    return list.find(item => item.value === value)?.label || value;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!report || !healthScore) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <p>❌ Failed to load analytics</p>
          <button onClick={loadAnalytics}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>📊 Cultural Personalization Analytics</h1>
          <p>Monitor the effectiveness of personalization features</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadAnalytics}>
            🔄 Refresh
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      {/* Health Score Card */}
      <div className="health-score-card">
        <div className="health-score-main">
          <div 
            className="health-score-circle"
            style={{ borderColor: getHealthColor(healthScore.score) }}
          >
            <span className="score-value" style={{ color: getHealthColor(healthScore.score) }}>
              {healthScore.score}
            </span>
            <span className="score-label">Health</span>
          </div>
          <div className="health-breakdown">
            <h3>System Health Breakdown</h3>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <span className="breakdown-label">Onboarding</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill"
                    style={{ width: `${(healthScore.breakdown.onboardingHealth / 25) * 100}%` }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.onboardingHealth}/25</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Context Detection</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill"
                    style={{ width: `${(healthScore.breakdown.contextDetectionHealth / 25) * 100}%` }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.contextDetectionHealth}/25</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Content Library</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill"
                    style={{ width: `${(healthScore.breakdown.contentHealth / 25) * 100}%` }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.contentHealth}/25</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Diversity</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill"
                    style={{ width: `${(healthScore.breakdown.diversityHealth / 25) * 100}%` }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.diversityHealth}/25</span>
              </div>
            </div>
          </div>
        </div>
        {healthScore.recommendations.length > 0 && (
          <div className="recommendations">
            <h4>💡 Recommendations</h4>
            <ul>
              {healthScore.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📚 Content
        </button>
        <button 
          className={`tab ${activeTab === 'signals' ? 'active' : ''}`}
          onClick={() => setActiveTab('signals')}
        >
          🔍 Signals
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <span className="stat-value">{report.onboarding.total}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span className="stat-value">{formatPercentage(report.onboarding.completionRate)}</span>
                  <span className="stat-label">Onboarding Rate</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔍</div>
                <div className="stat-info">
                  <span className="stat-value">{report.contextDetection.last7Days}</span>
                  <span className="stat-label">Signals (7d)</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <span className="stat-value">{report.contentUsage.activeContent}</span>
                  <span className="stat-label">Active Content</span>
                </div>
              </div>
            </div>

            {/* Feedback Comparison - Key Metric */}
            <div className="feedback-comparison-card">
              <h3>⭐ Personalized vs Generic Response Satisfaction</h3>
              <div className="feedback-comparison">
                <div className="feedback-stat personalized">
                  <div className="feedback-stat-header">
                    <span className="feedback-icon">🎯</span>
                    <span className="feedback-type">Personalized</span>
                  </div>
                  <div className="feedback-rate">
                    {report.feedbackComparison.culturalPersonalized.satisfactionRate.toFixed(1)}%
                  </div>
                  <div className="feedback-detail">
                    {report.feedbackComparison.culturalPersonalized.thumbsUp} 👍 / {report.feedbackComparison.culturalPersonalized.total} total
                  </div>
                </div>
                <div className="feedback-vs">
                  <div className={`improvement-badge ${report.feedbackComparison.improvement > 0 ? 'positive' : report.feedbackComparison.improvement < 0 ? 'negative' : 'neutral'}`}>
                    {report.feedbackComparison.improvement > 0 ? '+' : ''}{report.feedbackComparison.improvement.toFixed(1)}%
                  </div>
                </div>
                <div className="feedback-stat generic">
                  <div className="feedback-stat-header">
                    <span className="feedback-icon">📝</span>
                    <span className="feedback-type">Generic</span>
                  </div>
                  <div className="feedback-rate">
                    {report.feedbackComparison.generic.satisfactionRate.toFixed(1)}%
                  </div>
                  <div className="feedback-detail">
                    {report.feedbackComparison.generic.thumbsUp} 👍 / {report.feedbackComparison.generic.total} total
                  </div>
                </div>
              </div>
              {report.feedbackComparison.improvement > 0 && (
                <div className="feedback-insight positive">
                  🎉 Cultural personalization is improving user satisfaction by {report.feedbackComparison.improvement.toFixed(1)}%!
                </div>
              )}
              {report.feedbackComparison.improvement < 0 && (
                <div className="feedback-insight negative">
                  ⚠️ Generic responses are performing better. Review personalization settings.
                </div>
              )}
              {report.feedbackComparison.improvement === 0 && (
                <div className="feedback-insight neutral">
                  ➖ No significant difference detected. Gather more data.
                </div>
              )}
            </div>

            {/* Satisfaction by Background */}
            {Object.keys(report.feedbackComparison.byBackground).length > 0 && (
              <div className="section-card">
                <h3>🌍 Satisfaction by Cultural Background</h3>
                <div className="bar-chart-horizontal">
                  {Object.entries(report.feedbackComparison.byBackground)
                    .sort(([, a], [, b]) => b.satisfactionRate - a.satisfactionRate)
                    .map(([bg, stats]) => (
                      <div key={bg} className="bar-row">
                        <span className="bar-label">{getLabel(bg, CULTURAL_BACKGROUNDS)}</span>
                        <div className="bar-track">
                          <div className="bar-fill feedback" style={{ width: `${stats.satisfactionRate}%` }} />
                        </div>
                        <span className="bar-value">{stats.satisfactionRate.toFixed(0)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Signal Trends Chart */}
            {trends.length > 0 && (
              <div className="chart-card">
                <h3>Context Signal Detection (30 Days)</h3>
                <div className="simple-chart">
                  {trends.slice(-14).map((point, i) => {
                    const maxCount = Math.max(...trends.map(t => t.count), 1);
                    const height = (point.count / maxCount) * 100;
                    return (
                      <div key={i} className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${point.date}: ${point.count} signals`}
                        />
                        <span className="chart-label">
                          {new Date(point.date).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-tab">
            {/* Onboarding Stats */}
            <div className="section-card">
              <h3>📝 Onboarding Statistics</h3>
              <div className="onboarding-stats">
                <div className="donut-chart">
                  <svg viewBox="0 0 36 36" className="donut">
                    <path
                      className="donut-ring"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="donut-segment completed"
                      strokeDasharray={`${report.onboarding.completionRate} ${100 - report.onboarding.completionRate}`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="donut-center">
                    <span>{report.onboarding.completed}</span>
                    <small>completed</small>
                  </div>
                </div>
                <div className="onboarding-legend">
                  <div className="legend-item">
                    <span className="legend-dot completed"></span>
                    <span>Completed: {report.onboarding.completed}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot skipped"></span>
                    <span>Skipped: {report.onboarding.skipped}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot pending"></span>
                    <span>No Action: {report.onboarding.noAction}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cultural Breakdown */}
            <div className="section-card">
              <h3>🌍 Cultural Backgrounds</h3>
              <div className="bar-chart-horizontal">
                {Object.entries(report.culturalBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([bg, count]) => {
                    const total = Object.values(report.culturalBreakdown).reduce((a, b) => a + b, 0);
                    const percentage = (count / total) * 100;
                    return (
                      <div key={bg} className="bar-row">
                        <span className="bar-label">{getLabel(bg, CULTURAL_BACKGROUNDS)}</span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="bar-value">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Age Ranges */}
            <div className="section-card">
              <h3>👤 Age Distribution</h3>
              <div className="bar-chart-horizontal">
                {Object.entries(report.ageRanges)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([age, count]) => {
                    const total = Object.values(report.ageRanges).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={age} className="bar-row">
                        <span className="bar-label">{age}</span>
                        <div className="bar-track">
                          <div className="bar-fill age" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="bar-value">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Communication Styles */}
            <div className="section-card">
              <h3>💬 Communication Preferences</h3>
              <div className="bar-chart-horizontal">
                {Object.entries(report.communicationStyles)
                  .sort(([, a], [, b]) => b - a)
                  .map(([style, count]) => {
                    const total = Object.values(report.communicationStyles).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={style} className="bar-row">
                        <span className="bar-label">{getLabel(style, COMMUNICATION_STYLES)}</span>
                        <div className="bar-track">
                          <div className="bar-fill style" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="bar-value">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="content-tab">
            {/* Content Stats */}
            <div className="content-stats-grid">
              <div className="content-stat">
                <span className="content-stat-value">{report.contentUsage.totalContent}</span>
                <span className="content-stat-label">Total Content</span>
              </div>
              <div className="content-stat active">
                <span className="content-stat-value">{report.contentUsage.activeContent}</span>
                <span className="content-stat-label">Active</span>
              </div>
              <div className="content-stat inactive">
                <span className="content-stat-value">{report.contentUsage.totalContent - report.contentUsage.activeContent}</span>
                <span className="content-stat-label">Inactive</span>
              </div>
            </div>

            {/* Content by Type */}
            <div className="section-card">
              <h3>📂 Content by Type</h3>
              <div className="bar-chart-horizontal">
                {Object.entries(report.contentUsage.byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const total = Object.values(report.contentUsage.byType).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={type} className="bar-row">
                        <span className="bar-label">{type.replace(/_/g, ' ')}</span>
                        <div className="bar-track">
                          <div className="bar-fill content" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="bar-value">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Top Concerns */}
            <div className="section-card">
              <h3>💭 Top User Concerns</h3>
              <div className="concerns-list">
                {report.topConcerns.map(([concern, count], i) => (
                  <div key={concern} className="concern-item">
                    <span className="concern-rank">#{i + 1}</span>
                    <span className="concern-name">{getLabel(concern, PRIMARY_CONCERNS)}</span>
                    <span className="concern-count">{count} users</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Communities */}
            <div className="section-card">
              <h3>🤝 Top Communities</h3>
              <div className="concerns-list">
                {report.topCommunities.map(([community, count], i) => (
                  <div key={community} className="concern-item">
                    <span className="concern-rank">#{i + 1}</span>
                    <span className="concern-name">{getLabel(community, COMMUNITIES)}</span>
                    <span className="concern-count">{count} users</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div className="signals-tab">
            {/* Signal Stats */}
            <div className="signal-stats-grid">
              <div className="signal-stat">
                <span className="signal-stat-value">{report.contextDetection.total}</span>
                <span className="signal-stat-label">Total Signals</span>
              </div>
              <div className="signal-stat">
                <span className="signal-stat-value">{report.contextDetection.last7Days}</span>
                <span className="signal-stat-label">Last 7 Days</span>
              </div>
              <div className="signal-stat">
                <span className="signal-stat-value">{report.contextDetection.last30Days}</span>
                <span className="signal-stat-label">Last 30 Days</span>
              </div>
              <div className="signal-stat confidence">
                <span className="signal-stat-value">
                  {formatPercentage(report.contextDetection.averageConfidence * 100)}
                </span>
                <span className="signal-stat-label">Avg Confidence</span>
              </div>
            </div>

            {/* Signals by Type */}
            <div className="section-card">
              <h3>🏷️ Signals by Type</h3>
              <div className="bar-chart-horizontal">
                {Object.entries(report.contextDetection.byType)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([type, count]) => {
                    const total = Object.values(report.contextDetection.byType).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={type} className="bar-row">
                        <span className="bar-label">{type.replace(/_/g, ' ')}</span>
                        <div className="bar-track">
                          <div className="bar-fill signal" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="bar-value">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Signals by Inferred Attribute */}
            {Object.keys(report.contextDetection.byInferredAttribute).length > 0 && (
              <div className="section-card">
                <h3>🧠 Inferred Attributes</h3>
                <div className="bar-chart-horizontal">
                  {Object.entries(report.contextDetection.byInferredAttribute)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([attr, count]) => {
                      const total = Object.values(report.contextDetection.byInferredAttribute).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={attr} className="bar-row">
                          <span className="bar-label">{attr.replace(/_/g, ' ')}</span>
                          <div className="bar-track">
                            <div className="bar-fill inferred" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="bar-value">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="analytics-footer">
        <p>Last updated: {new Date(report.generatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
