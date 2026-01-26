// Time-Based Risk Monitoring
// Adjusts moderation sensitivity based on time of day, day of week, and known high-risk periods

export interface TimeRiskFactor {
  period: string;
  riskMultiplier: number; // 1.0 = normal, >1.0 = higher risk
  reason: string;
}

export interface HighRiskDate {
  date: string; // YYYY-MM-DD format
  name: string;
  riskLevel: 'medium' | 'high' | 'critical';
  reason: string;
}

// ============================================================================
// HIGH-RISK TIME PERIODS
// ============================================================================

const HIGH_RISK_HOURS = {
  // Late night hours (11 PM - 4 AM) = higher crisis risk
  lateNight: {
    start: 23, // 11 PM
    end: 4,    // 4 AM
    multiplier: 1.5,
    reason: 'Late night hours show increased crisis risk',
  },
  
  // Early morning (4 AM - 7 AM) = moderate risk
  earlyMorning: {
    start: 4,
    end: 7,
    multiplier: 1.3,
    reason: 'Early morning isolation periods',
  },
  
  // Sunday evenings (6 PM - 11 PM) = moderate risk
  sundayEvening: {
    day: 0, // Sunday
    start: 18, // 6 PM
    end: 23,   // 11 PM
    multiplier: 1.4,
    reason: 'Sunday evening anxiety ("Sunday scaries")',
  },
};

// ============================================================================
// HIGH-RISK DATES (2025-2026)
// ============================================================================

const HIGH_RISK_DATES: HighRiskDate[] = [
  // Major Holidays (isolation/family stress)
  {
    date: '2025-12-24',
    name: 'Christmas Eve',
    riskLevel: 'high',
    reason: 'Holiday isolation and family stress',
  },
  {
    date: '2025-12-25',
    name: 'Christmas Day',
    riskLevel: 'high',
    reason: 'Holiday isolation and family stress',
  },
  {
    date: '2025-12-31',
    name: 'New Year\'s Eve',
    riskLevel: 'high',
    reason: 'End of year reflection, loneliness',
  },
  {
    date: '2026-01-01',
    name: 'New Year\'s Day',
    riskLevel: 'high',
    reason: 'Post-holiday depression',
  },
  {
    date: '2025-11-27',
    name: 'Thanksgiving',
    riskLevel: 'medium',
    reason: 'Family gatherings can trigger stress',
  },
  {
    date: '2026-02-14',
    name: 'Valentine\'s Day',
    riskLevel: 'medium',
    reason: 'Relationship stress and loneliness',
  },
  {
    date: '2026-11-26',
    name: 'Thanksgiving 2026',
    riskLevel: 'medium',
    reason: 'Family gatherings can trigger stress',
  },
  {
    date: '2026-12-24',
    name: 'Christmas Eve 2026',
    riskLevel: 'high',
    reason: 'Holiday isolation and family stress',
  },
  {
    date: '2026-12-25',
    name: 'Christmas Day 2026',
    riskLevel: 'high',
    reason: 'Holiday isolation and family stress',
  },
  {
    date: '2026-12-31',
    name: 'New Year\'s Eve 2026',
    riskLevel: 'high',
    reason: 'End of year reflection, loneliness',
  },
  
  // Mental Health Awareness Periods (increased discussion)
  {
    date: '2025-09-10',
    name: 'World Suicide Prevention Day',
    riskLevel: 'high',
    reason: 'Increased awareness may trigger vulnerable users',
  },
  {
    date: '2026-09-10',
    name: 'World Suicide Prevention Day 2026',
    riskLevel: 'high',
    reason: 'Increased awareness may trigger vulnerable users',
  },
  {
    date: '2025-10-10',
    name: 'World Mental Health Day',
    riskLevel: 'medium',
    reason: 'Increased mental health discussions',
  },
  {
    date: '2026-10-10',
    name: 'World Mental Health Day 2026',
    riskLevel: 'medium',
    reason: 'Increased mental health discussions',
  },
  
  // Start of seasons (seasonal depression)
  {
    date: '2025-12-21',
    name: 'Winter Solstice',
    riskLevel: 'medium',
    reason: 'Seasonal Affective Disorder peak',
  },
  {
    date: '2026-03-20',
    name: 'Spring Equinox',
    riskLevel: 'medium',
    reason: 'Seasonal transition challenges',
  },
  {
    date: '2026-06-21',
    name: 'Summer Solstice',
    riskLevel: 'low' as 'medium', // Using medium as minimum
    reason: 'Seasonal transition',
  },
  {
    date: '2026-09-22',
    name: 'Fall Equinox',
    riskLevel: 'medium',
    reason: 'Seasonal transition, shorter days begin',
  },
  {
    date: '2026-12-21',
    name: 'Winter Solstice 2026',
    riskLevel: 'medium',
    reason: 'Seasonal Affective Disorder peak',
  },
  
  // Tax Day (financial stress)
  {
    date: '2026-04-15',
    name: 'Tax Day',
    riskLevel: 'medium',
    reason: 'Financial stress and anxiety',
  },
  
  // Back to School (for students/parents)
  {
    date: '2025-09-01',
    name: 'Back to School Period',
    riskLevel: 'medium',
    reason: 'Academic stress and social anxiety',
  },
  {
    date: '2026-09-01',
    name: 'Back to School Period 2026',
    riskLevel: 'medium',
    reason: 'Academic stress and social anxiety',
  },
  
  // End of Daylight Saving Time (sleep disruption)
  {
    date: '2025-11-02',
    name: 'End of Daylight Saving Time',
    riskLevel: 'medium',
    reason: 'Sleep disruption and early darkness',
  },
  {
    date: '2026-11-01',
    name: 'End of Daylight Saving Time 2026',
    riskLevel: 'medium',
    reason: 'Sleep disruption and early darkness',
  },
  
  // Mother's Day & Father's Day (grief triggers)
  {
    date: '2026-05-10',
    name: 'Mother\'s Day',
    riskLevel: 'medium',
    reason: 'Grief and family estrangement triggers',
  },
  {
    date: '2026-06-21',
    name: 'Father\'s Day',
    riskLevel: 'medium',
    reason: 'Grief and family estrangement triggers',
  },
  
  // Memorial Day / Veterans Day (military community)
  {
    date: '2026-05-25',
    name: 'Memorial Day',
    riskLevel: 'high',
    reason: 'Military loss grief, veteran mental health',
  },
  {
    date: '2026-11-11',
    name: 'Veterans Day',
    riskLevel: 'high',
    reason: 'Military community mental health awareness',
  },
];

