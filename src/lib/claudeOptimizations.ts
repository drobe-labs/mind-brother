// Claude-Specific Optimizations
// Leverages Claude's unique capabilities: extended thinking, tool use, prompt caching

import { modernRAG } from './modernRAG';
import { feedbackAnalytics } from './feedbackAnalytics';

// ===== TOOL DEFINITIONS FOR CLAUDE =====

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export const claudeTools: ClaudeTool[] = [
  {
    name: 'search_mental_health_resources',
    description: 'Search the mental health knowledge base for specific information about topics like depression, anxiety, trauma, coping strategies, etc. Use this when the user asks about specific mental health topics or needs detailed information.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant mental health information (e.g., "coping strategies for anxiety", "signs of depression")'
        },
        topic: {
          type: 'string',
          description: 'The specific mental health topic (e.g., "depression", "anxiety", "trauma", "relationships")',
          enum: ['depression', 'anxiety', 'trauma', 'relationships', 'workplace', 'crisis', 'self_care', 'general']
        }
      },
      required: ['query', 'topic']
    }
  },
  {
    name: 'assess_crisis_level',
    description: 'Assess the severity of a potential crisis situation based on user messages. Use this when detecting suicidal ideation, self-harm, or other crisis indicators. Returns severity level and recommended action.',
    input_schema: {
      type: 'object',
      properties: {
        user_message: {
          type: 'string',
          description: 'The user message that may indicate a crisis'
        },
        context: {
          type: 'string',
          description: 'Additional context from conversation history'
        }
      },
      required: ['user_message']
    }
  },
  {
    name: 'get_professional_resources',
    description: 'Retrieve professional mental health resources (therapists, hotlines, support groups) based on the user\'s specific needs. Use when recommending professional help.',
    input_schema: {
      type: 'object',
      properties: {
        resource_type: {
          type: 'string',
          description: 'Type of resource needed',
          enum: ['therapy', 'crisis', 'addiction', 'trauma', 'support_groups', 'hotlines']
        },
        urgency: {
          type: 'string',
          description: 'How urgent is the need',
          enum: ['immediate', 'soon', 'routine']
        },
        cultural_preference: {
          type: 'string',
          description: 'Cultural or identity-specific resources if relevant (e.g., "Black men", "LGBTQ+", "Latino")'
        }
      },
      required: ['resource_type', 'urgency']
    }
  },
  {
    name: 'schedule_followup',
    description: 'Schedule a follow-up check-in for the user. Use when the user mentions upcoming events or situations that warrant checking in later.',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'What to follow up about (e.g., "job interview", "therapy appointment", "difficult conversation")'
        },
        timeframe: {
          type: 'string',
          description: 'When to follow up',
          enum: ['tomorrow', 'next_week', 'next_month', 'specific_date']
        },
        specific_date: {
          type: 'string',
          description: 'Specific date if timeframe is "specific_date" (ISO format)'
        }
      },
      required: ['topic', 'timeframe']
    }
  },
  {
    name: 'retrieve_user_patterns',
    description: 'Retrieve patterns from the user\'s conversation history (recurring topics, mood trends, progress). Use to provide personalized insights.',
    input_schema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'The user ID to retrieve patterns for'
        },
        pattern_type: {
          type: 'string',
          description: 'Type of pattern to retrieve',
          enum: ['recurring_topics', 'mood_trends', 'triggers', 'coping_strategies', 'progress']
        }
      },
      required: ['user_id', 'pattern_type']
    }
  },
  {
    name: 'log_safety_concern',
    description: 'Log a safety concern for review. Use when detecting serious issues like abuse, harm to others, or severe mental health deterioration.',
    input_schema: {
      type: 'object',
      properties: {
        concern_type: {
          type: 'string',
          description: 'Type of safety concern',
          enum: ['self_harm', 'harm_to_others', 'abuse', 'severe_deterioration', 'medication_issue']
        },
        severity: {
          type: 'string',
          description: 'Severity level',
          enum: ['low', 'medium', 'high', 'critical']
        },
        details: {
          type: 'string',
          description: 'Brief description of the concern'
        }
      },
      required: ['concern_type', 'severity', 'details']
    }
  }
];

