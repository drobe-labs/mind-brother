import React, { useState, useEffect } from 'react';
import { feedbackAnalytics } from '../lib/feedbackAnalytics';

export default function AnalyticsDashboard() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    loadReport();
  }, [timeRange]);

  const loadReport = () => {
    setLoading(true);
    
    const now = new Date();
    let start: Date | undefined;
    
    if (timeRange === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const generatedReport = feedbackAnalytics.generateReport(
      start ? { start, end: now } : undefined
    );
    
    setReport(generatedReport);
    setLoading(false);
  };

  const exportData = () => {
    const data = feedbackAnalytics.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amani-analytics-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Amani AI Continuous Improvement</p>
        </div>
        
        <div className="flex gap-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          
          {/* Export Button */}
          <button
            onClick={exportData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Satisfaction Rate */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Satisfaction Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {report.ratings.satisfactionRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">👍</div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {report.ratings.thumbsUp} up / {report.ratings.thumbsDown} down
          </p>
        </div>

        {/* Session Completion */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {report.sessions.completionRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {report.sessions.completedSessions} / {report.sessions.totalSessions} sessions
          </p>
        </div>

        {/* Resource Click-Through */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Resource CTR</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {report.resources.overall.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">🔗</div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Users clicking resources
          </p>
        </div>

        {/* Avg Messages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Messages</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {report.sessions.averageMessageCount.toFixed(1)}
              </p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Per session
          </p>
        </div>
      </div>

      {/* Topic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Rated Topics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🌟 Top Rated Topics</h2>
          {report.ratings.topRatedTopics.length > 0 ? (
            <div className="space-y-3">
              {report.ratings.topRatedTopics.map((topic: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700">{topic.topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 px-3 py-1 rounded-full">
                      <span className="text-green-700 font-semibold">{topic.score.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No ratings yet</p>
          )}
        </div>

        {/* Needs Improvement */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Needs Improvement</h2>
          {report.ratings.bottomRatedTopics.length > 0 ? (
            <div className="space-y-3">
              {report.ratings.bottomRatedTopics.map((topic: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700">{topic.topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-red-100 px-3 py-1 rounded-full">
                      <span className="text-red-700 font-semibold">{topic.score.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No ratings yet</p>
          )}
        </div>
      </div>

      {/* Resource Performance */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Resource Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(report.resources.byType).map(([type, stats]: [string, any]) => (
            <div key={type} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 capitalize mb-2">{type}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Shown: {stats.shown}</span>
                <span className="text-gray-600">Clicked: {stats.clicked}</span>
              </div>
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${stats.rate}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{stats.rate.toFixed(1)}% CTR</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disengagement Patterns */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🚪 Disengagement Patterns</h2>
        {report.disengagement.length > 0 ? (
          <div className="space-y-3">
            {report.disengagement.slice(0, 5).map((pattern: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <span className="text-gray-900 font-medium">{pattern.topic}</span>
                  <p className="text-sm text-gray-600">
                    Avg {pattern.averageMessageBeforeDisengagement.toFixed(1)} messages before dropout
                  </p>
                </div>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {pattern.totalOccurrences} times
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No disengagement patterns detected</p>
        )}
      </div>

      {/* A/B Test Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🧪 A/B Test Results</h2>
        {Object.entries(report.abTests).map(([experimentName, results]: [string, any]) => (
          <div key={experimentName} className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{experimentName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.variants.map((variant: any) => (
                <div
                  key={variant.variantId}
                  className={`border-2 rounded-lg p-4 ${
                    results.winner === variant.variantId
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{variant.description}</h4>
                    {results.winner === variant.variantId && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                        WINNER ({results.confidence.toFixed(0)}% conf.)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Impressions</p>
                      <p className="font-semibold">{variant.metrics.impressions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Completed</p>
                      <p className="font-semibold">{variant.metrics.completedSessions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Rating</p>
                      <p className="font-semibold">{variant.metrics.averageRating.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Resource Clicks</p>
                      <p className="font-semibold">{variant.metrics.resourceClickThroughs}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}