// ============================================================================
// GET CURRENT TIME RISK FACTOR
// ============================================================================

export function getCurrentTimeRiskFactor(timestamp: Date = new Date()): TimeRiskFactor {
  const hour = timestamp.getHours();
  const day = timestamp.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check late night hours
  if ((hour >= HIGH_RISK_HOURS.lateNight.start) || (hour < HIGH_RISK_HOURS.lateNight.end)) {
    return {
      period: 'late_night',
      riskMultiplier: HIGH_RISK_HOURS.lateNight.multiplier,
      reason: HIGH_RISK_HOURS.lateNight.reason,
    };
  }
  
  // Check early morning
  if (hour >= HIGH_RISK_HOURS.earlyMorning.start && hour < HIGH_RISK_HOURS.earlyMorning.end) {
    return {
      period: 'early_morning',
      riskMultiplier: HIGH_RISK_HOURS.earlyMorning.multiplier,
      reason: HIGH_RISK_HOURS.earlyMorning.reason,
    };
  }
  
  // Check Sunday evening
  if (day === HIGH_RISK_HOURS.sundayEvening.day &&
      hour >= HIGH_RISK_HOURS.sundayEvening.start &&
      hour < HIGH_RISK_HOURS.sundayEvening.end) {
    return {
      period: 'sunday_evening',
      riskMultiplier: HIGH_RISK_HOURS.sundayEvening.multiplier,
      reason: HIGH_RISK_HOURS.sundayEvening.reason,
    };
  }
  
  // Check weekends (general)
  if (day === 0 || day === 6) {
    return {
      period: 'weekend',
      riskMultiplier: 1.2,
      reason: 'Weekend periods show slightly elevated risk',
    };
  }
  
  // Normal hours
  return {
    period: 'normal',
    riskMultiplier: 1.0,
    reason: 'Standard monitoring period',
  };
}

// ============================================================================
// GET HIGH-RISK DATE INFO
// ============================================================================

