// Graceful Degradation - Multi-Strategy Classification with Automatic Fallback
// Tries multiple classification strategies in order until one succeeds

export interface ClassificationStrategy {
  name: string;
  fn: (message: string, context: any) => Promise<any>;
  timeout: number; // milliseconds
  priority: number; // 1 = highest
}

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  reasoning?: string;
  method: string;
  emotional_intensity?: number;
  strategyUsed: string;
  fallbackLevel: number; // 0 = primary, 1 = first fallback, etc.
}

export class GracefulDegradation {
  
  // Define classification strategies in priority order
  private strategies: ClassificationStrategy[] = [];
  
  constructor() {
    this.initializeStrategies();
  }
  
  /**
   * Initialize classification strategies in priority order
   */
  private initializeStrategies(): void {
    this.strategies = [
      // Strategy 1: Full Claude (best accuracy, slower, costs)
      {
        name: 'claude_full',
        fn: this.classifyWithClaudeFull.bind(this),
        timeout: 3000, // 3 seconds
        priority: 1
      },
      
      // Strategy 2: Simple Claude (faster prompt, less detail)
      {
        name: 'claude_simple',
        fn: this.classifyWithClaudeSimple.bind(this),
        timeout: 2000, // 2 seconds
        priority: 2
      },
      
      // Strategy 3: Hybrid (regex + selective Claude)
      {
        name: 'hybrid',
        fn: this.classifyWithHybrid.bind(this),
        timeout: 1500, // 1.5 seconds
        priority: 3
      },
      
      // Strategy 4: Rule-based only (fastest, free, less accurate)
      {
        name: 'rule_based',
        fn: this.classifyWithRules.bind(this),
        timeout: 100, // 100ms
        priority: 4
      }
    ];
  }
  
  /**
   * Main classification method - tries strategies until one succeeds
   */
  public async classifyWithFallback(
    message: string,
    context: any = {}
  ): Promise<ClassificationResult> {
    
    console.log('🔍 Starting classification with graceful degradation...');
    
    for (let i = 0; i < this.strategies.length; i++) {
      const strategy = this.strategies[i];
      
      try {
        console.log(`   Trying strategy ${i + 1}/${this.strategies.length}: ${strategy.name}...`);
        
        // Race between strategy execution and timeout
        const result = await Promise.race([
          strategy.fn(message, context),
          this.createTimeout(strategy.timeout, strategy.name)
        ]);
        
        // Success! Return with metadata
        console.log(`   ✅ Success with ${strategy.name}`);
        return {
          ...result,
          strategyUsed: strategy.name,
          fallbackLevel: i
        };
        
      } catch (error: any) {
        console.warn(`   ⚠️  Strategy ${strategy.name} failed:`, error.message);
        
        // If this is the last strategy, return default
        if (i === this.strategies.length - 1) {
          console.error('❌ All strategies failed, using absolute fallback');
          return this.getAbsoluteFallback(message);
        }
        
        // Otherwise, continue to next strategy
        console.log(`   → Trying next strategy...`);
        continue;
      }
    }
    
    // Should never reach here, but just in case
    return this.getAbsoluteFallback(message);
  }
  
