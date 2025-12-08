// Batch Analytics Processing
// Queues analytics events and processes them in batches for efficiency

export interface AnalyticsEvent {
  type: 'classification' | 'crisis' | 'engagement' | 'feedback' | 'resource_click';
  timestamp: Date;
  userId: string;
  sessionId: string;
  data: any;
}

export interface BatchConfig {
  maxBatchSize: number; // Process when queue reaches this size
  maxWaitTime: number;  // Process after this many milliseconds (ms)
  retryAttempts: number;
  onError?: (error: Error, batch: AnalyticsEvent[]) => void;
}

const DEFAULT_CONFIG: BatchConfig = {
  maxBatchSize: 10,      // Process every 10 events
  maxWaitTime: 5000,     // Or every 5 seconds
  retryAttempts: 3
};

export class BatchAnalyticsProcessor {
  private queue: AnalyticsEvent[] = [];
  private config: BatchConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private processing = false;
  private failedBatches: AnalyticsEvent[][] = [];
  
  // Statistics
  private stats = {
    eventsQueued: 0,
    batchesProcessed: 0,
    eventsProcessed: 0,
    eventsFailed: 0,
    averageBatchSize: 0,
    lastProcessedAt: null as Date | null
  };
  
  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Add an event to the analytics queue
   */
  public queueEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date()
    };
    
    this.queue.push(fullEvent);
    this.stats.eventsQueued++;
    
    // Check if we should flush immediately
    if (this.queue.length >= this.config.maxBatchSize) {
      this.flush();
    } else {
      // Schedule a flush if not already scheduled
      this.scheduleFlush();
    }
  }
  
  /**
   * Schedule a flush after maxWaitTime
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return; // Already scheduled
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.config.maxWaitTime);
  }
  
  /**
   * Process the current queue immediately
   */
  public async flush(): Promise<void> {
    // Clear any pending timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Don't flush if already processing or queue is empty
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    // Take up to maxBatchSize events from queue
    const batch = this.queue.splice(0, this.config.maxBatchSize);
    
    try {
      await this.processBatch(batch);
      
      // Update stats
      this.stats.batchesProcessed++;
      this.stats.eventsProcessed += batch.length;
      this.stats.averageBatchSize = this.stats.eventsProcessed / this.stats.batchesProcessed;
      this.stats.lastProcessedAt = new Date();
      
    } catch (error) {
      console.error('❌ Failed to process analytics batch:', error);
      
      // Store failed batch for retry
      this.failedBatches.push(batch);
      this.stats.eventsFailed += batch.length;
      
      if (this.config.onError) {
        this.config.onError(error as Error, batch);
      }
      
      // Retry failed batches
      await this.retryFailedBatches();
    } finally {
      this.processing = false;
      
      // If there are more items in queue, schedule another flush
      if (this.queue.length > 0) {
        this.scheduleFlush();
      }
    }
  }
  
  /**
   * Process a batch of events
   * This is where you'd write to your database
   */
  private async processBatch(batch: AnalyticsEvent[]): Promise<void> {
    if (batch.length === 0) {
      return;
    }
    
    // Group events by type for efficient processing
    const groupedEvents = this.groupByType(batch);
    
    // Process each type
    await Promise.all([
      this.processClassificationEvents(groupedEvents.classification || []),
      this.processCrisisEvents(groupedEvents.crisis || []),
      this.processEngagementEvents(groupedEvents.engagement || []),
      this.processFeedbackEvents(groupedEvents.feedback || []),
      this.processResourceClickEvents(groupedEvents.resource_click || [])
    ]);
    
    console.log(`✅ Processed batch: ${batch.length} events`);
  }
  
  /**
   * Group events by type
   */
  private groupByType(events: AnalyticsEvent[]): { [type: string]: AnalyticsEvent[] } {
    return events.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = [];
      }
      acc[event.type].push(event);
      return acc;
    }, {} as { [type: string]: AnalyticsEvent[] });
  }
  
  /**
   * Process classification events (batch insert)
   */
  private async processClassificationEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    // TODO: Replace with actual database insert
    // await supabase.from('analytics_classifications').insert(
    //   events.map(e => ({
    //     user_id: e.userId,
    //     session_id: e.sessionId,
    //     timestamp: e.timestamp,
    //     ...e.data
    //   }))
    // );
    
    console.log(`  📊 ${events.length} classification events`);
  }
  
  /**
   * Process crisis events (batch insert + immediate alerting)
   */
  private async processCrisisEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    // Crisis events may need immediate processing
    for (const event of events) {
      // TODO: Trigger immediate alerts if needed
      console.warn(`  🚨 Crisis event: ${event.userId}`);
    }
    
    // Then batch insert
    // await supabase.from('analytics_crises').insert(...);
    
    console.log(`  🚨 ${events.length} crisis events`);
  }
  
  /**
   * Process engagement events (batch insert)
   */
  private async processEngagementEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    // TODO: Replace with actual database insert
    console.log(`  💬 ${events.length} engagement events`);
  }
  
  /**
   * Process feedback events (batch insert)
   */
  private async processFeedbackEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    // TODO: Replace with actual database insert
    console.log(`  ⭐ ${events.length} feedback events`);
  }
  
  /**
   * Process resource click events (batch insert)
   */
  private async processResourceClickEvents(events: AnalyticsEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    // TODO: Replace with actual database insert
    console.log(`  🔗 ${events.length} resource click events`);
  }
  
  /**
   * Retry failed batches
   */
  private async retryFailedBatches(): Promise<void> {
    const toRetry = [...this.failedBatches];
    this.failedBatches = [];
    
    for (const batch of toRetry) {
      let attempts = 0;
      let success = false;
      
      while (attempts < this.config.retryAttempts && !success) {
        attempts++;
        
        try {
          await this.processBatch(batch);
          success = true;
          
          // Update stats
          this.stats.eventsProcessed += batch.length;
          this.stats.eventsFailed -= batch.length;
          
          console.log(`✅ Retry successful for batch of ${batch.length} events`);
        } catch (error) {
          console.error(`❌ Retry ${attempts}/${this.config.retryAttempts} failed:`, error);
          
          if (attempts >= this.config.retryAttempts) {
            // Give up after max retries
            console.error(`❌ Batch permanently failed after ${attempts} attempts`);
            // Could store to dead-letter queue here
          } else {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      }
    }
  }
  
  /**
   * Get processor statistics
   */
  public getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      failedBatches: this.failedBatches.length,
      processing: this.processing
    };
  }
  
  /**
   * Force flush on shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Flushing analytics queue before shutdown...');
    
    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Process all remaining events
    while (this.queue.length > 0) {
      await this.flush();
    }
    
    // Retry any failed batches
    if (this.failedBatches.length > 0) {
      await this.retryFailedBatches();
    }
    
    console.log('✅ Analytics queue flushed');
  }
}

// Singleton instance
let batchProcessor: BatchAnalyticsProcessor | null = null;

/**
 * Get or create the global batch processor
 */
