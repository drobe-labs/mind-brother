import React, { useState, useEffect } from 'react';
import { evaluationService } from '../lib/evaluationFramework';
import { safetyTestCases } from '../lib/safetyTestCases';

export default function EvaluationDashboard() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testingAll, setTestingAll] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadReport();
  }, [timeRange]);

  const loadReport = () => {
    setLoading(true);
    
    const now = new Date();
    let start: Date;
    
    if (timeRange === '7d') {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      start = new Date(0); // All time
    }
    
    const generatedReport = evaluationService.generateComprehensiveReport(start, now);
    setReport(generatedReport);
    setLoading(false);
  };

  const runAllSafetyTests = async () => {
    setTestingAll(true);
    
    for (const testCase of safetyTestCases) {
      evaluationService.runSafetyTest(testCase);
      // Small delay to not overwhelm
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setTestingAll(false);
    loadReport(); // Reload to show results
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evaluation report...</p>
        </div>
      </div>
    );
  }

  const { quality, safety, engagement, overallHealth } = report;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evaluation Dashboard</h1>
          <p className="text-gray-600 mt-1">Quality • Safety • Engagement Metrics</p>
        </div>
        
        <div className="flex gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          
          <button
            onClick={runAllSafetyTests}
            disabled={testingAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {testingAll ? 'Testing...' : 'Run Safety Tests'}
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Overall Health Score</h2>
            <p className="text-indigo-100">
              Aggregate measure of quality, safety, and engagement
            </p>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold">{overallHealth.score.toFixed(1)}</div>
            <div className="text-3xl font-bold mt-2">Grade: {overallHealth.grade}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="font-semibold mb-2">✅ Strengths</h3>
            <ul className="space-y-1">
              {overallHealth.strengths.map((s: string, i: number) => (
                <li key={i} className="text-sm">• {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">⚠️ Areas for Improvement</h3>
            <ul className="space-y-1">
              {overallHealth.weaknesses.map((w: string, i: number) => (
                <li key={i} className="text-sm">• {w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Quality Metrics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {Object.entries(quality.averageScores).map(([metric, score]: [string, any]) => (
            <div key={metric} className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{score.toFixed(1)}</div>
              <div className="text-sm text-gray-600 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</div>
              <div className="mt-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Top Performing Topics</h3>
            {Object.entries(quality.scoresByTopic)
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 5)
              .map(([topic, score]: [string, any]) => (
                <div key={topic} className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 capitalize">{topic}</span>
                  <span className="font-semibold text-green-600">{score.toFixed(1)}/5</span>
                </div>
              ))}
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Needs Improvement</h3>
            {Object.entries(quality.scoresByTopic)
              .sort(([, a]: any, [, b]: any) => a - b)
              .slice(0, 5)
              .map(([topic, score]: [string, any]) => (
                <div key={topic} className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 capitalize">{topic}</span>
                  <span className="font-semibold text-red-600">{score.toFixed(1)}/5</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Safety Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🛡️ Safety Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{safety.crisisDetectionAccuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Detection Accuracy</div>
            <div className="text-xs text-gray-500 mt-1">Target: ≥95%</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{safety.falsePositiveRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">False Positive Rate</div>
            <div className="text-xs text-gray-500 mt-1">Target: ≤10%</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{safety.falseNegativeRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">False Negative Rate</div>
            <div className="text-xs text-gray-500 mt-1">Target: 0% (CRITICAL)</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{safety.averageResponseTime.toFixed(0)}ms</div>
            <div className="text-sm text-gray-600">Response Time</div>
            <div className="text-xs text-gray-500 mt-1">Target: ≤100ms</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">By Severity</h3>
            {Object.entries(safety.bySeverity).map(([severity, stats]: [string, any]) => (
              <div key={severity} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-700 capitalize">{severity}</span>
                  <span className="text-sm text-gray-600">{stats.count} tests</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.accuracy >= 95 ? 'bg-green-600' :
                      stats.accuracy >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${stats.accuracy}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{stats.accuracy.toFixed(1)}% accuracy</div>
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">By Category</h3>
            {Object.entries(safety.byCategory).map(([category, stats]: [string, any]) => (
              <div key={category} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-700 capitalize">{category.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-red-600">
                    {stats.falseNegatives} missed
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stats.accuracy >= 95 ? 'bg-green-600' :
                      stats.accuracy >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${stats.accuracy}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{stats.accuracy.toFixed(1)}% accuracy</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Engagement Metrics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{engagement.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{engagement.activeUsers}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{engagement.averageConversationLength.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Messages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{engagement.returnUserRate.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Return Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Cohort Retention</h3>
            <div className="space-y-2">
              {Object.entries(engagement.cohortRetention).map(([week, rate]: [string, any]) => (
                <div key={week}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700">{week.replace('week', 'Week ')}</span>
                    <span className="font-semibold">{rate}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Top Engaging Topics</h3>
            {engagement.topEngagingTopics.map((topic: any) => (
              <div key={topic.topic} className="flex items-center justify-between mb-2">
                <span className="text-gray-700 capitalize">{topic.topic}</span>
                <span className="font-semibold text-green-600">{topic.avgLength} msgs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {overallHealth.recommendations.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3">💡 Recommendations</h3>
          <ul className="space-y-2">
            {overallHealth.recommendations.map((rec: string, i: number) => (
              <li key={i} className="text-blue-800">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}












