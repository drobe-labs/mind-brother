// Culturally-Aware Crisis Detection for Mind Brother
// Enhances standard crisis detection with cultural context
// Helps avoid over-escalation while providing culturally relevant resources

import { supabase } from './supabase';
import { 
  getUserCulturalProfile, 
  type CulturalProfile,
  type CulturalBackground 
} from './culturalPersonalizationService';

// ============================================================================
// TYPES
// ============================================================================

export interface CrisisAssessment {
  isCrisis: boolean;
  severity: 0 | 1 | 2 | 3 | 4 | 5; // 0 = not crisis, 5 = most severe
  type: CrisisType;
  confidence: number;
  context?: CrisisContext;
  resources: CrisisResource[];
  culturalConsiderations?: string[];
  adjustmentReason?: string;
  requiresHumanReview: boolean;
}

export type CrisisType = 
  | 'suicide'
  | 'self_harm'
  | 'despair'
  | 'violence'
  | 'abuse'
  | 'workplace_stress'
  | 'racial_trauma'
  | 'immigration_stress'
  | 'police_interaction'
  | 'family_crisis'
  | 'substance_crisis'
  | 'veteran_crisis'
  | 'faith_crisis'
  | 'identity_crisis'
  | 'relationship_crisis'
  | 'financial_crisis'
  | 'other';

export type CrisisContext = 
  | 'workplace_cultural_stress'
  | 'code_switching_burnout'
  | 'racial_discrimination'
  | 'police_fear'
  | 'immigration_fear'
  | 'deportation_anxiety'
  | 'family_separation'
  | 'cultural_isolation'
  | 'religious_conflict'
  | 'identity_struggle'
  | 'veteran_transition'
  | 'combat_ptsd'
  | 'economic_hardship'
  | 'incarceration_related'
  | 'reentry_stress'
  | 'generational_trauma'
  | 'medical_mistrust'
  | null;

export interface CrisisResource {
  name: string;
  nameLocalized?: string;
  phone?: string;
  text?: string;
  website?: string;
  description: string;
  descriptionLocalized?: string;
  culturallyRelevant: boolean;
  forBackground?: CulturalBackground[];
  forCommunities?: string[];
  available24Hours: boolean;
  languages?: string[];
  priority: number; // 1 = highest
}

// ============================================================================
// CULTURALLY RELEVANT CRISIS RESOURCES
// ============================================================================