export function getBatchProcessor(config?: Partial<BatchConfig>): BatchAnalyticsProcessor {
  if (!batchProcessor) {
    batchProcessor = new BatchAnalyticsProcessor(config);
  }
  return batchProcessor;
}

/**
 * Queue a classification event
 */
export function queueClassification(
  userId: string,
  sessionId: string,
  data: {
    category: string;
    subcategory?: string;
    confidence: number;
    method: 'regex' | 'claude';
    ambiguousPhrase?: string;
    emotionalIntensity?: number;
    responseTime: number;
  }
): void {
  getBatchProcessor().queueEvent({
    type: 'classification',
    userId,
    sessionId,
    data
  });
}

/**
 * Queue a crisis event (high priority)
 */
export function queueCrisis(
  userId: string,
  sessionId: string,
  data: {
    severity: number;
    indicators: string[];
    responseProvided: string;
    escalated: boolean;
  }
): void {
  getBatchProcessor().queueEvent({
    type: 'crisis',
    userId,
    sessionId,
    data
  });
}

/**
 * Queue an engagement event
 */
export function queueEngagement(
  userId: string,
  sessionId: string,
  data: {
    action: 'message_sent' | 'session_started' | 'session_ended';
    messageCount?: number;
    durationSeconds?: number;
  }
): void {
  getBatchProcessor().queueEvent({
    type: 'engagement',
    userId,
    sessionId,
    data
  });
}

/**
 * Queue a feedback event
 */
export function queueFeedback(
  userId: string,
  sessionId: string,
  data: {
    rating: 'positive' | 'negative' | 'neutral';
    comment?: string;
    messageId?: string;
  }
): void {
  getBatchProcessor().queueEvent({
    type: 'feedback',
    userId,
    sessionId,
    data
  });
}

/**
 * Queue a resource click event
 */
export function queueResourceClick(
  userId: string,
  sessionId: string,
  data: {
    resourceId: string;
    resourceType: 'crisis_hotline' | 'article' | 'therapist' | 'community';
    category: string;
  }
): void {
  getBatchProcessor().queueEvent({
    type: 'resource_click',
    userId,
    sessionId,
    data
  });
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    if (batchProcessor) {
      await batchProcessor.shutdown();
    }
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    if (batchProcessor) {
      await batchProcessor.shutdown();
    }
    process.exit(0);
  });
}