export function getHighRiskDateInfo(date: Date = new Date()): HighRiskDate | null {
  const dateString = formatDateString(date);
  
  // Check exact date match
  const exactMatch = HIGH_RISK_DATES.find(d => d.date === dateString);
  if (exactMatch) return exactMatch;
  
  // Check surrounding dates (±1 day for major holidays)
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const surroundingMatch = HIGH_RISK_DATES.find(d => 
    (d.date === formatDateString(yesterday) || d.date === formatDateString(tomorrow)) &&
    d.riskLevel === 'high'
  );
  
  if (surroundingMatch) {
    return {
      ...surroundingMatch,
      name: `Near ${surroundingMatch.name}`,
      riskLevel: 'medium',
    };
  }
  
  return null;
}

// ============================================================================
// GET COMBINED RISK MULTIPLIER
// ============================================================================

export function getCombinedRiskMultiplier(timestamp: Date = new Date()): {
  multiplier: number;
  factors: string[];
} {
  let multiplier = 1.0;
  const factors: string[] = [];
  
  // Time-based factor
  const timeFactor = getCurrentTimeRiskFactor(timestamp);
  if (timeFactor.riskMultiplier > 1.0) {
    multiplier *= timeFactor.riskMultiplier;
    factors.push(`${timeFactor.period}: ${timeFactor.reason}`);
  }
  
  // Date-based factor
  const dateInfo = getHighRiskDateInfo(timestamp);
  if (dateInfo) {
    const dateMultiplier = dateInfo.riskLevel === 'critical' ? 1.5 :
                          dateInfo.riskLevel === 'high' ? 1.3 :
                          1.2;
    multiplier *= dateMultiplier;
    factors.push(`${dateInfo.name}: ${dateInfo.reason}`);
  }
  
  return { multiplier, factors };
}

// ============================================================================
// ADJUST SEVERITY BASED ON TIME
// ============================================================================

export function adjustSeverityForTime(
  baseSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical',
  timestamp: Date = new Date()
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  const { multiplier } = getCombinedRiskMultiplier(timestamp);
  
  // If multiplier is significant (>1.3), escalate severity
  if (multiplier >= 1.4) {
    if (baseSeverity === 'medium') return 'high';
    if (baseSeverity === 'low') return 'medium';
  } else if (multiplier >= 1.2) {
    if (baseSeverity === 'low') return 'medium';
  }
  
  return baseSeverity;
}

// ============================================================================
// SHOULD INCREASE MONITORING
// ============================================================================

export function shouldIncreaseMonitoring(timestamp: Date = new Date()): boolean {
  const { multiplier } = getCombinedRiskMultiplier(timestamp);
  return multiplier > 1.2;
}

// ============================================================================
// GET MONITORING RECOMMENDATION
// ============================================================================

export function getMonitoringRecommendation(timestamp: Date = new Date()): {
  level: 'standard' | 'elevated' | 'high' | 'critical';
  message: string;
  actions: string[];
} {
  const { multiplier, factors } = getCombinedRiskMultiplier(timestamp);
  
  if (multiplier >= 1.5) {
    return {
      level: 'critical',
      message: 'Critical monitoring period - multiple high-risk factors active',
      actions: [
        'Display crisis resources more prominently',
        'Reduce moderation thresholds',
        'Increase moderator availability',
        'Monitor for coordinated harm patterns',
        'Fast-track high-risk content review',
      ],
    };
  } else if (multiplier >= 1.3) {
    return {
      level: 'high',
      message: `High-risk period active: ${factors.join('; ')}`,
      actions: [
        'Increase moderation sensitivity',
        'Show crisis resources to at-risk users',
        'Flag borderline content for review',
        'Monitor user behavior patterns closely',
      ],
    };
  } else if (multiplier >= 1.2) {
    return {
      level: 'elevated',
      message: `Elevated risk period: ${factors.join('; ')}`,
      actions: [
        'Slightly increase monitoring',
        'Be more proactive with crisis resources',
        'Track user patterns more carefully',
      ],
    };
  }
  
  return {
    level: 'standard',
    message: 'Standard monitoring period',
    actions: ['Normal moderation procedures'],
  };
}

// ============================================================================
// GET UPCOMING HIGH-RISK DATES
// ============================================================================