// ===== TOOL EXECUTION HANDLERS =====

export class ClaudeToolHandler {
  async executeTool(toolName: string, toolInput: any): Promise<any> {
    switch (toolName) {
      case 'search_mental_health_resources':
        return this.searchMentalHealthResources(toolInput.query, toolInput.topic);
      
      case 'assess_crisis_level':
        return this.assessCrisisLevel(toolInput.user_message, toolInput.context);
      
      case 'get_professional_resources':
        return this.getProfessionalResources(
          toolInput.resource_type,
          toolInput.urgency,
          toolInput.cultural_preference
        );
      
      case 'schedule_followup':
        return this.scheduleFollowup(
          toolInput.topic,
          toolInput.timeframe,
          toolInput.specific_date
        );
      
      case 'retrieve_user_patterns':
        return this.retrieveUserPatterns(toolInput.user_id, toolInput.pattern_type);
      
      case 'log_safety_concern':
        return this.logSafetyConcern(
          toolInput.concern_type,
          toolInput.severity,
          toolInput.details
        );
      
      default:
        return { error: 'Unknown tool' };
    }
  }

  private searchMentalHealthResources(query: string, topic: string): any {
    const results = modernRAG.retrieveRelevantKnowledge(query, 3);
    
    return {
      success: true,
      results: results.map(r => ({
        content: r.content,
        relevance_score: r.relevanceScore,
        category: r.category
      })),
      summary: results.length > 0 
        ? `Found ${results.length} relevant resources about ${topic}`
        : 'No specific resources found, providing general support'
    };
  }

  private assessCrisisLevel(userMessage: string, context?: string): any {
    const patterns = modernRAG.detectPatterns(userMessage);
    
    if (!patterns.isCrisis) {
      return {
        crisis_detected: false,
        severity: 'none',
        recommended_action: 'continue_conversation'
      };
    }

    // Assess severity based on keywords
    const criticalKeywords = ['right now', 'tonight', 'today', 'ending it', 'goodbye'];
    const hasCriticalTiming = criticalKeywords.some(k => userMessage.toLowerCase().includes(k));
    
    const hasMethod = /\b(pills|gun|knife|rope|jump|overdose)\b/i.test(userMessage);
    const hasPlan = /\b(plan|going to|about to|ready to)\b/i.test(userMessage);
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (hasCriticalTiming && (hasMethod || hasPlan)) {
      severity = 'critical';
    } else if (hasMethod || hasPlan) {
      severity = 'high';
    } else if (hasCriticalTiming) {
      severity = 'high';
    }

    return {
      crisis_detected: true,
      severity,
      indicators: {
        has_timing: hasCriticalTiming,
        has_method: hasMethod,
        has_plan: hasPlan
      },
      recommended_action: severity === 'critical' 
        ? 'immediate_intervention'
        : 'provide_crisis_resources',
      resources: {
        primary: '988 Suicide & Crisis Lifeline',
        secondary: 'Crisis Text Line: HOME to 741741',
        emergency: '911'
      }
    };
  }