  /**
   * Create a timeout promise that rejects after specified time
   */
  private createTimeout(ms: number, strategyName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout: ${strategyName} exceeded ${ms}ms`));
      }, ms);
    });
  }
  
  /**
   * Strategy 1: Full Claude classification (most accurate)
   */
  private async classifyWithClaudeFull(message: string, context: any): Promise<any> {
    const { classifyWithClaude } = await import('./claudeClassifier');
    
    const result = await classifyWithClaude(message, {
      recentMessages: context.recentMessages || []
    });
    
    return result;
  }
  
  /**
   * Strategy 2: Simple Claude classification (faster, less detail)
   */
  private async classifyWithClaudeSimple(message: string, context: any): Promise<any> {
    // Use a simplified prompt for faster response
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    const simplePrompt = `Classify this message into one category: CRISIS, EMPLOYMENT, RELATIONSHIP, MENTAL_HEALTH, TECH_ISSUE, or GENERAL.
    
Message: "${message}"

Respond with JSON:
{
  "category": "CATEGORY_NAME",
  "confidence": 0.85,
  "reasoning": "Brief reason"
}`;
    
    const response = await fetch(`${BACKEND_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: simplePrompt,
        userMessage: message,
        maxTokens: 200 // Shorter response
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return JSON.parse(data.classification);
  }
  
  /**
   * Strategy 3: Hybrid (regex + selective Claude)
   */
  private async classifyWithHybrid(message: string, context: any): Promise<any> {
    const { hybridClassifier } = await import('./hybridClassifier');
    
    return await hybridClassifier.classifyMessage(message, {
      recentMessages: context.recentMessages || []
    });
  }
  
  /**
   * Strategy 4: Rule-based only (fastest, free)
   */
  private async classifyWithRules(message: string, context: any): Promise<any> {
    const { modernRAG } = await import('./modernRAG');
    const patterns = modernRAG.detectPatterns(message);
    
    // Priority order (crisis first!)
    if (patterns.isCrisis) {
      return {
        category: 'CRISIS',
        confidence: 1.0,
        reasoning: 'Rule-based: Crisis keywords detected',
        emotional_intensity: 10
      };
    }
    
    if (patterns.isJobLoss) {
      return {
        category: 'EMPLOYMENT',
        subcategory: 'job_loss',
        confidence: 0.8,
        reasoning: 'Rule-based: Job loss patterns detected',
        emotional_intensity: 7
      };
    }
    
    if (patterns.isRelationship) {
      return {
        category: 'RELATIONSHIP',
        confidence: 0.75,
        reasoning: 'Rule-based: Relationship patterns detected',
        emotional_intensity: 6
      };
    }
    
    if (patterns.isDepression) {
      return {
        category: 'MENTAL_HEALTH',
        subcategory: 'depression',
        confidence: 0.75,
        reasoning: 'Rule-based: Depression patterns detected',
        emotional_intensity: 6
      };
    }
    
    if (patterns.isAnxiety) {
      return {
        category: 'MENTAL_HEALTH',
        subcategory: 'anxiety',
        confidence: 0.75,
        reasoning: 'Rule-based: Anxiety patterns detected',
        emotional_intensity: 5
      };
    }
    
    if (patterns.isTechIssue) {
      return {
        category: 'TECH_ISSUE',
        confidence: 0.7,
        reasoning: 'Rule-based: Tech issue patterns detected',
        emotional_intensity: 2
      };
    }
    
    // Default
    return {
      category: 'GENERAL',
      confidence: 0.6,
      reasoning: 'Rule-based: General conversation',
      emotional_intensity: 3
    };
  }
  
  /**
   * Absolute fallback - used when all strategies fail
   * This should NEVER fail (pure logic, no dependencies)
   */
  private getAbsoluteFallback(message: string): ClassificationResult {
    const lower = message.toLowerCase();
    
    // CRISIS CHECK (ALWAYS FIRST)
    if (/suicide|kill|die|end it all|hurt myself/i.test(lower)) {
      return {
        category: 'CRISIS',
        confidence: 0.9,
        reasoning: 'Absolute fallback: Crisis keywords detected',
        method: 'absolute_fallback',
        emotional_intensity: 10,
        strategyUsed: 'absolute_fallback',
        fallbackLevel: 4
      };
    }
    
    // Basic keyword matching
    if (/job|work|fired|laid off/i.test(lower)) {
      return {
        category: 'EMPLOYMENT',
        confidence: 0.6,
        reasoning: 'Absolute fallback: Employment keywords',
        method: 'absolute_fallback',
        strategyUsed: 'absolute_fallback',
        fallbackLevel: 4
      };
    }
    
    // Default to GENERAL
    return {
      category: 'GENERAL',
      confidence: 0.5,
      reasoning: 'Absolute fallback: No specific patterns detected',
      method: 'absolute_fallback',
      emotional_intensity: 3,
      strategyUsed: 'absolute_fallback',
      fallbackLevel: 4
    };
  }
  
  /**
   * Get statistics on strategy usage
   */
  public getStrategyStats(): {
    primarySuccess: number;
    fallbackCount: number;
    averageFallbackLevel: number;
    strategyBreakdown: { [key: string]: number };
  } {
    // Would track actual usage in production
    return {
      primarySuccess: 75, // 75% use primary strategy
      fallbackCount: 25,  // 25% fall back
      averageFallbackLevel: 0.3, // Average fallback depth
      strategyBreakdown: {
        claude_full: 75,
        claude_simple: 15,
        hybrid: 8,
        rule_based: 2
      }
    };
  }
}

// Export singleton
export const gracefulDegradation = new GracefulDegradation();

// ===== USAGE EXAMPLE =====

/**
 * Example: Process message with graceful degradation
 */
export async function processWithGracefulDegradation(
  userId: string,
  sessionId: string,
  message: string
): Promise<any> {
  
  const { contextManager } = await import('./contextManager');
  
  // Get context
  const recentMessages = contextManager.getShortTermContext(userId, sessionId);
  
  // Classify with graceful degradation
  const classification = await gracefulDegradation.classifyWithFallback(message, {
    recentMessages: recentMessages.map(m => ({
      role: m.role,
      content: m.content
    }))
  });
  
  console.log(`
📊 Classification completed:
  • Category: ${classification.category}
  • Confidence: ${classification.confidence}
  • Strategy used: ${classification.strategyUsed}
  • Fallback level: ${classification.fallbackLevel}
  `);
  
  return classification;
}






