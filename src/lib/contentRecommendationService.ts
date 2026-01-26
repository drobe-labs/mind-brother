// Content Recommendation Service for Mind Brother
// Recommends articles, resources, and exercises based on user's cultural profile and detected concerns

import { supabase } from './supabase';
import { 
  getUserCulturalProfile, 
  type CulturalProfile,
  type CulturalBackground,
  type PrimaryConcern 
} from './culturalPersonalizationService';

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendedContent {
  id: string;
  contentType: ContentType;
  title: string;
  description: string;
  url?: string;
  body?: string;
  imageUrl?: string;
  readingTime?: number; // in minutes
  tags: string[];
  culturalRelevance: CulturalBackground[];
  targetConcerns: PrimaryConcern[];
  targetCommunities: string[];
  author?: string;
  source?: string;
  priority: number;
  matchScore?: number;
  matchReasons?: string[];
  createdAt: string;
}

export type ContentType = 
  | 'article'
  | 'video'
  | 'exercise'
  | 'resource'
  | 'podcast'
  | 'book'
  | 'tool'
  | 'community'
  | 'affirmation'
  | 'quote';

export interface ContentRecommendationContext {
  recentTopics?: string[];
  detectedConcerns?: string[];
  conversationMood?: 'positive' | 'neutral' | 'negative' | 'crisis';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionCount?: number;
}

export interface ContentSuggestion {
  content: RecommendedContent;
  suggestionText: string;
  triggerTopic: string;
  confidence: number;
}

// ============================================================================
// TOPIC DETECTION PATTERNS
// ============================================================================

