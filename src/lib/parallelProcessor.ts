// Parallel Processing Optimization
// Separate critical path from background tasks for faster response times

export interface BackgroundTask {
  name: string;
  task: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
}

export interface ProcessingResult {
  critical: any;
  background?: {
    completed: string[];
    failed: string[];
    pending: string[];
  };
}

export class ParallelProcessor {
  
  private backgroundQueue: BackgroundTask[] = [];
  private processing = false;
  
  /**
   * Process message with critical path + background tasks
   * Returns immediately after critical path completes
   */
  public async processMessage(
    userId: string,
    sessionId: string,
    message: string,
    options: {
      classification: any;
      context?: any;
    }
  ): Promise<ProcessingResult> {
    
    const startTime = Date.now();
    
    // ===== CRITICAL PATH (SERIAL - MUST COMPLETE) =====
    const criticalResult = await this.executeCriticalPath(
      userId,
      sessionId,
      message,
      options
    );
    
    const criticalTime = Date.now() - startTime;
    console.log(`   ⚡ Critical path: ${criticalTime}ms`);
    
    // ===== BACKGROUND TASKS (PARALLEL - FIRE AND FORGET) =====
    this.executeBackgroundTasks(userId, sessionId, message, options.classification)
      .catch(err => console.error('❌ Background tasks error:', err));
    
    return {
      critical: criticalResult,
      background: {
        completed: [],
        failed: [],
        pending: ['sentiment', 'profile', 'analytics']
      }
    };
  }
  
