import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Scale, 
  RefreshCw,
  ChevronDown,
  Check,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Calendar,
  Activity,
  ArrowLeft
} from 'lucide-react';
import {
  getHighRiskUsers,
  getAllRiskAlerts,
  clearUserAlerts,
  getCommunityHealthMetrics,
  type UserRiskProfile,
  type RiskAlert,
} from '../lib/userRiskTracking';
import {
  getMonitoringRecommendation,
  getUpcomingHighRiskDates,
  generateTimeBasedAlert,
  type HighRiskDate,
} from '../lib/timeBasedMonitoring';
import {
  getPendingAppeals,
  getAppealQueueSummary,
  reviewAppeal,
  type ModerationAppeal,
} from '../lib/moderationAppeals';

interface ModeratorDashboardProps {
  onBack?: () => void;
}

export default function ModeratorDashboard({ onBack }: ModeratorDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'users' | 'appeals'>('overview');
  
  // Data states
  const [healthMetrics, setHealthMetrics] = useState<ReturnType<typeof getCommunityHealthMetrics> | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [highRiskUsers, setHighRiskUsers] = useState<UserRiskProfile[]>([]);
  const [pendingAppeals, setPendingAppeals] = useState<ModerationAppeal[]>([]);
  const [appealSummary, setAppealSummary] = useState<ReturnType<typeof getAppealQueueSummary> | null>(null);
  const [timeBasedAlert, setTimeBasedAlert] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load community health metrics
    const metrics = getCommunityHealthMetrics();
    setHealthMetrics(metrics);

    // Load risk alerts
    const alerts = getAllRiskAlerts();
    setRiskAlerts(alerts);

    // Load high-risk users
    const users = getHighRiskUsers(40); // Users with score >= 40
    setHighRiskUsers(users);

    // Load appeals
    const appeals = getPendingAppeals();
    setPendingAppeals(appeals);
    
    const summary = getAppealQueueSummary();
    setAppealSummary(summary);

    // Check for time-based alerts
    const alert = generateTimeBasedAlert();
    setTimeBasedAlert(alert);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    loadDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleClearAlert = (userId: string) => {
    clearUserAlerts(userId);
    loadDashboardData();
  };

  const handleAppealDecision = async (appealId: string, decision: 'approve' | 'deny') => {
    await reviewAppeal({
      appealId,
      decision,
      reviewerNotes: decision === 'approve' ? 'Approved by moderator' : 'Denied by moderator',
      actionTaken: decision === 'approve' ? 'Content restored' : 'Decision upheld',
      revisedModeration: decision === 'approve' ? {
        newStatus: 'approved',
        newReason: 'Appeal approved - content restored'
      } : undefined
    });
    loadDashboardData();
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'alerts' as const, label: 'Alerts', icon: AlertTriangle, count: riskAlerts.length },
    { id: 'users' as const, label: 'Users', icon: Users, count: highRiskUsers.length },
    { id: 'appeals' as const, label: 'Appeals', icon: Scale, count: pendingAppeals.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-6 h-6 text-cyan-400" />
                  Moderator Dashboard
                </h1>
                <p className="text-sm text-gray-400">Community Safety Monitor</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-900/50 border-b border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-cyan-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            healthMetrics={healthMetrics}
            timeBasedAlert={timeBasedAlert}
            riskAlerts={riskAlerts}
            appealSummary={appealSummary}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsTab alerts={riskAlerts} onClearAlert={handleClearAlert} />
        )}

        {activeTab === 'users' && (
          <UsersTab users={highRiskUsers} onClearAlert={handleClearAlert} />
        )}

        {activeTab === 'appeals' && (
          <AppealsTab 
            appeals={pendingAppeals} 
            summary={appealSummary}
            onDecision={handleAppealDecision}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ healthMetrics, timeBasedAlert, riskAlerts, appealSummary }: {
  healthMetrics: ReturnType<typeof getCommunityHealthMetrics> | null;
  timeBasedAlert: string | null;
  riskAlerts: RiskAlert[];
  appealSummary: ReturnType<typeof getAppealQueueSummary> | null;
}) {
  const upcomingDates = getUpcomingHighRiskDates(14);
  const monitoring = getMonitoringRecommendation();

  const monitoringColors = {
    standard: 'bg-green-500/20 text-green-400 border-green-500/30',
    elevated: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Time-Based Alert */}
      {timeBasedAlert && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <pre className="text-orange-200 text-sm whitespace-pre-wrap font-sans">
            {timeBasedAlert}
          </pre>
        </div>
      )}

      {/* Current Monitoring Level */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Current Monitoring Level
        </h3>
        <div className={`inline-flex px-4 py-2 rounded-full border ${monitoringColors[monitoring.level]}`}>
          <span className="font-semibold">{monitoring.level.toUpperCase()}</span>
        </div>
        <p className="text-gray-400 mt-3 text-sm">{monitoring.message}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {healthMetrics && (
          <>
            <MetricCard label="Tracked Users" value={healthMetrics.totalTrackedUsers} />
            <MetricCard label="Critical Users" value={healthMetrics.criticalUsers} color="red" />
            <MetricCard label="Escalating" value={healthMetrics.escalatingUsers} color="orange" />
            <MetricCard label="Improving" value={healthMetrics.improvingUsers} color="green" />
          </>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Appeal Queue */}
        {appealSummary && (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              Appeal Queue
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Total Pending</p>
                <p className="text-2xl font-bold text-white">{appealSummary.total}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">High Priority</p>
                <p className="text-2xl font-bold text-red-400">{appealSummary.high}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Approval Rate</p>
                <p className="text-2xl font-bold text-cyan-400">{appealSummary.stats.approvalRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Avg Review Time</p>
                <p className="text-2xl font-bold text-white">{appealSummary.stats.averageReviewTimeMinutes}m</p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming High-Risk Dates */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Upcoming High-Risk Dates
          </h3>
          {upcomingDates.length === 0 ? (
            <p className="text-gray-500 text-sm">No high-risk dates in the next 14 days</p>
          ) : (
            <div className="space-y-2">
              {upcomingDates.slice(0, 5).map((date, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                  <div>
                    <p className="text-white text-sm">{date.name}</p>
                    <p className="text-gray-500 text-xs">{new Date(date.date).toLocaleDateString()}</p>
                  </div>
                  <RiskBadge level={date.riskLevel} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Recent Alerts
        </h3>
        {riskAlerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No active alerts</p>
        ) : (
          <div className="space-y-3">
            {riskAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-cyan-400 text-sm font-medium">
                    {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <RiskBadge level={alert.severity} />
                </div>
                <p className="text-gray-300 text-sm">{alert.reason}</p>
                <p className="text-gray-500 text-xs mt-2">
                  User: {alert.username || alert.userId.slice(0, 8)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ALERTS TAB
// ============================================================================

function AlertsTab({ alerts, onClearAlert }: {
  alerts: RiskAlert[];
  onClearAlert: (userId: string) => void;
}) {
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

  const filteredAlerts = filterSeverity
    ? alerts.filter(a => a.severity === filterSeverity)
    : alerts;

  const severities = ['critical', 'high', 'medium'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSeverity(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterSeverity === null
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({alerts.length})
        </button>
        {severities.map(severity => (
          <button
            key={severity}
            onClick={() => setFilterSeverity(severity)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterSeverity === severity
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)} ({alerts.filter(a => a.severity === severity).length})
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No alerts at this level</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert, index) => (
            <div key={index} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-cyan-400 font-medium">
                    {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <p className="text-gray-400 text-sm mt-1">
                    User: {alert.username || alert.userId}
                  </p>
                </div>
                <RiskBadge level={alert.severity} />
              </div>
              
              <p className="text-white mb-3">{alert.reason}</p>
              <p className="text-orange-400 text-sm mb-3">📋 {alert.recommendedAction}</p>
              <p className="text-gray-500 text-xs mb-4">
                {new Date(alert.timestamp).toLocaleString()}
              </p>

              <button
                onClick={() => onClearAlert(alert.userId)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
              >
                Clear Alert
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USERS TAB
// ============================================================================

function UsersTab({ users, onClearAlert }: {
  users: UserRiskProfile[];
  onClearAlert: (userId: string) => void;
}) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'critical':
      case 'escalating':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'improving':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'critical': return 'text-red-400';
      case 'escalating': return 'text-orange-400';
      case 'improving': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">High-Risk Users (Score ≥ 40)</h2>
      
      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No high-risk users currently tracked</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user, index) => (
            <div key={index} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-semibold">{user.username || user.userId.slice(0, 12)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(user.riskTrend)}
                    <span className={`text-sm ${getTrendColor(user.riskTrend)}`}>
                      {user.riskTrend.charAt(0).toUpperCase() + user.riskTrend.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">Risk Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(user.escalationScore)}`}>
                    {user.escalationScore.toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-xs">Posts (24h)</p>
                  <p className="text-white font-medium">{user.recentPosts.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Crisis Keywords</p>
                  <p className="text-white font-medium">{user.crisisKeywordCount}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Positive Interactions</p>
                  <p className="text-white font-medium">{user.positiveInteractions}</p>
                </div>
              </div>

              {user.lastCrisisPost && (
                <p className="text-orange-400 text-sm mb-3">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Last crisis post: {new Date(user.lastCrisisPost).toLocaleString()}
                </p>
              )}

              {user.flaggedForReview && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
                  <span className="text-red-400 text-sm font-medium">⚠️ FLAGGED FOR REVIEW</span>
                </div>
              )}

              <button
                onClick={() => onClearAlert(user.userId)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
              >
                Clear Alerts
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// APPEALS TAB
// ============================================================================

function AppealsTab({ appeals, summary, onDecision }: {
  appeals: ModerationAppeal[];
  summary: ReturnType<typeof getAppealQueueSummary> | null;
  onDecision: (appealId: string, decision: 'approve' | 'deny') => void;
}) {
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const filteredAppeals = filterPriority
    ? appeals.filter(a => a.priority === filterPriority)
    : appeals;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Pending" value={summary.total} />
          <MetricCard label="High Priority" value={summary.high} color="red" />
          <MetricCard label="False Positive Rate" value={`${summary.stats.falsePositiveRate.toFixed(1)}%`} color="cyan" />
          <MetricCard label="Avg Review Time" value={`${summary.stats.averageReviewTimeMinutes}m`} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterPriority(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterPriority === null
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({appeals.length})
        </button>
        {['high', 'medium', 'low'].map(priority => (
          <button
            key={priority}
            onClick={() => setFilterPriority(priority)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterPriority === priority
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)} ({appeals.filter(a => a.priority === priority).length})
          </button>
        ))}
      </div>

      {/* Appeals List */}
      {filteredAppeals.length === 0 ? (
        <div className="text-center py-12">
          <Scale className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No pending appeals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppeals.map((appeal, index) => (
            <div key={index} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-gray-500 text-xs font-mono">
                    #{appeal.id.slice(-8)}
                  </span>
                  <p className="text-gray-300 text-sm mt-1">
                    User: {appeal.username || appeal.userId.slice(0, 12)}
                  </p>
                </div>
                <RiskBadge level={appeal.priority} />
              </div>

              <div className="mb-3">
                <span className="text-orange-400 text-sm font-medium">
                  Action: {appeal.moderationAction.toUpperCase()}
                </span>
                <p className="text-gray-400 text-sm mt-1">
                  Original Reason: {appeal.originalReason}
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-3 mb-3 border-l-2 border-gray-600">
                <p className="text-white text-sm line-clamp-3">{appeal.originalContent}</p>
              </div>

              <p className="text-cyan-400 text-sm mb-3">
                <strong>Appeal Reason:</strong> {appeal.appealReason}
              </p>

              <p className="text-gray-500 text-xs mb-4">
                Submitted: {new Date(appeal.createdAt).toLocaleString()}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => onDecision(appeal.id, 'approve')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => onDecision(appeal.id, 'deny')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function MetricCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClasses = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ? colorClasses[color as keyof typeof colorClasses] : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[level] || colors.low}`}>
      {level.toUpperCase()}
    </span>
  );
}


