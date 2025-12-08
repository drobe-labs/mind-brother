import { mentalHealthKnowledge } from './knowledgeBase';

interface KnowledgeEntry {
  id: string;
  category: string;
  content: string;
  tags: string[];
  keywords: string[];
  priority: number; // Higher = more important
  authority: number; // Source credibility (1-10)
  dateAdded: Date;
  topicTags: string[]; // Semantic topic classification
  chunks: string[]; // Semantic chunks with overlap
}

interface RAGResult {
  content: string;
  category: string;
  relevanceScore: number;
  matchedKeywords: string[];
}

export class ModernRAGService {
  private knowledgeBase: KnowledgeEntry[] = [];

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Convert knowledge base to enhanced format with better keyword extraction
    this.knowledgeBase = mentalHealthKnowledge.map((item, index) => ({
      id: `kb_${index}`,
      category: item.category,
      content: item.content,
      tags: item.tags,
      keywords: this.extractKeywords(item.content, item.tags),
      priority: this.getPriority(item.category),
      authority: this.getAuthority(item.category),
      dateAdded: new Date(),
      topicTags: this.extractTopicTags(item.category, item.tags),
      chunks: this.createSemanticChunks(item.content)
    }));
  }

  // Semantic chunking by topic/concept with overlap
  private createSemanticChunks(content: string): string[] {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    const chunks: string[] = [];
    const chunkSize = 3; // sentences per chunk
    const overlapSize = 1; // 33% overlap for context continuity
    
    for (let i = 0; i < sentences.length; i += (chunkSize - overlapSize)) {
      const chunk = sentences.slice(i, i + chunkSize).join(' ').trim();
      if (chunk) chunks.push(chunk);
    }
    
    return chunks.length > 0 ? chunks : [content];
  }

  // Source authority/credibility scoring
  private getAuthority(category: string): number {
    const authorityScores: { [key: string]: number } = {
      'crisis_resources': 10,      // Clinical/emergency resources
      'therapy': 9,                 // Professional treatment
      'depression': 8,              // Clinical conditions
      'anxiety': 8,
      'trauma': 8,
      'ptsd': 8,
      'paranoia': 8,
      'job_loss': 7,                // Evidence-based advice
      'unemployment_support': 7,
      'relationship_cheating': 7,
      'workplace_stress': 6,
      'self_care': 5,               // General wellness
      'coping_strategies': 6,
      'general': 4
    };
    return authorityScores[category] || 5;
  }

  // Extract semantic topic tags
  private extractTopicTags(category: string, tags: string[]): string[] {
    const topicMap: { [key: string]: string[] } = {
      'depression': ['mood', 'emotional_health', 'mental_illness'],
      'anxiety': ['stress', 'worry', 'panic', 'emotional_health'],
      'job_loss': ['career', 'employment', 'financial', 'life_transition'],
      'workplace_stress': ['career', 'work_life_balance', 'professional'],
      'relationship': ['interpersonal', 'social', 'connection'],
      'crisis': ['emergency', 'safety', 'urgent_care'],
      'therapy': ['treatment', 'professional_help', 'healing']
    };
    
    const baseTags = topicMap[category] || ['general'];
    return [...new Set([...baseTags, ...tags.slice(0, 3)])];
  }

  private extractKeywords(content: string, tags: string[]): string[] {
    const text = content.toLowerCase();
    const keywords = new Set<string>();
    
    // Add all tags
    tags.forEach(tag => keywords.add(tag.toLowerCase()));
    
    // Extract important words from content
    const importantWords = [
      'job', 'work', 'employment', 'career', 'boss', 'colleague', 'office',
      'laid off', 'fired', 'terminated', 'unemployed', 'job loss', 'downsized',
      'sad', 'depressed', 'anxious', 'stressed', 'overwhelmed', 'hopeless',
      'relationship', 'family', 'partner', 'friend', 'lonely', 'isolated',
      'cheating', 'infidelity', 'betrayal', 'trust', 'communication',
      'therapy', 'counseling', 'support', 'help', 'crisis', 'suicide',
      'discrimination', 'racism', 'microaggression', 'bias', 'prejudice',
      'identity', 'culture', 'community', 'belonging', 'acceptance'
    ];
    
    importantWords.forEach(word => {
      if (text.includes(word)) {
        keywords.add(word);
      }
    });
    
    return Array.from(keywords);
  }

  private getPriority(category: string): number {
    const priorities: { [key: string]: number } = {
      'crisis_resources': 10,
      'job_loss': 9,
      'unemployment_support': 8,
      'depression': 7,
      'anxiety': 6,
      'workplace_stress': 5,
      'support_systems': 4,
      'therapy': 3,
      'self_care': 2,
      'general': 1
    };
    return priorities[category] || 1;
  }

  // Query expansion with synonyms and related terms
  private expandQuery(userMessage: string): string[] {
    const queries = [userMessage.toLowerCase()];
    const synonymMap: { [key: string]: string[] } = {
      'sad': ['depressed', 'down', 'blue', 'unhappy', 'miserable'],
      'anxious': ['worried', 'nervous', 'stressed', 'panicked', 'on edge'],
      'job': ['work', 'employment', 'career', 'position'],
      'fired': ['laid off', 'terminated', 'let go', 'dismissed'],
      'relationship': ['partner', 'spouse', 'girlfriend', 'boyfriend', 'marriage'],
      'cheating': ['infidelity', 'affair', 'unfaithful', 'betrayal'],
      'help': ['support', 'assistance', 'guidance', 'counseling'],
      'worthless': ['inadequate', 'useless', 'hopeless', 'failure']
    };
    
    Object.entries(synonymMap).forEach(([term, synonyms]) => {
      if (userMessage.toLowerCase().includes(term)) {
        synonyms.forEach(syn => {
          if (!queries.some(q => q.includes(syn))) {
            queries.push(userMessage.toLowerCase().replace(term, syn));
          }
        });
      }
    });
    
    return queries.slice(0, 5); // Limit to top 5 expanded queries
  }

  // Hybrid search: combine vector similarity with keyword matching
  private calculateSimilarity(userMessage: string, knowledge: KnowledgeEntry, expandedQueries: string[]): number {
    const userText = userMessage.toLowerCase();
    let score = 0;
    
    // 1. Direct keyword matching (highest weight) - with expanded queries
    let keywordMatches = knowledge.keywords.filter(keyword => 
      expandedQueries.some(query => query.includes(keyword))
    ).length;
    score += (keywordMatches / Math.max(knowledge.keywords.length, 1)) * 0.5;
    
    // 2. Tag matching - with expanded queries
    const tagMatches = knowledge.tags.filter(tag => 
      expandedQueries.some(query => query.includes(tag.toLowerCase()))
    ).length;
    score += (tagMatches / Math.max(knowledge.tags.length, 1)) * 0.2;
    
    // 3. Topic tag matching (semantic similarity)
    const topicMatches = knowledge.topicTags.filter(topic =>
      expandedQueries.some(query => query.includes(topic.toLowerCase()))
    ).length;
    score += (topicMatches / Math.max(knowledge.topicTags.length, 1)) * 0.2;
    
    // 4. Content similarity (word overlap)
    const userWords = userText.split(/\s+/);
    const contentWords = knowledge.content.toLowerCase().split(/\s+/);
    const commonWords = userWords.filter(word => contentWords.includes(word) && word.length > 3);
    score += (commonWords.length / Math.max(userWords.length, 1)) * 0.1;
    
    return score;
  }

  // Determine query complexity for dynamic retrieval
  private getQueryComplexity(userMessage: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = userMessage.split(/\s+/).length;
    const hasMultipleTopics = (userMessage.match(/and|or|but|also/gi) || []).length > 0;
    const hasComplexPhrases = /because|although|however|therefore|moreover/i.test(userMessage);
    
    if (wordCount > 20 || (hasMultipleTopics && hasComplexPhrases)) return 'complex';
    if (wordCount > 10 || hasMultipleTopics) return 'moderate';
    return 'simple';
  }

  // Dynamic retrieval: adjust based on query complexity
  public retrieveRelevantKnowledge(userMessage: string, limit?: number): RAGResult[] {
    // Expand query with synonyms
    const expandedQueries = this.expandQuery(userMessage);
    
    // Dynamic limit based on query complexity
    if (!limit) {
      const complexity = this.getQueryComplexity(userMessage);
      limit = complexity === 'complex' ? 5 : complexity === 'moderate' ? 3 : 2;
    }
    
    const results: RAGResult[] = [];
    
    // Initial retrieval with hybrid search
    for (const knowledge of this.knowledgeBase) {
      const relevanceScore = this.calculateSimilarity(userMessage, knowledge, expandedQueries);
      
      if (relevanceScore > 0.05) { // Lower threshold for better coverage
        const matchedKeywords = knowledge.keywords.filter(keyword => 
          expandedQueries.some(query => query.includes(keyword))
        );
        
        results.push({
          content: knowledge.content,
          category: knowledge.category,
          relevanceScore: relevanceScore * knowledge.priority, // Boost by priority
          matchedKeywords
        });
      }
    }
    
    // Sort by initial relevance
    const sortedResults = results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Get top candidates for reranking (2x limit)
    const candidates = sortedResults.slice(0, limit * 2);
    
    // Reranking with authority and recency
    const reranked = this.rerankResults(candidates, userMessage);
    
    // Return final top results
    return reranked.slice(0, limit);
  }

  // Rerank results by authority and additional relevance signals
  private rerankResults(results: RAGResult[], userMessage: string): RAGResult[] {
    return results.map(result => {
      const knowledge = this.knowledgeBase.find(kb => kb.category === result.category);
      if (!knowledge) return result;
      
      // Calculate reranking score
      let rerankScore = result.relevanceScore;
      
      // Boost by authority/credibility
      rerankScore *= (1 + (knowledge.authority / 20));
      
      // Boost crisis-related content
      if (this.isCrisisQuery(userMessage) && knowledge.category.includes('crisis')) {
        rerankScore *= 1.5;
      }
      
      // Penalize very old content (if we had timestamps)
      // For now, all content is considered current
      
      return {
        ...result,
        relevanceScore: rerankScore
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Detect crisis queries for priority boosting
  private isCrisisQuery(message: string): boolean {
    const crisisKeywords = [
      // Direct ideation (Category 1)
      'suicide', 'kill myself', 'end my life', 'don\'t want to live', 'want to die',
      'wish i was dead', 'end it all', 'planning to kill myself',
      // Self-harm (Category 2)
      'self harm', 'hurt myself', 'cutting', 'overdosed', 'burning myself',
      // Preparation/Planning (Category 7 - CRITICAL)
      'have a plan', 'set a date', 'wrote goodbye', 'saying goodbye', 'final arrangements',
      // Burden beliefs (Category 4)
      'better off without me', 'burden to everyone', 'nobody would miss me',
      // Finality (Category 12)
      'goodbye forever', 'this is goodbye', 'won\'t see me again', 'this is the end',
      // Hopelessness (Category 3)
      'no hope', 'no way out', 'can\'t go on', 'give up',
      // Emergency
      'emergency', 'crisis'
    ];
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Calculate severity score for mental health issues (0-10 scale)
  public calculateSeverityScore(patterns: ReturnType<typeof this.detectPatterns>, userMessage: string = ''): {
    overallSeverity: number;
    categories: { category: string; severity: number; priority: 'critical' | 'high' | 'elevated' | 'moderate' }[];
    recommendations: string[];
  } {
    const lowerMessage = userMessage.toLowerCase();
    const scores: { category: string; severity: number; priority: 'critical' | 'high' | 'elevated' | 'moderate' }[] = [];
    const recommendations: string[] = [];

    // Crisis (10/10 - CRITICAL)
    if (patterns.isCrisis) {
      scores.push({ category: 'Crisis/Suicide', severity: 10, priority: 'critical' });
      recommendations.push('Immediate crisis intervention required');
      recommendations.push('Display 988 Suicide & Crisis Lifeline');
      recommendations.push('Offer Crisis Text Line (text HOME to 741741)');
    }

    // Depression (7-9/10 depending on severity)
    if (patterns.isDepression) {
      const depressionSeverity = patterns.isCrisis ? 9 : 7;
      scores.push({ category: 'Depression', severity: depressionSeverity, priority: depressionSeverity >= 8 ? 'high' : 'elevated' });
      recommendations.push('Offer mood tracking and behavioral activation');
      if (depressionSeverity >= 8) recommendations.push('Strongly recommend professional therapy');
    }

    // Anxiety (6-8/10)
    if (patterns.isAnxiety) {
      const anxietySeverity = patterns.isOverwhelmed ? 8 : 6;
      scores.push({ category: 'Anxiety & Stress', severity: anxietySeverity, priority: anxietySeverity >= 7 ? 'high' : 'elevated' });
      recommendations.push('Offer breathing exercises and grounding techniques');
      recommendations.push('Suggest mindfulness practices');
    }

    // Overwhelm (7/10)
    if (patterns.isOverwhelmed) {
      scores.push({ category: 'Overwhelm', severity: 7, priority: 'elevated' });
      recommendations.push('Help break down tasks into manageable steps');
      recommendations.push('Suggest priority matrix');
    }

    // Frustration (5-6/10) - NEW: Distinct from anger
    if (patterns.isFrustration) {
      const frustrationSeverity = patterns.isOverwhelmed ? 6 : 5;
      scores.push({ category: 'Frustration', severity: frustrationSeverity, priority: 'moderate' });
      recommendations.push('Help identify what specifically is blocking progress');
      recommendations.push('Break down the problem into smaller steps');
      recommendations.push('Explore alternative approaches or perspectives');
    }

    // Anger (6-7/10)
    if (patterns.isAnger) {
      // Check the actual message text for severe anger indicators
      const angerSeverity = /\b(rage|violent|explode|snap|furious|enraged|seeing red|want to punch|want to break)\b/i.test(lowerMessage) ? 7 : 6;
      scores.push({ category: 'Anger', severity: angerSeverity, priority: 'elevated' });
      recommendations.push('Offer anger management techniques');
      recommendations.push('Suggest physical outlets');
    }

    // Loneliness (6-7/10)
    if (patterns.isLoneliness) {
      const lonelinessSeverity = patterns.isDepression ? 7 : 6;
      scores.push({ category: 'Loneliness & Isolation', severity: lonelinessSeverity, priority: 'elevated' });
      recommendations.push('Connect to community resources');
      recommendations.push('Suggest social connection strategies');
    }

    // Trauma (8/10)
    if (patterns.isTrauma) {
      scores.push({ category: 'Trauma/PTSD', severity: 8, priority: 'high' });
      recommendations.push('Recommend trauma-informed therapy (EMDR, CPT)');
      recommendations.push('Offer grounding techniques for flashbacks');
    }

    // Substance abuse (8/10)
    if (patterns.isSubstance) {
      scores.push({ category: 'Substance Use', severity: 8, priority: 'high' });
      recommendations.push('Recommend substance abuse counseling');
      recommendations.push('Provide recovery resources');
    }

    // Financial stress (5-6/10)
    if (patterns.isFinancial) {
      scores.push({ category: 'Financial Stress', severity: 5, priority: 'moderate' });
      recommendations.push('Connect to financial counseling resources');
    }

    // Self-esteem (includes imposter syndrome, shame, guilt) (5-6/10)
    if (patterns.isSelfEsteem) {
      scores.push({ category: 'Self-Esteem/Self-Worth', severity: 5, priority: 'moderate' });
      recommendations.push('Explore self-compassion practices');
      recommendations.push('Challenge negative self-talk');
    }

    // NEW ENHANCED CATEGORIES (TypeScript types pending - detection works, severity scoring to be added later)
    // Note: These categories ARE detected and work in the RAG system, just not yet in severity scoring
    // - Grief & Loss (isGrief)
    // - Burnout (isBurnout) 
    // - Sleep Issues (isSleep)
    // - Body Image/Eating (isBodyImage)
    // - Perfectionism (isPerfectionism)
    // - PTSD (isPTSD)
    // - Existential Crisis (isExistential)
    // - Procrastination (isProcrastination)
    // - Boundary Issues (isBoundaries)

    // Calculate overall severity (weighted average with max cap at 10)
    const overallSeverity = scores.length > 0
      ? Math.min(10, Math.max(...scores.map(s => s.severity)))
      : 0;

    return {
      overallSeverity,
      categories: scores.sort((a, b) => b.severity - a.severity),
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  // Get specific knowledge by category
  public getKnowledgeByCategory(category: string): KnowledgeEntry | null {
    return this.knowledgeBase.find(kb => kb.category === category) || null;
  }

  // Check if user message matches specific patterns
  public detectPatterns(userMessage: string): {
    isJobLoss: boolean;
    isCrisis: boolean;
    isDepression: boolean;
    isAnxiety: boolean;
    isOverwhelmed: boolean;
    isWorkplace: boolean;
    isRelationship: boolean;
    isEmotionallyExhausted: boolean; // NEW: Context-aware emotional exhaustion (not physical fatigue)
    isTrauma: boolean;
    isAnger: boolean;
    isFrustration: boolean; // NEW: General frustration (distinct from anger)
    isSubstance: boolean;
    isLoneliness: boolean;
    isSelfEsteem: boolean;
    isGrief: boolean; // NEW: Grief & Loss
    isBurnout: boolean; // NEW: Burnout (distinct from general stress)
    isSleep: boolean; // NEW: Sleep Issues
    isFinancial: boolean;
    isBodyImage: boolean; // NEW: Body Image & Eating
    isPerfectionism: boolean; // NEW: Perfectionism
    isPTSD: boolean; // NEW: PTSD & Trauma (enhanced)
    isExistential: boolean; // NEW: Existential Crisis
    isProcrastination: boolean; // NEW: Procrastination & Avoidance
    isBoundaries: boolean; // NEW: Boundary Issues
    isIdentity: boolean;
    isSexuality: boolean;
    isFatherhood: boolean;
    isHealth: boolean;
    isMasculinity: boolean;
    isSelfCare: boolean;
    isParanoia: boolean;
    // NEW IDENTITY & SELF-ESTEEM CATEGORIES
    isImposterSyndrome: boolean; // NEW: Feeling like a fraud, don't belong
    isShame: boolean; // NEW: Shame about identity, actions, past
    isGuilt: boolean; // NEW: Chronic or specific guilt
    isInadequacy: boolean; // NEW: Feeling not enough, inadequate
    // NEW CULTURAL & RACIAL IDENTITY CATEGORIES
    isRacialIdentity: boolean; // NEW: Racial identity struggles
    isCodeSwitching: boolean; // NEW: Code-switching exhaustion
    isCulturalNavigation: boolean; // NEW: Between two cultures
    isAuthenticity: boolean; // NEW: Hiding true self, living lie
    isIdentityCrisis: boolean; // NEW: "Who am I" questions
    // NEW MASCULINITY CATEGORIES (Enhanced beyond current isMasculinity)
    isToxicMasculinity: boolean; // NEW: Toxic masculinity impact
    isVulnerability: boolean; // NEW: Struggling with vulnerability
    isEmotionalSuppression: boolean; // NEW: Can't express emotions
    isMentalHealthStigma: boolean; // NEW: Stigma around seeking help
    // NEW SEXUALITY & LGBTQ+ CATEGORIES
    isLGBTQ: boolean; // NEW: LGBTQ+ issues, questioning
    isComingOut: boolean; // NEW: Coming out concerns
    isDownLow: boolean; // NEW: Living on the down low
    isSexualHealth: boolean; // NEW: STI, HIV concerns
    isHIV: boolean; // NEW: HIV status, PrEP
    isSexualTrauma: boolean; // NEW: Sexual assault, abuse
    isIntimacyIssues: boolean; // NEW: Intimacy struggles
    // NEW FATHERHOOD CATEGORIES (Enhanced beyond current isFatherhood)
    isParentingStress: boolean; // NEW: Overwhelmed by parenting
    isNewDad: boolean; // NEW: New father adjustment
    isPostpartumDad: boolean; // NEW: Paternal postpartum depression
    isCustody: boolean; // NEW: Custody battles, child support
    isAbsentFather: boolean; // NEW: Absent father issues
    isCoParenting: boolean; // NEW: Co-parenting challenges
    // NEW HEALTH CATEGORIES (Enhanced)
    isChronicIllness: boolean; // NEW: Chronic illness struggles
    isMedication: boolean; // NEW: Medication issues
    isTherapySeeking: boolean; // NEW: Seeking therapy
    isTherapyStigma: boolean; // NEW: Embarrassed about therapy
    // NEW SYSTEMIC DISCRIMINATION CATEGORIES
    isRacism: boolean; // NEW: Experiencing racism
    isMicroaggressions: boolean; // NEW: Microaggressions
    isDiscrimination: boolean; // NEW: General discrimination
    isWorkplaceDiscrimination: boolean; // NEW: Workplace discrimination
    isStereotypes: boolean; // NEW: Dealing with stereotypes
    isRacialProfiling: boolean; // NEW: Racial profiling, police
    isCommunityTrauma: boolean; // NEW: Collective trauma
    isSystemicOppression: boolean; // NEW: Structural racism
    isCulturalTaxation: boolean; // NEW: Extra burden in white spaces
    // NEW CULTURAL COMPETENCY CATEGORIES - BLACK MEN
    isMedicalMistrust: boolean; // NEW: Historical medical trauma, Tuskegee
    isStrongBlackMan: boolean; // NEW: "Strong Black man" myth pressure
    isChurchSpirituality: boolean; // NEW: Church as support, faith conflicts
    isCommunityResponsibility: boolean; // NEW: Representing race, uplift burden
    isPoliceAnxiety: boolean; // NEW: Fear of police, safety concerns
    isBlackExcellence: boolean; // NEW: "Twice as good" pressure
    // NEW CULTURAL COMPETENCY CATEGORIES - LATINO/HISPANIC
    isFamilismo: boolean; // NEW: Family first, collective vs individual
    isMachismo: boolean; // NEW: Traditional masculinity, "men don't cry"
    isImmigrationStress: boolean; // NEW: Immigrant experience, displacement
    isUndocumented: boolean; // NEW: Undocumented status, deportation fear
    isLanguageBarrier: boolean; // NEW: Limited English, need Spanish services
    isRespeto: boolean; // NEW: Respect for elders, shame/vergüenza
    // NEW CULTURAL COMPETENCY CATEGORIES - ASIAN AMERICAN
    isModelMinority: boolean; // NEW: Model minority myth pressure
    isFilialPiety: boolean; // NEW: Obligation to parents, career pressure
    isFaceHonor: boolean; // NEW: Saving face, family reputation
    isAsianRacism: boolean; // NEW: Anti-Asian racism, COVID-19 hate
    isPerpetualForeigner: boolean; // NEW: "Where are you really from"
    isAsianMentalHealthStigma: boolean; // NEW: Cultural shame around therapy
    // NEW CULTURAL COMPETENCY CATEGORIES - INDIGENOUS
    isHistoricalTrauma: boolean; // NEW: Intergenerational trauma, genocide
    isLandDisplacement: boolean; // NEW: Displaced from ancestral land
    isTribalIdentity: boolean; // NEW: Blood quantum, tribal belonging
    isTraditionalHealing: boolean; // NEW: Need for ceremony, spiritual healing
    // NEW CULTURAL COMPETENCY CATEGORIES - IMMIGRANT
    isAcculturationStress: boolean; // NEW: Between cultures, identity loss
    isDocumentationStatus: boolean; // NEW: DACA, TPS, undocumented fears
    isFamilySeparation: boolean; // NEW: Transnational families, guilt
    isRefugeeTrauma: boolean; // NEW: War, violence, persecution trauma
    isLossOfStatus: boolean; // NEW: Professional in home country, starting over
    // NEW CULTURAL COMPETENCY CATEGORIES - FAITH/RELIGION
    isFaithBasedHealing: boolean; // NEW: Prayer as therapy, faith integration
    isReligiousConflict: boolean; // NEW: Faith vs mental health, church rejection
    isFaithLGBTQConflict: boolean; // NEW: Religious trauma, LGBTQ+ rejection
    isIslamicConsiderations: boolean; // NEW: Muslim-specific concerns
    // NEW INTERSECTIONALITY CATEGORIES
    isRaceAndSexuality: boolean; // NEW: Double marginalization (LGBTQ+ POC)
    isRaceAndClass: boolean; // NEW: Poverty + racism compounded
    isRaceAndGender: boolean; // NEW: Racialized masculinity expectations
    isMultipleMarginalization: boolean; // NEW: 3+ intersecting identities
    isIntersectionalComplexity: boolean; // NEW: Complex identity navigation
    isDigitalCommunication: boolean;
    isUrbanSlang: boolean;
    isGreeting: boolean;
    isFarewell: boolean;
    isGratitude: boolean;
    isPositiveEmotion: boolean;
    isFatigue: boolean;
    isHelpRequest: boolean;
    isPracticalAdvice: boolean;
    isEmotionalSupport: boolean;
    isInformation: boolean;
    isInformationRequest: boolean;
    isAffirmation: boolean;
    isNegation: boolean;
    isUncertainty: boolean;
    isActionRequest: boolean;
    isEndAction: boolean;
    isTimeReference: boolean;
    isTechIssue: boolean;
    isHumor: boolean;
    isShock: boolean;
    isWorldConcerns: boolean;
    isConversationEnding: boolean;
    isGeneralEmotional: boolean;
    isTreatmentNotWorking: boolean; // New: therapy/medication ineffective
    isTaskFrustration: boolean; // New: "can't figure this out"
    isSelfDoubt: boolean; // New: "can't be a good father/partner"
  } {
    const text = userMessage.toLowerCase();
    
    // ===== CONTEXT-AWARE DETECTION FOR AMBIGUOUS PHRASES =====
    // "not working" can mean: employment, tech, or therapy/coping strategy
    
    // Define context keywords for different meanings
    const employmentContext = /\b(job|career|fired|laid off|layoffs|unemployment|unemployed|income|paycheck|employer|hiring|wife|husband|partner|family|burden|money|bills|financial|provide|provider|breadwinner|employment|jobless|resume|interview)\b/i;
    const techContext = /\b(app|site|website|web|page|button|link|chat|feature|interface|browser|device|phone|computer|mobile|desktop|login|sign in|access|screen|loading|menu|settings|system|platform|software|program)\b/i;
    const therapyContext = /\b(therapy|therapist|medication|meds|treatment|counseling|coping|approach|strategy|technique|exercise)\b/i;
    
    // Ambiguous "not working" phrase
    const notWorkingPhrase = /\b(not working|isn't working|isnt working|won't work|wont work|doesn't work|doesnt work|hasn't worked|hasnt worked|stopped working)\b/i;
    
    // ===== SUBJECT-BASED DISAMBIGUATION =====
    // Look at what comes BEFORE "not working" to determine the subject
    
    // Pattern 1: Personal employment - "I'm/I am/I've been + not working"
    const personalEmploymentPattern = /\b(i'm|i am|i've been|im|ive been|currently|not currently|haven't been|havent been)\s+(not\s+)?working\b/i;
    
    // Pattern 2: Tech object - "the/this/it/that + [tech object] + not working"
    const techObjectPattern = /\b(the|this|it|that|my|your)\s+(app|site|website|page|button|link|feature|chat|login|menu|screen)\b.{0,30}not\s+working/i;
    
    // Pattern 3: Therapy/medication - "therapy/medication + not working"
    const therapyNotWorkingPattern = /\b(therapy|therapist|medication|meds|treatment|counseling|approach|strategy|technique|coping|this|that)\b.{0,20}(not\s+working|isn't\s+working|hasn't\s+worked|stopped\s+working)/i;
    
    // Pattern 4: Specific tech syntax - "app/website/etc + is not working"
    const specificTechPattern = /\b(app|site|website|page|button|feature|link|chat)\s+(is\s+)?(not\s+working|broken|down|offline)\b/i;
    
    // Decision logic using subject-based analysis
    let isEmploymentIssue = false;
    let isTechRelated = false;
    let isTherapyApproach = false;
    
    const hasNotWorking = notWorkingPhrase.test(text);
    
    if (hasNotWorking) {
      // Check subject patterns (most specific first)
      if (personalEmploymentPattern.test(text)) {
        // "I'm not working" → EMPLOYMENT
        isEmploymentIssue = true;
      }
      else if (therapyNotWorkingPattern.test(text)) {
        // "therapy's not working" → THERAPY APPROACH
        isTherapyApproach = true;
      }
      else if (specificTechPattern.test(text) || techObjectPattern.test(text)) {
        // "the app is not working" → TECH
        isTechRelated = true;
      }
      else {
        // Fallback to context keywords
        const hasEmploymentContext = employmentContext.test(text);
        const hasTechContext = techContext.test(text);
        const hasTherapyContext = therapyContext.test(text);
        
        if (hasEmploymentContext && !hasTechContext && !hasTherapyContext) {
          isEmploymentIssue = true;
        }
        else if (hasTechContext && !hasEmploymentContext) {
          isTechRelated = true;
        }
        else if (hasTherapyContext) {
          isTherapyApproach = true;
        }
        else if (hasEmploymentContext) {
          // Employment wins if multiple contexts
          isEmploymentIssue = true;
        }
        else {
          // Check sentence structure - if starts with "I", assume employment
          if (/^(i\s|i'm|im)/i.test(text.trim())) {
            isEmploymentIssue = true;
          } else {
            // Default to tech (safer to ask "what went wrong" than assume job loss)
            isTechRelated = true;
          }
        }
      }
    }
    
    return {
      // Job Loss (context-aware + explicit terms)
      isJobLoss: isEmploymentIssue || /\b(laid off|layoffs|fired|terminated|lost my job|job loss|unemployed|let go|downsized|between jobs|no job|jobless|can't find a job|can't find work|looking for work|job hunting|job search)\b/i.test(text),
      
      // Crisis & Suicide (includes "can't do this anymore" variations)
      isCrisis: /\b(suicide|suicidal|kill myself|end it all|end my life|don't want to be here|hurt myself|self harm|self-harm|cutting|overdose|want to die|better off dead|no point living|no reason to live|wish i was dead|planning to kill myself|going to kill myself)\b/i.test(text) ||
        // "Can't do this anymore" - high risk phrases
        /\b(can't|cannot)\s+(do\s+this|go\s+on|take\s+it|live|continue|keep\s+going)\s+(anymore|any\s+more|much\s+longer)\b/i.test(text) ||
        // Short standalone crisis phrases
        /\b(can't|cannot)\s+go\s+on\b/i.test(text) ||
        /\b(don't\s+want\s+to|dont\s+want\s+to)\s+(do\s+this|go\s+on|live|be\s+here|continue)\s+(anymore|any\s+more)\b/i.test(text) ||
        // Preparation/Planning indicators (Category 7 - CRITICAL)
        /\b(have\s+a\s+plan|set\s+a\s+date|wrote\s+goodbye|saying\s+goodbye|final\s+arrangements|getting\s+my\s+affairs|gave\s+away\s+my\s+things)\b/i.test(text) ||
        // Burden beliefs (Category 4 - strong predictor)
        /\b(better\s+off\s+without\s+me|burden\s+to\s+everyone|nobody\s+would\s+miss|waste\s+of\s+space)\b/i.test(text) ||
        // Finality language (Category 12)
        /\b(goodbye\s+forever|this\s+is\s+goodbye|won't\s+see\s+me\s+again|this\s+is\s+the\s+end)\b/i.test(text) ||
        // Passive ideation (Category 8)
        /\b(hope\s+i\s+don't\s+wake\s+up|wish\s+i\s+would\s+die|wouldn't\s+mind\s+if\s+i\s+died)\b/i.test(text),
      
      // Depression (Enhanced with 500+ phrase guide)
      isDepression: /\b(depressed|depression|sad|hopeless|worthless|empty|numb|down|blue|melancholy|gloomy|despair|desperate|helpless|useless|pointless|empty feeling|feeling empty|hollow|void|missing something|something missing|incomplete|unfulfilled|disconnected|detached|flat|dull|lifeless|spiritless|listless|apathetic|indifferent|blah|meh|okay|just ok|just okay|don't know why|can't explain|confused|lost|directionless|purposeless|not doing well|i'm not doing well|im not doing well|i am not doing well|not doing too well|doing poorly|struggling|having a hard time|rough time|tough time|bad day|bad week|feeling down|feeling low|not good|not too good|not great|not well|dont feel good|don't feel good|feeling bad|not okay|i'm not okay|im not okay|i am not okay|not feeling well|not feeling good|not feeling great|not feeling right|things aren't good|things are not good|things aren't going well|things are not going well)\b/.test(text) ||
        // Additional "not doing well" variations
        /\b(i'm|im|i am|things are|things aren't|i feel like i'm|i feel like im|i feel like i am)\s+(not|aren't|are not)\s+(doing|feeling|going)\s+(well|good|great|okay|ok|right|fine)\b/i.test(text) ||
        // Unexplained sadness patterns
        /\b(sad for no reason|don't know why i'm sad|should be happy but|everything is fine but i feel|can't explain why|sadness came out of nowhere)\b/i.test(text) ||
        // Numbness & anhedonia
        /\b(feel nothing|emotionally dead|going through the motions|on autopilot|can't feel anything|nothing brings me joy|lost interest in everything|can't enjoy anything|don't care about)\b/i.test(text) ||
        // Self-hatred & worthlessness
        /\b(hate myself|i'm a failure|i'm pathetic|i'm nothing|i don't matter|my life has no value|i'm disgusted with myself)\b/i.test(text) ||
        // Energy loss
        /\b(no energy|can't get out of bed|too tired|everything feels exhausting|i'm drained|sleep all day|can't wake up|no motivation)\b/i.test(text),
      
      // Anxiety & Stress (Enhanced with 500+ phrase guide)
      isAnxiety: /\b(anxious|anxiety|worried|worry|nervous|panic|stressed|stress|burnout|burned out|pressure|tense|restless|uneasy|fearful|scared|frightened|uncomfortable|racing thoughts|thoughts are racing|mind racing|mind is racing|can't stop thinking|overthinking|spiraling|on edge|jittery|jumpy)\b/.test(text) ||
        // Panic attacks & physical symptoms
        /\b(panic attack|can't breathe|chest is tight|heart is racing|feel like i'm dying|feel like i'm having a heart attack|i'm shaking|room is spinning|feel dizzy|going to pass out|losing control)\b/i.test(text) ||
        // Racing thoughts & mental spirals
        /\b(my thoughts are racing|can't slow down my mind|brain won't shut off|thoughts are flying|mind is going a mile a minute|stuck in a thought loop|keep replaying|ruminating)\b/i.test(text) ||
        // Excessive worry & overthinking
        /\b(worry about everything|can't stop worrying|overthink everything|catastrophize|always expect the worst|what if something bad happens|sense of dread)\b/i.test(text) ||
        // Social anxiety
        /\b(scared to talk to people|anxious in social situations|afraid of being judged|people make me nervous|feel awkward around people|avoid social events|self-conscious)\b/i.test(text),
      
      // Overwhelmed (Enhanced - distinct from anxiety)
      isOverwhelmed: /\b(overwhelmed|too much|can't handle|can't cope|drowning|swamped|buried|snowed under|in over my head|more than i can handle|too many things|everything at once|all at once|piling up|stacking up|piled up|stacked up|backlog|behind|falling behind|can't keep up|can't catch up|drowning in|sinking|sinking feeling|weight of|weight on my shoulders|crushing|crushed|suffocating|suffocated|trapped|stuck|no way out|no escape|helpless|powerless|out of control|lost control|losing control|spinning|spinning out|spiraling out|out of my depth|in too deep|over my head|way over my head|way too much|way too many|far too much|far too many|way beyond|beyond me|beyond my capacity|beyond my ability|more than i can bear|more than i can take|more than i can deal with|more than i can manage|more than i can handle|more than i can cope with|more than i can process|more than i can absorb|more than i can digest|more than i can take in)\b/.test(text) ||
        // Loss of control & capacity
        /\b(hit my limit|at capacity|maxed out|about to break|lost control|everything is out of control|falling apart|everything is falling apart|my life is chaos)\b/i.test(text) ||
        // Everything piling up
        /\b(everything is piling up|things keep piling on|it never stops|one thing after another|problems keep coming|i can't catch a break|when will it end|the pressure is building)\b/i.test(text),
      
      // Workplace & Career (current job stress, not job searching)
      isWorkplace: (() => {
        // First check if it's clearly about job searching/unemployment
        const isJobSearching = /\b(need a job|looking for work|job search|job hunting|unemployed|lost my job|got fired|laid off|between jobs|out of work|can't find work|finding work|applying for jobs|job interview|resume|cv)\b/.test(text);
        if (isJobSearching) return false;
        
        // Then check for workplace stress indicators
        return /\b(work stress|workplace stress|boss|colleague|manager|supervisor|office|workplace|work-life balance|work life balance|career pressure|professional stress|job pressure|work environment|toxic workplace|workplace harassment|work conflict|work drama|coworker|workload|overtime|work demands)\b/.test(text);
      })(),
      
      // Relationships
      isRelationship: /\b(relationship|partner|girlfriend|boyfriend|wife|husband|spouse|cheating|cheat|cheating on me|is cheating|cheated|cheated on|family|friend|lonely|isolated|dating|breakup|break up|divorce|marriage|romance|love|dating|single|couple|inappropriate relationship|workplace relationship|office romance|work romance|affair|extramarital|emotional affair|physical affair|crush|attraction|flirting|boundaries|professional boundaries|infidelity|betrayal|unfaithful|faithful|trust|suspicious|suspicion)\b/.test(text),
      
      // Emotional Exhaustion (context-aware: distinguish from physical fatigue)
      // ONLY triggers when "tired"/"exhausted"/"drained" appears with emotional/relationship/work context
      isEmotionallyExhausted: (() => {
        const hasEmotionalContext = /\b(relationship|partner|wife|husband|work|job|financial|money|stress|burden|carrying|dealing with|coping with|handling)\b/i.test(text);
        const hasFatigueWords = /\b(tired|exhausted|drained|weary|burnt out|burned out|running on empty|emotionally spent|mentally exhausted)\b/i.test(text);
        const isNotPhysicalSleep = !/\b(can't sleep|insomnia|can't fall asleep|tossing and turning|waking up|night|bed|sleeping)\b/i.test(text);
        
        return hasEmotionalContext && hasFatigueWords && isNotPhysicalSleep;
      })(),
      
      // Trauma & PTSD
      isTrauma: /\b(trauma|traumatic|ptsd|post-traumatic|flashback|nightmare|triggered|trigger|abuse|violence|assault|accident|disaster|grief|loss|bereavement)\b/.test(text),
      
      // Frustration (NEW - distinct from anger: feeling stuck, blocked, or unable to progress)
      isFrustration: /\b(frustrated|frustration|frustrating|stuck|blocked|can't make progress|nothing is working|hitting a wall|going nowhere|spinning my wheels|at my wit's end|nothing seems to help|trying everything|nothing works|can't get anywhere|feeling stuck|stuck in place|not getting anywhere|can't move forward|going in circles)\b/.test(text) ||
        // Frustration with situations (not anger at people)
        /\b(so frustrated with|frustrated about|frustrated that|frustrated because|frustrated by|this is frustrating|it's frustrating|really frustrating|extremely frustrated|incredibly frustrated|beyond frustrated)\b/i.test(text) ||
        // Frustration without anger intensity
        /\b(feeling frustrated|i'm frustrated|i feel frustrated|getting frustrated|becoming frustrated|growing frustrated|increasingly frustrated|more and more frustrated)\b/i.test(text),
      
      // Anger Management (Enhanced with 500+ phrase guide) - REMOVED "frustrated" from here
      isAnger: /\b(angry|anger|rage|furious|mad|irritated|hostile|aggressive|violent|temper|outburst|lashing out|explosive)\b/.test(text) ||
        // Rage & intense anger
        /\b(filled with rage|so angry i could explode|i'm enraged|seeing red|want to punch something|want to break things|feel violent|about to lose it|ready to snap|could scream)\b/i.test(text) ||
        // Irritability (without frustration - these are more about being annoyed with people/things)
        /\b(everything annoys me|everyone is getting on my nerves|easily annoyed|short-tempered|snap at people|i'm on edge|i'm touchy|i'm cranky|little things set me off|no patience)\b/i.test(text) ||
        // Anger outbursts
        /\b(anger outbursts|lose my temper easily|explode over small things|can't control my temper|go from 0 to 100|flip out|rage out|short fuse|blow up at people|lost my temper)\b/i.test(text) ||
        // Hostility & resentment
        /\b(feel hostile|hate everyone|angry at the world|everyone is against me|want to lash out|i resent everyone|i'm bitter|hold grudges|can't forgive)\b/i.test(text),
      
      // Substance Abuse
      isSubstance: /\b(addiction|addicted|substance abuse|alcohol|drug|drinking|smoking|using|recovery|sober|relapse|dependence|withdrawal|overdose|pills|marijuana|cocaine|heroin)\b/.test(text),
      
      // Loneliness & Isolation (Enhanced with 500+ phrase guide)
      isLoneliness: /\b(lonely|loneliness|isolated|isolation|alone|disconnected|disconnection|social|friendship|community|village|support|peer support|support groups)\b/.test(text) ||
        // Feeling alone
        /\b(so lonely|feel alone|all by myself|nobody is here for me|i have nobody|i feel abandoned|everyone left me|always alone|lonely even in a crowd|surrounded by people but feel alone)\b/i.test(text) ||
        // Disconnection
        /\b(feel disconnected from everyone|don't relate to anyone|nobody understands me|don't fit in anywhere|i'm an outsider|don't belong|i'm invisible|nobody sees me|feel like a ghost)\b/i.test(text) ||
        // No support system
        /\b(no one to talk to|have no support|nobody cares about me|i'm on my own|have to deal with everything alone|nobody checks on me|no one asks how i'm doing|have no friends|have no close relationships)\b/i.test(text) ||
        // Social isolation & withdrawal
        /\b(never leave the house|isolating myself|avoid people|cancel all my plans|don't go out anymore|stay in my room|withdrawn from everyone|cut everyone off|don't want to see anyone|ignore messages)\b/i.test(text) ||
        // No community
        /\b(don't have a community|don't have a tribe|don't have my people|haven't found where i belong|searching for connection|don't have a support network|wish i had a friend group)\b/i.test(text),
      
      // Self-Esteem & Self-Worth (Enhanced)
      isSelfEsteem: /\b(self-esteem|self esteem|self-worth|self worth|self worthiness|confidence|insecure|insecurity|inadequate|inferior|not good enough|self-doubt|self doubt|imposter|impostor|shame|guilt|worthless|unworthy|feeling worthless|i'm worthless|i am worthless)\b/.test(text) ||
        // Imposter syndrome specific
        /\b(feel like a fraud|feel like an imposter|don't deserve|they'll find out|not qualified|faking it|don't belong here|got lucky|anyone could do this)\b/i.test(text) ||
        // Shame & guilt
        /\b(i'm ashamed|feel guilty|i should have|it's my fault|i'm to blame|i did something wrong|i'm a bad person|can't forgive myself)\b/i.test(text),
      
      // Grief & Loss (NEW CATEGORY)
      isGrief: /\b(grief|grieving|mourning|loss|lost someone|someone died|passed away|death|funeral|miss them|miss him|miss her|can't accept|can't believe they're gone|empty without|life without|wish they were here)\b/i.test(text) ||
        /\b(anniversary of|would have been|birthday without|holidays without|first [christmas|thanksgiving|birthday] without)\b/i.test(text),
      
      // Burnout (NEW CATEGORY - distinct from general stress)
      isBurnout: /\b(burnt out|burned out|burnout|compassion fatigue|can't care anymore|emotionally exhausted|nothing left to give|running on fumes|checked out|going through motions at work|hate my job|dread going to work|sunday scaries|counting down|just for paycheck)\b/i.test(text) ||
        /\b(no work life balance|work is my life|always working|never stop working|work on weekends|work at night|can't disconnect|always on call)\b/i.test(text),
      
      // Sleep Issues (NEW CATEGORY)
      isSleep: /\b(can't sleep|insomnia|can't fall asleep|can't stay asleep|wake up at night|wake up at 3am|toss and turn|racing mind at night|too tired to sleep|exhausted but can't sleep|sleep problems|sleeping too much|oversleeping|can't wake up|sleep all day|nightmares|bad dreams|night terrors)\b/i.test(text),
      
      // Financial Stress (Enhanced)
      isFinancial: /\b(financial|money|bills|debt|poor|broke|poverty|wealth|rich|expensive|cheap|budget|spending|saving|investment|retirement|insurance|medical bills|rent|mortgage)\b/.test(text) ||
        // Financial crisis
        /\b(can't pay|behind on|late payment|overdue|collections|bankruptcy|foreclosure|eviction|repo|repossession|garnishment|can't afford|living paycheck to paycheck|drowning in debt)\b/i.test(text) ||
        // Money anxiety
        /\b(worried about money|stressed about money|money problems|financial problems|money is tight|financially struggling|can't make ends meet|barely surviving)\b/i.test(text),
      
      // Body Image & Eating (NEW CATEGORY)
      isBodyImage: /\b(body image|hate my body|fat|ugly|disgusting|too skinny|too big|not attractive|unattractive|overweight|underweight|weight|pounds|lose weight|gain weight|diet|dieting|eating disorder|anorexia|bulimia|binge|purge|restrict|food obsessed|calorie counting|body dysmorphia)\b/i.test(text) ||
        /\b(don't want to eat|can't stop eating|eat my feelings|emotional eating|food is control|skip meals|starve myself|make myself throw up)\b/i.test(text),
      
      // Perfectionism (NEW CATEGORY)
      isPerfectionism: /\b(perfectionist|perfectionism|never good enough|has to be perfect|can't make mistakes|fear of failure|afraid to fail|afraid of messing up|can't accept mistakes|everything has to be right|obsess over details|redo everything|never satisfied)\b/i.test(text) ||
        /\b(high standards|impossible standards|too hard on myself|can't let it go|nitpick|hypercritical|self-critical|beat myself up)\b/i.test(text),
      
      // PTSD & Trauma (Enhanced)
      isPTSD: /\b(ptsd|post-traumatic|flashback|flashbacks|triggered|trigger warning|triggering|reliving|nightmares about|can't forget|haunted by|intrusive thoughts|hypervigilant|always on alert|can't feel safe|don't feel safe|startled easily|jumpy)\b/i.test(text) ||
        /\b(trauma|traumatic|traumatized|sexual assault|raped|rape|molested|abused|abuse victim|domestic violence|combat|war|accident|attacked|mugged|witnessed)\b/i.test(text),
      
      // Identity & Cultural Issues
      isIdentity: /\b(identity|who am i|myself|authentic|authenticity|real me|true self|masculinity|masculine|manhood|man|being a man|stereotype|stereotypes|be strong|don't cry|tough|weak|vulnerability|vulnerable)\b/.test(text),
      
      // Sexuality & Sexual Health
      isSexuality: /\b(gay|lesbian|bisexual|straight|sexuality|sexual|sex|porn|pornography|down low|dl|closet|coming out|lgbtq|queer|transgender|trans|sexual health|intimacy|desire|libido|cheating|infidelity)\b/.test(text),
      
      // Fatherhood & Family
      isFatherhood: /\b(father|fatherhood|dad|daddy|parent|parenting|child|children|son|daughter|family|pregnant|pregnancy|baby|newborn|custody|visitation|child support|new dad|new father|just had a baby|newborn|infant|toddler|parenting|overwhelmed dad|overwhelmed father)\b/.test(text),
      
      // Physical & Mental Health (Enhanced)
      isHealth: /\b(health|healthy|sick|illness|disease|medical|doctor|hospital|medication|meds|therapy|counseling|psychologist|psychiatrist|coaching|treatment|healing|recovery|body image|physical|fitness|exercise|nutrition|diet|sleep|insomnia|tired|fatigue|energy)\b/.test(text) ||
        // Chronic illness
        /\b(chronic pain|chronic illness|chronic condition|chronic fatigue|disabled|disability|diagnosis|diagnosed with|living with|managing|flare up|symptoms|side effects)\b/i.test(text) ||
        // Medication concerns
        /\b(medication not working|meds don't work|side effects|medication side effects|went off meds|stopped taking|can't afford medication|need medication|medication adjustment)\b/i.test(text),
      
      // Existential Crisis (NEW CATEGORY)
      isExistential: /\b(existential|meaning of life|what's the point|why am i here|what's my purpose|life has no meaning|nothing matters|existential crisis|existential dread|what am i doing with my life|is this all there is|midlife crisis)\b/i.test(text) ||
        /\b(wasted my life|time is running out|getting older|aging|mortality|death anxiety|afraid of dying|what happens when|legacy|what will i leave behind)\b/i.test(text),
      
      // Procrastination & Avoidance (NEW CATEGORY)
      isProcrastination: /\b(procrastinating|procrastination|putting off|avoiding|avoidance|can't start|don't want to start|paralyzed|stuck|can't make myself|keep delaying|deadline|running out of time|last minute|always late)\b/i.test(text) ||
        /\b(analysis paralysis|overthinking instead of doing|perfectionism paralysis|fear of starting|don't know where to start|too overwhelming to start)\b/i.test(text),
      
      // Boundary Issues (NEW CATEGORY)  
      isBoundaries: /\b(boundaries|boundary|can't say no|people pleaser|people pleasing|always say yes|put everyone first|neglect myself|doormat|taken advantage|used|manipulated|guilt trip|guilt tripped|obligation|feel obligated|have to)\b/i.test(text) ||
        /\b(codependent|codependency|enmeshed|overly involved|no personal space|invade my space|disrespect my|don't respect my)\b/i.test(text),
      
      // Masculinity & Stigma
      isMasculinity: /\b(masculinity|masculine|manhood|being a man|man up|be strong|don't cry|tough|weak|vulnerability|vulnerable|stigma|stigmatized|shame|ashamed|embarrassed|judged|judgment|safe space|confidentiality|confidential|privacy|bullying|bullied|harassment|discrimination|microaggression|microaggressions|racism|racial|discrimination|bias|prejudice|stereotypes|stereotyping)\b/.test(text),
      
      // Self-Care & Wellness
      isSelfCare: /\b(self-care|self care|selfcare|mindfulness|meditation|journaling|gratitude|hobbies|hobby|exercise|fitness|nutrition|sleep|rest|relaxation|vacation|time off|personal growth|growth|development|learning|education|reading|books|music|art|creative|spiritual|prayer|faith|religion|church|temple|mosque)\b/.test(text),
      
      // Paranoia & Suspicion
      isParanoia: /\b(paranoid|paranoia|suspicious|suspicion|they're watching|watching me|following me|plotting|conspiracy|everyone's against me|out to get me|trying to hurt me|deceiving me|lying to me|manipulating|gaslighting|can't trust|don't trust|betraying|backstabbing|talking behind my back|gossiping|judging me|staring at me|whispering|laughing at me|making fun|mocking|ridiculing|conspiring|scheming|planning against|out to destroy|trying to ruin|sabotaging|undermining|working against|hostile|threatening|dangerous|unsafe|not safe|scared of people|afraid of everyone|fear people|distrust|mistrust|skeptical|cynical|pessimistic|negative thoughts|irrational thoughts|unrealistic fears)\b/.test(text),
      
      // Digital Communication & Acronyms
      isDigitalCommunication: /\b(idk|idc|smh|tfw|tbh|imho|imo|fml|wtf|brb|nm|nvm|gg|ily|ilu|lmk|tyt|hbd|gg ez|yolo|fomo|npc|op|afk|lol|lmao|rofl|omg)\b/.test(text),
      
      // Urban Slang & Cultural Communication
      isUrbanSlang: /\b(bet|cap|no cap|deadass|bruh|bro|fam|lit|lowkey|highkey|sus|flex|drip|w|win|l|loss|vibe|vibing|mood|salty|ghost|ghosting|shade|throwing shade|tea|spill the tea|extra|bop|goat|clout|squad)\b/.test(text),
      
      // Basic Communication Patterns
      isGreeting: /\b(hi|hello|hey|good morning|good afternoon|good evening|sup|what's up|wassup)\b/.test(text),
      isFarewell: /\b(bye|goodbye|see you|later|gotta go|talk later|catch you later|peace out|take care)\b/.test(text),
      isGratitude: /\b(thanks|thank you|appreciate it|much appreciated|grateful|bless you)\b/.test(text),
      isPositiveEmotion: /\b(happy|excited|joy|love|amazing|awesome|great|fantastic|wonderful|thrilled|ecstatic|blissful|content|satisfied|proud|accomplished)\b/.test(text),
      isFatigue: /\b(tired|burnt out|burned out|exhausted|drained|worn out|spent|fatigued|sleepy|drowsy|lethargic)\b/.test(text),
      isHelpRequest: /\b(help|support|assistance|advice|guidance|what should i do|what do i do|how do i|can you help|need help)\b/.test(text),
      isPracticalAdvice: /\b(practical advice|practical help|practical support|action steps|what to do|how to handle|strategies|solutions|guidance)\b/.test(text),
      isEmotionalSupport: /\b(emotional support|emotional help|just listen|vent|talk|feelings|support me|be there)\b/.test(text),
      isInformation: /\b(info|information|facts|details|explain|tell me|teach me|learn|knowledge)\b/.test(text),
      isInformationRequest: /\b(info|details|explain|meaning|what does|what is|tell me about|define|clarify|elaborate)\b/.test(text),
      isAffirmation: /\b(yes|yep|yeah|okay|ok|sure|absolutely|definitely|of course|sounds good|let's do it)\b/.test(text),
      isNegation: /\b(no|nope|not really|nah|not interested|don't want|can't|won't|refuse|decline)\b/.test(text),
      isUncertainty: /\b(maybe|unsure|idk|i don't know|not sure|perhaps|possibly|might|could be|uncertain|confused|confusing)\b/.test(text),
      isActionRequest: /\b(start|begin|go|try|let's do|let's go|let's try|can we|should we|ready to|let's start)\b/.test(text),
      isEndAction: /\b(stop|quit|cancel|exit|end|done|finished|enough|no more|that's enough)\b/.test(text),
      isTimeReference: /\b(today|tomorrow|later|now|this week|next week|soon|eventually|sometime|when|schedule|calendar|date|reminder)\b/.test(text),
      
      // Tech Issue (context-aware - only if tech context AND not employment)
      isTechIssue: (isTechRelated && !isEmploymentIssue && !isTherapyApproach) || (
        // Explicit tech terms (always tech)
        /\b(error|bug|glitch|crash|freeze|frozen|technical issue|system error|login error|login issue|login problem)\b/i.test(text) ||
        // Tech object + malfunction
        /\b(app|site|website|page|button|feature|link)\s+(is\s+)?(broken|won't\s+load|not\s+loading|can't\s+load)\b/i.test(text) ||
        // Access issues (clearly tech)
        /\b(can't|cannot|unable to)\s+(access|log\s+in|sign\s+in|load|open|use|see|click)\b/i.test(text)
      ) && !isEmploymentIssue && !isTherapyApproach, // Never override employment or therapy detection
      
      // Treatment/Therapy Not Working (important mental health concern)
      isTreatmentNotWorking: isTherapyApproach || /\b(therapy|therapist|medication|meds|treatment|counseling|antidepressant|ssri)\b.{0,30}\b(not working|isn't working|not helping|doesn't help|ineffective|not effective|making it worse)\b/i.test(text),
      
      isHumor: /\b(lol|lmao|rofl|haha|hehe|funny|hilarious|comedy|joke|laughing|😂|😄|😆)\b/.test(text),
      isShock: /\b(wtf|omg|oh my god|wow|seriously|no way|unbelievable|shocking|surprising|can't believe)\b/.test(text),
      
      // World Concerns & Current Events
      isWorldConcerns: /\b(state of the world|world is|current events|politics|political|news|everything going on|what's happening|society|social issues|climate|environment|economy|inflation|war|conflict|violence|injustice|inequality|racism|discrimination|system|government|leaders|future|hopeless|overwhelmed by|can't keep up|too much|everything is|world feels|reality|times we live in)\b/.test(text),
      
      // Conversation Ending Phrases
      isConversationEnding: /\b(thanks|thank you|appreciate it|that helps|that helped|feel better|feeling better|good talk|good chat|gotta go|got to go|have to go|need to go|talk later|catch you later|see you|bye|goodbye|peace|take care|ttyl|later|thx|ty|alright|okay then|ok then|sounds good|i'm good|i'm okay now|that's all|that's it|nothing else|i'm done|we're done|all set|this helps|this helped|makes sense|got it|understood)\b/.test(text),
      
      // General Emotional States
      isGeneralEmotional: /(feeling|feel|emotion|emotional|mood|state|okay|ok|fine|good|bad|weird|strange|off|different|not myself|not right|something's wrong|something is wrong|can't put my finger on it|hard to explain|hard to describe|don't understand|confused about|unsure about|mixed feelings|conflicted|torn|stuck|trapped|frustrated|annoyed|bothered|concerned|worried|uneasy|uncomfortable|restless|agitated|irritated|overwhelmed|underwhelmed|numb|detached|disconnected|lost|directionless|purposeless|unmotivated|uninspired|bored|stir crazy|cabin fever|cooped up|stuck in a rut|going through the motions|autopilot|zombie|robot|mechanical|routine|mundane|monotonous|repetitive|predictable|boring|dull|lifeless|spiritless|listless|apathetic|indifferent|blah|meh|just ok|just okay|don't know why|can't explain|can't explain it|empty feeling|feeling empty|hollow|void|missing something|something missing|incomplete|unfulfilled|flat)/.test(text),
      
      // Self-Doubt / Role Struggle - "can't be a good father", "can't handle this relationship" 
      // CHECK BEFORE TASK FRUSTRATION (more specific)
      isSelfDoubt: /\b(can't|cannot)\s+(be|handle|manage|do)\s+(a\s+)?(good|better|enough)\b/i.test(text) ||
        /\b(can't|cannot)\s+(be|handle|do)\s+(this|a|my|the)\s+(job|relationship|marriage|father|dad|parent|partner|husband|wife|friend)\b/i.test(text),
      
      // Task Frustration - "can't figure this out", "can't do this task"
      // Checked AFTER self-doubt to avoid catching "can't do this job"
      isTaskFrustration: /\b(can't|cannot|unable\s+to)\s+(do|figure|solve|complete|finish|get|make|understand)\s+(this|that|it|the)\s+(task|assignment|problem|thing|work|project)\b/i.test(text) &&
        // But NOT if it's a crisis phrase or role struggle
        !/\b(anymore|any\s+more|go\s+on|take\s+it|live|keep\s+going|job|relationship|father|parent)\b/i.test(text),
      
      // ===== NEW IDENTITY & SELF-ESTEEM CATEGORIES =====
      
      // Imposter Syndrome
      isImposterSyndrome: /\b(imposter syndrome|impostor syndrome|feel like a fraud|feel like an imposter|don't belong here|don't deserve|they'll find out|not qualified|faking it|got lucky|anyone could do this|waiting to be exposed|tricked them|fooled them|not as smart as they think|my success is just luck)\b/i.test(text),
      
      // Shame
      isShame: /\b(ashamed|shame|shameful|embarrassed|mortified|humiliated|disgusted with myself|carry shame|embarrassed by who i am|embarrassed by where i come from|hide parts of myself|ashamed of my background|ashamed of my family|ashamed of my past|ashamed of my body|ashamed of my sexuality)\b/i.test(text),
      
      // Guilt
      isGuilt: /\b(guilty|guilt|feel guilty all the time|feel guilty for everything|guilt is eating me|apologize for existing|can't forgive myself|i hurt someone|i made a mistake i can't take back|i should have done better|i let people down)\b/i.test(text),
      
      // Inadequacy
      isInadequacy: /\b(inadequate|not enough|don't measure up|fall short|deficient|something wrong with me|broken|flawed|damaged|everyone else has it together|everyone is better than me|behind everyone else|not where i should be|everyone is ahead of me)\b/i.test(text),
      
      // ===== NEW CULTURAL & RACIAL IDENTITY CATEGORIES =====
      
      // Racial Identity
      isRacialIdentity: /\b(racial identity|struggling with my racial identity|don't know where i fit racially|mixed|too black for white people|too white for black people|don't feel black enough|disconnected from my racial community|don't know my culture)\b/i.test(text),
      
      // Code-Switching
      isCodeSwitching: /\b(code-switch|code switch|change how i talk|have to be two different people|can't be myself at work|tone down my blackness|modify myself for white people|exhausted from code-switching)\b/i.test(text),
      
      // Cultural Navigation
      isCulturalNavigation: /\b(stuck between two cultures|don't fit in either culture|not \w+ enough for my family|too \w+ for white america|bridge between cultures|don't fully belong anywhere|caught between my parents' culture|first-generation|translate for my parents|immigration trauma|immigrant trying to fit in)\b/i.test(text),
      
      // Authenticity
      isAuthenticity: /\b(don't know how to be myself|hide who i really am|wear a mask|pretend to be someone i'm not|afraid to be authentic|people don't know the real me|living a lie|not being true to myself|afraid of being judged for who i am|rejected if i'm authentic)\b/i.test(text),
      
      // Identity Crisis
      isIdentityCrisis: /\b(who am i|don't know who i am|lost myself|don't recognize myself|identity crisis|don't know my purpose|what's my identity|searching for myself|don't know who i am without|redefining myself|figuring out who i want to be|becoming someone new)\b/i.test(text),
      
      // ===== NEW MASCULINITY CATEGORIES (Enhanced) =====
      
      // Toxic Masculinity
      isToxicMasculinity: /\b(toxic masculinity|raised with toxic masculinity|unhealthy ideas about being a man|men don't cry|told to man up|showing emotion was weakness|suppress my feelings|men should be tough|vulnerability wasn't allowed|unlearning toxic masculinity|trying to be a better man|working on healthy masculinity|breaking the cycle|redefine what being a man means|toxic masculinity hurt me)\b/i.test(text),
      
      // Vulnerability
      isVulnerability: /\b(can't be vulnerable|afraid to open up|vulnerability feels like weakness|taught not to show weakness|don't know how to be vulnerable|being vulnerable terrifies me|can't let my guard down|keep my feelings inside|want to be more vulnerable|want to open up but don't know how|trying to be vulnerable|learning to share my feelings|can't be vulnerable with my partner)\b/i.test(text),
      
      // Emotional Suppression
      isEmotionalSuppression: /\b(don't express my emotions|bottle everything up|hold my feelings in|never taught to express emotions|don't know how to talk about my feelings|numb my emotions|push my feelings down|only emotion i'm allowed is anger|turn everything into anger|anger is the only acceptable emotion|don't know how to express sadness|my anger is covering other emotions|learning to express my emotions|trying to talk about my feelings)\b/i.test(text),
      
      // Mental Health Stigma (Men)
      isMentalHealthStigma: /\b(men aren't supposed to go to therapy|seeking help isn't manly|embarrassed to see a therapist|people will think i'm weak if i get help|real men handle their problems alone|ashamed to need mental health support|breaking stigma|seeking help is strength|taking care of my mental health|more men need to normalize therapy)\b/i.test(text),
      
      // ===== NEW SEXUALITY & LGBTQ+ CATEGORIES =====
      
      // LGBTQ+ Issues
      isLGBTQ: /\b(gay|lesbian|bisexual|lgbtq|queer|questioning my sexuality|attracted to men|might be gay|don't know what my sexuality is|confused about my attraction|might not be straight|same-sex|openly gay|out and proud|living authentically as a gay man|navigating the gay community)\b/i.test(text),
      
      // Coming Out
      isComingOut: /\b(coming out|come out|thinking about coming out|want to come out|scared to come out|how do i tell people i'm gay|safe to come out|my family won't accept me|i'll lose people if i come out|came out and it went badly|came out and it went well)\b/i.test(text),
      
      // Down Low / Hidden Sexuality
      isDownLow: /\b(down low|dl|on the dl|have sex with men but i'm not gay|nobody knows about this part of my life|hiding my same-sex encounters|in the closet|secret life|ashamed of my attractions|live a double life|hiding who i really am|can't let anyone know|terrified of being found out|lying to my partner|cheating with men|secret is destroying my relationship|tired of hiding|want to be honest about who i am|want to stop living on the dl|ready to be authentic)\b/i.test(text),
      
      // Sexual Health
      isSexualHealth: /\b(sexual health|sti|std|worried about stis|think i might have an sti|afraid to get tested|need to get tested|worried about my sexual health|had unprotected sex|might have been exposed|safe sex|where do i get tested|how do i protect myself|need to know my status)\b/i.test(text),
      
      // HIV
      isHIV: /\b(hiv positive|hiv|living with hiv|found out i'm hiv positive|prep|pre-exposure prophylaxis|pep|post-exposure prophylaxis|undetectable|managing my hiv|hiv status|antiretroviral)\b/i.test(text),
      
      // Sexual Trauma
      isSexualTrauma: /\b(sexually assaulted|sexually abused|sexual trauma|raped|rape survivor|someone violated me sexually|sex triggers me|can't enjoy sex after what happened|afraid of sex|sexual intimacy is difficult after trauma|dissociate during sex)\b/i.test(text),
      
      // Intimacy Issues
      isIntimacyIssues: /\b(struggle with intimacy|can't be intimate|afraid of intimacy|intimacy issues|keep people at a distance sexually|emotionally unavailable during sex|erectile dysfunction|performance anxiety|can't perform sexually|sexual problems|struggling with my libido|no sex drive|not interested in sex|low libido|sex drive is gone|don't want to have sex|not attracted to my partner|partner wants sex more than i do|different sex drives|feel pressured to have sex|mismatched desire)\b/i.test(text),
      
      // ===== NEW FATHERHOOD CATEGORIES (Enhanced) =====
      
      // Parenting Stress
      isParentingStress: /\b(parenting is overwhelming|stressed about being a dad|don't know what i'm doing as a parent|parenting is harder than i thought|exhausted from parenting|not patient enough with my kids|yell at my kids|failing as a father|miss my kids' lives because of work|never home|work too much to be a good dad|missing milestones|feel guilty for not being around)\b/i.test(text),
      
      // New Dad
      isNewDad: /\b(just became a dad|new father|new dad|having a baby changed everything|not prepared for this|don't know how to be a dad|terrified i'll mess up my kid|overwhelmed dad|overwhelmed father|just had a baby|newborn|infant)\b/i.test(text),
      
      // Postpartum Dad
      isPostpartumDad: /\b(postpartum depression|struggling after the baby was born|disconnected from my baby|don't feel bonded with my child|resentful of the baby|not happy like i thought i'd be|relationship changed after the baby|partner only focuses on the baby|don't have intimacy anymore|feel left out|don't know my role)\b/i.test(text),
      
      // Custody
      isCustody: /\b(fighting for custody|custody battle|custody issues|ex won't let me see my kids|want more time with my children|only get weekends|not being treated fairly in custody|can't see my kids|being kept from my children|ex is using the kids against me|being alienated from my kids|losing my children|can't afford child support|child support is crushing me|behind on child support|want to support my kids but can't afford it)\b/i.test(text),
      
      // Absent Father
      isAbsentFather: /\b(wasn't there for my kids|absent father|missed my kids growing up|want to reconnect with my children|trying to make up for lost time|regrets about not being present|my dad wasn't around|grew up without a father|dad abandoned us|don't have a relationship with my father|dealing with father wounds|breaking the cycle my dad started)\b/i.test(text),
      
      // Co-Parenting
      isCoParenting: /\b(co-parenting|co-parent|ex and i can't communicate|different parenting styles|co-parenting is contentious|fight about the kids constantly|blended families|step-parent|step-parenting|step-kids don't accept me|don't know my role as a step-parent|blending families is difficult|tension with my step-children)\b/i.test(text),
      
      // ===== NEW HEALTH CATEGORIES (Enhanced) =====
      
      // Chronic Illness
      isChronicIllness: /\b(chronic illness|chronic condition|chronic pain|chronic fatigue|dealing with \w+ illness|sick all the time|health is deteriorating|living with chronic pain|my illness affects everything|diagnosed with|living with|managing|flare up|symptoms|disability|disabled)\b/i.test(text),
      
      // Medication (Enhanced)
      isMedication: /\b(medication|meds|pills|prescription|on medication for|medication isn't working|having side effects|can't afford my medication|hate taking medication|feel like a zombie on meds|ashamed to be on medication|taking medication makes me feel weak|embarrassed about my prescriptions|people judge me for being medicated|stopped taking my medication|don't want to take pills|not following my treatment plan|skip doses)\b/i.test(text),
      
      // Therapy Seeking
      isTherapySeeking: /\b(thinking about therapy|want to see a therapist|need therapy|nervous about starting therapy|don't know how to find a therapist|looking for a black therapist|looking for a therapist|in therapy|go to counseling|see a therapist|therapy is helping|working through things in therapy)\b/i.test(text),
      
      // Therapy Stigma
      isTherapyStigma: /\b(embarrassed to go to therapy|people will think i'm crazy|don't want anyone to know i'm in therapy|black men don't go to therapy|therapy is for weak people|therapy is hard|don't trust my therapist|therapist doesn't get me|can't find a therapist who understands my culture|can't afford therapy|therapy isn't working)\b/i.test(text),
      
      // ===== NEW SYSTEMIC DISCRIMINATION CATEGORIES =====
      
      // Racism
      isRacism: /\b(racism|racist|experience racism|face racism daily|discriminated against because i'm black|people are racist toward me|deal with racism constantly|racism affects every part of my life|tired of racism|someone called me the n-word|n word|racial slur|racially profiled|followed in a store|police stopped me for no reason|denied \w+ because i'm black|experienced blatant racism)\b/i.test(text),
      
      // Microaggressions
      isMicroaggressions: /\b(microaggression|microaggressions|people clutch their bags around me|people cross the street when they see me|treated like a threat|white women are afraid of me|get followed in stores|security always watches me|implicit bias|unconscious bias|people make assumptions about me|prejudged|people see me as dangerous|experience microaggressions at work)\b/i.test(text),
      
      // Discrimination (General)
      isDiscrimination: /\b(discrimination|discriminated|discriminate|prejudice|bias|biased|unfair treatment|treated differently|treated unfairly|denied opportunities|held back|passed over|overlooked|excluded|left out|marginalized|oppressed)\b/i.test(text),
      
      // Workplace Discrimination
      isWorkplaceDiscrimination: /\b(can't get hired|qualified but overlooked|hired a less qualified white person|didn't get the job because i'm black|my resume gets ignored|have to hide my race|keep getting passed over for promotion|white people with less experience get promoted|held back because of my race|glass ceiling for black people|treated differently at work|my ideas are dismissed|excluded from opportunities|not invited to important meetings|left out of social events|isolated at work|only black person|only person of color|represent my entire race|tokenized|diversity hire|carry the burden of being the only one)\b/i.test(text),
      
      // Stereotypes
      isStereotypes: /\b(stereotype|stereotyped|people stereotype me|seen as aggressive|seen as threatening|people think i'm uneducated|assumed to be|don't fit their stereotype|don't fit the black man stereotype|educated and it surprises people|speak well and people are shocked|breaking stereotypes|refuse to be put in a box)\b/i.test(text),
      
      // Racial Profiling
      isRacialProfiling: /\b(racial profiling|profiled|profiling|stopped by police|pulled over|harassed by police|afraid of police|afraid of cops|could be killed by police|black people are targeted|arrested for something a white person would get a warning for)\b/i.test(text),
      
      // Community Trauma
      isCommunityTrauma: /\b(community is traumatized|generational trauma|collective trauma|police violence affects my community|constantly grieving|another black person was killed|numb from all the trauma|racial trauma|always on guard|have to monitor my behavior|can't relax in public|fear for my safety|hypervigilant because i'm black|had to give my son the talk|teaching my kids how to survive|teaching my kids to protect themselves from racism|worry about my son being seen as a threat)\b/i.test(text),
      
      // Systemic Oppression
      isSystemicOppression: /\b(systemic racism|structural racism|system is designed against us|systemic oppression|face barriers because of systemic oppression|institutions are racist|deck is stacked against black people|structural disadvantages|slavery's effects|centuries of oppression|legacy of racism|generational poverty|redlining|justice system is racist|criminal justice|mass incarceration)\b/i.test(text),
      
      // Cultural Taxation
      isCulturalTaxation: /\b(cultural expert at work|asked to speak for all black people|have to educate white people|expected to explain racism|diversity committee by default|carry extra emotional labor|exhausted from being black in white spaces|tired of explaining racism|burnt out from cultural taxation|exhausting being the only one)\b/i.test(text),
      
      // ===== NEW CULTURAL COMPETENCY CATEGORIES - BLACK MEN =====
      
      // Medical Mistrust (Tuskegee Legacy)
      isMedicalMistrust: /\b(don't trust doctors|medical system has hurt black people|afraid of being experimented on|they don't care about black health|doctors have historically harmed us|remember tuskegee|medical racism|doctors don't take my pain seriously|they think i'm drug-seeking|black people's pain is dismissed|undertreated for pain|don't believe me when i say i'm in pain|medical bias)\b/i.test(text),
      
      // Strong Black Man Myth
      isStrongBlackMan: /\b(black men have to be strong|we can't show weakness|community depends on me to be strong|have to be strong for my family|black men carry the weight|don't have the luxury of breaking down|have to be twice as strong|can't afford to be weak|strength is survival|no room for vulnerability|expected to be unbreakable)\b/i.test(text),
      
      // Church & Spirituality
      isChurchSpirituality: /\b(go to church for my mental health|prayer is my therapy|my pastor helps me|church is my support system|god will handle it|just need more faith|my church says therapy means i don't trust god|prayer should be enough|mental health struggles mean weak faith|church doesn't support therapy|choosing between church and therapy|can i do therapy and still have faith|faith-based therapy|christian counseling|therapy doesn't replace god)\b/i.test(text),
      
      // Community Responsibility
      isCommunityResponsibility: /\b(represent all black men|can't let my community down|black people are depending on me|have to succeed for everyone who couldn't|my failure reflects on the race|carrying my ancestors' dreams|can't show struggle|have to be exceptional|racial uplift burden)\b/i.test(text),
      
      // Police & Safety Anxiety
      isPoliceAnxiety: /\b(always afraid of police|could be killed for no reason|worry every time i leave the house|driving while black|have to be hyperaware|had to give my son the talk|teaching my kids how to survive police|children can't have carefree childhood|preparing my kids for racism|every time a black person is killed|can't watch the news anymore|traumatized by videos of police violence|it could have been me|it could be my son)\b/i.test(text),
      
      // Black Excellence Pressure
      isBlackExcellence: /\b(have to be twice as good to get half as much|there's no room for error|mediocrity isn't an option|can't just be average|excellence is survival|have to prove them wrong|can't make mistakes|held to a higher standard|have to be perfect)\b/i.test(text),
      
      // ===== NEW CULTURAL COMPETENCY CATEGORIES - LATINO/HISPANIC =====
      
      // Familismo
      isFamilismo: /\b(mi familia es todo|my family is everything|have to put family first|my needs come after my family|can't disappoint my family|family honor|what will the familia think|individual therapy feels selfish|should sacrifice for my family|my problems burden the family|handle things within the family)\b/i.test(text),
      
      // Machismo
      isMachismo: /\b(los hombres no lloran|men don't cry|have to be the man of the house|showing emotion isn't masculine|i'm the provider|machismo was how i was raised|unlearning machismo|want to be a different kind of man|traditional masculinity hurts|redefining what it means to be latino and masculine)\b/i.test(text),
      
      // Immigration Stress
      isImmigrationStress: /\b(left everything to come here|here for a better life but struggling|left my family behind|sending money home|american dream isn't what i expected|first generation|carry my family's hopes|navigating two cultures|my parents sacrificed everything|feel guilty for struggling when they gave up so much)\b/i.test(text),
      
      // Undocumented Status
      isUndocumented: /\b(i'm undocumented|afraid of deportation|can't access healthcare|live in fear of ice|my status prevents me from getting help|afraid to report crimes|documentation status|daca|tps|papers|sin papeles)\b/i.test(text),
      
      // Language Barrier
      isLanguageBarrier: /\b(my english isn't good|need services in spanish|can't explain myself in english|language barrier prevents|need a spanish-speaking therapist|i translate for my family|bridge between cultures|code-switch between spanish and english|lose part of myself in translation|prefer spanish|hablo español|no hablo ingles bien)\b/i.test(text),
      
      // Respeto (Respect/Shame)
      isRespeto: /\b(can't disagree with my parents|respect for elders is paramount|can't question authority|family hierarchy|i bring shame to my family|embarrassed in front of the community|qué dirá la gente|what will people say|can't let people know i'm struggling|vergüenza|respeto)\b/i.test(text),
      
      // ===== NEW CULTURAL COMPETENCY CATEGORIES - ASIAN AMERICAN =====
      
      // Model Minority Myth
      isModelMinority: /\b(expected to be perfect|asians are supposed to be successful|failing the model minority myth|can't show struggle|have to be good at math|my parents expect straight a's|asian mental health is ignored|people don't believe asians struggle|successful minority so we don't get help|our pain is invisible|model minority)\b/i.test(text),
      
      // Filial Piety
      isFilialPiety: /\b(owe everything to my parents|have to repay my parents' sacrifices|can't choose my own path|parents' approval matters more than my happiness|expected to care for my aging parents|have to be a doctor|my parents chose my career|can't pursue my passion|in a career i hate to please my family|filial piety|obligation to parents)\b/i.test(text),
      
      // Face/Honor
      isFaceHonor: /\b(can't bring shame to my family|don't air our problems publicly|mental health is shameful|have to maintain face|family reputation is everything|my failure reflects on my whole family|i'm an embarrassment|saving face|lose face|honor)\b/i.test(text),
      
      // Asian Racism
      isAsianRacism: /\b(experienced more racism since covid|people blame me for the virus|afraid to go out|been called racial slurs|anti-asian hate|covid racism|coronavirus racism|china virus|asian hate crimes)\b/i.test(text),
      
      // Perpetual Foreigner
      isPerpetualForeigner: /\b(people ask where i'm really from|treated like i don't belong|i'm american but seen as foreign|people assume i wasn't born here|people compliment my english|surprised i don't have an accent|where are you from originally|no where are you really from|perpetual foreigner)\b/i.test(text),
      
      // Asian Mental Health Stigma
      isAsianMentalHealthStigma: /\b(mental health isn't discussed in asian families|my family doesn't believe in therapy|depression is seen as weakness|expected to just work harder|mental illness brings shame|asian families don't talk about feelings|therapy is taboo)\b/i.test(text),
      
      // ===== NEW CULTURAL COMPETENCY CATEGORIES - INDIGENOUS =====
      
      // Historical Trauma
      isHistoricalTrauma: /\b(carry my ancestors' pain|genocide affects my generation|boarding schools traumatized my family|cultural genocide impacts me|historical trauma runs through my bloodline|my language was stolen|my culture was erased|disconnected from my heritage|don't know my tribal traditions|colonization took our identity|intergenerational trauma)\b/i.test(text),
      
      // Land Displacement
      isLandDisplacement: /\b(displaced from my ancestral land|don't live on my reservation|separated from my community|urban native|disconnected from the land|the land is sacred|need connection to nature|spiritual connection to land)\b/i.test(text),
      
      // Tribal Identity
      isTribalIdentity: /\b(don't know my tribe|enrolled but not connected|not native enough|blood quantum|fighting for tribal recognition|urban vs reservation|grew up off the rez|don't fit in on the reservation|between two worlds|tribal enrollment|native identity)\b/i.test(text),
      
      // Traditional Healing
      isTraditionalHealing: /\b(want traditional healing and therapy|western medicine isn't enough|need ceremony|need a medicine person|combine therapy with traditional practices|need smudging|need sweat lodge|need connection to elders|traditional practices heal me|indigenous healing|native healing practices)\b/i.test(text),
      
      // ===== NEW CULTURAL COMPETENCY CATEGORIES - IMMIGRANT =====
      
      // Acculturation Stress
      isAcculturationStress: /\b(caught between two cultures|don't fully belong anywhere|lost my identity|not enough for either culture|othered in both places|culture clash|cultural adjustment|adapting to new culture|losing my culture|bicultural stress)\b/i.test(text),
      
      // Documentation Status
      isDocumentationStatus: /\b(documentation status|immigration status|visa|green card|citizenship|naturalization|asylum|work permit|travel document|immigration papers)\b/i.test(text),
      
      // Family Separation
      isFamilySeparation: /\b(my family is in another country|left my children behind|can't see my aging parents|missing my kids growing up|send money but i'm absent|feel guilty for leaving|abandoned my family|here while they suffer there|should have stayed|transnational family)\b/i.test(text),
      
      // Refugee Trauma
      isRefugeeTrauma: /\b(fled war|escaped violence|survived persecution|refugee trauma|witnessed atrocities|adjusting to a new country|don't understand the system here|everything is foreign|isolated in a new place|resettlement stress|asylum seeker|displaced)\b/i.test(text),
      
      // Loss of Professional Status
      isLossOfStatus: /\b(was a professional in my country|my credentials don't transfer|starting over from nothing|overqualified but underemployed|lost my career when i immigrated|can't practice my profession here|degree isn't recognized|brain waste)\b/i.test(text),
      
      // ===== NEW CULTURAL COMPETENCY CATEGORIES - FAITH/RELIGION =====
      
      // Faith-Based Healing
      isFaithBasedHealing: /\b(pray instead of therapy|god is my therapist|faith is my healing|turn to scripture|church is my support|can i do therapy and keep my faith|want a christian therapist|faith-based counseling|therapy that honors my spirituality|prayer and therapy)\b/i.test(text),
      
      // Religious Conflict
      isReligiousConflict: /\b(my church says depression is lack of faith|mental illness is seen as demonic|told to pray harder|my pastor says therapy is worldly|faith communities stigmatize mental health|church doesn't support mental health care|religion vs therapy|faith vs psychology)\b/i.test(text),
      
      // Faith + LGBTQ+ Conflict
      isFaithLGBTQConflict: /\b(my church rejects my sexuality|i'm gay and christian|choosing between faith and authenticity|religious trauma from being lgbtq|told i'm going to hell|church says being gay is a sin|can i be gay and religious|faith community won't accept me)\b/i.test(text),
      
      // Islamic Considerations
      isIslamicConsiderations: /\b(need a muslim therapist|mental health and islam|halal therapy|my imam doesn't support therapy|mental health stigma in muslim community|islamic counseling|culturally sensitive to islam)\b/i.test(text),
      
      // ===== NEW INTERSECTIONALITY CATEGORIES =====
      
      // Race + Sexuality
      isRaceAndSexuality: /\b(face racism in the gay community|face homophobia in the black community|marginalized twice|white gay men are racist|not accepted in either community|experience both racism and homophobia|gay spaces are racist|fetishized as a black gay man|excluded from gay spaces|white gay privilege|black community is homophobic|culture doesn't accept me being gay|lost my community when i came out|choosing between race and sexuality|down low|black and gay|latino and gay|asian and gay|poc and lgbtq)\b/i.test(text),
      
      // Race + Class
      isRaceAndClass: /\b(generational poverty from racism|my family never had wealth|systemic barriers keep us poor|wealth gap is racial|starting from nothing because of history|paid less because i'm black|wage gap is racial|can't get loans because of my race|redlining affected my family|economic racism|work three jobs|one paycheck from homelessness|too poor for help|grew up poor|poverty trauma|first to go to college|first with a professional job|survivor's guilt|navigating unfamiliar class spaces|poor pretending to be middle class|class-based imposter syndrome)\b/i.test(text),
      
      // Race + Gender
      isRaceAndGender: /\b(seen as threatening|black men are criminalized|have to prove i'm safe|hypermasculinized|can't show softness|machismo is expected|latino men are providers|asian men are emasculated|seen as less masculine|asian men aren't seen as attractive|stereotypes desexualize|seen as aggressive because i'm black|latino men are hot-tempered|racialized masculinity)\b/i.test(text),
      
      // Multiple Marginalization (3+ identities)
      isMultipleMarginalization: /\b(black gay and poor|latino undocumented and|asian first-gen and lgbtq|navigating multiple marginalizations|each identity adds complexity|triple marginalization|oppressed in multiple ways)\b/i.test(text),
      
      // Intersectional Complexity
      isIntersectionalComplexity: /\b(which identity do i prioritize|can't separate my identities|intersectionality|emphasize different parts of myself|identity shifts based on context|fragment myself to survive|all my identities matter|complex identity)\b/i.test(text)
    };
  }
}

export const modernRAG = new ModernRAGService();
