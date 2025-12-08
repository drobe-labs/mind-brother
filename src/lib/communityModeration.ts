// communityModeration.ts
// Community Guardrails & Auto-Moderation System for Mental Health App

/**
 * CRITICAL KEYWORD DETECTION
 * Posts containing these keywords are immediately blocked
 */
export const criticalSuicideKeywords = [
  // Hanging methods
  /\b(hang|hanging) (?:myself|yourself)\b/i,
  /\b(?:rope|noose).*neck/i,
  
  // Overdose methods
  /\bov[e]?rdose on\b/i,
  /\b(?:take|taking|take too many) (?:too many )?(?:pills|meds|medication|drugs)\b/i,
  
  // Cutting methods
  /\bcut (?:my|your) wrists\b/i,
  /\bcut (?:my|your) (?:throat|neck|veins|arteries)\b/i,
  
  // Jumping methods
  /\bjump(?:ing)? off (?:a |the )?(?:bridge|building|cliff|roof|balcony|window)\b/i,
  /\bjump(?:ing)? (?:in front of|in front|onto) (?:a |the )?(?:train|car|bus|truck|traffic)\b/i,
  
  // Gun/firearm methods (expanded to catch more variations)
  /\b(?:gun|firearm|pistol|rifle|shotgun|revolver|handgun) to (?:my|your) (?:head|brain|temple)\b/i,
  /\b(?:use|using|shoot|shooting) (?:a |an |the )?(?:gun|firearm|pistol|rifle|shotgun|revolver|handgun)\b/i,
  /\b(?:put|putting|place|placing) (?:a |an )?bullet (?:in|through|into) (?:my|your) (?:head|brain|skull|temple)\b/i,
  /\b(?:shoot|shooting|blow) (?:my|your|myself|yourself) (?:in|with) (?:the )?(?:head|brain|skull|temple)\b/i,
  /\b(?:bullet|gunshot) (?:in|through|into) (?:my|your) (?:head|brain|skull)\b/i,
  /\bpull (?:the )?trigger (?:on myself|on yourself|on my|on your)/i,
  // Catch combinations of gun/bullet with brain/head (even if separated by other words)
  /\b(?:gun|firearm|pistol|rifle|bullet).*\b(?:brain|head|skull|temple)\b/i,
  /\b(?:brain|head|skull|temple).*\b(?:gun|firearm|pistol|rifle|bullet)\b/i,
  // Catch "bullet" with "brain" in same context
  /\bbullet.*brain|brain.*bullet/i,
  
  // Method-seeking and "how to" requests (block)
  /\b(?:how (?:to|do i)|tips|advice|suggest(?:ion|ions)?|best way) (?:to )?(?:kill myself|end my life|commit suicide|die)\b/i,
  // Quick/painless requests (block)
  /\b(?:quick|fast|painless|without pain|easy) (?:way|method)? (?:to )?(?:kill myself|end my life|commit suicide|die)\b/i,
  
  // Carbon monoxide
  /\bcarbon monoxide\b/i,
  /\b(?:exhaust|car|garage).*(?:fumes|monoxide|asphyxiat)/i,
  
  // Planning and timing
  /\b(?:plan|planning|planned|going to|gonna) (?:to |my |tonight |today |this week |soon )?(?:kill myself|suicide|end (?:my )?life|do it|end it)\b/i,
  /\b(?:tonight|today|this week|soon|right now) (?:i'?m|ill?|I will|gonna) (?:kill myself|end it|do it|end my life)\b/i,
  /\b(?:wrote|writing|written|left) (?:a |my )?(?:suicide )?note\b/i,
  
  // Goodbye statements
  /\b(?:say|saying|said|tell|telling|told) (?:goodbye|good bye).*\b(?:forever|last time|one last|for good)\b/i,
  
  // Hopelessness combined with action language
  /\bno (?:reason|point|use) (?:to |in )(?:liv(?:e|ing)|go(?:ing)? on|trying|continuing)\b/i,
  /\bworld (?:would be |is |will be )better (?:off )?without me\b/i,
  /\bcan'?t (?:take|do|handle|cope) (?:this|it|anymore)\b.*\b(?:end|over|done|finish)\b/i,
  
  // Explicit suicide method combinations
  /\b(?:kill|killing|end|ending) (?:my|your) (?:life|myself|yourself)\b/i,
  /\b(?:way|method|plan) (?:to )?(?:kill myself|end my life|commit suicide|die)\b/i,
  
  // Dangerous substance combinations
  /\b(?:drink|drinking|swallow|swallowing) (?:bleach|poison|chemicals|pills)\b/i,
];

export const criticalSelfHarmKeywords = [
  // Cutting methods
  /\bcut(?:ting)? (?:my|your|myself|yourself)\b/i,
  /\bcut(?:ting)? (?:my|your) (?:skin|arms|legs|wrists|thighs)\b/i,
  /\b(?:razor|knife|blade|sharp|scissors|glass)\b.*\b(?:cut|cutting|slice|slicing|skin)\b/i,
  /\b(?:want|need|going to|gonna) (?:to )?(?:cut|cutting|slice|hurt) (?:my|your|myself|yourself)\b/i,
  /\bwhere (?:to |should I )?(?:cut|make cuts)\b/i,
  /\bhow (?:to |do (?:you|i) |deep )?(?:cut|cutting|self[- ]?harm)\b/i,
  
  // Burning methods
  /\bbur(?:n|ning) (?:my|your|myself|yourself)\b/i,
  /\b(?:lighter|matches|cigarette|candle).*(?:burn|burning|skin)\b/i,
  
  // Hitting/harming
  /\bhit(?:ting)? (?:my|your|myself|yourself)\b/i,
  /\b(?:punch|punching|slap|slapping) (?:my|your|myself|yourself)\b/i,
  
  // Self-harm terminology
  /\b(?:self[- ]?harm|SI|self injury) (?:urges|thoughts|methods|how)\b/i,
  /\brelapse(?:d|ing)?\b.*\b(?:cut|cutting|self[- ]?harm|SI)\b/i,
  
  // Combination phrases indicating active self-harm planning
  /\b(?:going to|gonna|plan to|planning to) (?:hurt|harm|cut|burn|hit) (?:my|your|myself|yourself)\b/i,
];

/**
 * HIGH-RISK KEYWORD DETECTION
 * Posts are allowed but flagged for immediate review
 */
export const highRiskKeywords = [
  /\bsuicidal(?:| thoughts| ideation)\b/i,
  /\bwant (?:to |2 )(?:die|kill myself)\b/i,
  /\bwish i (?:was|were) dead\b/i,
  /\bdon'?t want to (?:be|live) (?:here|anymore)\b/i,
  /\bgive up on life\b/i,
  /\bthinking about (?:hurting|harming) myself\b/i,
  /\burges to (?:cut|hurt|harm)\b/i,
  /\bself[- ]?harm\b/i,
  /\bcan'?t (?:take|handle|cope) (?:this|it|anymore)\b/i,
  /\bcompletely (?:hopeless|helpless)\b/i,
  /\b(?:severe|extreme|unbearable) (?:pain|depression|anxiety)\b/i,
  /\bbreakdown\b/i,
  /\bcrisis\b/i,
];

/**
 * HARASSMENT & BULLYING DETECTION
 * Content that attacks, shames, or targets individuals
 */
export const harassmentPatterns = [
  // Direct personal attacks
  /\byou'?re (?:a |an )?(?:idiot|stupid|pathetic|waste|loser|attention[- ]?seeking|crazy|insane)\b/i,
  /\b(?:you|your) (?:are|need to|should) (?:shut up|go away|kill yourself|fuck off)\b/i,
  
  // Toxic positivity (dismissive, minimizing)
  /\b(?:just|simply) (?:think positive|be happy|try harder|get over it|stop being|snap out of it|cheer up|be grateful)\b/i,
  /\b(?:everyone|we all|everybody) (?:feels?|goes through|has) (?:this|that|depression|anxiety)\b.*\b(?:deal with it|suck it up|just deal|get over)\b/i,
  
  // Invalidation
  /\b(?:you don't|not really|probably not|doubt you|you're not) (?:have|need|really|actually) (?:depression|anxiety|PTSD|trauma|mental illness)\b/i,
  /\bthat'?s not (?:real|actual|true|really) (?:depression|anxiety|PTSD|trauma|mental illness)\b/i,
  /\b(?:it's|that's) (?:all in your head|not that bad|just drama|attention seeking)\b/i,
  
  // Gatekeeping mental health
  /\b(?:you can't|don't|shouldn't) (?:say|talk about|claim you have) (?:depression|anxiety|PTSD|trauma)\b/i,
  
  // Dismissive advice when not asked
  /\b(?:have you tried|why don't you|you should|just) (?:yoga|meditation|exercise|prayer|vitamins)\b.*\b(?:that's all|that's it|that fixes)\b/i,
];

/**
 * SPAM & SCAM DETECTION
 */
export const spamPatterns = [
  // Multiple URLs (excessive linking)
  /https?:\/\/.*https?:\/\/.*https?:\/\//i,
  
  // Suspicious link shorteners or promotional language
  /\b(?:bit\.ly|tinyurl|short\.link|click here|link in bio|DM me for)\b/i,
  
  // MLM/Pyramid scheme language
  /\b(?:work from home|make money|financial freedom|be your own boss|MLM|multi[- ]?level)\b/i,
  
  // Fake therapy/healing services
  /\b(?:certified healer|quantum|energy healing|cure depression|eliminate anxiety|100% guaranteed)\b.*\b(?:book now|contact me|DM|email|click)\b/i,
  
  // Pharmaceutical scams
  /\b(?:buy (?:pills|meds|medication)|cheap (?:pills|meds)|prescription without|no prescription)\b/i,
];

/**
 * MEDICAL ADVICE DETECTION
 * Users should not diagnose or prescribe
 */
export const medicalAdvicePatterns = [
  // Diagnosing others
  /\b(?:you have|you're|you've got|you definitely|you clearly) (?:depression|anxiety|bipolar|PTSD|ADHD|autism|OCD)\b/i,
  
  // Prescribing medication
  /\b(?:you should|you need|take|try|get) (?:this medication|these pills|this drug|this prescription)\b/i,
  /\b(?:dosage|mg|milligrams) (?:of|for) (?:Xanax|Valium|Prozac|Zoloft|Lexapro|antidepressant)\b/i,
  
  // Medical instructions
  /\b(?:stop taking|change|increase|decrease|cut|split) (?:your|your) (?:meds|medication|pills|prescription)\b/i,
  
  // Unqualified medical claims
  /\b(?:this will cure|guaranteed to fix|definitely works|100% effective|proven to treat)\b.*\b(?:depression|anxiety|mental illness|disorder)\b/i,
];

/**
 * TRIGGER WARNING DETECTION
 */
export const triggerKeywords = {
  depression: /\b(?:severe|major|clinical) depression\b/i,
  suicide: /\b(?:suicid(?:e|al)|want to die|end my life)\b/i,
  selfHarm: /\b(?:self[- ]?harm|cutting|SI|urges to hurt)\b/i,
  eatingDisorder: /\b(?:anorexia|bulimia|restrict|purge|binge)\b/i,
  substanceUse: /\b(?:alcohol|drug|addict|relapse|sober)\b/i,
  trauma: /\b(?:trauma|PTSD|flashback|abuse|assault)\b/i,
  panic: /\b(?:panic attack|can't breathe|heart racing)\b/i,
  grief: /\b(?:death|grief|lost|died|funeral)\b/i,
};

/**
 * Check if content contains trigger warning
 */
export function hasTriggerWarning(content: string): boolean {
  return /^(?:TW|CW|Trigger Warning|Content Warning):/i.test(content.trim());
}

/**
 * Analyze content for prohibited keywords
 */
export function analyzeContent(content: string): {
  blocked: boolean;
  flagged: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  needsTriggerWarning: boolean;
  suggestedTriggers: string[];
  reason?: string;
} {
  // Strip HTML tags for analysis
  const tmp = document.createElement('div');
  tmp.innerHTML = content;
  const textContent = tmp.textContent || tmp.innerText || '';
  const lowerContent = textContent.toLowerCase();

  // Compound logic: explicit suicide intent + method-seeking or "quick/painless"
  const explicitSuicideIntent = /\b(?:kill myself|end my life|commit suicide|die)\b/i;
  const methodSeeking = /\b(?:how (?:to|do i)|tips|advice|suggest(?:ion|ions)?|best way)\b/i;
  const quickOrPainless = /\b(?:quick|fast|painless|without pain|easy)\b/i;
  if (explicitSuicideIntent.test(lowerContent) && (methodSeeking.test(lowerContent) || quickOrPainless.test(lowerContent))) {
    return {
      blocked: true,
      flagged: true,
      riskLevel: 'critical',
      needsTriggerWarning: true,
      suggestedTriggers: ['Crisis'],
      reason: 'Method-seeking or quick/painless suicide request'
    };
  }

  // Check for critical keywords (BLOCK)
  for (const pattern of [...criticalSuicideKeywords, ...criticalSelfHarmKeywords]) {
    if (pattern.test(lowerContent)) {
      return {
        blocked: true,
        flagged: true,
        riskLevel: 'critical',
        needsTriggerWarning: true,
        suggestedTriggers: ['Crisis'],
        reason: 'Content contains prohibited suicide or self-harm methods'
      };
    }
  }

  // Check for harassment/bullying (BLOCK or FLAG)
  for (const pattern of harassmentPatterns) {
    if (pattern.test(lowerContent)) {
      // Some harassment is critical enough to block immediately
      const criticalHarassment = /\b(?:kill yourself|fuck off|shut up|go away)\b/i;
      if (criticalHarassment.test(lowerContent)) {
        return {
          blocked: true,
          flagged: true,
          riskLevel: 'critical',
          needsTriggerWarning: false,
          suggestedTriggers: [],
          reason: 'Content contains harassment or bullying'
        };
      }
      // Other harassment should be flagged for review
      return {
        blocked: false,
        flagged: true,
        riskLevel: 'high',
        needsTriggerWarning: false,
        suggestedTriggers: [],
        reason: 'Content may contain harassment or harmful language'
      };
    }
  }

  // Check for spam/scams (FLAG)
  for (const pattern of spamPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        blocked: false,
        flagged: true,
        riskLevel: 'medium',
        needsTriggerWarning: false,
        suggestedTriggers: [],
        reason: 'Content may be spam or promotional'
      };
    }
  }

  // Check for medical advice (FLAG)
  for (const pattern of medicalAdvicePatterns) {
    if (pattern.test(lowerContent)) {
      return {
        blocked: false,
        flagged: true,
        riskLevel: 'medium',
        needsTriggerWarning: false,
        suggestedTriggers: [],
        reason: 'Content may contain unqualified medical advice'
      };
    }
  }

  // Check for high-risk keywords (FLAG for review)
  let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
  const suggestedTriggers: string[] = [];

  for (const pattern of highRiskKeywords) {
    if (pattern.test(lowerContent)) {
      riskLevel = 'high';
      break;
    }
  }

  // Check for trigger warnings needed
  for (const [topic, pattern] of Object.entries(triggerKeywords)) {
    if (pattern.test(lowerContent)) {
      const displayTopic = topic
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^./, char => char.toUpperCase());
      suggestedTriggers.push(displayTopic);
    }
  }

  // Determine if blocked (critical only) or flagged
  return {
    blocked: false,
    flagged: riskLevel === 'high',
    riskLevel,
    needsTriggerWarning: suggestedTriggers.length > 0 && !hasTriggerWarning(content),
    suggestedTriggers
  };
}

/**
 * Get crisis resources message
 */
export function getCrisisResources(): string {
  return `🆘 CRISIS RESOURCES - IMMEDIATE HELP AVAILABLE

If you or someone you know is in crisis:

📞 Call 988 (Suicide & Crisis Lifeline)
   Available 24/7 - Call or text 988

💬 Crisis Text Line
   Text HOME to 741741

🌐 International Crisis Resources
   Visit: https://www.iasp.info/resources/Crisis_Centres/

🏥 Emergency Services
   Call 911 or go to your nearest emergency room

🤖 Chat with Amani
   Your personal AI support (in app)

🔍 Find a Therapist
   Use our Resources section

You are not alone. Help is available 24/7.`;
}

/**
 * Format content warning for display
 */
export function formatTriggerWarning(topics: string[]): string {
  return `⚠️ TW: ${topics.join(', ')}`;
}

/**
 * Generate block message for prohibited content
 */
export function getBlockedMessage(reason: string): string {
  return `We're concerned about the content in your post. If you're in crisis, please reach out for help immediately.

${getCrisisResources()}

Our community guidelines prohibit detailed descriptions of suicide methods or self-harm. You can share that you're struggling without specific details.

Would you like to:
• Edit your post to remove prohibited content
• Chat with Amani (AI support) for immediate help
• Cancel and get crisis resources`;
}

/**
 * Create a simple content hash for duplicate detection
 */
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