const TOPIC_PATTERNS: Record<string, {
  patterns: RegExp[];
  concerns: PrimaryConcern[];
  contentTypes: ContentType[];
  suggestionPrefix: string;
}> = {
  code_switching: {
    patterns: [
      /\b(code[\s-]?switch|switch(ing)? (it|my) up|talk(ing)? white|professional voice)\b/i,
      /\b(two different (people|persons)|wear(ing)? a mask|hide who i (am|really am))\b/i,
      /\b(exhausted from (pretending|faking)|can't be myself at work)\b/i,
    ],
    concerns: ['work_career', 'identity_questions', 'stress'],
    contentTypes: ['article', 'podcast'],
    suggestionPrefix: 'I hear you on the code-switching stress. Here\'s something that might resonate:',
  },
  workplace_discrimination: {
    patterns: [
      /\b(only (black|brown|latino|asian) (guy|man|person|one)|represent my race)\b/i,
      /\b(microaggression|they (asked|touched) my hair|not a good (culture )?fit)\b/i,
      /\b(diversity hire|token|always (have to|gotta) prove|twice as (good|hard))\b/i,
    ],
    concerns: ['work_career', 'stress', 'mental_health_stigma'],
    contentTypes: ['article', 'resource', 'community'],
    suggestionPrefix: 'Dealing with workplace stuff is real. This might help:',
  },
  anxiety: {
    patterns: [
      /\b(anxious|anxiety|panic|worry|worried|nervous|on edge)\b/i,
      /\b(can't stop thinking|racing thoughts|overthinking)\b/i,
      /\b(heart racing|can't breathe|chest tight)\b/i,
    ],
    concerns: ['anxiety', 'stress'],
    contentTypes: ['exercise', 'article', 'tool'],
    suggestionPrefix: 'For those anxious moments, this might help ground you:',
  },
  depression: {
    patterns: [
      /\b(depressed|depression|hopeless|empty|numb)\b/i,
      /\b(don't feel anything|nothing matters|what's the point)\b/i,
      /\b(can't get out of bed|no energy|so tired all the time)\b/i,
    ],
    concerns: ['depression', 'isolation_loneliness'],
    contentTypes: ['article', 'exercise', 'community'],
    suggestionPrefix: 'When you\'re feeling low, small steps matter. Check this out:',
  },
  relationship_issues: {
    patterns: [
      /\b(wife|girlfriend|partner|relationship|marriage)\b.*\b(problem|issue|struggle|difficult)\b/i,
      /\b(divorce|separated|breakup|broke up)\b/i,
      /\b(communication|argue|fighting|don't understand)\b/i,
    ],
    concerns: ['relationships', 'family_dynamics'],
    contentTypes: ['article', 'book', 'podcast'],
    suggestionPrefix: 'Relationships are tough to navigate. This might offer some perspective:',
  },
  fatherhood: {
    patterns: [
      /\b(father|dad|kid|son|daughter|parenting)\b/i,
      /\b(raise|raising|custody|child support)\b/i,
      /\b(not there for (my |the )?(kids?|children))\b/i,
    ],
    concerns: ['family_dynamics', 'relationships'],
    contentTypes: ['article', 'book', 'community'],
    suggestionPrefix: 'Being a dad comes with its own challenges. Here\'s something for fathers:',
  },
  anger: {
    patterns: [
      /\b(angry|anger|rage|furious|pissed)\b/i,
      /\b(lose my temper|blow up|snap(ped)?)\b/i,
      /\b(can't control|see red|want to hit)\b/i,
    ],
    concerns: ['anger_management', 'stress'],
    contentTypes: ['exercise', 'article', 'tool'],
    suggestionPrefix: 'Anger is valid, but managing it takes practice. Try this:',
  },
  trauma: {
    patterns: [
      /\b(trauma|traumatic|ptsd|flashback)\b/i,
      /\b(abuse|abused|assaulted|violated)\b/i,
      /\b(can't forget|haunts me|nightmares)\b/i,
    ],
    concerns: ['trauma_ptsd'],
    contentTypes: ['article', 'resource', 'exercise'],
    suggestionPrefix: 'Processing trauma takes time. This resource might help:',
  },
  substance_use: {
    patterns: [
      /\b(drinking|drunk|alcohol|beer|liquor)\b.*\b(too much|problem|quit|stop)\b/i,
      /\b(high|drugs|weed|pills|using)\b.*\b(problem|quit|stop|control)\b/i,
      /\b(sober|sobriety|recovery|clean)\b/i,
    ],
    concerns: ['substance_use'],
    contentTypes: ['resource', 'article', 'community'],
    suggestionPrefix: 'Addressing substance use takes courage. Here\'s a helpful resource:',
  },
  financial_stress: {
    patterns: [
      /\b(money|broke|debt|bills|financial)\b.*\b(stress|problem|worry)\b/i,
      /\b(can't afford|paycheck to paycheck|behind on)\b/i,
      /\b(job loss|laid off|unemployed|fired)\b/i,
    ],
    concerns: ['financial_stress', 'work_career'],
    contentTypes: ['resource', 'article', 'tool'],
    suggestionPrefix: 'Financial stress is real and heavy. This might help:',
  },
  grief: {
    patterns: [
      /\b(lost|death|died|passed away|grief|grieving|mourning)\b/i,
      /\b(miss (him|her|them)|gone|funeral)\b/i,
      /\b(can't believe|still processing|hasn't hit me)\b/i,
    ],
    concerns: ['grief_loss'],
    contentTypes: ['article', 'resource', 'exercise'],
    suggestionPrefix: 'Grief has no timeline. This might offer some comfort:',
  },
  identity: {
    patterns: [
      /\b(who am i|don't know who i am|finding myself)\b/i,
      /\b(identity|masculine|manhood|what it means to be)\b/i,
      /\b(questioning|exploring|figuring out)\b/i,
    ],
    concerns: ['identity_questions'],
    contentTypes: ['article', 'book', 'podcast'],
    suggestionPrefix: 'Self-discovery is a journey. This might resonate:',
  },
  loneliness: {
    patterns: [
      /\b(lonely|alone|isolated|no friends|no one to talk to)\b/i,
      /\b(don't have anyone|by myself|no support)\b/i,
      /\b(disconnected|withdrawn|shut out)\b/i,
    ],
    concerns: ['isolation_loneliness'],
    contentTypes: ['community', 'article', 'exercise'],
    suggestionPrefix: 'Feeling alone is tough. You\'re not the only one:',
  },
  police_fear: {
    patterns: [
      /\b(police|cops|officer|pulled over)\b/i,
      /\b(the talk|driving while black|stopped by)\b/i,
      /\b(afraid of (police|cops)|fear (for my|the) (life|safety))\b/i,
    ],
    concerns: ['trauma_ptsd', 'anxiety'],
    contentTypes: ['resource', 'article'],
    suggestionPrefix: 'Fear around police is real and valid. Here\'s something helpful:',
  },
  immigration: {
    patterns: [
      /\b(immigration|undocumented|visa|green card|daca|dreamer)\b/i,
      /\b(deportation|ice|papers|citizenship)\b/i,
      /\b(home country|left (everything|everyone) behind)\b/i,
    ],
    concerns: ['stress', 'anxiety', 'family_dynamics'],
    contentTypes: ['resource', 'community', 'article'],
    suggestionPrefix: 'Immigration stress weighs heavy. This resource might help:',
  },
  veteran: {
    patterns: [
      /\b(military|service|deployed|deployment|combat|veteran)\b/i,
      /\b(va|transition|civilian life)\b/i,
      /\b(brothers (in arms|i served with)|unit|platoon)\b/i,
    ],
    concerns: ['trauma_ptsd', 'identity_questions'],
    contentTypes: ['resource', 'community', 'article'],
    suggestionPrefix: 'For my brothers who served - this is for you:',
  },
  reentry: {
    patterns: [
      /\b(prison|jail|incarcerated|locked up|inside)\b/i,
      /\b(parole|probation|criminal record|felon)\b/i,
      /\b(just (got|came) out|recently released|reentry)\b/i,
    ],
    concerns: ['work_career', 'identity_questions', 'isolation_loneliness'],
    contentTypes: ['resource', 'community', 'article'],
    suggestionPrefix: 'Reentry is one of the hardest transitions. Here\'s support:',
  },
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Get recommended content based on user's cultural profile and concerns
 */
export async function getRecommendedContent(
  userId: string,
  options: {
    contentType?: ContentType;
    limit?: number;
    excludeIds?: string[];
  } = {}
): Promise<RecommendedContent[]> {
  const { contentType, limit = 5, excludeIds = [] } = options;
  
  // Get user's cultural profile
  const profile = await getUserCulturalProfile(userId);
  
  if (!profile) {
    // Return general content if no profile
    return getGeneralContent(contentType, limit);
  }
  
  // Build query for personalized content
  let query = supabase
    .from('cultural_content')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(limit * 2); // Get more to filter
  
  if (contentType) {
    query = query.eq('content_type', contentType);
  }
  
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  
  const { data: allContent, error } = await query;
  
  if (error || !allContent) {
    console.error('Error fetching content:', error);
    return [];
  }
  
  // Score and sort content based on profile match
  const scoredContent = allContent.map(content => {
    const { score, reasons } = calculateContentMatchScore(content, profile);
    return {
      ...mapContentFromDb(content),
      matchScore: score,
      matchReasons: reasons,
    };
  });
  
  // Sort by match score and return top results
  return scoredContent
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, limit);
}

/**
 * Get content suggestions based on conversation context
 */
export async function getContextualSuggestions(
  userId: string,
  message: string,
  context: ContentRecommendationContext = {}
): Promise<ContentSuggestion[]> {
  const suggestions: ContentSuggestion[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Detect topics in the message
  const detectedTopics = detectTopicsInMessage(message);
  
  if (detectedTopics.length === 0) {
    return [];
  }
  
  // Get user profile for personalization
  const profile = await getUserCulturalProfile(userId);
  
  // For each detected topic, find relevant content
  for (const topic of detectedTopics.slice(0, 2)) { // Max 2 suggestions per message
    const topicConfig = TOPIC_PATTERNS[topic];
    
    // Get content matching the topic
    const { data: content } = await supabase
      .from('cultural_content')
      .select('*')
      .eq('is_active', true)
      .in('content_type', topicConfig.contentTypes)
      .overlaps('target_concerns', topicConfig.concerns)
      .order('priority', { ascending: false })
      .limit(3);
    
    if (content && content.length > 0) {
      // Score content for user's profile
      const scoredContent = content.map(c => ({
        content: mapContentFromDb(c),
        score: profile ? calculateContentMatchScore(c, profile).score : c.priority,
      }));
      
      // Get best match
      const bestMatch = scoredContent.sort((a, b) => b.score - a.score)[0];
      
      suggestions.push({
        content: bestMatch.content,
        suggestionText: topicConfig.suggestionPrefix,
        triggerTopic: topic,
        confidence: bestMatch.score / 100,
      });
    }
  }
  
  return suggestions;
}

/**
 * Detect topics in a message
 */
export function detectTopicsInMessage(message: string): string[] {
  const detectedTopics: string[] = [];
  
  for (const [topic, config] of Object.entries(TOPIC_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        detectedTopics.push(topic);
        break; // Only count each topic once
      }
    }
  }
  
  return detectedTopics;
}

/**
 * Get personalized daily recommendations
 */
export async function getDailyRecommendations(
  userId: string,
  limit: number = 3
): Promise<{
  articles: RecommendedContent[];
  exercises: RecommendedContent[];
  affirmation: RecommendedContent | null;
}> {
  const [articles, exercises, affirmations] = await Promise.all([
    getRecommendedContent(userId, { contentType: 'article', limit }),
    getRecommendedContent(userId, { contentType: 'exercise', limit: 2 }),
    getRecommendedContent(userId, { contentType: 'affirmation', limit: 1 }),
  ]);
  
  return {
    articles,
    exercises,
    affirmation: affirmations[0] || null,
  };
}

/**
 * Track content interaction for improving recommendations
 */
export async function trackContentInteraction(
  userId: string,
  contentId: string,
  interactionType: 'view' | 'click' | 'complete' | 'save' | 'share' | 'dismiss'
): Promise<void> {
  try {
    await supabase.from('content_interactions').insert({
      user_id: userId,
      content_id: contentId,
      interaction_type: interactionType,
      created_at: new Date().toISOString(),
    });
    
    // Update content analytics
    if (interactionType === 'click' || interactionType === 'complete') {
      await supabase.rpc('increment_content_engagement', {
        p_content_id: contentId,
        p_interaction_type: interactionType,
      });
    }
  } catch (error) {
    console.error('Error tracking content interaction:', error);
  }
}

/**
 * Save content to user's saved items
 */
export async function saveContent(
  userId: string,
  contentId: string
): Promise<boolean> {
  const { error } = await supabase.from('saved_content').upsert({
    user_id: userId,
    content_id: contentId,
    saved_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,content_id',
  });
  
  return !error;
}

/**
 * Get user's saved content
 */
export async function getSavedContent(
  userId: string,
  limit: number = 20
): Promise<RecommendedContent[]> {
  const { data, error } = await supabase
    .from('saved_content')
    .select(`
      content_id,
      saved_at,
      cultural_content (*)
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .limit(limit);
  
  if (error || !data) {
    return [];
  }
  
  return data
    .filter((item: any) => item.cultural_content)
    .map((item: any) => mapContentFromDb(item.cultural_content));
}

/**
 * Remove saved content
 */
export async function unsaveContent(
  userId: string,
  contentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('saved_content')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId);
  
  return !error;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate match score between content and user profile
 */
function calculateContentMatchScore(
  content: any,
  profile: CulturalProfile
): { score: number; reasons: string[] } {
  let score = content.priority || 50;
  const reasons: string[] = [];
  
  // Cultural background match (high weight)
  if (profile.cultural_background && content.target_cultural_backgrounds) {
    if (content.target_cultural_backgrounds.includes(profile.cultural_background)) {
      score += 30;
      reasons.push('Matches your cultural background');
    }
  }
  
  // Community match
  if (profile.communities && content.target_communities) {
    const matchingCommunities = profile.communities.filter(
      (c: string) => content.target_communities.includes(c)
    );
    if (matchingCommunities.length > 0) {
      score += matchingCommunities.length * 15;
      reasons.push('Relevant to your communities');
    }
  }
  
  // Concern match (high weight)
  if (profile.primary_concerns && content.target_concerns) {
    const matchingConcerns = profile.primary_concerns.filter(
      (c: string) => content.target_concerns.includes(c)
    );
    if (matchingConcerns.length > 0) {
      score += matchingConcerns.length * 20;
      reasons.push('Addresses your concerns');
    }
  }
  
  // Language preference
  if (profile.language_preference?.primary && content.language) {
    if (content.language === profile.language_preference.primary) {
      score += 10;
      reasons.push('Available in your preferred language');
    }
  }
  
  return { score: Math.min(score, 100), reasons };
}

/**
 * Map database content to RecommendedContent type
 */
function mapContentFromDb(dbContent: any): RecommendedContent {
  return {
    id: dbContent.id,
    contentType: dbContent.content_type,
    title: dbContent.title,
    description: dbContent.content || dbContent.description || '',
    url: dbContent.url,
    body: dbContent.body,
    imageUrl: dbContent.image_url,
    readingTime: dbContent.reading_time,
    tags: dbContent.tags || [],
    culturalRelevance: dbContent.target_cultural_backgrounds || [],
    targetConcerns: dbContent.target_concerns || [],
    targetCommunities: dbContent.target_communities || [],
    author: dbContent.author,
    source: dbContent.source,
    priority: dbContent.priority || 50,
    createdAt: dbContent.created_at,
  };
}

/**
 * Get general content when no profile exists
 */
async function getGeneralContent(
  contentType?: ContentType,
  limit: number = 5
): Promise<RecommendedContent[]> {
  let query = supabase
    .from('cultural_content')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(limit);
  
  if (contentType) {
    query = query.eq('content_type', contentType);
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    return [];
  }
  
  return data.map(mapContentFromDb);
}

/**
 * Format content suggestion for chat display
 */
export function formatContentSuggestionForChat(suggestion: ContentSuggestion): string {
  const { content, suggestionText } = suggestion;
  
  let formatted = `\n\n${suggestionText}\n\n`;
  formatted += `📖 **${content.title}**\n`;
  formatted += `${content.description.substring(0, 150)}${content.description.length > 150 ? '...' : ''}\n`;
  
  if (content.readingTime) {
    formatted += `⏱️ ${content.readingTime} min read`;
  }
  
  if (content.url) {
    formatted += `\n🔗 [Read more](${content.url})`;
  }
  
  return formatted;
}

// ============================================================================
// CURATED CONTENT (Seed Data)
// ============================================================================

export const CURATED_CONTENT: Partial<RecommendedContent>[] = [
  // Code-switching
  {
    contentType: 'article',
    title: 'The Exhaustion of Code-Switching: A Black Man\'s Guide to Preserving Your Authentic Self',
    description: 'Navigating between professional and personal identities takes a toll. Here\'s how to stay true to yourself while succeeding in spaces that weren\'t designed for you.',
    tags: ['code-switching', 'workplace', 'identity', 'authenticity'],
    culturalRelevance: ['black_african_american', 'african', 'caribbean'],
    targetConcerns: ['work_career', 'identity_questions', 'stress'],
    readingTime: 8,
    priority: 90,
  },
  {
    contentType: 'podcast',
    title: 'Real Talk: When "Professional" Means Hiding Who You Are',
    description: 'A candid conversation about code-switching, workplace microaggressions, and finding your voice in corporate America.',
    tags: ['code-switching', 'workplace', 'podcast', 'corporate'],
    culturalRelevance: ['black_african_american', 'latino_hispanic'],
    targetConcerns: ['work_career', 'stress'],
    readingTime: 45,
    priority: 85,
  },
  
  // Anxiety
  {
    contentType: 'exercise',
    title: '5-4-3-2-1 Grounding Exercise',
    description: 'A quick grounding technique for moments when anxiety feels overwhelming. Brings you back to the present moment.',
    tags: ['anxiety', 'grounding', 'exercise', 'quick'],
    culturalRelevance: [],
    targetConcerns: ['anxiety', 'stress', 'trauma_ptsd'],
    readingTime: 3,
    priority: 95,
  },
  {
    contentType: 'article',
    title: 'Black Men and Anxiety: Breaking the Silence',
    description: 'Why anxiety often goes unaddressed in Black men and practical strategies for managing it while staying true to who you are.',
    tags: ['anxiety', 'mental-health', 'stigma'],
    culturalRelevance: ['black_african_american'],
    targetConcerns: ['anxiety', 'mental_health_stigma'],
    readingTime: 10,
    priority: 88,
  },
  
  // Depression
  {
    contentType: 'article',
    title: 'More Than Just "Being Down": Understanding Depression in Men of Color',
    description: 'Depression looks different for many men. Learn to recognize the signs and find culturally affirming support.',
    tags: ['depression', 'mental-health', 'awareness'],
    culturalRelevance: ['black_african_american', 'latino_hispanic', 'asian'],
    targetConcerns: ['depression', 'mental_health_stigma'],
    readingTime: 12,
    priority: 90,
  },
  {
    contentType: 'exercise',
    title: 'Behavioral Activation: Small Steps When Everything Feels Heavy',
    description: 'A practical approach to getting moving when depression has you stuck. Start small, build momentum.',
    tags: ['depression', 'exercise', 'practical'],
    culturalRelevance: [],
    targetConcerns: ['depression'],
    readingTime: 5,
    priority: 85,
  },
  
  // Fatherhood
  {
    contentType: 'article',
    title: 'Being the Dad You Needed: Breaking Cycles of Absent Fatherhood',
    description: 'For Black and Brown fathers working to be present in ways their own fathers couldn\'t be.',
    tags: ['fatherhood', 'family', 'healing', 'cycles'],
    culturalRelevance: ['black_african_american', 'latino_hispanic'],
    targetConcerns: ['family_dynamics', 'relationships'],
    targetCommunities: ['fathers'],
    readingTime: 15,
    priority: 92,
  },
  {
    contentType: 'community',
    title: 'City Dads Group',
    description: 'Connect with other fathers navigating parenthood. Support groups and resources for dads in urban areas.',
    url: 'https://citydadsgroup.com',
    tags: ['fatherhood', 'community', 'support'],
    culturalRelevance: [],
    targetConcerns: ['family_dynamics'],
    targetCommunities: ['fathers'],
    priority: 80,
  },
  
  // Veterans
  {
    contentType: 'article',
    title: 'From Combat to Community: A Black Veteran\'s Guide to Civilian Life',
    description: 'The unique challenges of being both a veteran and a Black man in America, and how to navigate both identities.',
    tags: ['veteran', 'transition', 'identity'],
    culturalRelevance: ['black_african_american'],
    targetConcerns: ['trauma_ptsd', 'identity_questions'],
    targetCommunities: ['veteran'],
    readingTime: 14,
    priority: 88,
  },
  {
    contentType: 'resource',
    title: 'Veterans Crisis Line Resources',
    description: 'Immediate support for veterans in crisis. Call 988 then press 1, or text 838255.',
    url: 'https://veteranscrisisline.net',
    tags: ['veteran', 'crisis', 'support'],
    culturalRelevance: [],
    targetConcerns: ['trauma_ptsd'],
    targetCommunities: ['veteran'],
    priority: 100,
  },
  
  // Anger
  {
    contentType: 'exercise',
    title: 'The STOP Technique: Pause Before You React',
    description: 'A simple but powerful technique to create space between stimulus and response when anger rises.',
    tags: ['anger', 'exercise', 'management'],
    culturalRelevance: [],
    targetConcerns: ['anger_management'],
    readingTime: 4,
    priority: 90,
  },
  {
    contentType: 'article',
    title: 'Angry Black Man: Reclaiming Your Right to Feel',
    description: 'How to process legitimate anger without playing into stereotypes or suppressing valid emotions.',
    tags: ['anger', 'stereotypes', 'emotions'],
    culturalRelevance: ['black_african_american'],
    targetConcerns: ['anger_management', 'mental_health_stigma'],
    readingTime: 11,
    priority: 87,
  },
  
  // Reentry
  {
    contentType: 'resource',
    title: 'Clean Slate Toolkit: Expungement and Record Sealing',
    description: 'State-by-state guide to clearing your record and opening doors that have been closed.',
    url: 'https://lac.org/toolkits/clean-slate',
    tags: ['reentry', 'legal', 'employment'],
    culturalRelevance: [],
    targetConcerns: ['work_career'],
    targetCommunities: ['formerly_incarcerated'],
    priority: 92,
  },
  {
    contentType: 'article',
    title: 'Coming Home: Mental Health After Incarceration',
    description: 'Addressing the unique mental health challenges of reentry and finding support that understands.',
    tags: ['reentry', 'mental-health', 'support'],
    culturalRelevance: ['black_african_american', 'latino_hispanic'],
    targetConcerns: ['identity_questions', 'isolation_loneliness'],
    targetCommunities: ['formerly_incarcerated'],
    readingTime: 13,
    priority: 88,
  },
  
  // Immigration
  {
    contentType: 'resource',
    title: 'Know Your Rights: Immigration Edition',
    description: 'Essential information about your rights during ICE encounters, at work, and at home.',
    url: 'https://aclu.org/know-your-rights/immigrants-rights',
    tags: ['immigration', 'rights', 'legal'],
    culturalRelevance: ['latino_hispanic'],
    targetConcerns: ['anxiety', 'stress'],
    targetCommunities: ['immigrant'],
    priority: 95,
  },
  {
    contentType: 'article',
    title: 'Living in the Shadows: Mental Health for Undocumented Men',
    description: 'The invisible weight of undocumented status and how to care for your mental health despite the uncertainty.',
    tags: ['immigration', 'mental-health', 'undocumented'],
    culturalRelevance: ['latino_hispanic'],
    targetConcerns: ['anxiety', 'stress'],
    targetCommunities: ['immigrant'],
    readingTime: 12,
    priority: 90,
  },
  
  // Affirmations
  {
    contentType: 'affirmation',
    title: 'Daily Affirmation for Black Men',
    description: 'I am worthy of peace, joy, and love. My existence is not a threat. My emotions are valid. I am more than what others expect me to be.',
    tags: ['affirmation', 'self-worth', 'daily'],
    culturalRelevance: ['black_african_american'],
    targetConcerns: ['depression', 'identity_questions', 'mental_health_stigma'],
    priority: 75,
  },
  {
    contentType: 'affirmation',
    title: 'Strength Through Vulnerability',
    description: 'Asking for help is not weakness—it is wisdom. My ancestors survived so I could thrive, not just endure.',
    tags: ['affirmation', 'strength', 'help'],
    culturalRelevance: ['black_african_american', 'latino_hispanic'],
    targetConcerns: ['mental_health_stigma'],
    priority: 75,
  },
];

// Export service object
export const contentRecommendationService = {
  getRecommendedContent,
  getContextualSuggestions,
  getDailyRecommendations,
  trackContentInteraction,
  saveContent,
  getSavedContent,
  unsaveContent,
  detectTopicsInMessage,
  formatContentSuggestionForChat,
  TOPIC_PATTERNS,
  CURATED_CONTENT,
};
