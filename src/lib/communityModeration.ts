// Enhanced Community Moderation System
// Comprehensive safety patterns for mental health community

export interface ModerationResult {
  shouldBlock: boolean;
  shouldFlag: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  triggerWarnings: string[];
  crisisResourcesNeeded: boolean;
  detectedPatterns: string[];
}

// ============================================================================
// CRITICAL PATTERNS - AUTO BLOCK
// ============================================================================

const CRITICAL_SUICIDE_KEYWORDS = [
  // Method-seeking
  /how\s+(?:to|do\s+i|can\s+i)\s+(?:kill|end)\s+(?:myself|my\s+life)/gi,
  /best\s+way\s+to\s+(?:die|kill\s+myself|commit\s+suicide)/gi,
  /easiest\s+way\s+to\s+(?:die|end\s+it)/gi,
  
  // Specific methods
  /hanging\s+myself/gi,
  /overdose\s+on/gi,
  /jump\s+(?:off|from)/gi,
  /gun\s+to\s+(?:my\s+)?head/gi,
  /slit\s+my\s+wrists/gi,
  /carbon\s+monoxide/gi,
  
  // Immediate intent
  /(?:going|gonna|about)\s+to\s+(?:kill|end)\s+(?:myself|it\s+all)/gi,
  /tonight\s+(?:is|will\s+be)\s+(?:the\s+night|my\s+last)/gi,
  /goodbye\s+(?:world|everyone|cruel\s+world)/gi,
  /this\s+is\s+(?:it|the\s+end|goodbye)/gi,
  /writing\s+(?:my|a)\s+(?:suicide\s+)?note/gi,
];

const CRITICAL_SELF_HARM_KEYWORDS = [
  // Cutting/burning
  /how\s+(?:deep|much)\s+to\s+cut/gi,
  /cutting\s+(?:deeper|until)/gi,
  /burn\s+myself\s+with/gi,
  /razor\s+blade/gi,
  
  // Method details
  /where\s+to\s+cut\s+(?:to|for)/gi,
  /best\s+place\s+to\s+cut/gi,
];

const HARASSMENT_PATTERNS = [
  // Direct attacks
  /kill\s+yourself/gi,
  /you\s+should\s+(?:die|end\s+it)/gi,
  /nobody\s+(?:cares|likes|wants)\s+you/gi,
  /world\s+(?:would\s+be\s+)?better\s+without\s+you/gi,
  
  // Severe bullying
  /you'?re\s+(?:worthless|pathetic|useless|a\s+waste)/gi,
  /go\s+die/gi,
  /kys/gi, // "kill yourself" acronym
];

// ============================================================================
// DISGUISED PATTERNS - NEW FEATURE #1
// ============================================================================

const DISGUISED_HARMFUL_PATTERNS: Record<string, RegExp[]> = {
  leetspeak: [
    /su[!1][c¢][!1]d[e3]/gi,  // "su1c1de"
    /s3lf[\s-]?h[a4]rm/gi,     // "s3lf-h4rm"
    /k[!1]ll/gi,               // "k1ll"
  ],
  spacing: [
    /s\s*u\s*i\s*c\s*i\s*d\s*e/gi,
    /s\s*e\s*l\s*f\s*[\s-]*h\s*a\s*r\s*m/gi,
    /k\s*i\s*l\s*l\s+(?:m\s*y\s*s\s*e\s*l\s*f|y\s*o\s*u\s*r\s*s\s*e\s*l\s*f)/gi,
  ],
  symbols: [
    /k[!1]ll\s+y[o0]urself/gi,
    /d[!1]e\s+already/gi,
    /@\s*(?:sui|kys|die)/gi,
  ],
  emojis: [
    /🔫|💊|🔪.*(?:myself|me|tonight)/gi,
    /💀.*(?:ready|tonight|finally)/gi,
  ],
  homoglyphs: [
    /[sƽ][uμυ][iı!1][cϲ][iı!1][dԁ][eе]/gi,  // Unicode lookalikes
  ],
};

