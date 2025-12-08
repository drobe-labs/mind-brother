import { modernRAG } from './modernRAG';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export class SmartChatbotService {
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  // Generate intelligent response using modern RAG
  public generateResponse(
    userMessage: string,
    userId: string = 'default',
    conversationHistory: ChatMessage[] = []
  ): string {
    try {
      // Get last message from Amani (to check if we asked a question)
      const lastAmaniMessage = conversationHistory && conversationHistory.length > 0 
        ? conversationHistory[conversationHistory.length - 1]
        : null;
      
      // Detect patterns in user message (with conversation context)
      const patterns = modernRAG.detectPatterns(userMessage);
      
      // Get relevant knowledge
      const relevantKnowledge = modernRAG.retrieveRelevantKnowledge(userMessage, 2);
      
      // Generate response based on patterns and knowledge
      let response = this.buildResponse(userMessage, patterns, relevantKnowledge, lastAmaniMessage, conversationHistory, userId);
      
      // Store conversation
      this.storeConversation(userId, userMessage, response);
      
      return response;
    } catch (error) {
      console.error('Error generating chatbot response:', error);
      // Fallback response if something goes wrong
      return `I'm having trouble processing that right now. Can you try rephrasing what you're going through?`;
    }
  }

  private buildResponse(
    userMessage: string,
    patterns: any,
    knowledge: any[],
    lastAmaniMessage: ChatMessage | null = null,
    conversationHistory: ChatMessage[] = [],
    userId: string = 'default'
  ): string {
    // ===== CONVERSATION-AWARE DETECTION =====
    // Check if user is responding to our question
    const isRespondingToQuestion = this.isResponseToQuestion(userMessage, lastAmaniMessage);
    
    // Check for repetitive responses and adjust accordingly
    const recentResponses = this.getRecentResponses(userMessage, patterns, userId);
    if (recentResponses.isRepetitive) {
      return this.getVariedResponse(userMessage, patterns, recentResponses.lastResponseType);
    }
    
    // If user says "not good" right after we asked "how are you", it's definitely distress
    if (isRespondingToQuestion.respondingToHowAreYou && patterns.isDepression) {
      return this.getDepressionResponse(userMessage);
    }
    
    // If user gives one-word negative response after we asked something, explore it
    if (isRespondingToQuestion.isShortNegativeResponse) {
      return this.getShortNegativeResponseHandler(userMessage);
    }
    // ===== TIER 1: CRISIS & SAFETY (ALWAYS FIRST) =====
    if (patterns.isCrisis) {
      return this.getCrisisResponse();
    }
    
    // ===== TIER 2: BASIC COMMUNICATION (GREETINGS/ENDINGS) =====
    if (patterns.isGreeting) {
      return this.getGreetingResponse();
    }
    
    if (patterns.isConversationEnding) {
      return this.getConversationEndingResponse(userMessage);
    }
    
    if (patterns.isFarewell) {
      return this.getFarewellResponse();
    }
    
    if (patterns.isGratitude) {
      return this.getGratitudeResponse();
    }
    
    if (patterns.isPositiveEmotion) {
      return this.getPositiveEmotionResponse(userMessage);
    }
    
    // ===== TIER 3: SERIOUS MENTAL HEALTH ISSUES =====
    // Trauma (very serious)
    if (patterns.isTrauma) {
      return this.getTraumaResponse(userMessage);
    }
    
    // Paranoia (very serious)
    if (patterns.isParanoia) {
      return this.getParanoiaResponse(userMessage);
    }
    
    // Substance abuse (very serious)
    if (patterns.isSubstance) {
      return this.getSubstanceResponse(userMessage);
    }
    
    // Treatment/therapy not working (important - need to adjust approach)
    if (patterns.isTreatmentNotWorking) {
      return this.getTreatmentNotWorkingResponse(userMessage);
    }
    
    // ===== TIER 4: LIFE CIRCUMSTANCES (BEFORE GENERAL EMOTIONS) =====
    // Job loss & employment (specific life event)
    if (patterns.isJobLoss) {
      return this.getJobLossResponse(userMessage);
    }
    
    // Financial stress (specific stressor)
    if (patterns.isFinancial) {
      return this.getFinancialResponse(userMessage, lastAmaniMessage, conversationHistory);
    }
    
    // Relationship issues (specific area)
    if (patterns.isRelationship) {
      return this.getRelationshipResponse(userMessage);
    }
    
    // Workplace stress (specific context)
    if (patterns.isWorkplace) {
      return this.getWorkplaceResponse(userMessage);
    }
    
    // Fatherhood (specific role/identity)
    if (patterns.isFatherhood) {
      return this.getFatherhoodResponse(userMessage);
    }
    
    // ===== TIER 5: MENTAL HEALTH CONDITIONS =====
    // Overwhelmed (distinct from anxiety - check first)
    if (patterns.isOverwhelmed) {
      return this.getOverwhelmedResponse(userMessage);
    }
    
    // Self-doubt / Role struggle (check before depression - more specific)
    if (patterns.isSelfDoubt) {
      return this.getSelfDoubtResponse(userMessage);
    }
    
    // Depression (common, specific)
    if (patterns.isDepression) {
      return this.getDepressionResponse(userMessage);
    }
    
    // Anxiety (common, specific)
    if (patterns.isAnxiety) {
      return this.getAnxietyResponse(userMessage);
    }
    
    // Frustration (NEW - distinct from anger: feeling stuck or blocked)
    if (patterns.isFrustration) {
      return this.getFrustrationResponse(userMessage);
    }
    
    // Anger (emotion with behavioral component)
    if (patterns.isAnger) {
      return this.getAngerResponse(userMessage);
    }
    
    // Self-esteem (specific issue)
    if (patterns.isSelfEsteem) {
      return this.getSelfEsteemResponse(userMessage);
    }
    
    // Loneliness (specific feeling)
    if (patterns.isLoneliness) {
      return this.getLonelinessResponse(userMessage);
    }
    
    // ===== TIER 6: IDENTITY & CULTURAL =====
    // Sexuality (sensitive topic)
    if (patterns.isSexuality) {
      return this.getSexualityResponse(userMessage);
    }
    
    // Identity & masculinity
    if (patterns.isIdentity || patterns.isMasculinity) {
      return this.getMasculinityResponse(userMessage);
    }
    
    // World concerns
    if (patterns.isWorldConcerns) {
      return this.getWorldConcernsResponse(userMessage);
    }
    
    // ===== TIER 7: GENERAL WELLNESS =====
    // Health concerns
    if (patterns.isHealth) {
      return this.getHealthResponse(userMessage);
    }
    
    // Self-care
    if (patterns.isSelfCare) {
      return this.getSelfCareResponse(userMessage);
    }
    
    // Fatigue
    if (patterns.isFatigue) {
      return this.getFatigueResponse();
    }
    
    // ===== TIER 8: COMMUNICATION STYLES =====
    // Urban slang (cultural relevance)
    if (patterns.isUrbanSlang) {
      return this.getUrbanSlangResponse(userMessage);
    }
    
    // Digital communication
    if (patterns.isDigitalCommunication) {
      return this.getDigitalCommunicationResponse(userMessage);
    }
    
    // Humor
    if (patterns.isHumor) {
      return this.getHumorResponse();
    }
    
    // Shock
    if (patterns.isShock) {
      return this.getShockResponse(userMessage);
    }
    
    // ===== TIER 9: GENERAL EMOTIONAL (BEFORE META-CONVERSATION) =====
    if (patterns.isGeneralEmotional) {
      return this.getGeneralEmotionalResponse(userMessage);
    }
    
    // ===== TIER 10: REQUEST TYPES =====
    // Task frustration (specific problem-solving)
    if (patterns.isTaskFrustration) {
      return this.getTaskFrustrationResponse(userMessage);
    }
    
    if (patterns.isHelpRequest) {
      return this.getHelpRequestResponse();
    }
    
    if (patterns.isPracticalAdvice) {
      return this.getPracticalAdviceResponse();
    }
    
    if (patterns.isEmotionalSupport) {
      return this.getEmotionalSupportResponse();
    }
    
    if (patterns.isInformation) {
      return this.getInformationResponse();
    }
    
    if (patterns.isInformationRequest) {
      return this.getInformationRequestResponse(userMessage);
    }
    
    // ===== TIER 11: SIMPLE RESPONSES =====
    if (patterns.isAffirmation) {
      return this.getAffirmationResponse();
    }
    
    if (patterns.isNegation && !this.hasEmotionalContext(userMessage)) {
      return this.getNegationResponse();
    }
    
    if (patterns.isUncertainty) {
      return this.getUncertaintyResponse();
    }
    
    if (patterns.isActionRequest) {
      return this.getActionRequestResponse();
    }
    
    if (patterns.isEndAction) {
      return this.getEndActionResponse();
    }
    
    if (patterns.isTimeReference) {
      return this.getTimeReferenceResponse(userMessage);
    }
    
    // ===== TIER 12: TECH ISSUES (LAST - MOST GENERIC) =====
    if (patterns.isTechIssue) {
      return this.getTechIssueResponse();
    }
    
    // ===== TIER 13: ABSOLUTE FALLBACK =====
    // If nothing else matched, use general response
    return this.getGeneralResponse(userMessage);
  }

  private getCrisisResponse(): string {
    return `🚨 I'm very concerned about you right now. Your life has value and you don't have to go through this alone.

Please reach out for immediate help:
• 988 Suicide & Crisis Lifeline: Call or text 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: Call 911

If you're not in immediate danger but need support:
• National Alliance on Mental Illness: 1-800-950-NAMI
• SAMHSA National Helpline: 1-800-662-4357

You matter, and there are people who want to help you through this difficult time. Can you reach out to one of these resources right now?`;
  }

  private getJobLossResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    const culturalContext = this.hasCulturalContext(userMessage);
    const culturalAddition = culturalContext ? 
      " I understand this can be especially challenging when facing discrimination or bias in the job market." : "";
    
    // Handle feeling like a burden
    if (text.includes('burden') || text.includes('feel bad') || text.includes('guilty')) {
      return `Being out of work doesn't make you a burden - you're going through a difficult transition. Your worth isn't tied to your job status. How are you and your wife navigating this together?`;
    }
    
    // Handle not working/unemployment
    if (text.includes('not working') || text.includes('out of work') || text.includes('no job')) {
      return `Not having work right now is tough, especially when it affects how you see yourself and your role. What's been the hardest part for you?`;
    }
    
    // Handle explicit layoff
    if (text.includes('laid off') || text.includes('layoff')) {
      return `I'm really sorry to hear you were laid off. That's such a tough experience. How long has it been, and how are you holding up?`;
    }
    
    // Default job loss response
    return `Losing your job is one of life's major stressors.${culturalAddition} What's weighing on you most right now?`;
  }

  private getDepressionResponse(userMessage: string): string {
    const culturalContext = this.hasCulturalContext(userMessage);
    const culturalAddition = culturalContext ? 
      " I know that depression in our communities is often underdiagnosed because of cultural barriers and historical mistrust of healthcare systems." : "";
    
    // More intuitive responses based on what they actually said
    if (userMessage.toLowerCase().includes("not doing well") || userMessage.toLowerCase().includes("not too well")) {
      return `That sounds rough.${culturalAddition} What's been going on?`;
    }
    
    if (userMessage.toLowerCase().includes("sad")) {
      return `I'm sorry you're feeling sad.${culturalAddition} Want to talk about it?`;
    }
    
    return `I hear you.${culturalAddition} What's on your mind?`;
  }

  private getAnxietyResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Racing thoughts / overthinking
    if (text.includes('racing') || text.includes('overthinking') || text.includes('can\'t stop thinking')) {
      return `Racing thoughts can be exhausting. Try grounding yourself - name 5 things you can see right now. What's one thing you can control in this moment?`;
    }
    
    // Nervous, uneasy, uncomfortable
    if (text.includes('nervous') || text.includes('uneasy') || text.includes('uncomfortable')) {
      return `That nervous energy is real. Sometimes our body picks up on things before our mind does. What do you think might be causing it?`;
    }
    
    // General anxiety
    if (text.includes('anxious') && text.includes('don\'t know why')) {
      return `Anxiety without a clear reason can be frustrating. Sometimes it's just our nervous system being overactive. Have you tried any breathing exercises or physical movement?`;
    }
    
    return `I hear that you're feeling anxious. What's making you feel this way?`;
  }

  private getOverwhelmedResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Too many tasks/responsibilities
    if (text.includes('too much') || text.includes('too many') || text.includes('everything at once') || text.includes('all at once')) {
      return `It sounds like you have a lot on your plate right now. When everything feels like it's piling up, it can be helpful to take a step back and prioritize. What feels most urgent to tackle first?`;
    }
    
    // Can't handle/cope
    if (text.includes('can\'t handle') || text.includes('can\'t cope') || text.includes('drowning') || text.includes('swamped')) {
      return `Feeling like you can't handle everything is completely valid. Sometimes we need to recognize our limits and ask for help. What would make you feel more supported right now?`;
    }
    
    // Weight of responsibilities
    if (text.includes('weight') || text.includes('crushing') || text.includes('suffocating') || text.includes('trapped')) {
      return `That feeling of being crushed by responsibilities is so heavy. It's okay to feel this way - you're carrying a lot. What's one small thing you could take off your plate today?`;
    }
    
    // Out of control
    if (text.includes('out of control') || text.includes('lost control') || text.includes('spinning') || text.includes('spiraling')) {
      return `When everything feels out of control, it can be scary. Try focusing on what you can control right now - even something small like taking a few deep breaths. What's one thing you can control in this moment?`;
    }
    
    // General overwhelmed
    return `I hear that you're feeling overwhelmed. That's a really tough place to be. What's contributing most to this feeling right now?`;
  }

  private getWorkplaceResponse(userMessage: string): string {
    const culturalContext = this.hasCulturalContext(userMessage);
    const culturalAddition = culturalContext ? 
      " I understand workplace challenges can be particularly difficult when dealing with discrimination or being the only person of color in spaces." : "";
    
    return `Workplace stress can really impact your well-being.${culturalAddition} What specific aspects of your work situation are bothering you most?`;
  }

  private getRelationshipResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Workplace relationship scenarios
    if (text.includes('inappropriate relationship') || text.includes('workplace relationship') || text.includes('office romance') || text.includes('work romance')) {
      return `Workplace relationships can be really complicated, especially when they cross professional boundaries. This sounds like it's weighing on you. What's making this relationship feel inappropriate to you?`;
    }
    
    if (text.includes('affair') || text.includes('extramarital') || text.includes('emotional affair') || text.includes('physical affair')) {
      return `Affairs can be incredibly painful and confusing for everyone involved. It sounds like you're dealing with some complex emotions around this. What's been most difficult about this situation?`;
    }
    
    if (text.includes('crush') || text.includes('attraction') || text.includes('flirting')) {
      return `Having feelings for someone can be exciting but also complicated, especially when it's not straightforward. What's making this attraction difficult for you to navigate?`;
    }
    
    if (text.includes('boundaries') || text.includes('professional boundaries')) {
      return `Setting and maintaining boundaries, especially in professional settings, can be really challenging. What boundaries are you struggling with?`;
    }
    
    if (text.includes('cheat') || text.includes('cheating')) {
      return `I'm really sorry you're dealing with suspicions about cheating. That's such a painful and confusing situation to be in. What's making you think your girlfriend might be cheating?`;
    }
    
    if (text.includes('breakup') || text.includes('break up')) {
      return `I'm sorry to hear your relationship isn't working out. Breakups can be really painful, even when you know it's for the best. How are you feeling about everything?`;
    }
    
    return `Relationships can be challenging sometimes. What relationship situations are you finding most difficult right now?`;
  }

  private getGeneralResponse(userMessage: string): string {
    return `I'm still getting to know you and don't quite understand. Can you try and break down what you are trying to tell me so I can try to understand you better?`;
  }

  // New response methods for expanded topics
  private getTraumaResponse(userMessage: string): string {
    return `I'm really sorry you're dealing with trauma. That's such a heavy burden to carry, and it takes incredible strength to talk about it. What's been most difficult about processing what happened?`;
  }

  private getParanoiaResponse(userMessage: string): string {
    return `I can hear that you're feeling suspicious or paranoid about people's intentions. Those thoughts can be really overwhelming and make it hard to trust or feel safe. What's been making you feel this way?`;
  }

  private getFrustrationResponse(userMessage: string): string {
    return `I hear that you're feeling frustrated. Frustration is a completely valid emotion - it often comes up when we feel stuck, blocked, or like things aren't working out the way we hoped. What's been making you feel this way?`;
  }

  private getAngerResponse(userMessage: string): string {
    return `I hear that you're feeling angry. Anger is a completely valid emotion, and it often comes up when we're feeling hurt or when our boundaries have been crossed. What's been triggering these feelings for you?`;
  }

  private getSubstanceResponse(userMessage: string): string {
    return `I'm glad you're talking about this. Substance use can sometimes develop as a way to cope with difficult emotions or situations. What's been your experience with this?`;
  }

  private getTreatmentNotWorkingResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Medication not working
    if (text.includes('medication') || text.includes('meds') || text.includes('antidepressant')) {
      return `It's frustrating when medication doesn't help like you hoped. This is actually really common - finding the right medication can take time and adjustments. Have you talked to your doctor about this? They might need to adjust the dosage or try a different medication. What's been your experience with it?`;
    }
    
    // Therapy not working
    if (text.includes('therapy') || text.includes('therapist') || text.includes('counseling')) {
      return `I hear you - it can be really discouraging when therapy doesn't feel helpful. Sometimes it's about fit (the therapist's style might not match what you need), or it might just need more time. What's not working about it for you?`;
    }
    
    // Coping strategy not working
    if (text.includes('coping') || text.includes('strategy') || text.includes('technique') || text.includes('approach')) {
      return `Not every coping strategy works for everyone, and that's okay. What matters is finding what works for you. What have you tried, and what's not clicking?`;
    }
    
    // General treatment concern
    return `It sounds like you're not getting the help you need from your current approach. That's worth exploring. What's not working about it?`;
  }

  // Check if user is responding to a question we asked
  private isResponseToQuestion(userMessage: string, lastAmaniMessage: ChatMessage | null): {
    respondingToHowAreYou: boolean;
    isShortNegativeResponse: boolean;
    respondingToOpenQuestion: boolean;
  } {
    if (!lastAmaniMessage) {
      return {
        respondingToHowAreYou: false,
        isShortNegativeResponse: false,
        respondingToOpenQuestion: false
      };
    }
    
    const lastMessage = lastAmaniMessage.content.toLowerCase();
    const userText = userMessage.toLowerCase().trim();
    const wordCount = userMessage.split(/\s+/).length;
    
    // Did we ask "how are you" or variations?
    const askedHowAreYou = /\b(how\s+are\s+you|how\s+you\s+doing|how's\s+it\s+going|how\s+have\s+you\s+been|feeling\s+today)\b/i.test(lastMessage);
    
    // Is the response short and negative?
    const distressWords = /\b(not\s+(good|great|well|okay|ok)|terrible|awful|struggling|rough|hard|tough|bad|horrible)\b/i;
    const isShortAndNegative = wordCount <= 5 && distressWords.test(userText);
    
    // Did we ask an open-ended question?
    const askedOpenQuestion = lastMessage.includes('?');
    
    return {
      respondingToHowAreYou: askedHowAreYou && distressWords.test(userText),
      isShortNegativeResponse: isShortAndNegative && askedOpenQuestion,
      respondingToOpenQuestion: askedOpenQuestion
    };
  }

  // Handle short negative responses (1-5 words)
  private getShortNegativeResponseHandler(userMessage: string): string {
    const text = userMessage.toLowerCase().trim();
    
    // Very short distress signals
    if (text === 'not good' || text === 'not too good' || text === 'not well') {
      return `I'm sorry to hear that. What's been going on?`;
    }
    
    if (text === 'terrible' || text === 'awful' || text === 'horrible') {
      return `That sounds really tough. Want to talk about it?`;
    }
    
    if (text === 'struggling' || text === 'rough' || text === 'hard') {
      return `I hear you. What's been making things hard?`;
    }
    
    if (text === 'bad' || text === 'not okay') {
      return `I'm sorry things aren't okay. What's happening?`;
    }
    
    // Default for short negative responses
    return `That sounds difficult. What's on your mind?`;
  }

  // Handle self-doubt / role struggle
  private getSelfDoubtResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Parenting / fatherhood doubt
    if (text.includes('father') || text.includes('dad') || text.includes('parent')) {
      return `Being a parent is one of the hardest things anyone can do. The fact that you care about being good at it shows you already are. What's making you doubt yourself?`;
    }
    
    // Relationship doubt
    if (text.includes('relationship') || text.includes('partner') || text.includes('husband') || text.includes('marriage')) {
      return `Relationships take work, and doubting yourself doesn't mean you're failing. What's making you feel like you can't handle this?`;
    }
    
    // Job/career doubt
    if (text.includes('job') || text.includes('career') || text.includes('work')) {
      return `Feeling like you can't handle your job is really stressful. Sometimes we're harder on ourselves than we need to be. What specifically is making you doubt your ability?`;
    }
    
    // General "can't be good enough"
    if (text.includes('good enough') || text.includes('better') || text.includes('enough')) {
      return `"Not good enough" is a really heavy burden to carry. Often we set impossible standards for ourselves. What does "good enough" look like to you?`;
    }
    
    // Default self-doubt response
    return `Self-doubt is tough. It sounds like you're questioning your ability in something important to you. What's bringing this up?`;
  }

  // Handle task frustration
  private getTaskFrustrationResponse(userMessage: string): string {
    return `Task frustration is real. Sometimes when we're stuck, we need to step back or try a different approach. What are you working on that's got you stuck?`;
  }

  private getSelfEsteemResponse(userMessage: string): string {
    return `I hear you, and I want you to know that your worth isn't determined by any single thing or person. It sounds like you're being really hard on yourself. What's making you feel this way about yourself?`;
  }

  private getLonelinessResponse(userMessage: string): string {
    return `Loneliness can be really painful, especially when it feels like everyone else has connections and you don't. You're not alone in feeling this way. What's been making you feel most isolated?`;
  }

  private getFinancialResponse(
    userMessage: string, 
    lastAmaniMessage: ChatMessage | null = null,
    conversationHistory: ChatMessage[] = []
  ): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if we just asked about financial pressure and user is providing details
    const lastMessage = lastAmaniMessage?.content.toLowerCase() || '';
    const askedAboutFinancialPressure = lastMessage.includes('financial pressure') || 
                                        lastMessage.includes('money worries') ||
                                        lastMessage.includes('financial stress');
    
    // Check if user already provided specific financial details
    const hasSpecificDetails = lowerMessage.includes('trip') || 
                               lowerMessage.includes('christmas') ||
                               lowerMessage.includes('prepaid') ||
                               lowerMessage.includes('pre paid') ||
                               lowerMessage.includes('expecting money') ||
                               lowerMessage.includes('waiting for money') ||
                               lowerMessage.includes('broke') ||
                               lowerMessage.includes('spent') ||
                               lowerMessage.includes('paid for');
    
    // If user is responding to our question with details, acknowledge and respond to specifics
    if (askedAboutFinancialPressure && hasSpecificDetails) {
      const hasTrips = lowerMessage.includes('trip');
      const hasChristmas = lowerMessage.includes('christmas');
      const isBroke = lowerMessage.includes('broke');
      const isWaitingForMoney = lowerMessage.includes('expecting') || lowerMessage.includes('waiting');
      
      let response = `I hear you - that's a really stressful situation. `;
      
      if (hasTrips && isBroke) {
        response += `You've already committed money to trips, and now you're broke while still having to go. `;
      }
      
      if (hasChristmas) {
        response += `And with Christmas coming, the financial pressure is even more intense. `;
      }
      
      if (isWaitingForMoney) {
        response += `The uncertainty of waiting for money that hasn't come in yet adds another layer of stress. `;
      }
      
      response += `It sounds like you're caught between commitments you've already made and money that hasn't arrived yet. What's your biggest concern right now - the immediate expenses, or the uncertainty about when the money will come?`;
      
      return response;
    }
    
    // If user already provided details in this message, respond to them
    if (hasSpecificDetails && !askedAboutFinancialPressure) {
      const hasTrips = lowerMessage.includes('trip');
      const hasChristmas = lowerMessage.includes('christmas');
      const isBroke = lowerMessage.includes('broke');
      const isWaitingForMoney = lowerMessage.includes('expecting') || lowerMessage.includes('waiting');
      
      let response = `That sounds really stressful. `;
      
      if (isWaitingForMoney && isBroke) {
        response += `Waiting for money that hasn't come in while you're already broke is incredibly anxiety-provoking. `;
      }
      
      if (hasTrips) {
        response += `And having prepaid for trips means you're committed to expenses even though the money situation is tight. `;
      }
      
      if (hasChristmas) {
        response += `With Christmas coming, the financial pressure is building even more. `;
      }
      
      response += `It's a lot to manage all at once. What's weighing on you most - the immediate financial crunch, or the uncertainty about when things will get better?`;
      
      return response;
    }
    
    // Check conversation history for previous financial mentions
    const previousFinancialMentions = conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(-3) // Check last 3 user messages
      .some(msg => {
        const text = msg.content.toLowerCase();
        return text.includes('money') || text.includes('financial') || text.includes('broke') || 
               text.includes('trip') || text.includes('christmas');
      });
    
    // If we've already discussed financial issues, don't ask the same question
    if (previousFinancialMentions && !hasSpecificDetails) {
      return `I know financial stress can feel overwhelming. What aspect of your money situation is bothering you most right now?`;
    }
    
    // Default: first time discussing finances
    return `Financial stress can really weigh on you and affect your mental health. Money worries can feel overwhelming and all-consuming. What's been the biggest financial pressure you're facing?`;
  }

  private getIdentityResponse(userMessage: string): string {
    return `Identity questions can be really complex and confusing, especially when you're trying to figure out who you are in different spaces. What aspects of your identity are you struggling with most?`;
  }

  private getSexualityResponse(userMessage: string): string {
    return `I'm here to listen without judgment. Sexuality and sexual health can be complicated topics, especially when there's shame or stigma involved. What would be most helpful for you to talk about?`;
  }

  private getFatherhoodResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    if (text.includes('new dad') || text.includes('new father') || text.includes('overwhelmed')) {
      return `Being a new dad is such a huge life change, and it's completely normal to feel overwhelmed. You're learning to care for a tiny human while also taking care of yourself - that's a lot! What's been the most overwhelming part of new fatherhood for you?`;
    }
    
    return `Fatherhood can bring up so many different emotions and challenges. Whether you're dealing with custody issues, struggling with parenting, or just trying to figure it all out, it's okay to talk about these feelings. What's been most challenging about fatherhood for you?`;
  }

  private getHealthResponse(userMessage: string): string {
    return `Physical and mental health are so connected, and it's important to take care of both. What health concerns have been on your mind lately?`;
  }

  private getMasculinityResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    if (text.includes('microaggression') || text.includes('microaggressions')) {
      return `Microaggressions can be really draining and confusing to deal with. It's completely valid to feel frustrated or hurt by them, and you're not overreacting. These subtle forms of discrimination can have a real impact on your mental health. What specific situations have you been dealing with?`;
    }
    
    if (text.includes('racism') || text.includes('racial') || text.includes('discrimination') || text.includes('bias')) {
      return `I hear you, and I want you to know that your experiences with racism and discrimination are real and valid. These experiences can be incredibly painful and it's important to acknowledge their impact on your mental health. What's been most challenging about dealing with these situations?`;
    }
    
    return `I hear you, and I want you to know that being vulnerable and talking about your feelings doesn't make you any less of a man. Those old stereotypes about "being strong" and "not crying" can be really harmful. What's been most difficult about navigating masculinity for you?`;
  }

  private getSelfCareResponse(userMessage: string): string {
    return `Self-care is so important for your mental health, and it's not selfish to prioritize it. What kinds of self-care activities have you been doing, or what would you like to try?`;
  }

  // Basic Communication Pattern Responses
  private getGreetingResponse(): string {
    return `Hey 👋, how's your day going so far?`;
  }

  private getFarewellResponse(): string {
    return `Take care, I'll be here if you need me again.`;
  }

  private getGratitudeResponse(): string {
    return `You're welcome, happy to help!`;
  }

  private getPositiveEmotionResponse(userMessage: string): string {
    return `That's awesome! Want to share what made you feel good?`;
  }

  private getHumorResponse(): string {
    return `😂 Glad that made you laugh! What's up?`;
  }

  private getShockResponse(userMessage: string): string {
    return `That sounds intense — want to tell me what happened?`;
  }

  private getHelpRequestResponse(): string {
    return `Got it — do you need emotional support, info, or practical advice?`;
  }

  private getPracticalAdviceResponse(): string {
    return `I'm here to help with practical advice. What specific situation are you dealing with that you'd like some guidance on?`;
  }

  private getEmotionalSupportResponse(): string {
    return `I'm here to provide emotional support. What's been weighing on you lately?`;
  }

  private getInformationResponse(): string {
    return `I can help with information. What would you like to know more about?`;
  }

  private getInformationRequestResponse(userMessage: string): string {
    return `Here's what that means: [simple definition]. Want more details?`;
  }

  private getAffirmationResponse(): string {
    return `Great, let's keep going.`;
  }

  private getNegationResponse(): string {
    return `No problem — let's try something else or pause.`;
  }

  private getUncertaintyResponse(): string {
    return `That's okay — want to explore a few options together?`;
  }

  private getActionRequestResponse(): string {
    return `Sure, let's start now. Here's the first step…`;
  }

  private getEndActionResponse(): string {
    return `Understood. We'll pause here.`;
  }

  private getTimeReferenceResponse(userMessage: string): string {
    return `Okay, when exactly do you want to focus on this — today or later?`;
  }

  private getTechIssueResponse(): string {
    return `Sorry about that! Can you tell me what went wrong?`;
  }

  private getFatigueResponse(): string {
    return `Rest sounds important. Want some tips to recharge?`;
  }

  private getUrbanSlangResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Agreement & Confirmation
    if (text.includes('bet')) {
      return `Bet 👍 Got it, let's roll.`;
    }
    
    if (text.includes('no cap')) {
      return `Got it — thanks for keeping it real.`;
    }
    
    if (text.includes('deadass')) {
      return `Deadass? Wow, that sounds serious.`;
    }
    
    // Greetings & Bonding
    if (text.includes('bruh') || text.includes('bro') || text.includes('fam')) {
      return `What's up, fam? How you doing?`;
    }
    
    // Positive Reactions
    if (text.includes('lit')) {
      return `That sounds lit 🔥 what made it so good?`;
    }
    
    if (text.includes('flex')) {
      return `Nice flex 💪 — sounds like you're proud of that win.`;
    }
    
    if (text.includes('drip')) {
      return `That drip sounds fresh — confidence matters.`;
    }
    
    if (text.includes('w') || text.includes('win')) {
      return `Big W 🙌 congrats on that!`;
    }
    
    if (text.includes('goat')) {
      return `That's a GOAT-level move — big respect.`;
    }
    
    if (text.includes('bop')) {
      return `That song's a bop 🎶 got it on repeat?`;
    }
    
    // Emotional States
    if (text.includes('lowkey')) {
      return `Lowkey? Interesting… want to share more?`;
    }
    
    if (text.includes('highkey')) {
      return `Highkey respect that — thanks for being upfront.`;
    }
    
    if (text.includes('vibe') || text.includes('vibing')) {
      return `I like the vibe — how's your mood right now?`;
    }
    
    if (text.includes('mood')) {
      return `Yeah, I feel that mood too sometimes.`;
    }
    
    if (text.includes('salty')) {
      return `Sounds like you're salty about it — want to vent?`;
    }
    
    // Distrust & Suspicion
    if (text.includes('cap')) {
      return `No cap — are you saying that for real?`;
    }
    
    if (text.includes('sus')) {
      return `Hmm, sounds kinda sus. What makes you feel that way?`;
    }
    
    // Loss & Setbacks
    if (text.includes('l') || text.includes('loss')) {
      return `Tough L — want to talk through it?`;
    }
    
    // Relationship Issues
    if (text.includes('ghost') || text.includes('ghosting')) {
      return `That can hurt when someone ghosts. Want to unpack it?`;
    }
    
    if (text.includes('shade') || text.includes('throwing shade')) {
      return `Sounds like some shade got thrown — how'd that make you feel?`;
    }
    
    // Sharing & Gossip
    if (text.includes('tea') || text.includes('spill the tea')) {
      return `👀 Okay, spill the tea — what's going on?`;
    }
    
    // Exaggeration & Drama
    if (text.includes('extra')) {
      return `Haha, sounds extra — but I get it.`;
    }
    
    // Social Dynamics
    if (text.includes('clout')) {
      return `So clout chasing, huh? Do you feel like it's worth it?`;
    }
    
    if (text.includes('squad')) {
      return `Always good to have your squad around.`;
    }
    
    // Fallback for any other urban slang
    return `I see you're using some slang — I'm here for it. What's really going on?`;
  }

  private getDigitalCommunicationResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Uncertainty & Confusion
    if (text.includes('idk')) {
      return `That's okay — sometimes it's hard to put feelings into words. Want to talk through what's on your mind, even if it's messy?`;
    }
    
    if (text.includes('idc')) {
      return `Sounds like you might be feeling drained. Do you want to share what's been taking your energy lately?`;
    }
    
    if (text.includes('smh')) {
      return `Yeah, it can be really frustrating when things feel that way. Want to vent a bit?`;
    }
    
    if (text.includes('tfw')) {
      return `I get it — that feeling can be tough. Want to tell me more about what's behind it?`;
    }
    
    if (text.includes('tbh') || text.includes('imho') || text.includes('imo')) {
      return `I appreciate your honesty — you can be real here. What's been on your chest lately?`;
    }
    
    // Stress & Struggles
    if (text.includes('fml')) {
      return `I hear you — sounds like today's been really heavy. What's been the hardest part for you?`;
    }
    
    if (text.includes('wtf')) {
      return `That reaction makes sense. Want to walk me through what happened?`;
    }
    
    if (text.includes('brb')) {
      return `No worries, take your time. I'll be here when you're ready to come back.`;
    }
    
    if (text.includes('nm') || text.includes('nvm')) {
      return `Totally fine, but if something's bothering you and you change your mind, I'm here to listen.`;
    }
    
    // Supportive & Coping
    if (text.includes('ily') || text.includes('ilu')) {
      return `That means a lot — thanks for sharing that. Having people you care about can really help during tough times.`;
    }
    
    if (text.includes('lmk')) {
      return `Thanks, I'll check in again later. And if you ever need to talk, I'm right here.`;
    }
    
    if (text.includes('tyt')) {
      return `Appreciate that. No rush — healing and sharing don't have a time limit.`;
    }
    
    if (text.includes('hbd')) {
      return `Happy birthday! Birthdays can bring up a lot of feelings. How are you feeling about it?`;
    }
    
    if (text.includes('gg') && !text.includes('gg ez')) {
      return `Sometimes "good game" can mean "I give up" after a hard day. How are you really doing?`;
    }
    
    if (text.includes('gg ez')) {
      return `Sometimes we use humor to lighten tough situations. What's really going on underneath?`;
    }
    
    // Culture & Identity
    if (text.includes('yolo')) {
      return `True, but that one life deserves care too. What's something you'd like to do just for yourself?`;
    }
    
    if (text.includes('fomo')) {
      return `It's normal to feel left out sometimes. Want to talk about what you feel you're missing?`;
    }
    
    if (text.includes('npc')) {
      return `That's a strong way to put it — feeling stuck or on autopilot can be tough. Want to unpack what's making you feel that way?`;
    }
    
    if (text.includes('op')) {
      return `When problems feel "overpowered," they can seem impossible to handle. What's making this feel so overwhelming?`;
    }
    
    if (text.includes('afk')) {
      return `Taking a step back is okay. Do you want me to check in again later?`;
    }
    
    // Fallback for any other digital communication
    return `I see you're using some digital shorthand. Sometimes these acronyms can carry a lot of meaning. What's really going on for you right now?`;
  }

  private hasCulturalContext(userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase();
    return lowerMessage.includes('because i\'m black') || 
           lowerMessage.includes('because i\'m a black man') || 
           lowerMessage.includes('as a black man') ||
           lowerMessage.includes('because i\'m hispanic') || 
           lowerMessage.includes('because i\'m latino') ||
           lowerMessage.includes('being black') || 
           lowerMessage.includes('being a person of color') ||
           lowerMessage.includes('due to my race') || 
           lowerMessage.includes('because of my color') ||
           lowerMessage.includes('racial discrimination') || 
           lowerMessage.includes('racism against me') ||
           lowerMessage.includes('discriminated against') || 
           lowerMessage.includes('microaggression');
  }

  private hasEmotionalContext(userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for emotional keywords that indicate this isn't just a simple "no"
    const emotionalKeywords = [
      'afraid', 'scared', 'worried', 'anxious', 'nervous', 'fear',
      'sad', 'depressed', 'down', 'hopeless', 'worthless', 'useless',
      'angry', 'mad', 'furious', 'frustrated', 'pissed',
      'lonely', 'isolated', 'alone', 'empty', 'numb',
      'stressed', 'overwhelmed', 'burned out', 'exhausted',
      'confused', 'lost', 'stuck', 'trapped',
      'hurt', 'pain', 'suffering', 'struggling',
      'relationship', 'girlfriend', 'boyfriend', 'partner', 'wife', 'husband',
      'family', 'friend', 'people', 'everyone', 'they', 'she', 'he',
      'think', 'thinks', 'believes', 'feels', 'sees', 'knows',
      'loser', 'failure', 'disappointment', 'embarrassment', 'shame',
      'judge', 'judging', 'criticize', 'criticism', 'hate', 'hates'
    ];
    
    return emotionalKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private storeConversation(userId: string, userMessage: string, response: string): void {
    if (!userId || !userMessage || !response) {
      console.warn('storeConversation: Missing required parameters');
      return;
    }
    
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    
    const history = this.conversationHistory.get(userId);
    if (!history) {
      console.warn('storeConversation: Failed to get conversation history');
      return;
    }
    history.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });
    history.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 20 messages
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  // Get conversation history
  public getConversationHistory(userId: string): ChatMessage[] {
    return this.conversationHistory.get(userId) || [];
  }

  // General emotional response for nuanced feelings
  private getGeneralEmotionalResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Handle "not good" or "not too good" - these are negative emotional states
    if (text.match(/\b(not good|not too good|not well|not great|dont feel good|don't feel good|feeling bad|not okay)\b/)) {
      return `I'm sorry you're not feeling good. That's tough. What's going on that's making you feel this way?`;
    }
    
    // Handle "just ok" or "just okay" responses
    if (text.includes('just ok') || text.includes('just okay')) {
      return `"Just okay" can sometimes mean a lot more than it sounds. What's behind that feeling?`;
    }
    
    // Handle "don't know why" or similar confusion
    if (text.includes("don't know why") || text.includes("can't explain") || text.includes("hard to explain")) {
      return `Sometimes feelings don't come with clear explanations, and that's okay. What's it like to sit with that uncertainty?`;
    }
    
    // Handle empty feelings
    if (text.includes('empty') || text.includes('hollow') || text.includes('void') || text.includes('missing something')) {
      return `That empty feeling can be really unsettling. Sometimes it's our way of noticing something important is missing. What do you think might be missing?`;
    }
    
    // Handle "off" or "not right" feelings
    if (text.includes('off') || text.includes('not right') || text.includes('not myself') || text.includes('different')) {
      return `When something feels "off," it's usually worth paying attention to. What feels different about how you're experiencing things right now?`;
    }
    
    // Handle confusion or uncertainty
    if (text.includes('confused') || text.includes('unsure') || text.includes('mixed feelings') || text.includes('conflicted')) {
      return `Mixed feelings are completely normal, especially when things are complex. What's pulling you in different directions?`;
    }
    
    // Handle feeling stuck or trapped
    if (text.includes('stuck') || text.includes('trapped') || text.includes('rut') || text.includes('autopilot')) {
      return `Feeling stuck can be really frustrating. Sometimes the first step is just recognizing that you want something different. What would you like to change?`;
    }
    
    // Handle boredom or monotony
    if (text.includes('bored') || text.includes('monotonous') || text.includes('routine') || text.includes('mundane')) {
      return `When things feel monotonous, it can drain your energy. What would make your days feel more meaningful?`;
    }
    
    // Handle feeling disconnected
    if (text.includes('disconnected') || text.includes('detached') || text.includes('numb')) {
      return `Feeling disconnected can be really isolating. Sometimes it's our mind's way of protecting us. What's making you feel this way?`;
    }
    
    // Handle feeling lost or directionless
    if (text.includes('lost') || text.includes('directionless') || text.includes('purposeless')) {
      return `Feeling lost can be scary, but it's also a sign that you're ready for something new. What direction feels right to you right now?`;
    }
    
    // Default response for general emotional states
    return `I hear you. Sometimes our feelings don't fit into neat categories, and that's okay. What's it like to sit with whatever you're experiencing right now?`;
  }

  private getWorldConcernsResponse(userMessage: string): string {
    const culturalContext = this.hasCulturalContext(userMessage);
    const culturalAddition = culturalContext ? 
      " especially when you're already dealing with systemic issues" : "";
    
    return `Yeah, there's a lot going on right now${culturalAddition}. What's hitting you the hardest?`;
  }

  private getConversationEndingResponse(userMessage: string): string {
    const text = userMessage.toLowerCase();
    
    // Different closing responses based on what they said
    if (text.includes('thank') || text.includes('appreciate') || text.includes('thx') || text.includes('ty')) {
      const closings = [
        "I'm here anytime for you.",
        "Let me know how you're doing.",
        "Come back whenever you need me.",
        "I'm here when you need me."
      ];
      return closings[Math.floor(Math.random() * closings.length)];
    }
    
    if (text.includes('feel better') || text.includes('feeling better') || text.includes('that help')) {
      const closings = [
        "I'm here anytime for you.",
        "Let me know how you're doing.",
        "Come back whenever you need me.",
        "I'm here when you need me."
      ];
      return closings[Math.floor(Math.random() * closings.length)];
    }
    
    if (text.includes('gotta go') || text.includes('got to go') || text.includes('have to go') || text.includes('need to go')) {
      const closings = [
        "I'm here anytime for you.",
        "Let me know how you're doing.",
        "Come back whenever you need me.",
        "I'm here when you need me."
      ];
      return closings[Math.floor(Math.random() * closings.length)];
    }
    
    if (text.includes("i'm good") || text.includes("i'm okay") || text.includes('all set') || text.includes('sounds good')) {
      const closings = [
        "I'm here anytime for you.",
        "Let me know how you're doing.",
        "Come back whenever you need me.",
        "I'm here when you need me."
      ];
      return closings[Math.floor(Math.random() * closings.length)];
    }
    
    // Default closing
    const defaultClosings = [
      "I'm here anytime for you.",
      "Let me know how you're doing.",
      "Come back whenever you need me.",
      "I'm here when you need me."
    ];
    return defaultClosings[Math.floor(Math.random() * defaultClosings.length)];
  }

  // Check for repetitive responses in recent conversation
  private getRecentResponses(userMessage: string, patterns: any, userId: string = 'default'): { isRepetitive: boolean, lastResponseType: string | null } {
    const history = this.conversationHistory.get(userId) || [];
    
    // Look at last 3 assistant messages
    const recentAssistantMessages = history
      .filter(msg => msg && msg.role === 'assistant')
      .slice(-3);
    
    if (recentAssistantMessages.length < 2) {
      return { isRepetitive: false, lastResponseType: null };
    }
    
    // Check if the last response was about the same topic
    const lastMessage = recentAssistantMessages[recentAssistantMessages.length - 1];
    const secondLastMessage = recentAssistantMessages[recentAssistantMessages.length - 2];
    
    if (!lastMessage || !secondLastMessage) {
      return { isRepetitive: false, lastResponseType: null };
    }
    
    // Simple similarity check - if both responses contain similar phrases
    const lastContent = lastMessage.content.toLowerCase();
    const secondLastContent = secondLastMessage.content.toLowerCase();
    
    // Check for common phrases that indicate repetition (expanded list)
    const commonPhrases = [
      "i hear that you're feeling",
      "what's making you feel",
      "that's completely understandable",
      "what's contributing to this feeling",
      "financial stress can really weigh",
      "what's been the biggest",
      "that sounds really stressful",
      "i'm sorry to hear",
      "want to talk about it",
      "what's been going on"
    ];
    
    // Check for exact or near-exact matches
    const isExactMatch = lastContent === secondLastContent;
    const isPhraseRepetitive = commonPhrases.some(phrase => 
      lastContent.includes(phrase) && secondLastContent.includes(phrase)
    );
    
    // Calculate similarity score (simple word overlap)
    const lastWords = new Set(lastContent.split(/\s+/).filter(w => w.length > 3));
    const secondLastWords = new Set(secondLastContent.split(/\s+/).filter(w => w.length > 3));
    const commonWords = [...lastWords].filter(w => secondLastWords.has(w));
    const similarityScore = commonWords.length / Math.max(lastWords.size, secondLastWords.size);
    
    const isRepetitive = isExactMatch || (isPhraseRepetitive && similarityScore > 0.5);
    
    return { 
      isRepetitive, 
      lastResponseType: isRepetitive ? 'repetitive' : null 
    };
  }

  // Provide a varied response when repetition is detected
  private getVariedResponse(userMessage: string, patterns: any, lastResponseType: string | null): string {
    const text = userMessage.toLowerCase();
    
    // If we've been asking the same question, try a different approach
    if (lastResponseType === 'repetitive' || lastResponseType === 'overwhelmed') {
      // Check what the user is actually talking about to provide context-appropriate variation
      if (patterns.isFinancial) {
        const variedResponses = [
          "I can see money stress is really weighing on you. Sometimes it helps to focus on what you can control right now. What's one small step you could take today?",
          "Financial pressure can feel overwhelming. You're not alone in this struggle. What aspect of your money situation feels most urgent?",
          "I hear you on the financial stress. It's a lot to manage. What would help you feel a bit more in control?"
        ];
        return variedResponses[Math.floor(Math.random() * variedResponses.length)];
      }
      
      if (patterns.isOverwhelmed) {
        const variedResponses = [
          "I can see this is really weighing on you. Sometimes when we feel overwhelmed, it helps to break things down. What's one small thing you could tackle right now?",
          "It sounds like you're carrying a lot right now. When everything feels like too much, it's okay to step back and take a breath. What would help you feel more grounded?",
          "I hear you, and I want you to know that feeling overwhelmed doesn't mean you're failing. It means you're human. What's been the hardest part about managing everything?",
          "When we're overwhelmed, it can feel like we're drowning in responsibilities. You're not alone in this feeling. What's one thing that would make today feel more manageable?"
        ];
        return variedResponses[Math.floor(Math.random() * variedResponses.length)];
      }
    }
    
    // Default varied response
    return "I can tell this is really important to you. Let me try a different approach - what's been on your mind most today?";
  }
}

export const smartChatbot = new SmartChatbotService();