export function getUpcomingHighRiskDates(daysAhead: number = 30): HighRiskDate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  futureDate.setHours(23, 59, 59, 999);
  
  return HIGH_RISK_DATES.filter(d => {
    const date = new Date(d.date);
    return date >= today && date <= futureDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ============================================================================
// GENERATE TIME-BASED MODERATOR ALERT
// ============================================================================

export function generateTimeBasedAlert(timestamp: Date = new Date()): string | null {
  const recommendation = getMonitoringRecommendation(timestamp);
  
  if (recommendation.level === 'standard') return null;
  
  const emoji = recommendation.level === 'critical' ? '🚨' :
                recommendation.level === 'high' ? '⚠️' : 'ℹ️';
  
  return `
${emoji} **${recommendation.level.toUpperCase()} MONITORING PERIOD**

${recommendation.message}

**Recommended Actions:**
${recommendation.actions.map(action => `• ${action}`).join('\n')}
`;
}

// ============================================================================
// CHECK IF CRISIS BANNER SHOULD BE SHOWN
// ============================================================================

export function shouldShowCrisisBanner(timestamp: Date = new Date()): boolean {
  const { multiplier } = getCombinedRiskMultiplier(timestamp);
  return multiplier >= 1.3;
}

// ============================================================================
// GET CRISIS BANNER MESSAGE
// ============================================================================

export function getCrisisBannerMessage(timestamp: Date = new Date()): string | null {
  const dateInfo = getHighRiskDateInfo(timestamp);
  
  if (!dateInfo) return null;
  
  if (dateInfo.riskLevel === 'high' || dateInfo.riskLevel === 'critical') {
    return `💙 We know ${dateInfo.name} can be a difficult time. If you're struggling, know that help is available 24/7. Call or text 988.`;
  }
  
  return null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// ADD CUSTOM HIGH-RISK DATE
// ============================================================================

export function addCustomHighRiskDate(
  date: string,
  name: string,
  riskLevel: 'medium' | 'high' | 'critical',
  reason: string
): void {
  // Check if already exists
  const exists = HIGH_RISK_DATES.find(d => d.date === date);
  if (exists) {
    console.warn(`High-risk date ${date} already exists`);
    return;
  }
  
  HIGH_RISK_DATES.push({ date, name, riskLevel, reason });
  HIGH_RISK_DATES.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  console.log(`✅ Added custom high-risk date: ${name} (${date})`);
}

// ============================================================================
// REMOVE CUSTOM HIGH-RISK DATE
// ============================================================================

export function removeHighRiskDate(date: string): boolean {
  const index = HIGH_RISK_DATES.findIndex(d => d.date === date);
  if (index === -1) return false;
  
  HIGH_RISK_DATES.splice(index, 1);
  console.log(`✅ Removed high-risk date: ${date}`);
  return true;
}

// ============================================================================
// GET ALL HIGH-RISK DATES
// ============================================================================

export function getAllHighRiskDates(): HighRiskDate[] {
  return [...HIGH_RISK_DATES].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// ============================================================================
// EXPORT CONFIGURATION FOR ADMIN
// ============================================================================

export function getTimeRiskConfiguration() {
  return {
    highRiskHours: HIGH_RISK_HOURS,
    highRiskDates: HIGH_RISK_DATES,
    currentRiskLevel: getMonitoringRecommendation().level,
    currentMultiplier: getCombinedRiskMultiplier().multiplier,
    currentFactors: getCombinedRiskMultiplier().factors,
    upcomingHighRiskDates: getUpcomingHighRiskDates(),
  };
}

// ============================================================================
// LOG CURRENT STATUS (for debugging/monitoring)
// ============================================================================

export function logCurrentTimeRiskStatus(): void {
  const now = new Date();
  const { multiplier, factors } = getCombinedRiskMultiplier(now);
  const recommendation = getMonitoringRecommendation(now);
  
  console.log('⏰ TIME-BASED RISK STATUS:');
  console.log(`   Current time: ${now.toLocaleString()}`);
  console.log(`   Risk multiplier: ${multiplier.toFixed(2)}x`);
  console.log(`   Monitoring level: ${recommendation.level}`);
  
  if (factors.length > 0) {
    console.log('   Active factors:');
    factors.forEach(f => console.log(`   - ${f}`));
  }
  
  const upcoming = getUpcomingHighRiskDates(7);
  if (upcoming.length > 0) {
    console.log('   Upcoming high-risk dates (next 7 days):');
    upcoming.forEach(d => console.log(`   - ${d.date}: ${d.name} (${d.riskLevel})`));
  }
}