// ============================================================================
// IMPERSONATION DETECTION - NEW FEATURE #3
// ============================================================================

const IMPERSONATION_PATTERNS: Record<string, RegExp[]> = {
  credentials: [
    /(?:i'm|i\s+am)\s+(?:a|your)\s+(?:therapist|psychiatrist|psychologist|doctor|counselor|licensed\s+professional)/gi,
    /as\s+your\s+(?:therapist|doctor|counselor)/gi,
    /i\s+have\s+a\s+(?:phd|doctorate|medical\s+degree)\s+in/gi,
  ],
  authority: [
    /as\s+(?:a|your)\s+mental\s+health\s+professional/gi,
    /in\s+my\s+professional\s+(?:opinion|experience)/gi,
    /i'm\s+(?:board\s+)?certified\s+in/gi,
  ],
  diagnosis: [
    /you\s+(?:definitely\s+)?have\s+(?:depression|anxiety|ptsd|bipolar|schizophrenia|bpd)/gi,
    /you\s+(?:are|seem)\s+(?:clearly\s+)?(?:depressed|manic|psychotic)/gi,
    /i\s+diagnose\s+you\s+with/gi,
    /you're\s+suffering\s+from\s+(?:clinical|major)/gi,
  ],
  prescription: [
    /you\s+(?:should|need\s+to)\s+(?:take|get\s+on|try)\s+(?:medication|meds|antidepressants|ssri|benzos)/gi,
    /stop\s+taking\s+your\s+(?:medication|meds|pills)/gi,
    /i\s+recommend\s+(?:zoloft|prozac|xanax|lexapro|wellbutrin)/gi,
  ],
};

// ============================================================================
// TOXIC POSITIVITY - EXPANDED FEATURE #4
// ============================================================================

const TOXIC_POSITIVITY_PATTERNS: Record<string, RegExp[]> = {
  dismissive: [
    /just\s+(?:think\s+positive|be\s+happy|smile\s+more|get\s+over\s+it|cheer\s+up)/gi,
    /stop\s+(?:being\s+)?(?:negative|sad|depressed)/gi,
    /it'?s\s+all\s+in\s+your\s+head/gi,
    /you'?re\s+(?:just|only)\s+(?:sad|upset|stressed)/gi,
  ],
  minimizing: [
    /(?:others|people)\s+have\s+it\s+(?:much\s+)?worse/gi,
    /you'?re\s+(?:being\s+)?(?:dramatic|overdramatic|too\s+sensitive)/gi,
    /at\s+least\s+you'?re\s+not/gi,
    /could\s+be\s+worse/gi,
    /first\s+world\s+problems/gi,
  ],
  spiritualBypass: [
    /everything\s+happens\s+for\s+a\s+reason/gi,
    /(?:it'?s|this\s+is)\s+god'?s\s+(?:plan|will)/gi,
    /you\s+(?:just\s+)?need\s+(?:more\s+)?(?:faith|prayer|jesus)/gi,
    /the\s+universe\s+(?:has\s+a\s+plan|is\s+testing\s+you)/gi,
  ],
  hustleCulture: [
    /no\s+excuses/gi,
    /(?:grind|hustle)\s+harder/gi,
    /mind\s+over\s+matter/gi,
    /weak\s+(?:people|minded)/gi,
    /suck\s+it\s+up/gi,
    /everyone\s+struggles/gi,
  ],
  falseEquivalence: [
    /i\s+(?:was|felt)\s+(?:sad|depressed)\s+(?:once|too)\s+(?:and|but)/gi,
    /depression\s+is\s+(?:just|only)\s+a\s+(?:mood|feeling|choice)/gi,
  ],
};

// ============================================================================
// HIGH-RISK PATTERNS - FLAG FOR REVIEW
// ============================================================================

const HIGH_RISK_KEYWORDS = [
  /suicidal\s+(?:thoughts|ideation|feelings)/gi,
  /want\s+to\s+(?:die|disappear|not\s+exist)/gi,
  /wish\s+i\s+(?:was|were)\s+(?:dead|never\s+born)/gi,
  /don'?t\s+want\s+to\s+(?:live|be\s+here|exist)/gi,
  /tired\s+of\s+(?:living|life|being\s+alive)/gi,
  /can'?t\s+(?:take|do)\s+(?:it|this)\s+anymore/gi,
  /ready\s+to\s+(?:give\s+up|end\s+(?:it|things))/gi,
];

const SPAM_PATTERNS = [
  // Multiple URLs
  /https?:\/\/[^\s]+.*https?:\/\/[^\s]+/gi,
  
  // MLM/Scam language
  /(?:dm|message)\s+me\s+(?:for|to\s+learn)/gi,
  /(?:make|earn)\s+\$\d+.*(?:from\s+home|working\s+from)/gi,
  /passive\s+income/gi,
  /financial\s+freedom/gi,
  
  // Fake therapy
  /i\s+can\s+(?:cure|fix|heal)\s+(?:your|you)/gi,
  /guaranteed\s+(?:results|cure|recovery)/gi,
  /miracle\s+(?:cure|treatment|remedy)/gi,
];

const MEDICAL_ADVICE_PATTERNS = [
  /you\s+should\s+(?:stop|start|increase|decrease|change)\s+(?:taking|your)\s+(?:medication|meds)/gi,
  /try\s+(?:this|these)\s+(?:supplements|vitamins|herbs)/gi,
  /instead\s+of\s+(?:therapy|medication|meds)/gi,
];

// ============================================================================
// COORDINATED HARM DETECTION - NEW FEATURE #5
// ============================================================================

const COORDINATED_HARM_PATTERNS: Record<string, RegExp[]> = {
  methodSharing: [
    /(?:here'?s|try\s+this)\s+(?:method|way)/gi,
    /worked\s+for\s+me.*(?:pills|cutting|hanging)/gi,
  ],
  encouragement: [
    /(?:do|go\s+for)\s+it.*you'?ll\s+(?:feel\s+better|be\s+free)/gi,
    /i'?ll\s+(?:do\s+it\s+)?(?:with|too|if\s+you\s+do)/gi,
    /(?:we|let'?s)\s+(?:do\s+it\s+)?together/gi,
  ],
  pacts: [
    /suicide\s+pact/gi,
    /both\s+(?:end\s+it|die\s+together)/gi,
    /meet\s+up\s+(?:and|to)/gi,
  ],
};

// ============================================================================
// POSITIVE INDICATORS - NEW FEATURE #8
// ============================================================================

const POSITIVE_INDICATORS: Record<string, RegExp[]> = {
  progressSharing: [
    /\d+\s+days?\s+(?:clean|sober|self[-\s]harm[-\s]free)/gi,
    /made\s+it\s+through/gi,
    /feeling\s+(?:a\s+(?:little|bit)\s+)?better/gi,
    /small\s+(?:win|victory|progress)/gi,
    /proud\s+of\s+myself/gi,
  ],
  helpSeeking: [
    /(?:started|seeing|going\s+to)\s+(?:therapy|a\s+therapist|counseling|a\s+counselor)/gi,
    /talked\s+to\s+(?:someone|a\s+professional|my\s+doctor)/gi,
    /reached\s+out\s+for\s+help/gi,
    /scheduled\s+(?:an\s+)?appointment/gi,
  ],
  peerSupport: [
    /thank\s+you\s+(?:all|everyone|so\s+much)/gi,
    /you\s+(?:really\s+)?helped\s+me/gi,
    /appreciate\s+(?:you|this\s+community)/gi,
    /not\s+alone/gi,
  ],
  coping: [
    /(?:tried|using|practiced)\s+(?:breathing|meditation|grounding)/gi,
    /(?:called|texted)\s+(?:hotline|crisis\s+line|988)/gi,
    /distracted\s+myself\s+with/gi,
  ],
};

// ============================================================================
// TRIGGER WARNING TOPICS
// ============================================================================

const TRIGGER_WARNING_TOPICS: Record<string, RegExp[]> = {
  'Suicide': [
    /suicid/gi,
    /want\s+to\s+die/gi,
    /kill\s+myself/gi,
  ],
  'Self-Harm': [
    /self[-\s]?harm/gi,
    /cutting/gi,
    /hurt\s+myself/gi,
  ],
  'Sexual Abuse': [
    /(?:sexual|sex)\s+abuse/gi,
    /(?:raped|rape)/gi,
    /molest/gi,
    /sexual\s+assault/gi,
  ],
  'Physical Abuse': [
    /(?:physical|domestic)\s+(?:abuse|violence)/gi,
    /beaten/gi,
    /hit\s+me/gi,
  ],
  'Eating Disorders': [
    /anorexia/gi,
    /bulimia/gi,
    /eating\s+disorder/gi,
    /purging/gi,
  ],
  'Substance Abuse': [
    /addiction/gi,
    /alcoholic/gi,
    /drug\s+abuse/gi,
    /relapse/gi,
  ],
  'Trauma/PTSD': [
    /ptsd/gi,
    /trauma/gi,
    /flashback/gi,
    /triggered/gi,
  ],
  'Depression': [
    /depression/gi,
    /depressed/gi,
  ],
  'Anxiety': [
    /anxiety\s+attack/gi,
    /panic\s+attack/gi,
  ],
};

// ============================================================================
// CRISIS RESOURCES
// ============================================================================

export const CRISIS_RESOURCES = `

━━━━━━━━━━━━━━━━━━━━━━━━━━
🆘 CRISIS RESOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━

If you're in crisis, please reach out:

📞 988 Suicide & Crisis Lifeline
   Call or Text: 988
   Available 24/7

💬 Crisis Text Line
   Text HOME to 741741
   Available 24/7

🌐 Online Chat
   suicidepreventionlifeline.org/chat
   Available 24/7

🏳️‍🌈 Trevor Project (LGBTQ+ Youth)
   Call: 1-866-488-7386
   Text START to 678678

You are not alone. Help is available.
━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// ============================================================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Export patterns for external use if needed
export const criticalSuicideKeywords = CRITICAL_SUICIDE_KEYWORDS;
export const criticalSelfHarmKeywords = CRITICAL_SELF_HARM_KEYWORDS;
export const highRiskKeywords = HIGH_RISK_KEYWORDS;
export const harassmentPatterns = HARASSMENT_PATTERNS;
export const spamPatterns = SPAM_PATTERNS;
export const medicalAdvicePatterns = MEDICAL_ADVICE_PATTERNS;
export const triggerKeywords = TRIGGER_WARNING_TOPICS;

/**
 * Get crisis resources message (legacy function name)
 */
export function getCrisisResources(): string {
  return CRISIS_RESOURCES;
}

/**
 * Generate block message for prohibited content (legacy function)
 */
export function getBlockedMessage(reason: string): string {
  return `We're concerned about the content in your post. If you're in crisis, please reach out for help immediately.

${CRISIS_RESOURCES}

Our community guidelines prohibit detailed descriptions of suicide methods or self-harm. You can share that you're struggling without specific details.

Would you like to:
• Edit your post to remove prohibited content
• Chat with Amani (AI support) for immediate help
• Cancel and get crisis resources`;
}

/**
 * Format trigger warning for display (legacy function)
 */
export function formatTriggerWarning(topics: string[]): string {
  return `⚠️ TW: ${topics.join(', ')}`;
}

/**
 * Check if content contains trigger warning (legacy function)
 */
export function hasTriggerWarning(content: string): boolean {
  return /^(?:TW|CW|Trigger Warning|Content Warning):/i.test(content.trim());
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeContent(content: string): ModerationResult & {
  // Legacy properties for backward compatibility
  blocked: boolean;
  flagged: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  needsTriggerWarning: boolean;
  suggestedTriggers: string[];
  reason?: string;
} {
  const result: ModerationResult = {
    shouldBlock: false,
    shouldFlag: false,
    severity: 'none',
    reasons: [],
    triggerWarnings: [],
    crisisResourcesNeeded: false,
    detectedPatterns: [],
  };

  // Strip HTML tags for analysis
  const tmp = document.createElement('div');
  tmp.innerHTML = content;
  const textContent = tmp.textContent || tmp.innerText || '';

  // ============================================================================
  // CRITICAL - AUTO BLOCK
  // ============================================================================

  // Check critical suicide keywords
  for (const pattern of CRITICAL_SUICIDE_KEYWORDS) {
    pattern.lastIndex = 0; // Reset regex state
    if (pattern.test(textContent)) {
      result.shouldBlock = true;
      result.severity = 'critical';
      result.reasons.push('Contains explicit suicide method or immediate intent');
      result.crisisResourcesNeeded = true;
      result.detectedPatterns.push('critical_suicide');
      return createLegacyResult(result);
    }
  }

  // Check critical self-harm keywords
  for (const pattern of CRITICAL_SELF_HARM_KEYWORDS) {
    pattern.lastIndex = 0;
    if (pattern.test(textContent)) {
      result.shouldBlock = true;
      result.severity = 'critical';
      result.reasons.push('Contains explicit self-harm methods');
      result.crisisResourcesNeeded = true;
      result.detectedPatterns.push('critical_self_harm');
      return createLegacyResult(result);
    }
  }

  // Check harassment patterns
  for (const pattern of HARASSMENT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(textContent)) {
      result.shouldBlock = true;
      result.severity = 'critical';
      result.reasons.push('Contains harassment or bullying');
      result.detectedPatterns.push('harassment');
      return createLegacyResult(result);
    }
  }

  // ============================================================================
  // DISGUISED PATTERNS - NEW FEATURE #1
  // ============================================================================

  for (const [category, patterns] of Object.entries(DISGUISED_HARMFUL_PATTERNS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(textContent)) {
        result.shouldBlock = true;
        result.severity = 'critical';
        result.reasons.push(`Contains disguised harmful content (${category})`);
        result.crisisResourcesNeeded = true;
        result.detectedPatterns.push(`disguised_${category}`);
        return createLegacyResult(result);
      }
    }
  }

  // ============================================================================
  // IMPERSONATION - NEW FEATURE #3
  // ============================================================================

  for (const [category, patterns] of Object.entries(IMPERSONATION_PATTERNS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(textContent)) {
        result.shouldFlag = true;
        result.severity = result.severity === 'none' ? 'high' : result.severity;
        result.reasons.push(`Possible impersonation: ${category}`);
        result.detectedPatterns.push(`impersonation_${category}`);
      }
    }
  }

  // ============================================================================
  // TOXIC POSITIVITY - EXPANDED FEATURE #4
  // ============================================================================

  let toxicPositivityCount = 0;
  for (const [category, patterns] of Object.entries(TOXIC_POSITIVITY_PATTERNS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(textContent)) {
        toxicPositivityCount++;
        result.detectedPatterns.push(`toxic_positivity_${category}`);
      }
    }
  }

  if (toxicPositivityCount >= 2) {
    result.shouldFlag = true;
    result.severity = result.severity === 'none' ? 'medium' : result.severity;
    result.reasons.push('Contains toxic positivity language');
  }

  // ============================================================================
  // COORDINATED HARM - NEW FEATURE #5
  // ============================================================================

  for (const [category, patterns] of Object.entries(COORDINATED_HARM_PATTERNS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(textContent)) {
        result.shouldFlag = true;
        result.severity = 'high';
        result.reasons.push(`Possible coordinated harm: ${category}`);
        result.detectedPatterns.push(`coordinated_${category}`);
      }
    }
  }

  // ============================================================================
  // HIGH-RISK CONTENT - FLAG
  // ============================================================================

  for (const pattern of HIGH_RISK_KEYWORDS) {
    pattern.lastIndex = 0;
    if (pattern.test(textContent)) {
      result.shouldFlag = true;
      result.severity = result.severity === 'none' ? 'high' : result.severity;
      result.reasons.push('Contains high-risk suicide ideation language');
      result.crisisResourcesNeeded = true;
      result.detectedPatterns.push('high_risk_ideation');
      break;
    }
  }

  // ============================================================================
  // SPAM PATTERNS
  // ============================================================================

  for (const pattern of SPAM_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(textContent)) {
      result.shouldFlag = true;
      result.severity = result.severity === 'none' ? 'medium' : result.severity;
      result.reasons.push('Possible spam or scam content');
      result.detectedPatterns.push('spam');
      break;
    }
  }

  // ============================================================================
  // MEDICAL ADVICE
  // ============================================================================

  for (const pattern of MEDICAL_ADVICE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(textContent)) {
      result.shouldFlag = true;
      result.severity = result.severity === 'none' ? 'medium' : result.severity;
      result.reasons.push('Contains medical advice');
      result.detectedPatterns.push('medical_advice');
      break;
    }
  }

  // ============================================================================
  // POSITIVE INDICATORS - NEW FEATURE #8
  // ============================================================================

  let positiveScore = 0;
  for (const [category, patterns] of Object.entries(POSITIVE_INDICATORS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(textContent)) {
        positiveScore++;
        result.detectedPatterns.push(`positive_${category}`);
      }
    }
  }

  // Reduce severity if strong positive indicators
  if (positiveScore >= 2 && result.severity === 'high') {
    result.severity = 'medium';
  }

  // ============================================================================
  // TRIGGER WARNINGS
  // ============================================================================

  for (const [topic, patterns] of Object.entries(TRIGGER_WARNING_TOPICS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(textContent)) {
        if (!result.triggerWarnings.includes(topic)) {
          result.triggerWarnings.push(topic);
        }
      }
    }
  }

  return createLegacyResult(result);
}

/**
 * Helper to create legacy-compatible result
 */
function createLegacyResult(result: ModerationResult): ModerationResult & {
  blocked: boolean;
  flagged: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  needsTriggerWarning: boolean;
  suggestedTriggers: string[];
  reason?: string;
} {
  return {
    ...result,
    // Legacy properties
    blocked: result.shouldBlock,
    flagged: result.shouldFlag,
    riskLevel: result.severity,
    needsTriggerWarning: result.triggerWarnings.length > 0,
    suggestedTriggers: result.triggerWarnings,
    reason: result.reasons.length > 0 ? result.reasons[0] : undefined,
  };
}

// ============================================================================
// DUPLICATE CONTENT DETECTION
// ============================================================================

const recentContentHashes = new Map<string, number>();

export function checkDuplicateContent(content: string, userId: string): boolean {
  const contentHash = `${userId}:${content.trim().toLowerCase().slice(0, 100)}`;
  const lastSeen = recentContentHashes.get(contentHash);
  const now = Date.now();

  if (lastSeen && now - lastSeen < 60000) { // 1 minute
    return true; // Duplicate
  }

  recentContentHashes.set(contentHash, now);

  // Cleanup old entries (older than 5 minutes)
  for (const [hash, timestamp] of recentContentHashes.entries()) {
    if (now - timestamp > 300000) {
      recentContentHashes.delete(hash);
    }
  }

  return false;
}

// ============================================================================
// APPLY TRIGGER WARNINGS TO CONTENT
// ============================================================================

export function applyTriggerWarnings(content: string, warnings: string[]): string {
  if (warnings.length === 0) return content;

  const warningText = `⚠️ TW: ${warnings.join(', ')}

---

`;
  return warningText + content;
}

// ============================================================================
// LEGACY: Create content hash for duplicate detection (from old file)
// ============================================================================

export function createContentHash(content: string): string {
  // Normalize content: lowercase, remove punctuation, trim whitespace
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100); // First 100 chars for hash
  
  // Simple hash (for production, use crypto)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}