  /**
   * Critical path - must complete before returning to user
   * Keep this as fast as possible!
   */
  private async executeCriticalPath(
    userId: string,
    sessionId: string,
    message: string,
    options: any
  ): Promise<any> {
    
    // 1. Classification (already done, passed in)
    const classification = options.classification;
    
    // 2. Generate response (MUST be fast)
    const { responseGenerator } = await import('./responseGenerator');
    const response = responseGenerator.generateResponse(
      classification,
      message,
      options.context || ''
    );
    
    // 3. Store in context (quick memory operation)
    const { contextManager } = await import('./contextManager');
    contextManager.addMessage({
      role: 'user',
      content: message,
      timestamp: new Date(),
      classification
    });
    
    contextManager.addMessage({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });
    
    return {
      response,
      classification,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Background tasks - run in parallel, don't block response
   */
  private async executeBackgroundTasks(
    userId: string,
    sessionId: string,
    message: string,
    classification: any
  ): Promise<void> {
    
    console.log('   🔄 Starting background tasks...');
    
    const tasks = [
      // Task 1: Sentiment analysis
      this.analyzeSentiment(message, classification),
      
      // Task 2: Update user profile
      this.updateUserProfile(userId, classification),
      
      // Task 3: Log analytics
      this.logAnalytics(userId, sessionId, classification),
      
      // Task 4: Check for patterns (recurring topics)
      this.checkPatterns(userId, sessionId),
      
      // Task 5: Update metrics
      this.updateMetrics(classification)
    ];
    
    // Run all in parallel
    const results = await Promise.allSettled(tasks);
    
    // Log results (don't throw errors)
    results.forEach((result, index) => {
      const taskName = ['sentiment', 'profile', 'analytics', 'patterns', 'metrics'][index];
      if (result.status === 'fulfilled') {
        console.log(`   ✅ Background task '${taskName}' completed`);
      } else {
        console.error(`   ❌ Background task '${taskName}' failed:`, result.reason);
      }
    });
  }
  
  /**
   * Background Task 1: Sentiment Analysis
   */
  private async analyzeSentiment(message: string, classification: any): Promise<void> {
    // Detailed sentiment analysis (not needed for immediate response)
    const { modernRAG } = await import('./modernRAG');
    const patterns = modernRAG.detectPatterns(message);
    
    // Store sentiment data (could be sent to analytics service)
    // In production: await sendToAnalyticsService({ patterns, classification });
    
    return;
  }
  
  /**
   * Background Task 2: Update User Profile
   */
  private async updateUserProfile(userId: string, classification: any): Promise<void> {
    // Update user profile with new data
    // In production: await database.updateUserProfile(userId, { ... });
    
    return;
  }
  
  /**
   * Background Task 3: Log Analytics
   */
  private async logAnalytics(
    userId: string,
    sessionId: string,
    classification: any
  ): Promise<void> {
    const { metricsTracker } = await import('./metricsTracker');
    
    // Log to metrics (non-critical)
    // Already done in main flow, but could add more detailed logging here
    
    return;
  }
  
  /**
   * Background Task 4: Check for Patterns
   */
  private async checkPatterns(userId: string, sessionId: string): Promise<void> {
    const { contextManager } = await import('./contextManager');
    
    // Check for recurring topics (for alerts)
    const trend = contextManager.getEmotionalTrend(userId, sessionId);
    
    if (trend === 'declining') {
      // In production: alert dashboard, schedule check-in, etc.
      console.log(`   ⚠️  User ${userId} showing declining trend`);
    }
    
    return;
  }
  
  /**
   * Background Task 5: Update Metrics
   */
  private async updateMetrics(classification: any): Promise<void> {
    // Update aggregate metrics (not time-sensitive)
    // In production: increment counters, update dashboards, etc.
    
    return;
  }
  
  /**
   * Add task to background queue (for rate-limited operations)
   */
  public queueBackgroundTask(task: BackgroundTask): void {
    this.backgroundQueue.push(task);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processBackgroundQueue();
    }
  }
  
  /**
   * Process background queue (one at a time to avoid overload)
   */
  private async processBackgroundQueue(): Promise<void> {
    if (this.processing || this.backgroundQueue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.backgroundQueue.length > 0) {
      // Sort by priority
      this.backgroundQueue.sort((a, b) => {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });
      
      const task = this.backgroundQueue.shift()!;
      
      try {
        await task.task();
        console.log(`   ✅ Queued task '${task.name}' completed`);
      } catch (error) {
        console.error(`   ❌ Queued task '${task.name}' failed:`, error);
      }
    }
    
    this.processing = false;
  }
}

// Export singleton
export const parallelProcessor = new ParallelProcessor();

// ===== OPTIMIZED MESSAGE PROCESSING =====

/**
 * Process message with optimized parallel execution
 */
export async function optimizedProcessMessage(
  userId: string,
  sessionId: string,
  message: string
): Promise<{
  response: string;
  classification: any;
  processingTime: number;
}> {
  
  const startTime = Date.now();
  
  // Step 1: Classification (critical path)
  const { hybridClassifier } = await import('./hybridClassifier');
  const classification = await hybridClassifier.classifyMessage(message);
  
  // Step 2: Process with parallel tasks
  const result = await parallelProcessor.processMessage(userId, sessionId, message, {
    classification
  });
  
  const processingTime = Date.now() - startTime;
  
  return {
    response: result.critical.response,
    classification: result.critical.classification,
    processingTime
  };
}

// ===== PERFORMANCE COMPARISON =====

/**
 * Sequential processing (OLD - SLOW)
 */
export async function sequentialProcessMessage(
  userId: string,
  sessionId: string,
  message: string
): Promise<any> {
  
  const startTime = Date.now();
  
  // All operations sequential (each waits for previous)
  const { hybridClassifier } = await import('./hybridClassifier');
  const classification = await hybridClassifier.classifyMessage(message);
  
  const { responseGenerator } = await import('./responseGenerator');
  const response = responseGenerator.generateResponse(classification, message, '');
  
  // These could be parallel but aren't
  const { modernRAG } = await import('./modernRAG');
  await modernRAG.detectPatterns(message); // 50ms
  
  const { metricsTracker } = await import('./metricsTracker');
  metricsTracker.trackClassification({
    category: classification.category,
    confidence: classification.confidence,
    method: classification.method || 'claude',
    responseTime: Date.now() - startTime,
    userId,
    sessionId,
    meetsThreshold: true
  }); // 20ms
  
  // More sequential operations...
  // Total: 310ms + classification time
  
  return {
    response,
    classification,
    processingTime: Date.now() - startTime
  };
}

// ===== USAGE EXAMPLE =====

/**
 * Example: Full message processing with parallel optimization
 */
export async function exampleUsage() {
  const userId = 'user-123';
  const sessionId = 'session-456';
  const message = 'im not working and afraid im a burden on my wife';
  
  console.log('\n📊 PERFORMANCE COMPARISON\n');
  
  // Sequential (old way)
  console.log('1️⃣ Sequential Processing:');
  const seq = await sequentialProcessMessage(userId, sessionId, message);
  console.log(`   Time: ${seq.processingTime}ms`);
  console.log(`   Response: "${seq.response.substring(0, 50)}..."`);
  
  console.log('\n2️⃣ Parallel Processing:');
  const par = await optimizedProcessMessage(userId, sessionId, message);
  console.log(`   Time: ${par.processingTime}ms`);
  console.log(`   Response: "${par.response.substring(0, 50)}..."`);
  console.log(`   Improvement: ${Math.round((1 - par.processingTime / seq.processingTime) * 100)}% faster`);
}