export const CRISIS_RESOURCES: Record<string, CrisisResource[]> = {
  general: [
    {
      name: '988 Suicide & Crisis Lifeline',
      phone: '988',
      text: '988',
      website: 'https://988lifeline.org',
      description: '24/7, free and confidential support for people in distress',
      culturallyRelevant: false,
      available24Hours: true,
      languages: ['english', 'spanish'],
      priority: 1,
    },
    {
      name: 'Crisis Text Line',
      text: 'Text HOME to 741741',
      website: 'https://crisistextline.org',
      description: 'Free 24/7 crisis support via text',
      culturallyRelevant: false,
      available24Hours: true,
      languages: ['english'],
      priority: 1,
    },
    {
      name: '911 Emergency Services',
      phone: '911',
      description: 'For immediate life-threatening emergencies',
      culturallyRelevant: false,
      available24Hours: true,
      priority: 1,
    },
  ],

  black_african_american: [
    {
      name: 'Black Mental Health Alliance',
      phone: '410-338-2642',
      website: 'https://blackmentalhealth.com',
      description: 'Culturally relevant mental health resources for Black communities',
      culturallyRelevant: true,
      forBackground: ['black_african_american'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
    {
      name: 'Boris Lawrence Henson Foundation',
      website: 'https://borislhensonfoundation.org',
      description: 'Breaking the stigma around mental health in the Black community',
      culturallyRelevant: true,
      forBackground: ['black_african_american'],
      available24Hours: false,
      languages: ['english'],
      priority: 3,
    },
    {
      name: 'Therapy for Black Men',
      website: 'https://therapyforblackmen.org',
      description: 'Directory of Black male therapists',
      culturallyRelevant: true,
      forBackground: ['black_african_american'],
      available24Hours: false,
      languages: ['english'],
      priority: 3,
    },
    {
      name: 'The Steve Fund',
      website: 'https://stevefund.org',
      phone: 'Text STEVE to 741741',
      description: 'Mental health support for young people of color',
      culturallyRelevant: true,
      forBackground: ['black_african_american', 'latino_hispanic', 'asian'],
      available24Hours: true,
      languages: ['english'],
      priority: 2,
    },
    {
      name: 'BEAM (Black Emotional and Mental Health)',
      website: 'https://beam.community',
      description: 'Collective dedicated to Black mental health',
      culturallyRelevant: true,
      forBackground: ['black_african_american'],
      available24Hours: false,
      languages: ['english'],
      priority: 3,
    },
  ],

  police_interaction: [
    {
      name: 'Know Your Rights Camp',
      website: 'https://knowyourrightscamp.com',
      description: 'Know your rights during police encounters',
      culturallyRelevant: true,
      forBackground: ['black_african_american'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
    {
      name: 'NAACP Legal Defense Fund',
      phone: '212-965-2200',
      website: 'https://naacpldf.org',
      description: 'Legal support and civil rights advocacy',
      culturallyRelevant: true,
      forBackground: ['black_african_american'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
    {
      name: 'ACLU Know Your Rights',
      website: 'https://aclu.org/know-your-rights',
      description: 'Legal rights information during police encounters',
      culturallyRelevant: false,
      available24Hours: false,
      languages: ['english', 'spanish'],
      priority: 3,
    },
  ],

  latino_hispanic: [
    {
      name: 'SAMHSA National Helpline (Español)',
      nameLocalized: 'Línea de Ayuda de SAMHSA',
      phone: '1-800-662-4357',
      website: 'https://samhsa.gov/find-help/national-helpline',
      description: 'Free 24/7 treatment referral service in English and Spanish',
      descriptionLocalized: 'Servicio gratuito de referencia de tratamiento 24/7 en inglés y español',
      culturallyRelevant: true,
      forBackground: ['latino_hispanic'],
      available24Hours: true,
      languages: ['english', 'spanish'],
      priority: 1,
    },
    {
      name: 'Latinx Therapy',
      website: 'https://latinxtherapy.com',
      description: 'Directory of Latinx therapists and Spanish-speaking providers',
      descriptionLocalized: 'Directorio de terapeutas Latinx y proveedores hispanohablantes',
      culturallyRelevant: true,
      forBackground: ['latino_hispanic'],
      available24Hours: false,
      languages: ['english', 'spanish'],
      priority: 2,
    },
    {
      name: 'National Alliance for Hispanic Health',
      phone: '1-866-783-2645',
      website: 'https://healthyamericas.org',
      description: 'Bilingual health information and support',
      descriptionLocalized: 'Información de salud bilingüe y apoyo',
      culturallyRelevant: true,
      forBackground: ['latino_hispanic'],
      available24Hours: false,
      languages: ['english', 'spanish'],
      priority: 2,
    },
  ],

  immigration: [
    {
      name: 'United We Dream',
      phone: '1-844-363-1423',
      website: 'https://unitedwedream.org',
      description: 'Immigration support and legal resources for immigrants and dreamers',
      descriptionLocalized: 'Apoyo de inmigración y recursos legales para inmigrantes y soñadores',
      culturallyRelevant: true,
      forCommunities: ['immigrant'],
      available24Hours: false,
      languages: ['english', 'spanish'],
      priority: 2,
    },
    {
      name: 'National Immigrant Justice Center',
      phone: '312-660-1370',
      website: 'https://immigrantjustice.org',
      description: 'Legal services for immigrants',
      culturallyRelevant: true,
      forCommunities: ['immigrant'],
      available24Hours: false,
      languages: ['english', 'spanish'],
      priority: 2,
    },
    {
      name: 'ICE Detention Reporting Hotline',
      phone: '1-888-351-4024',
      description: 'Report immigration enforcement actions',
      culturallyRelevant: true,
      forCommunities: ['immigrant'],
      available24Hours: true,
      languages: ['english', 'spanish'],
      priority: 2,
    },
  ],

  veteran: [
    {
      name: 'Veterans Crisis Line',
      phone: '988, then press 1',
      text: 'Text 838255',
      website: 'https://veteranscrisisline.net',
      description: '24/7 confidential support for veterans and their loved ones',
      culturallyRelevant: true,
      forCommunities: ['veteran'],
      available24Hours: true,
      languages: ['english'],
      priority: 1,
    },
    {
      name: 'Make the Connection',
      website: 'https://maketheconnection.net',
      description: 'Veterans sharing stories of mental health recovery',
      culturallyRelevant: true,
      forCommunities: ['veteran'],
      available24Hours: false,
      languages: ['english'],
      priority: 3,
    },
    {
      name: 'Wounded Warrior Project',
      phone: '888-997-2586',
      website: 'https://woundedwarriorproject.org',
      description: 'Programs for wounded veterans and their families',
      culturallyRelevant: true,
      forCommunities: ['veteran'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
  ],

  lgbtq: [
    {
      name: 'Trevor Project',
      phone: '1-866-488-7386',
      text: 'Text START to 678-678',
      website: 'https://thetrevorproject.org',
      description: '24/7 crisis support for LGBTQ+ young people',
      culturallyRelevant: true,
      forCommunities: ['lgbtq'],
      available24Hours: true,
      languages: ['english'],
      priority: 1,
    },
    {
      name: 'Trans Lifeline',
      phone: '877-565-8860',
      website: 'https://translifeline.org',
      description: 'Peer support for trans people by trans people',
      culturallyRelevant: true,
      forCommunities: ['lgbtq'],
      available24Hours: true,
      languages: ['english', 'spanish'],
      priority: 1,
    },
    {
      name: 'LGBT National Hotline',
      phone: '888-843-4564',
      website: 'https://lgbthotline.org',
      description: 'Peer support for all LGBTQ+ individuals',
      culturallyRelevant: true,
      forCommunities: ['lgbtq'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
  ],

  faith_based: [
    {
      name: 'National Prayer Line',
      phone: '800-4-PRAYER (800-477-2937)',
      description: 'Prayer and spiritual support 24/7',
      culturallyRelevant: true,
      forCommunities: ['faith_based'],
      available24Hours: true,
      languages: ['english'],
      priority: 2,
    },
  ],

  formerly_incarcerated: [
    {
      name: 'National Reentry Resource Center',
      phone: '1-855-838-3738',
      website: 'https://nationalreentryresourcecenter.org',
      description: 'Resources for people returning from incarceration',
      culturallyRelevant: true,
      forCommunities: ['formerly_incarcerated'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
    {
      name: 'Legal Action Center',
      phone: '212-243-1313',
      website: 'https://lac.org',
      description: 'Legal advocacy for people with criminal records',
      culturallyRelevant: true,
      forCommunities: ['formerly_incarcerated'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
  ],

  caribbean: [
    {
      name: 'Caribbean Crisis Line (NYC)',
      phone: '888-692-9355',
      website: 'https://nycwell.cityofnewyork.us',
      description: 'NYC Well - supports Caribbean community members',
      culturallyRelevant: true,
      forBackground: ['caribbean'],
      available24Hours: true,
      languages: ['english', 'spanish', 'french', 'creole'],
      priority: 2,
    },
  ],

  asian: [
    {
      name: 'Asian Mental Health Collective',
      website: 'https://asianmhc.org',
      description: 'Directory of Asian therapists and mental health resources',
      culturallyRelevant: true,
      forBackground: ['asian'],
      available24Hours: false,
      languages: ['english'],
      priority: 2,
    },
    {
      name: 'Asian American Psychological Association',
      website: 'https://aapaonline.org',
      description: 'Mental health resources for Asian Americans',
      culturallyRelevant: true,
      forBackground: ['asian'],
      available24Hours: false,
      languages: ['english'],
      priority: 3,
    },
  ],
};

// ============================================================================
// CULTURAL CRISIS PATTERNS
// ============================================================================

// Patterns that indicate cultural stress vs. actual suicidal crisis
const CULTURAL_STRESS_PATTERNS = {
  workplace_discrimination: [
    /\b(only (black|brown|latino|asian) (guy|man|person|one)|represent my race|they (asked|touched) my hair|code[\s-]?switch|switch(ing)? (it|my) up|professional voice|can't be myself at work)\b/i,
    /\b(diversity hire|token|affirmative action|not a good (culture )?fit|too urban|too ethnic)\b/i,
    /\b(microaggression|macro[\s-]?aggression|racial joke|always (have to|gotta) prove|twice as (good|hard))\b/i,
  ],
  police_fear: [
    /\b(police|cops|officer|pulled over|the talk|driving while black|stopped by|arrested|detained)\b/i,
    /\b(afraid of (police|cops)|scared of (getting|being) (pulled over|stopped)|fear (for my|the) (life|safety))\b/i,
  ],
  immigration_stress: [
    /\b(ice|deportation|papers|documents|undocumented|visa|green card|daca|dreamer|citizenship)\b/i,
    /\b(afraid of (ice|deportation|immigration)|family (separated|split up)|send (me|us) back)\b/i,
    /\b(mi familia|home country|left (everything|everyone) behind)\b/i,
  ],
  generational_trauma: [
    /\b(slavery|jim crow|segregation|lynching|civil rights|ancestors|generational|passed down)\b/i,
    /\b(our (people|community) (been through|survived)|historical trauma|collective trauma)\b/i,
  ],
  code_switching_burnout: [
    /\b(exhausted from (code[\s-]?switch|switching)|can't (keep|continue) (code[\s-]?switch|faking|pretending))\b/i,
    /\b(two different (people|persons)|wear(ing)? a mask|hide who i (am|really am))\b/i,
  ],
  reentry_stress: [
    /\b(just (got|came) out|recently released|out (of|from) (prison|jail)|parole|probation|criminal record)\b/i,
    /\b(no one will hire|can't get a job|background check|felon|convicted)\b/i,
  ],
  veteran_ptsd: [
    /\b(deployed|deployment|combat|military|service|veteran|va|ptsd|flashback)\b/i,
    /\b(miss the (service|military|corps|brotherhood)|civilian life is hard|don't fit in)\b/i,
  ],
  faith_struggle: [
    /\b(lost (my|faith in) god|god abandoned|question(ing)? (my|faith)|church hurt|spiritual crisis)\b/i,
    /\b(pastor|congregation|christian|muslim|faith community) (failed|rejected|judged)\b/i,
  ],
};

// Phrases that sound like crisis but may be cultural expressions
const CULTURAL_EXPRESSIONS = {
  frustration_not_suicidal: [
    // General frustration phrases used culturally
    /\b(can't take this (no more|anymore)|done with this|over it|fed up)\b/i,
    /\b(tired of (this|everything|the bs)|sick (and tired|of this))\b/i,
    // Often used to express workplace or discrimination frustration
    /\b(killing me|this (job|place|situation) is killing me|driving me crazy)\b/i,
  ],
  // Expressions that might trigger false positives
  religious_expressions: [
    /\b(ready to meet (my maker|god)|in god's hands|lord take me)\b/i,
    /\b(heaven|afterlife|next life|see (them|my) (loved ones|family) again)\b/i,
  ],
  // Veteran expressions
  veteran_expressions: [
    /\b(battle|war|fight|soldier on|in the trenches)\b/i,
    /\b(mission|deploy|tactical|strategic)\b/i,
  ],
};

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect crisis with cultural context awareness
 * Adjusts base crisis detection to account for cultural nuances
 */
export async function detectCrisisWithCulturalContext(
  message: string,
  userId: string,
  baseCrisisResult?: {
    isCrisis: boolean;
    type: string;
    confidence: number;
    severity?: number;
  }
): Promise<CrisisAssessment> {
  
  // Get user's cultural profile
  const culturalProfile = await getUserCulturalProfile(userId);
  
  // Start with base crisis assessment or detect fresh
  const baseSeverity = baseCrisisResult?.severity || (baseCrisisResult?.isCrisis ? 3 : 0);
  
  let assessment: CrisisAssessment = {
    isCrisis: baseCrisisResult?.isCrisis || false,
    severity: baseSeverity as 0 | 1 | 2 | 3 | 4 | 5,
    type: (baseCrisisResult?.type as CrisisType) || 'other',
    confidence: baseCrisisResult?.confidence || 0,
    resources: [...CRISIS_RESOURCES.general],
    culturalConsiderations: [],
    requiresHumanReview: baseSeverity >= 4,
  };
  
  const lowerMessage = message.toLowerCase();
  
  // =========================================================================
  // STEP 1: DETECT CULTURAL CONTEXT
  // =========================================================================
  
  const detectedContexts = detectCulturalContext(message, culturalProfile);
  
  // =========================================================================
  // STEP 2: ADJUST SEVERITY BASED ON CULTURAL CONTEXT
  // =========================================================================
  
  // Check for workplace/discrimination stress (may lower severity)
  if (detectWorkplaceStress(message, culturalProfile)) {
    assessment.context = 'workplace_cultural_stress';
    assessment.culturalConsiderations?.push(
      'May be expressing frustration with workplace discrimination rather than suicidal intent'
    );
    
    // Don't lower if there are also clear suicidal indicators
    if (!hasExplicitSuicidalIndicators(message)) {
      if (assessment.severity > 0 && assessment.severity < 5) {
        assessment.severity = Math.max(1, assessment.severity - 1) as 0 | 1 | 2 | 3 | 4 | 5;
        assessment.adjustmentReason = 'Detected cultural workplace stress context';
      }
    }
  }
  
  // Check for code-switching burnout
  if (detectCodeSwitchingStress(message, culturalProfile)) {
    assessment.context = 'code_switching_burnout';
    assessment.culturalConsiderations?.push(
      'User may be experiencing exhaustion from navigating multiple cultural identities'
    );
    
    if (!hasExplicitSuicidalIndicators(message)) {
      if (assessment.severity > 0 && assessment.severity < 5) {
        assessment.severity = Math.max(1, assessment.severity - 1) as 0 | 1 | 2 | 3 | 4 | 5;
        assessment.adjustmentReason = 'Detected code-switching exhaustion context';
      }
    }
  }
  
  // =========================================================================
  // STEP 3: IDENTIFY SPECIFIC CRISIS TYPES AND ADD RELEVANT RESOURCES
  // =========================================================================
  
  // Police interaction stress for Black users
  if (detectPoliceRelatedStress(message, culturalProfile)) {
    assessment.context = 'police_fear';
    assessment.type = 'police_interaction';
    assessment.resources = [
      ...CRISIS_RESOURCES.general,
      ...CRISIS_RESOURCES.police_interaction,
      ...(CRISIS_RESOURCES.black_african_american || []),
    ];
    assessment.culturalConsiderations?.push(
      'User expressing fear related to police interactions - provide relevant safety resources'
    );
    
    // If expressing fear but not suicidal, adjust type but keep vigilant
    if (!hasExplicitSuicidalIndicators(message)) {
      assessment.type = 'racial_trauma';
      assessment.culturalConsiderations?.push(
        'This is trauma-related stress, not suicidal crisis - respond with validation and resources'
      );
    }
  }
  
  // Immigration-related stress
  if (detectImmigrationStress(message, culturalProfile)) {
    assessment.context = 'immigration_fear';
    assessment.type = 'immigration_stress';
    assessment.resources = [
      ...CRISIS_RESOURCES.general,
      ...CRISIS_RESOURCES.immigration,
      ...(culturalProfile?.cultural_background === 'latino_hispanic' 
        ? CRISIS_RESOURCES.latino_hispanic 
        : []),
    ];
    assessment.culturalConsiderations?.push(
      'User expressing immigration-related fear - provide legal resources alongside mental health support'
    );
  }
  
  // Veteran-specific crisis
  if (detectVeteranCrisis(message, culturalProfile)) {
    assessment.type = 'veteran_crisis';
    assessment.context = 'combat_ptsd';
    assessment.resources = [
      ...CRISIS_RESOURCES.veteran, // Veterans line first
      ...CRISIS_RESOURCES.general,
    ];
    assessment.culturalConsiderations?.push(
      'Veteran in crisis - Veterans Crisis Line should be primary resource'
    );
    // Veterans at higher risk - don't lower severity
    assessment.requiresHumanReview = assessment.severity >= 3;
  }
  
  // LGBTQ+ specific considerations
  if (culturalProfile?.communities?.includes('lgbtq')) {
    assessment.resources = [
      ...CRISIS_RESOURCES.lgbtq,
      ...assessment.resources,
    ];
    assessment.culturalConsiderations?.push(
      'LGBTQ+ individual - include LGBTQ+ specific resources'
    );
  }
  
  // Formerly incarcerated specific considerations
  if (detectReentryStress(message, culturalProfile)) {
    assessment.context = 'reentry_stress';
    assessment.type = 'identity_crisis';
    assessment.resources = [
      ...CRISIS_RESOURCES.general,
      ...CRISIS_RESOURCES.formerly_incarcerated,
    ];
    assessment.culturalConsiderations?.push(
      'User dealing with reentry stress - acknowledge unique challenges of returning from incarceration'
    );
  }
  
  // =========================================================================
  // STEP 4: ADD CULTURALLY RELEVANT RESOURCES
  // =========================================================================
  
  // Add resources based on cultural background
  if (culturalProfile?.cultural_background) {
    const culturalResources = CRISIS_RESOURCES[culturalProfile.cultural_background];
    if (culturalResources) {
      assessment.resources = deduplicateResources([
        ...assessment.resources,
        ...culturalResources,
      ]);
    }
  }
  
  // Add community-specific resources
  if (culturalProfile?.communities) {
    for (const community of culturalProfile.communities) {
      const communityResources = CRISIS_RESOURCES[community];
      if (communityResources) {
        assessment.resources = deduplicateResources([
          ...assessment.resources,
          ...communityResources,
        ]);
      }
    }
  }
  
  // =========================================================================
  // STEP 5: LOCALIZE RESOURCES IF USER PREFERS NON-ENGLISH
  // =========================================================================
  
  if (culturalProfile?.language_preference?.primary !== 'english') {
    assessment.resources = prioritizeResourcesByLanguage(
      assessment.resources,
      culturalProfile.language_preference?.primary || 'english'
    );
  }
  
  // =========================================================================
  // STEP 6: ENSURE CRITICAL CRISES ARE NEVER DOWNGRADED TOO MUCH
  // =========================================================================
  
  // Never downgrade explicit suicidal statements
  if (hasExplicitSuicidalIndicators(message)) {
    assessment.severity = Math.max(assessment.severity, 4) as 0 | 1 | 2 | 3 | 4 | 5;
    assessment.isCrisis = true;
    assessment.type = 'suicide';
    assessment.requiresHumanReview = true;
    assessment.adjustmentReason = undefined; // Clear any downgrade reason
    assessment.culturalConsiderations?.push(
      'Explicit suicidal indicators detected - maintain high severity regardless of cultural context'
    );
  }
  
  // Sort resources by priority
  assessment.resources.sort((a, b) => a.priority - b.priority);
  
  return assessment;
}

// ============================================================================
// HELPER DETECTION FUNCTIONS
// ============================================================================

function detectCulturalContext(
  message: string,
  profile: CulturalProfile | null
): CrisisContext[] {
  const contexts: CrisisContext[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Check workplace discrimination patterns
  if (CULTURAL_STRESS_PATTERNS.workplace_discrimination.some(p => p.test(message))) {
    contexts.push('workplace_cultural_stress');
  }
  
  // Check code-switching burnout
  if (CULTURAL_STRESS_PATTERNS.code_switching_burnout.some(p => p.test(message))) {
    contexts.push('code_switching_burnout');
  }
  
  // Check police-related stress
  if (CULTURAL_STRESS_PATTERNS.police_fear.some(p => p.test(message))) {
    contexts.push('police_fear');
  }
  
  // Check immigration stress
  if (CULTURAL_STRESS_PATTERNS.immigration_stress.some(p => p.test(message))) {
    contexts.push('immigration_fear');
  }
  
  // Check generational trauma
  if (CULTURAL_STRESS_PATTERNS.generational_trauma.some(p => p.test(message))) {
    contexts.push('generational_trauma');
  }
  
  // Check reentry stress
  if (CULTURAL_STRESS_PATTERNS.reentry_stress.some(p => p.test(message))) {
    contexts.push('reentry_stress');
  }
  
  // Check veteran PTSD
  if (CULTURAL_STRESS_PATTERNS.veteran_ptsd.some(p => p.test(message)) &&
      profile?.communities?.includes('veteran')) {
    contexts.push('combat_ptsd');
  }
  
  // Check faith struggle
  if (CULTURAL_STRESS_PATTERNS.faith_struggle.some(p => p.test(message)) &&
      profile?.communities?.includes('faith_based')) {
    contexts.push('religious_conflict');
  }
  
  return contexts;
}

function detectWorkplaceStress(
  message: string,
  profile: CulturalProfile | null
): boolean {
  // More likely to be workplace stress if user has disclosed being Black/Brown
  const isBlackOrBrown = profile?.cultural_background && 
    ['black_african_american', 'african', 'caribbean', 'latino_hispanic'].includes(
      profile.cultural_background
    );
  
  const hasWorkplacePatterns = CULTURAL_STRESS_PATTERNS.workplace_discrimination
    .some(p => p.test(message));
  
  // Also check inferred context for workplace issues
  const hasInferredWorkplaceStress = 
    profile?.inferred_context?.code_switching_stress === 'high' ||
    profile?.inferred_context?.workplace_discrimination === 'detected';
  
  return hasWorkplacePatterns || (isBlackOrBrown && hasInferredWorkplaceStress);
}

function detectCodeSwitchingStress(
  message: string,
  profile: CulturalProfile | null
): boolean {
  return CULTURAL_STRESS_PATTERNS.code_switching_burnout.some(p => p.test(message)) ||
    (profile?.inferred_context?.code_switching_stress === 'high' &&
     message.toLowerCase().includes('can\'t take it anymore'));
}

function detectPoliceRelatedStress(
  message: string,
  profile: CulturalProfile | null
): boolean {
  const hasPolicePatterns = CULTURAL_STRESS_PATTERNS.police_fear.some(p => p.test(message));
  
  // Higher sensitivity for Black users
  const isBlack = profile?.cultural_background === 'black_african_american';
  
  return hasPolicePatterns && (isBlack || message.toLowerCase().includes('police'));
}

function detectImmigrationStress(
  message: string,
  profile: CulturalProfile | null
): boolean {
  const hasImmigrationPatterns = CULTURAL_STRESS_PATTERNS.immigration_stress
    .some(p => p.test(message));
  
  // Higher sensitivity for immigrants
  const isImmigrant = profile?.communities?.includes('immigrant');
  const isLatino = profile?.cultural_background === 'latino_hispanic';
  
  return hasImmigrationPatterns || (isImmigrant && message.toLowerCase().includes('afraid'));
}

function detectVeteranCrisis(
  message: string,
  profile: CulturalProfile | null
): boolean {
  const hasVeteranPatterns = CULTURAL_STRESS_PATTERNS.veteran_ptsd.some(p => p.test(message));
  const isVeteran = profile?.communities?.includes('veteran');
  
  return hasVeteranPatterns && isVeteran;
}

function detectReentryStress(
  message: string,
  profile: CulturalProfile | null
): boolean {
  const hasReentryPatterns = CULTURAL_STRESS_PATTERNS.reentry_stress.some(p => p.test(message));
  const isFormerlyIncarcerated = profile?.communities?.includes('formerly_incarcerated');
  
  return hasReentryPatterns || isFormerlyIncarcerated;
}

/**
 * Check for explicit suicidal indicators that should never be downgraded
 */
function hasExplicitSuicidalIndicators(message: string): boolean {
  const explicitPatterns = [
    /\b(suicide|kill myself|want to die|end my life|end it all|going to kill myself)\b/i,
    /\b(planning to (kill myself|end it|die))\b/i,
    /\b(have\s+a\s+plan|set\s+a\s+date|wrote\s+goodbye|saying\s+goodbye)\b/i,
    /\b(better off dead|no reason to live|wish i was dead)\b/i,
    /\b(goodbye\s+forever|this\s+is\s+goodbye|won't\s+see\s+me\s+again)\b/i,
    /\b(hurt myself|self harm|self-harm|cutting|overdose)\b/i,
    /\b(burden\s+to\s+everyone|better\s+off\s+without\s+me|nobody\s+would\s+miss)\b/i,
  ];
  
  return explicitPatterns.some(p => p.test(message));
}

/**
 * Deduplicate resources by name
 */
function deduplicateResources(resources: CrisisResource[]): CrisisResource[] {
  const seen = new Set<string>();
  return resources.filter(r => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });
}

/**
 * Prioritize resources by language
 */
function prioritizeResourcesByLanguage(
  resources: CrisisResource[],
  language: string
): CrisisResource[] {
  return resources.sort((a, b) => {
    const aHasLang = a.languages?.includes(language) ? 0 : 1;
    const bHasLang = b.languages?.includes(language) ? 0 : 1;
    if (aHasLang !== bHasLang) return aHasLang - bHasLang;
    return a.priority - b.priority;
  });
}

// ============================================================================
// LOGGING AND AUDIT
// ============================================================================

/**
 * Log crisis assessment with cultural context for audit trail
 */
export async function logCulturalCrisisAssessment(
  userId: string,
  sessionId: string,
  assessment: CrisisAssessment,
  originalSeverity?: number
): Promise<void> {
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: `HASH_${userId.substring(0, 8)}`, // Hash for privacy
    sessionId,
    severity: assessment.severity,
    originalSeverity,
    type: assessment.type,
    context: assessment.context,
    adjustmentReason: assessment.adjustmentReason,
    culturalConsiderations: assessment.culturalConsiderations,
    resourcesProvided: assessment.resources.map(r => r.name),
    requiresHumanReview: assessment.requiresHumanReview,
  };
  
  console.log('🔍 Cultural crisis assessment:', logEntry);
  
  // In production, store in Supabase:
  // await supabase.from('crisis_cultural_logs').insert(logEntry);
}

// ============================================================================
// INTEGRATION WITH CHATBOT
// ============================================================================

/**
 * Get crisis response with cultural context
 */
export function getCulturalCrisisResponse(
  assessment: CrisisAssessment,
  profile: CulturalProfile | null
): string {
  
  let response = '';
  
  // Personalized opening based on cultural background
  if (profile?.language_preference?.primary === 'spanish') {
    response += 'Hermano, te escucho. ';
  } else if (profile?.cultural_background === 'black_african_american') {
    response += 'Brother, I hear you. ';
  } else {
    response += 'I hear you, and what you\'re going through sounds really hard. ';
  }
  
  // Context-specific acknowledgment
  if (assessment.context === 'workplace_cultural_stress') {
    response += 'Navigating discrimination at work while trying to keep it together is exhausting. ';
  } else if (assessment.context === 'code_switching_burnout') {
    response += 'Having to constantly switch between different versions of yourself takes a real toll. ';
  } else if (assessment.context === 'police_fear') {
    response += 'Fear around police interactions is real and valid, especially with everything our community has experienced. ';
  } else if (assessment.context === 'immigration_fear') {
    response += 'The stress and fear around immigration is so heavy to carry. ';
  } else if (assessment.context === 'reentry_stress') {
    response += 'Coming back into the world after being away is one of the hardest transitions anyone can face. ';
  }
  
  // Crisis response
  if (assessment.isCrisis && assessment.severity >= 4) {
    response += '\n\nI want to make sure you\'re safe right now. ';
    
    const primaryResource = assessment.resources[0];
    if (primaryResource) {
      response += `Please reach out to ${primaryResource.name}`;
      if (primaryResource.phone) {
        response += ` at ${primaryResource.phone}`;
      }
      if (primaryResource.text) {
        response += ` (or ${primaryResource.text})`;
      }
      response += '. They\'re available 24/7 and can help. ';
    }
  }
  
  // Additional resources
  if (assessment.resources.length > 1) {
    response += '\n\nHere are some resources that might help:\n';
    
    const culturalResources = assessment.resources.filter(r => r.culturallyRelevant);
    const topResources = culturalResources.slice(0, 3);
    
    for (const resource of topResources) {
      const name = profile?.language_preference?.primary === 'spanish' && resource.nameLocalized
        ? resource.nameLocalized
        : resource.name;
      const desc = profile?.language_preference?.primary === 'spanish' && resource.descriptionLocalized
        ? resource.descriptionLocalized
        : resource.description;
      
      response += `\n• **${name}**`;
      if (resource.phone) response += ` - ${resource.phone}`;
      if (resource.website) response += ` - ${resource.website}`;
      response += `\n  ${desc}`;
    }
  }
  
  // Closing
  if (profile?.language_preference?.primary === 'spanish') {
    response += '\n\nNo estás solo. Estoy aquí para ti.';
  } else {
    response += '\n\nYou\'re not alone in this. I\'m here with you.';
  }
  
  return response;
}

// Export singleton for convenience
export const culturalCrisisDetector = {
  detectCrisisWithCulturalContext,
  logCulturalCrisisAssessment,
  getCulturalCrisisResponse,
  CRISIS_RESOURCES,
};
