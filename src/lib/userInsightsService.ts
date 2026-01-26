// User Insights Service for Mind Brother
// Analyzes user's mental health journey and provides personalized insights

import { supabase } from './supabase';
import { 
  getUserCulturalProfile, 
  type CulturalProfile,
  type CulturalBackground 
} from './culturalPersonalizationService';

// ============================================================================
// TYPES
// ============================================================================

export interface UserInsights {
  userId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  
  // Conversation metrics
  totalConversations: number;
  totalMessages: number;
  averageSessionLength: number; // in minutes
  
  // Topic analysis
  mostDiscussedTopics: TopicInsight[];
  emergingTopics: string[];
  resolvedTopics: string[];
  
  // Emotional analysis
  emotionalTrends: EmotionalTrend;
  moodDistribution: MoodDistribution;
  positiveShifts: PositiveShift[];
  
  // Growth areas
  growthAreas: GrowthArea[];
  strengthsIdentified: string[];
  copingStrategiesUsed: string[];
  
  // Cultural context
  culturalStressors: CulturalStressor[];
  culturalStrengths: string[];
  
  // Recommendations
  recommendations: Recommendation[];
  suggestedResources: SuggestedResource[];
  
  // Engagement
  engagementScore: number; // 0-100
  streakDays: number;
  checkInConsistency: 'improving' | 'stable' | 'declining';
}

export interface TopicInsight {
  topic: string;
  displayName: string;
  mentionCount: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  relatedEmotions: string[];
  firstMentioned: string;
  lastMentioned: string;
}

export interface EmotionalTrend {
  overallTrend: 'improving' | 'stable' | 'needs_attention';
  averageMood: number; // 1-10
  moodVariability: 'low' | 'medium' | 'high';
  bestDays: string[]; // Days of week
  challengingTimes: string[]; // Time patterns
  emotionalRange: {
    highest: { date: string; mood: number; context?: string };
    lowest: { date: string; mood: number; context?: string };
  };
}

export interface MoodDistribution {
  great: number;
  good: number;
  okay: number;
  notGreat: number;
  struggling: number;
}

export interface PositiveShift {
  description: string;
  evidence: string;
  date: string;
}

export interface GrowthArea {
  area: string;
  progress: 'significant' | 'moderate' | 'beginning' | 'potential';
  description: string;
  evidence: string[];
  nextSteps: string[];
}

export interface CulturalStressor {
  stressor: string;
  frequency: 'frequent' | 'occasional' | 'rare';
  impact: 'high' | 'medium' | 'low';
  context: string;
  copingStrategies?: string[];
}

export interface Recommendation {
  type: 'action' | 'resource' | 'reflection' | 'goal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  actionable: string;
}

export interface SuggestedResource {
  title: string;
  type: 'article' | 'exercise' | 'community' | 'professional';
  reason: string;
  url?: string;
}

// ============================================================================
// TOPIC PATTERNS FOR ANALYSIS
// ============================================================================

const TOPIC_PATTERNS: Record<string, {
  patterns: RegExp[];
  displayName: string;
  category: string;
}> = {
  work_stress: {
    patterns: [/\b(work|job|boss|career|office|coworker|promotion|fired|laid off)\b/i],
    displayName: 'Work & Career',
    category: 'life_area',
  },
  relationships: {
    patterns: [/\b(wife|husband|girlfriend|boyfriend|partner|dating|marriage|divorce|relationship)\b/i],
    displayName: 'Relationships',
    category: 'life_area',
  },
  family: {
    patterns: [/\b(family|father|mother|dad|mom|parent|kid|child|son|daughter|brother|sister)\b/i],
    displayName: 'Family',
    category: 'life_area',
  },
  anxiety: {
    patterns: [/\b(anxious|anxiety|worry|worried|nervous|panic|overwhelm)\b/i],
    displayName: 'Anxiety',
    category: 'mental_health',
  },
  depression: {
    patterns: [/\b(depress|sad|hopeless|empty|numb|lonely|isolat)\b/i],
    displayName: 'Low Mood',
    category: 'mental_health',
  },
  anger: {
    patterns: [/\b(angry|anger|rage|furious|frustrat|irritat)\b/i],
    displayName: 'Anger',
    category: 'emotion',
  },
  sleep: {
    patterns: [/\b(sleep|insomnia|tired|exhausted|rest|nightmare)\b/i],
    displayName: 'Sleep',
    category: 'wellness',
  },
  self_worth: {
    patterns: [/\b(worth|worthy|enough|value|confidence|self-esteem|imposter)\b/i],
    displayName: 'Self-Worth',
    category: 'identity',
  },
  identity: {
    patterns: [/\b(identity|who am i|authentic|real me|true self)\b/i],
    displayName: 'Identity',
    category: 'identity',
  },
  racism: {
    patterns: [/\b(racism|racist|discrimination|microaggression|prejudice)\b/i],
    displayName: 'Racial Experiences',
    category: 'cultural',
  },
  code_switching: {
    patterns: [/\b(code[\s-]?switch|two different|mask|pretend|professional voice)\b/i],
    displayName: 'Code-Switching',
    category: 'cultural',
  },
  financial: {
    patterns: [/\b(money|financial|debt|bills|broke|afford|rent|mortgage)\b/i],
    displayName: 'Financial',
    category: 'life_area',
  },
  health: {
    patterns: [/\b(health|sick|pain|doctor|hospital|diagnosis|chronic)\b/i],
    displayName: 'Physical Health',
    category: 'wellness',
  },
  grief: {
    patterns: [/\b(grief|loss|died|death|passed away|funeral|mourning)\b/i],
    displayName: 'Grief & Loss',
    category: 'life_event',
  },
  substance: {
    patterns: [/\b(drink|alcohol|drunk|high|drugs|sober|addiction|recovery)\b/i],
    displayName: 'Substance Use',
    category: 'wellness',
  },
};

