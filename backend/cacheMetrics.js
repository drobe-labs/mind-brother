// Cache Metrics Tracker
// Tracks prompt caching performance and cost savings

class CacheMetricsTracker {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokensSaved: 0,
      totalCostSaved: 0,
      averageHitRate: 0,
      byEndpoint: {
        '/api/chat': { hits: 0, misses: 0, tokensSaved: 0 },
        '/api/classify': { hits: 0, misses: 0, tokensSaved: 0 }
      }
    };
  }

  /**
   * Track a cache event
   */
  trackCacheEvent(endpoint, cacheHit, tokensSaved = 0) {
    this.metrics.totalRequests++;
    
    if (cacheHit) {
      this.metrics.cacheHits++;
      this.metrics.totalTokensSaved += tokensSaved;
      
      // Cost calculation: $3.00 per 1M input tokens
      const costSaved = (tokensSaved / 1000000) * 3.00;
      this.metrics.totalCostSaved += costSaved;
      
      if (this.metrics.byEndpoint[endpoint]) {
        this.metrics.byEndpoint[endpoint].hits++;
        this.metrics.byEndpoint[endpoint].tokensSaved += tokensSaved;
      }
    } else {
      this.metrics.cacheMisses++;
      if (this.metrics.byEndpoint[endpoint]) {
        this.metrics.byEndpoint[endpoint].misses++;
      }
    }
    
    // Update average hit rate
    this.metrics.averageHitRate = 
      (this.metrics.cacheHits / this.metrics.totalRequests) * 100;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      hitRate: this.metrics.averageHitRate,
      totalCostSavedFormatted: `$${this.metrics.totalCostSaved.toFixed(4)}`,
      tokensSavedFormatted: this.metrics.totalTokensSaved.toLocaleString()
    };
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const hitRate = this.metrics.averageHitRate;
    const costSaved = this.metrics.totalCostSaved;
    const tokensSaved = this.metrics.totalTokensSaved;
    
    return {
      summary: `Cache Performance: ${hitRate.toFixed(1)}% hit rate, ${tokensSaved.toLocaleString()} tokens saved, $${costSaved.toFixed(4)} cost saved`,
      details: {
        totalRequests: this.metrics.totalRequests,
        cacheHits: this.metrics.cacheHits,
        cacheMisses: this.metrics.cacheMisses,
        hitRate: `${hitRate.toFixed(1)}%`,
        tokensSaved: tokensSaved.toLocaleString(),
        costSaved: `$${costSaved.toFixed(4)}`
      },
      byEndpoint: this.metrics.byEndpoint
    };
  }

  /**
   * Reset metrics (for new period)
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalTokensSaved: 0,
      totalCostSaved: 0,
      averageHitRate: 0,
      byEndpoint: {
        '/api/chat': { hits: 0, misses: 0, tokensSaved: 0 },
        '/api/classify': { hits: 0, misses: 0, tokensSaved: 0 }
      }
    };
    console.log('✅ Cache metrics reset');
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
}

// Export singleton instance
const cacheMetrics = new CacheMetricsTracker();
module.exports = { cacheMetrics, CacheMetricsTracker };