  private getProfessionalResources(
    resourceType: string,
    urgency: string,
    culturalPreference?: string
  ): any {
    const resources: any = {
      therapy: {
        immediate: [
          { name: 'Crisis Text Line', contact: 'Text HOME to 741741', available: '24/7' },
          { name: 'SAMHSA Helpline', contact: '1-800-662-4357', available: '24/7' }
        ],
        soon: [
          { name: 'BetterHelp', url: 'betterhelp.com', type: 'Online therapy' },
          { name: 'Talkspace', url: 'talkspace.com', type: 'Online therapy' },
          { name: 'Local therapist search', url: 'psychologytoday.com/us/therapists', type: 'Directory' }
        ],
        routine: [
          { name: 'Psychology Today', url: 'psychologytoday.com/us/therapists', type: 'Directory' },
          { name: 'Insurance provider directory', type: 'Through your insurance' }
        ]
      },
      crisis: {
        immediate: [
          { name: '988 Suicide & Crisis Lifeline', contact: '988 or 1-800-273-8255', available: '24/7' },
          { name: 'Crisis Text Line', contact: 'Text HOME to 741741', available: '24/7' },
          { name: 'Emergency Services', contact: '911', available: '24/7' }
        ]
      },
      addiction: {
        immediate: [
          { name: 'SAMHSA National Helpline', contact: '1-800-662-4357', available: '24/7', free: true }
        ],
        soon: [
          { name: 'AA Meetings', url: 'aa.org', type: 'Support groups' },
          { name: 'NA Meetings', url: 'na.org', type: 'Support groups' }
        ]
      }
    };

    // Add cultural-specific resources
    if (culturalPreference) {
      const culturalResources: any = {
        'black': [
          { name: 'Therapy for Black Girls', url: 'therapyforblackgirls.com' },
          { name: 'Black Men Heal', url: 'blackmenheal.org' }
        ],
        'lgbtq+': [
          { name: 'Trevor Project', contact: '1-866-488-7386' },
          { name: 'Trans Lifeline', contact: '1-877-565-8860' }
        ],
        'latino': [
          { name: 'Latinx Therapy', url: 'latinxtherapy.com' }
        ]
      };

      const key = culturalPreference.toLowerCase().replace(/\s+/g, '');
      if (culturalResources[key]) {
        return {
          success: true,
          resources: resources[resourceType]?.[urgency] || [],
          cultural_resources: culturalResources[key],
          message: `Found ${culturalResources[key].length} culturally-specific resources`
        };
      }
    }

    return {
      success: true,
      resources: resources[resourceType]?.[urgency] || [],
      message: `Found ${resources[resourceType]?.[urgency]?.length || 0} resources for ${resourceType} (${urgency})`
    };
  }