// ============================================================================
// EMOTION PATTERNS
// ============================================================================

const EMOTION_PATTERNS: Record<string, {
  patterns: RegExp[];
  valence: 'positive' | 'negative' | 'neutral';
  intensity: 'high' | 'medium' | 'low';
}> = {
  joy: {
    patterns: [/\b(happy|joy|excited|thrilled|amazing|great|wonderful)\b/i],
    valence: 'positive',
    intensity: 'high',
  },
  contentment: {
    patterns: [/\b(content|peaceful|calm|relaxed|okay|good|fine)\b/i],
    valence: 'positive',
    intensity: 'medium',
  },
  gratitude: {
    patterns: [/\b(grateful|thankful|appreciat|blessed)\b/i],
    valence: 'positive',
    intensity: 'medium',
  },
  hope: {
    patterns: [/\b(hope|hopeful|optimistic|looking forward|better)\b/i],
    valence: 'positive',
    intensity: 'medium',
  },
  pride: {
    patterns: [/\b(proud|accomplished|achieved|success)\b/i],
    valence: 'positive',
    intensity: 'high',
  },
  sadness: {
    patterns: [/\b(sad|down|blue|unhappy|depressed|crying|tears)\b/i],
    valence: 'negative',
    intensity: 'medium',
  },
  fear: {
    patterns: [/\b(scared|afraid|fear|terrified|anxious|panic)\b/i],
    valence: 'negative',
    intensity: 'high',
  },
  anger: {
    patterns: [/\b(angry|mad|furious|rage|pissed|frustrated)\b/i],
    valence: 'negative',
    intensity: 'high',
  },
  shame: {
    patterns: [/\b(shame|embarrassed|guilty|regret|ashamed)\b/i],
    valence: 'negative',
    intensity: 'medium',
  },
  loneliness: {
    patterns: [/\b(lonely|alone|isolated|no one|nobody)\b/i],
    valence: 'negative',
    intensity: 'medium',
  },
  overwhelm: {
    patterns: [/\b(overwhelmed|too much|can't handle|drowning)\b/i],
    valence: 'negative',
    intensity: 'high',
  },
};

// ============================================================================
// GROWTH INDICATORS
// ============================================================================

const GROWTH_INDICATORS: Record<string, {
  patterns: RegExp[];
  description: string;
}> = {
  self_awareness: {
    patterns: [
      /\b(i realize|i notice|i'm aware|i understand now|i see that)\b/i,
      /\b(learned about myself|discovering|insight)\b/i,
    ],
    description: 'Developing self-awareness',
  },
  boundary_setting: {
    patterns: [
      /\b(set (a )?boundar|said no|stood up for|assertive)\b/i,
      /\b(stopped (allowing|letting)|drew (a )?line)\b/i,
    ],
    description: 'Setting healthy boundaries',
  },
  help_seeking: {
    patterns: [
      /\b(reached out|asked for help|talked to someone|sought support)\b/i,
      /\b(therapist|counselor|started therapy)\b/i,
    ],
    description: 'Seeking support',
  },
  coping_skills: {
    patterns: [
      /\b(breathing exercise|meditation|journal|ground(ed|ing))\b/i,
      /\b(coping|manage|dealt with|handled)\b/i,
    ],
    description: 'Using coping strategies',
  },
  emotional_expression: {
    patterns: [
      /\b(opened up|shared|expressed|told (them|him|her))\b/i,
      /\b(honest about|admitted|vulnerable)\b/i,
    ],
    description: 'Expressing emotions',
  },
  perspective_shift: {
    patterns: [
      /\b(different (perspective|way)|see it now|changed my mind)\b/i,
      /\b(reframe|new (light|angle)|understand better)\b/i,
    ],
    description: 'Gaining new perspectives',
  },
  self_compassion: {
    patterns: [
      /\b(kind(er)? to myself|self-compassion|forgive myself)\b/i,
      /\b(easier on myself|not (so )?hard on myself)\b/i,
    ],
    description: 'Practicing self-compassion',
  },
  connection: {
    patterns: [
      /\b(connected with|reached out to|spent time with|called|visited)\b/i,
      /\b(friend|support system|community)\b/i,
    ],
    description: 'Building connections',
  },
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate comprehensive user insights
 */
export async function generateUserInsights(
  userId: string,
  days: number = 30
): Promise<UserInsights> {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);
  
  // Get user's cultural profile
  const profile = await getUserCulturalProfile(userId);
  
  // Get context signals from the period
  const signals = await getContextSignals(userId, days);
  
  // Get conversation history for the period
  const conversations = await getConversationHistory(userId, periodStart, periodEnd);
  
  // Get mood check-ins for the period
  const moodCheckins = await getMoodCheckins(userId, periodStart, periodEnd);
  
  // Analyze all the data
  const topicAnalysis = analyzeTopics(conversations, signals);
  const emotionalAnalysis = analyzeEmotions(conversations, moodCheckins);
  const growthAnalysis = detectGrowth(conversations, signals);
  const culturalAnalysis = analyzeCulturalFactors(conversations, signals, profile);
  const recommendations = generateRecommendations(
    topicAnalysis, 
    emotionalAnalysis, 
    growthAnalysis, 
    culturalAnalysis,
    profile
  );
  
  // Calculate engagement metrics
  const engagement = calculateEngagement(conversations, moodCheckins, days);
  
  return {
    userId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    generatedAt: new Date().toISOString(),
    
    totalConversations: conversations.length,
    totalMessages: conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0),
    averageSessionLength: calculateAverageSessionLength(conversations),
    
    mostDiscussedTopics: topicAnalysis.topics,
    emergingTopics: topicAnalysis.emerging,
    resolvedTopics: topicAnalysis.resolved,
    
    emotionalTrends: emotionalAnalysis.trends,
    moodDistribution: emotionalAnalysis.distribution,
    positiveShifts: emotionalAnalysis.positiveShifts,
    
    growthAreas: growthAnalysis.areas,
    strengthsIdentified: growthAnalysis.strengths,
    copingStrategiesUsed: growthAnalysis.copingStrategies,
    
    culturalStressors: culturalAnalysis.stressors,
    culturalStrengths: culturalAnalysis.strengths,
    
    recommendations: recommendations.actions,
    suggestedResources: recommendations.resources,
    
    engagementScore: engagement.score,
    streakDays: engagement.streak,
    checkInConsistency: engagement.consistency,
  };
}

/**
 * Get context signals for a user within a time period
 */
async function getContextSignals(userId: string, days: number): Promise<any[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('user_context_signals')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching context signals:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get conversation history for analysis
 */
async function getConversationHistory(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('messages, created_at, updated_at')
    .eq('user_id', userId)
    .gte('updated_at', startDate.toISOString())
    .lte('updated_at', endDate.toISOString());
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  
  // Process conversations to extract analyzable content
  return (data || []).map(conv => {
    const messages = conv.messages || [];
    const userMessages = messages.filter((m: any) => m.role === 'user');
    
    return {
      messages: userMessages.map((m: any) => m.content).join(' '),
      messageCount: userMessages.length,
      date: conv.updated_at,
      createdAt: conv.created_at,
    };
  });
}

/**
 * Get mood check-ins (if available)
 */
async function getMoodCheckins(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  // Check if mood_checkins table exists, otherwise return empty
  try {
    const { data, error } = await supabase
      .from('mood_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      // Table might not exist, that's okay
      return [];
    }
    
    return data || [];
  } catch {
    return [];
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze topics discussed in conversations
 */
function analyzeTopics(
  conversations: any[],
  signals: any[]
): { topics: TopicInsight[]; emerging: string[]; resolved: string[] } {
  const topicMentions: Record<string, {
    count: number;
    dates: string[];
    sentiments: string[];
  }> = {};
  
  // Count topic mentions from conversations
  for (const conv of conversations) {
    const text = conv.messages || '';
    
    for (const [topicId, config] of Object.entries(TOPIC_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (pattern.test(text)) {
          if (!topicMentions[topicId]) {
            topicMentions[topicId] = { count: 0, dates: [], sentiments: [] };
          }
          topicMentions[topicId].count++;
          topicMentions[topicId].dates.push(conv.date);
          
          // Analyze sentiment
          const sentiment = analyzeSentiment(text);
          topicMentions[topicId].sentiments.push(sentiment);
          break;
        }
      }
    }
  }
  
  // Also analyze context signals
  for (const signal of signals) {
    const signalType = signal.signal_type?.toLowerCase() || '';
    const inferredAttr = signal.inferred_attribute?.toLowerCase() || '';
    
    for (const [topicId, config] of Object.entries(TOPIC_PATTERNS)) {
      if (signalType.includes(topicId) || inferredAttr.includes(topicId)) {
        if (!topicMentions[topicId]) {
          topicMentions[topicId] = { count: 0, dates: [], sentiments: [] };
        }
        topicMentions[topicId].count++;
        topicMentions[topicId].dates.push(signal.created_at);
      }
    }
  }
  
  // Convert to topic insights
  const topics: TopicInsight[] = Object.entries(topicMentions)
    .filter(([_, data]) => data.count >= 2) // At least mentioned twice
    .map(([topicId, data]) => {
      const config = TOPIC_PATTERNS[topicId];
      const sortedDates = data.dates.sort();
      
      // Calculate trend
      const midpoint = Math.floor(data.dates.length / 2);
      const firstHalf = data.dates.slice(0, midpoint).length;
      const secondHalf = data.dates.slice(midpoint).length;
      
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (secondHalf > firstHalf * 1.5) trend = 'increasing';
      else if (firstHalf > secondHalf * 1.5) trend = 'decreasing';
      
      // Aggregate sentiment
      const sentimentCounts = data.sentiments.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantSentiment = Object.entries(sentimentCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] as any || 'neutral';
      
      return {
        topic: topicId,
        displayName: config.displayName,
        mentionCount: data.count,
        trend,
        sentiment: dominantSentiment,
        relatedEmotions: detectRelatedEmotions(topicId, conversations),
        firstMentioned: sortedDates[0],
        lastMentioned: sortedDates[sortedDates.length - 1],
      };
    })
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 5);
  
  // Identify emerging topics (mentioned more in last week)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const emerging = topics
    .filter(t => t.trend === 'increasing')
    .map(t => t.displayName);
  
  // Identify resolved topics (not mentioned recently)
  const resolved = topics
    .filter(t => {
      const lastDate = new Date(t.lastMentioned);
      return lastDate < oneWeekAgo && t.trend === 'decreasing';
    })
    .map(t => t.displayName);
  
  return { topics, emerging, resolved };
}

/**
 * Analyze emotional patterns
 */
function analyzeEmotions(
  conversations: any[],
  moodCheckins: any[]
): {
  trends: EmotionalTrend;
  distribution: MoodDistribution;
  positiveShifts: PositiveShift[];
} {
  // Analyze emotions from conversations
  const emotionsByDate: Record<string, { positive: number; negative: number; count: number }> = {};
  
  for (const conv of conversations) {
    const text = conv.messages || '';
    const date = new Date(conv.date).toISOString().split('T')[0];
    
    if (!emotionsByDate[date]) {
      emotionsByDate[date] = { positive: 0, negative: 0, count: 0 };
    }
    
    for (const [emotionId, config] of Object.entries(EMOTION_PATTERNS)) {
      for (const pattern of config.patterns) {
        if (pattern.test(text)) {
          if (config.valence === 'positive') {
            emotionsByDate[date].positive++;
          } else if (config.valence === 'negative') {
            emotionsByDate[date].negative++;
          }
          emotionsByDate[date].count++;
          break;
        }
      }
    }
  }
  
  // Calculate mood from check-ins or conversations
  const moodScores: number[] = [];
  const dayOfWeekMoods: Record<number, number[]> = {};
  
  for (const checkin of moodCheckins) {
    const score = checkin.mood_score || checkin.mood || 5;
    moodScores.push(score);
    
    const dayOfWeek = new Date(checkin.created_at).getDay();
    if (!dayOfWeekMoods[dayOfWeek]) dayOfWeekMoods[dayOfWeek] = [];
    dayOfWeekMoods[dayOfWeek].push(score);
  }
  
  // If no check-ins, estimate from conversations
  if (moodScores.length === 0) {
    for (const [date, data] of Object.entries(emotionsByDate)) {
      const ratio = data.count > 0 ? data.positive / (data.positive + data.negative || 1) : 0.5;
      const estimatedMood = Math.round(ratio * 8 + 2); // Scale to 2-10
      moodScores.push(estimatedMood);
      
      const dayOfWeek = new Date(date).getDay();
      if (!dayOfWeekMoods[dayOfWeek]) dayOfWeekMoods[dayOfWeek] = [];
      dayOfWeekMoods[dayOfWeek].push(estimatedMood);
    }
  }
  
  // Calculate trends
  const averageMood = moodScores.length > 0
    ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
    : 5;
  
  const midpoint = Math.floor(moodScores.length / 2);
  const firstHalfAvg = moodScores.slice(0, midpoint).reduce((a, b) => a + b, 0) / (midpoint || 1);
  const secondHalfAvg = moodScores.slice(midpoint).reduce((a, b) => a + b, 0) / ((moodScores.length - midpoint) || 1);
  
  let overallTrend: 'improving' | 'stable' | 'needs_attention' = 'stable';
  if (secondHalfAvg > firstHalfAvg + 1) overallTrend = 'improving';
  else if (secondHalfAvg < firstHalfAvg - 1 || averageMood < 4) overallTrend = 'needs_attention';
  
  // Calculate variability
  const variance = moodScores.length > 1
    ? moodScores.reduce((sum, score) => sum + Math.pow(score - averageMood, 2), 0) / moodScores.length
    : 0;
  const stdDev = Math.sqrt(variance);
  
  let moodVariability: 'low' | 'medium' | 'high' = 'medium';
  if (stdDev < 1) moodVariability = 'low';
  else if (stdDev > 2) moodVariability = 'high';
  
  // Find best days
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAverages = Object.entries(dayOfWeekMoods)
    .map(([day, moods]) => ({
      day: dayNames[parseInt(day)],
      avg: moods.reduce((a, b) => a + b, 0) / moods.length,
    }))
    .sort((a, b) => b.avg - a.avg);
  
  const bestDays = dayAverages.slice(0, 2).map(d => d.day);
  
  // Calculate mood distribution
  const distribution: MoodDistribution = {
    great: moodScores.filter(m => m >= 9).length,
    good: moodScores.filter(m => m >= 7 && m < 9).length,
    okay: moodScores.filter(m => m >= 5 && m < 7).length,
    notGreat: moodScores.filter(m => m >= 3 && m < 5).length,
    struggling: moodScores.filter(m => m < 3).length,
  };
  
  // Detect positive shifts
  const positiveShifts = detectPositiveShifts(conversations);
  
  return {
    trends: {
      overallTrend,
      averageMood: Math.round(averageMood * 10) / 10,
      moodVariability,
      bestDays,
      challengingTimes: [], // Would need time-of-day data
      emotionalRange: {
        highest: { date: '', mood: Math.max(...moodScores, 5) },
        lowest: { date: '', mood: Math.min(...moodScores, 5) },
      },
    },
    distribution,
    positiveShifts,
  };
}

/**
 * Detect growth areas from conversations
 */
function detectGrowth(
  conversations: any[],
  signals: any[]
): {
  areas: GrowthArea[];
  strengths: string[];
  copingStrategies: string[];
} {
  const growthEvidence: Record<string, string[]> = {};
  const copingStrategies: Set<string> = new Set();
  
  for (const conv of conversations) {
    const text = conv.messages || '';
    
    for (const [areaId, config] of Object.entries(GROWTH_INDICATORS)) {
      for (const pattern of config.patterns) {
        const match = text.match(pattern);
        if (match) {
          if (!growthEvidence[areaId]) {
            growthEvidence[areaId] = [];
          }
          growthEvidence[areaId].push(match[0]);
          
          // Track coping strategies
          if (areaId === 'coping_skills') {
            if (/breath/i.test(match[0])) copingStrategies.add('Breathing exercises');
            if (/meditat/i.test(match[0])) copingStrategies.add('Meditation');
            if (/journal/i.test(match[0])) copingStrategies.add('Journaling');
            if (/ground/i.test(match[0])) copingStrategies.add('Grounding techniques');
          }
          break;
        }
      }
    }
  }
  
  // Convert to growth areas
  const areas: GrowthArea[] = Object.entries(growthEvidence)
    .filter(([_, evidence]) => evidence.length > 0)
    .map(([areaId, evidence]) => {
      const config = GROWTH_INDICATORS[areaId];
      
      // Determine progress level
      let progress: 'significant' | 'moderate' | 'beginning' | 'potential' = 'beginning';
      if (evidence.length >= 5) progress = 'significant';
      else if (evidence.length >= 3) progress = 'moderate';
      
      return {
        area: config.description,
        progress,
        description: `You've shown ${config.description.toLowerCase()} ${evidence.length} times this period`,
        evidence: evidence.slice(0, 3),
        nextSteps: getNextStepsForGrowth(areaId),
      };
    })
    .sort((a, b) => {
      const progressOrder = { significant: 4, moderate: 3, beginning: 2, potential: 1 };
      return progressOrder[b.progress] - progressOrder[a.progress];
    });
  
  // Identify strengths
  const strengths: string[] = areas
    .filter(a => a.progress === 'significant' || a.progress === 'moderate')
    .map(a => a.area);
  
  return {
    areas,
    strengths,
    copingStrategies: Array.from(copingStrategies),
  };
}

/**
 * Analyze cultural factors
 */
function analyzeCulturalFactors(
  conversations: any[],
  signals: any[],
  profile: CulturalProfile | null
): {
  stressors: CulturalStressor[];
  strengths: string[];
} {
  const stressorCounts: Record<string, number> = {};
  const strengths: string[] = [];
  
  // Cultural stressor patterns
  const stressorPatterns: Record<string, { patterns: RegExp[]; context: string }> = {
    'Code-switching exhaustion': {
      patterns: [/\b(code[\s-]?switch|two different|can't be myself)\b/i],
      context: 'Navigating between cultural identities at work or in different settings',
    },
    'Workplace microaggressions': {
      patterns: [/\b(microaggression|stereotyp|hair|where are you from|articulate)\b/i],
      context: 'Dealing with subtle discrimination or stereotyping at work',
    },
    'Racial stress': {
      patterns: [/\b(racism|racist|discrimination|prejudice|bigot)\b/i],
      context: 'Experiences of racial discrimination or prejudice',
    },
    'Representation pressure': {
      patterns: [/\b(represent|only one|token|diversity)\b/i],
      context: 'Feeling pressure to represent your entire race or culture',
    },
    'Family expectations': {
      patterns: [/\b(family expect|parents want|disappoint|honor|tradition)\b/i],
      context: 'Cultural or family expectations creating pressure',
    },
    'Immigration stress': {
      patterns: [/\b(immigra|visa|papers|citizen|deport|daca)\b/i],
      context: 'Stress related to immigration status or experiences',
    },
    'Police-related anxiety': {
      patterns: [/\b(police|cops|pulled over|the talk|driving while)\b/i],
      context: 'Fear or anxiety related to law enforcement encounters',
    },
  };
  
  for (const conv of conversations) {
    const text = conv.messages || '';
    
    for (const [stressor, config] of Object.entries(stressorPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(text)) {
          stressorCounts[stressor] = (stressorCounts[stressor] || 0) + 1;
          break;
        }
      }
    }
  }
  
  // Convert to cultural stressors
  const stressors: CulturalStressor[] = Object.entries(stressorCounts)
    .filter(([_, count]) => count > 0)
    .map(([stressor, count]) => {
      let frequency: 'frequent' | 'occasional' | 'rare' = 'occasional';
      if (count >= 5) frequency = 'frequent';
      else if (count <= 1) frequency = 'rare';
      
      let impact: 'high' | 'medium' | 'low' = 'medium';
      if (stressor.includes('Racial') || stressor.includes('Police')) impact = 'high';
      
      return {
        stressor,
        frequency,
        impact,
        context: stressorPatterns[stressor]?.context || '',
      };
    })
    .sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  
  // Identify cultural strengths
  if (profile?.communities?.includes('faith_based')) {
    strengths.push('Faith and spiritual connection');
  }
  if (profile?.communities?.includes('veteran')) {
    strengths.push('Military discipline and resilience');
  }
  
  // Check for community mentions
  const allText = conversations.map(c => c.messages).join(' ').toLowerCase();
  if (/\b(community|brotherhood|familia|church|congregation)\b/i.test(allText)) {
    strengths.push('Strong community connections');
  }
  if (/\b(ancestor|heritage|tradition|culture)\b/i.test(allText)) {
    strengths.push('Cultural pride and heritage');
  }
  
  return { stressors, strengths };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  topicAnalysis: { topics: TopicInsight[]; emerging: string[]; resolved: string[] },
  emotionalAnalysis: { trends: EmotionalTrend; distribution: MoodDistribution; positiveShifts: PositiveShift[] },
  growthAnalysis: { areas: GrowthArea[]; strengths: string[]; copingStrategies: string[] },
  culturalAnalysis: { stressors: CulturalStressor[]; strengths: string[] },
  profile: CulturalProfile | null
): {
  actions: Recommendation[];
  resources: SuggestedResource[];
} {
  const actions: Recommendation[] = [];
  const resources: SuggestedResource[] = [];
  
  // Based on emotional trends
  if (emotionalAnalysis.trends.overallTrend === 'needs_attention') {
    actions.push({
      type: 'action',
      priority: 'high',
      title: 'Check in more frequently',
      description: 'Your recent conversations suggest you might benefit from more regular support',
      reason: 'Your mood has been lower than usual',
      actionable: 'Try to check in with Amani at least every other day',
    });
  }
  
  if (emotionalAnalysis.trends.moodVariability === 'high') {
    actions.push({
      type: 'reflection',
      priority: 'medium',
      title: 'Track your mood patterns',
      description: 'Understanding what affects your mood can help you prepare for challenging times',
      reason: 'Your emotional state has been variable',
      actionable: 'Start a brief daily mood log to identify triggers',
    });
  }
  
  // Based on topics
  for (const topic of topicAnalysis.topics.slice(0, 2)) {
    if (topic.trend === 'increasing' && topic.sentiment === 'negative') {
      actions.push({
        type: 'resource',
        priority: 'high',
        title: `Address ${topic.displayName}`,
        description: `This has been coming up more often and seems to be weighing on you`,
        reason: `${topic.displayName} is a growing concern`,
        actionable: `Consider exploring specific strategies for ${topic.displayName.toLowerCase()}`,
      });
      
      resources.push({
        title: `Resources for ${topic.displayName}`,
        type: 'article',
        reason: 'Based on your recent conversations',
      });
    }
  }
  
  // Based on growth areas
  if (growthAnalysis.areas.length > 0) {
    const topGrowth = growthAnalysis.areas[0];
    actions.push({
      type: 'goal',
      priority: 'medium',
      title: `Continue ${topGrowth.area}`,
      description: topGrowth.description,
      reason: 'You\'ve been making progress here',
      actionable: topGrowth.nextSteps[0] || 'Keep doing what you\'re doing',
    });
  }
  
  // Based on cultural stressors
  for (const stressor of culturalAnalysis.stressors.slice(0, 1)) {
    if (stressor.impact === 'high') {
      actions.push({
        type: 'resource',
        priority: 'high',
        title: `Support for ${stressor.stressor}`,
        description: stressor.context,
        reason: 'This has been affecting you',
        actionable: 'Consider connecting with culturally-affirming resources',
      });
      
      resources.push({
        title: 'Culturally-affirming mental health resources',
        type: 'community',
        reason: `To help with ${stressor.stressor.toLowerCase()}`,
      });
    }
  }
  
  // Based on coping strategies (or lack thereof)
  if (growthAnalysis.copingStrategies.length < 2) {
    actions.push({
      type: 'action',
      priority: 'medium',
      title: 'Build your coping toolkit',
      description: 'Having multiple coping strategies gives you options when one isn\'t working',
      reason: 'Expanding your stress management tools',
      actionable: 'Try a new technique like box breathing or progressive muscle relaxation',
    });
    
    resources.push({
      title: 'Grounding Exercises',
      type: 'exercise',
      reason: 'To add to your coping toolkit',
    });
  }
  
  return { actions, resources };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'mixed' {
  let positive = 0;
  let negative = 0;
  
  for (const [_, config] of Object.entries(EMOTION_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        if (config.valence === 'positive') positive++;
        else if (config.valence === 'negative') negative++;
      }
    }
  }
  
  if (positive > 0 && negative > 0) return 'mixed';
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'neutral';
}

function detectRelatedEmotions(topicId: string, conversations: any[]): string[] {
  const emotions: Set<string> = new Set();
  
  for (const conv of conversations) {
    const text = conv.messages || '';
    const topicConfig = TOPIC_PATTERNS[topicId];
    
    // Check if this conversation mentions the topic
    const mentionsTopic = topicConfig.patterns.some(p => p.test(text));
    
    if (mentionsTopic) {
      for (const [emotionId, emotionConfig] of Object.entries(EMOTION_PATTERNS)) {
        for (const pattern of emotionConfig.patterns) {
          if (pattern.test(text)) {
            emotions.add(emotionId.replace(/_/g, ' '));
            break;
          }
        }
      }
    }
  }
  
  return Array.from(emotions).slice(0, 3);
}

function detectPositiveShifts(conversations: any[]): PositiveShift[] {
  const shifts: PositiveShift[] = [];
  const positivePatterns = [
    { pattern: /\b(better|improving|progress|getting there)\b/i, description: 'Feeling improvement' },
    { pattern: /\b(breakthrough|realized|understand now)\b/i, description: 'Gained insight' },
    { pattern: /\b(proud|accomplished|did it|made it)\b/i, description: 'Achievement' },
    { pattern: /\b(grateful|thankful|appreciat)\b/i, description: 'Experiencing gratitude' },
    { pattern: /\b(hopeful|looking forward|excited about)\b/i, description: 'Feeling hopeful' },
  ];
  
  for (const conv of conversations) {
    const text = conv.messages || '';
    
    for (const { pattern, description } of positivePatterns) {
      const match = text.match(pattern);
      if (match) {
        shifts.push({
          description,
          evidence: match[0],
          date: conv.date,
        });
        break;
      }
    }
  }
  
  return shifts.slice(0, 5);
}

function getNextStepsForGrowth(areaId: string): string[] {
  const nextSteps: Record<string, string[]> = {
    self_awareness: [
      'Continue noticing your patterns',
      'Try journaling about what you observe',
      'Share your insights with someone you trust',
    ],
    boundary_setting: [
      'Practice saying no in low-stakes situations',
      'Identify one boundary you want to strengthen',
      'Reflect on how setting boundaries feels',
    ],
    help_seeking: [
      'Continue reaching out when needed',
      'Consider expanding your support network',
      'Celebrate the courage it takes to ask for help',
    ],
    coping_skills: [
      'Keep using the strategies that work',
      'Try one new coping technique',
      'Notice which strategies work best for different situations',
    ],
    emotional_expression: [
      'Continue opening up at your own pace',
      'Find safe spaces to practice vulnerability',
      'Notice how it feels after sharing',
    ],
    perspective_shift: [
      'Apply this new perspective to similar situations',
      'Share your insights with others who might benefit',
      'Celebrate your flexibility',
    ],
    self_compassion: [
      'Make self-compassion a daily practice',
      'Notice when you\'re being hard on yourself',
      'Treat yourself like you would a good friend',
    ],
    connection: [
      'Maintain these important connections',
      'Consider reaching out to someone you haven\'t talked to',
      'Quality over quantity in relationships',
    ],
  };
  
  return nextSteps[areaId] || ['Keep doing what you\'re doing'];
}

function calculateAverageSessionLength(conversations: any[]): number {
  if (conversations.length === 0) return 0;
  
  // Estimate based on message count (assuming ~2 min per exchange)
  const totalMinutes = conversations.reduce((sum, c) => sum + (c.messageCount || 0) * 2, 0);
  return Math.round(totalMinutes / conversations.length);
}

function calculateEngagement(
  conversations: any[],
  moodCheckins: any[],
  days: number
): {
  score: number;
  streak: number;
  consistency: 'improving' | 'stable' | 'declining';
} {
  // Calculate engagement score (0-100)
  const conversationsPerWeek = (conversations.length / days) * 7;
  const checkinsPerWeek = (moodCheckins.length / days) * 7;
  
  let score = 0;
  score += Math.min(conversationsPerWeek * 10, 40); // Up to 40 points for conversations
  score += Math.min(checkinsPerWeek * 20, 40); // Up to 40 points for check-ins
  score += Math.min(conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0) / 10, 20); // Up to 20 for depth
  
  // Calculate streak (simplified)
  const streak = Math.min(conversations.length, 30); // Placeholder
  
  // Calculate consistency
  const midpoint = Math.floor(conversations.length / 2);
  const firstHalf = conversations.slice(0, midpoint).length;
  const secondHalf = conversations.slice(midpoint).length;
  
  let consistency: 'improving' | 'stable' | 'declining' = 'stable';
  if (secondHalf > firstHalf * 1.3) consistency = 'improving';
  else if (firstHalf > secondHalf * 1.3) consistency = 'declining';
  
  return {
    score: Math.round(score),
    streak,
    consistency,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export const userInsightsService = {
  generateUserInsights,
};
