// CommonJS Batch Analytics Processor
// Queues analytics events and processes them in batches

class BatchAnalyticsProcessor {
  constructor(config = {}) {
    this.maxBatchSize = config.maxBatchSize || 10;
    this.maxWaitTime = config.maxWaitTime || 5000; // 5 seconds
    this.retryAttempts = config.retryAttempts || 3;
    
    this.queue = [];
    this.flushTimer = null;
    this.processing = false;
    this.failedBatches = [];
    
    // Statistics
    this.stats = {
      eventsQueued: 0,
      batchesProcessed: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      averageBatchSize: 0,
      lastProcessedAt: null
    };
    
    // Graceful shutdown handlers
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }
  
  /**
   * Add an event to the analytics queue
   */
  queueEvent(event) {
    const fullEvent = {
      ...event,
      timestamp: new Date()
    };
    
    this.queue.push(fullEvent);
    this.stats.eventsQueued++;
    
    // Check if we should flush immediately
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    } else {
      // Schedule a flush if not already scheduled
      this.scheduleFlush();
    }
  }
  
  /**
   * Schedule a flush after maxWaitTime
   */
  scheduleFlush() {
    if (this.flushTimer) {
      return; // Already scheduled
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.maxWaitTime);
  }
  
  /**
   * Process the current queue immediately
   */
  async flush() {
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
    const batch = this.queue.splice(0, this.maxBatchSize);
    
    try {
      await this.processBatch(batch);
      
      // Update stats
      this.stats.batchesProcessed++;
      this.stats.eventsProcessed += batch.length;
      this.stats.averageBatchSize = this.stats.eventsProcessed / this.stats.batchesProcessed;
      this.stats.lastProcessedAt = new Date();
      
      console.log(`✅ Analytics batch processed: ${batch.length} events`);
      
    } catch (error) {
      console.error('❌ Failed to process analytics batch:', error.message);
      
      // Store failed batch for retry
      this.failedBatches.push(batch);
      this.stats.eventsFailed += batch.length;
      
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
   */
  async processBatch(batch) {
    if (batch.length === 0) {
      return;
    }
    
    // Group events by type
    const grouped = batch.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = [];
      }
      acc[event.type].push(event);
      return acc;
    }, {});
    
    // Process each type
    const promises = [];
    
    if (grouped.classification) {
      promises.push(this.processClassificationEvents(grouped.classification));
    }
    if (grouped.crisis) {
      promises.push(this.processCrisisEvents(grouped.crisis));
    }
    if (grouped.engagement) {
      promises.push(this.processEngagementEvents(grouped.engagement));
    }
    if (grouped.feedback) {
      promises.push(this.processFeedbackEvents(grouped.feedback));
    }
    if (grouped.resource_click) {
      promises.push(this.processResourceClickEvents(grouped.resource_click));
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Process classification events
   */
  async processClassificationEvents(events) {
    // TODO: Batch insert to database
    // await supabase.from('analytics_classifications').insert(events.map(...));
    console.log(`  📊 ${events.length} classification events`);
  }
  
  /**
   * Process crisis events (may need immediate alerting)
   */
  async processCrisisEvents(events) {
    for (const event of events) {
      // High severity crises might need immediate notification
      if (event.data.severity >= 9) {
        console.warn(`  🚨 HIGH SEVERITY CRISIS: User ${event.userId}`);
        // TODO: Trigger immediate alert
      }
    }
    
    // TODO: Batch insert to database
    console.log(`  🚨 ${events.length} crisis events`);
  }
  
  /**
   * Process engagement events
   */
  async processEngagementEvents(events) {
    // TODO: Batch insert to database
    console.log(`  💬 ${events.length} engagement events`);
  }
  
  /**
   * Process feedback events
   */
  async processFeedbackEvents(events) {
    // TODO: Batch insert to database
    console.log(`  ⭐ ${events.length} feedback events`);
  }
  
  /**
   * Process resource click events
   */
  async processResourceClickEvents(events) {
    // TODO: Batch insert to database
    console.log(`  🔗 ${events.length} resource click events`);
  }
  
  /**
   * Get processor statistics
   */
  getStats() {
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
  async shutdown() {
    console.log('\n🔄 Flushing analytics queue before shutdown...');
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Process all remaining events
    while (this.queue.length > 0 && !this.processing) {
      await this.flush();
    }
    
    console.log('✅ Analytics queue flushed');
  }
}

// Singleton instance
let batchProcessor = null;

/**
 * Get or create the global batch processor
 */
function getBatchProcessor(config) {
  if (!batchProcessor) {
    batchProcessor = new BatchAnalyticsProcessor(config);
  }
  return batchProcessor;
}

/**
 * Helper functions for queueing events
 */
function queueClassification(userId, sessionId, data) {
  getBatchProcessor().queueEvent({
    type: 'classification',
    userId,
    sessionId,
    data
  });
}

function queueCrisis(userId, sessionId, data) {
  getBatchProcessor().queueEvent({
    type: 'crisis',
    userId,
    sessionId,
    data
  });
}

function queueEngagement(userId, sessionId, data) {
  getBatchProcessor().queueEvent({
    type: 'engagement',
    userId,
    sessionId,
    data
  });
}

function queueFeedback(userId, sessionId, data) {
  getBatchProcessor().queueEvent({
    type: 'feedback',
    userId,
    sessionId,
    data
  });
}

function queueResourceClick(userId, sessionId, data) {
  getBatchProcessor().queueEvent({
    type: 'resource_click',
    userId,
    sessionId,
    data
  });
}

module.exports = {
  BatchAnalyticsProcessor,
  getBatchProcessor,
  queueClassification,
  queueCrisis,
  queueEngagement,
  queueFeedback,
  queueResourceClick
};