  private scheduleFollowup(topic: string, timeframe: string, specificDate?: string): any {
    let followUpDate: string;
    const now = new Date();

    switch (timeframe) {
      case 'tomorrow':
        followUpDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'next_week':
        followUpDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'next_month':
        followUpDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'specific_date':
        followUpDate = specificDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        followUpDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    return {
      success: true,
      follow_up_scheduled: true,
      topic,
      scheduled_for: followUpDate,
      message: `Follow-up scheduled for ${topic} on ${new Date(followUpDate).toLocaleDateString()}`
    };
  }

  private retrieveUserPatterns(userId: string, patternType: string): any {
    // This would integrate with your user state management
    // For now, return structure showing what would be retrieved
    
    return {
      success: true,
      user_id: userId,
      pattern_type: patternType,
      patterns: {
        recurring_topics: ['anxiety', 'work_stress', 'relationships'],
        mood_trend: 'improving',
        last_check_in: new Date().toISOString(),
        sessions_count: 12
      },
      message: `Retrieved ${patternType} patterns for user`
    };
  }

  private logSafetyConcern(concernType: string, severity: string, details: string): any {
    console.warn(`🚨 SAFETY CONCERN LOGGED:`, {
      type: concernType,
      severity,
      details,
      timestamp: new Date().toISOString()
    });

    // Log to analytics
    feedbackAnalytics.recordRating({
      conversationId: `concern_${Date.now()}`,
      userId: 'system',
      messageId: `safety_${Date.now()}`,
      rating: 'thumbs_down',
      feedbackText: `Safety concern: ${concernType} (${severity})`,
      topic: concernType
    });

    return {
      success: true,
      logged: true,
      concern_id: `concern_${Date.now()}`,
      severity,
      next_steps: severity === 'critical' 
        ? 'Immediate review required'
        : 'Logged for review',
      message: 'Safety concern has been logged for review'
    };
  }
}

// ===== EXTENDED THINKING PROMPTS =====

export interface ExtendedThinkingContext {
  userMessage: string;
  conversationHistory: any[];
  userProfile: any;
  detectedPatterns: any;
}

export function buildExtendedThinkingPrompt(context: ExtendedThinkingContext): string {
  return `
Before responding, take time to think deeply about this situation:

USER MESSAGE: "${context.userMessage}"

THINKING PROCESS (use extended thinking):

1. **Emotional State Analysis**
   - What emotions is the user expressing (explicitly and implicitly)?
   - What's the intensity level (1-10)?
   - Are there multiple conflicting emotions?

2. **Cultural Context Assessment**
   - Is race/ethnicity relevant to their experience?
   - Are there cultural pressures or expectations at play?
   - Should I reference their cultural background?

3. **Safety Evaluation**
   - Any crisis indicators (direct or subtle)?
   - Self-harm risk level?
   - Need for immediate intervention?

4. **Pattern Recognition**
   - Does this connect to previous conversations?
   - Are there recurring themes or triggers?
   - Any progress or regression?

5. **Response Strategy**
   - What does the user need most (validation, advice, resources)?
   - Should I ask questions or provide guidance?
   - Appropriate tone (empathetic, direct, gentle)?
   - Length (brief or detailed)?

6. **Boundary Check**
   - Is this within my scope as an AI?
   - Do I need to recommend professional help?
   - Any ethical concerns?

After this analysis, provide your response.`;
}

// ===== PROMPT CACHING STRUCTURE =====

export interface CachedPromptStructure {
  system: string[];  // Cacheable system instructions
  context: string[]; // Cacheable RAG documents
  conversation: string[]; // Recent conversation (not cached)
}

export function buildCachedPromptStructure(
  systemPrompt: string,
  ragDocuments: string[],
  recentConversation: string[]
): CachedPromptStructure {
  return {
    // These parts are cached (marked with cache_control in API call)
    system: [
      systemPrompt,
      // Add any other static instructions
    ],
    context: ragDocuments, // RAG docs are relatively stable
    
    // This part changes frequently (not cached)
    conversation: recentConversation
  };
}

// ===== INTEGRATION HELPER =====

export function prepareClaudeRequest(
  userMessage: string,
  systemPrompt: string,
  ragDocuments: string[],
  conversationHistory: any[],
  useExtendedThinking: boolean = false,
  useTools: boolean = true
): any {
  const request: any = {
    model: 'claude-3-5-sonnet-20241022', // Latest model with caching support
    max_tokens: 1000,
    messages: []
  };

  // Add system prompt with caching
  request.system = [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' } // Cache this
    }
  ];

  // Add RAG context with caching
  if (ragDocuments.length > 0) {
    request.system.push({
      type: 'text',
      text: `\n\n=== RELEVANT KNOWLEDGE BASE ===\n${ragDocuments.join('\n\n')}`,
      cache_control: { type: 'ephemeral' } // Cache this
    });
  }

  // Add conversation history (not cached - changes frequently)
  request.messages = conversationHistory.map((msg: any) => ({
    role: msg.role,
    content: msg.content
  }));

  // Add current user message with extended thinking if needed
  const userContent = useExtendedThinking
    ? buildExtendedThinkingPrompt({
        userMessage,
        conversationHistory,
        userProfile: {},
        detectedPatterns: {}
      }) + `\n\nUser: ${userMessage}`
    : userMessage;

  request.messages.push({
    role: 'user',
    content: userContent
  });

  // Add tools if enabled
  if (useTools) {
    request.tools = claudeTools;
  }

  return request;
}

export const claudeToolHandler = new ClaudeToolHandler();






