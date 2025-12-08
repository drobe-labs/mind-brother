// Rate Limiter & Caching for Claude API
// Handles rate limits, implements caching, and provides fallback mechanisms

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  cacheTTL: number; // milliseconds
}

export class RateLimiter {
  private cache = new Map<string, CacheEntry<any>>();
  private requestLog: number[] = []; // timestamps of requests
  
  private config: RateLimitConfig = {
    maxRequestsPerMinute: 50,    // Claude's limit is higher, but be conservative
    maxRequestsPerHour: 1000,
    maxRequestsPerDay: 10000,
    cacheTTL: 3600000 // 1 hour
  };
  
  constructor(config?: Partial<RateLimitConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Clean up expired cache entries every 10 minutes
    setInterval(() => this.cleanupCache(), 600000);
  }
  
  /**
   * Check if request is allowed under rate limits
   */
  public canMakeRequest(): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number; // seconds
  } {
    const now = Date.now();
    
    // Remove requests older than 24 hours
    this.requestLog = this.requestLog.filter(ts => now - ts < 86400000);
    
    // Check minute limit
    const lastMinute = this.requestLog.filter(ts => now - ts < 60000).length;
    if (lastMinute >= this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: 'Rate limit: max requests per minute exceeded',
        retryAfter: 60
      };
    }
    
    // Check hour limit
    const lastHour = this.requestLog.filter(ts => now - ts < 3600000).length;
    if (lastHour >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: 'Rate limit: max requests per hour exceeded',
        retryAfter: 3600
      };
    }
    
    // Check day limit
    if (this.requestLog.length >= this.config.maxRequestsPerDay) {
      return {
        allowed: false,
        reason: 'Rate limit: max requests per day exceeded',
        retryAfter: 86400
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Log a request (call after successful request)
   */
  public logRequest(): void {
    this.requestLog.push(Date.now());
  }
  
  /**
   * Get cache key for message + context
   */
  private getCacheKey(message: string, context?: any): string {
    // Normalize message (lowercase, trim)
    const normalizedMessage = message.toLowerCase().trim();
    
    // Include context if provided
    const contextStr = context ? JSON.stringify(context) : '';
    
    // Create hash-like key (simple version - could use crypto.hash for production)
    return `${normalizedMessage}:${contextStr}`;
  }
  
  /**
   * Get cached result if available and not expired
   */
  public getCached<T>(message: string, context?: any): T | null {
    const key = this.getCacheKey(message, context);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`   💾 Cache hit for: "${message.substring(0, 50)}..."`);
    return entry.data as T;
  }
  
  /**
   * Set cache entry
   */
  public setCache<T>(message: string, data: T, context?: any, ttl?: number): void {
    const key = this.getCacheKey(message, context);
    const now = Date.now();
    const cacheTTL = ttl || this.config.cacheTTL;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheTTL
    });
    
    console.log(`   💾 Cached result for: "${message.substring(0, 50)}..." (TTL: ${cacheTTL / 1000}s)`);
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    let oldestTimestamp: number | null = null;
    
    for (const entry of this.cache.values()) {
      if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }
    
    return {
      size: this.cache.size,
      hitRate: 0, // Would track hits/misses in production
      oldestEntry: oldestTimestamp
    };
  }
  
  /**
   * Get rate limit statistics
   */
  public getRateLimitStats(): {
    requestsLastMinute: number;
    requestsLastHour: number;
    requestsLastDay: number;
    remainingMinute: number;
    remainingHour: number;
    remainingDay: number;
  } {
    const now = Date.now();
    
    const lastMinute = this.requestLog.filter(ts => now - ts < 60000).length;
    const lastHour = this.requestLog.filter(ts => now - ts < 3600000).length;
    const lastDay = this.requestLog.length;
    
    return {
      requestsLastMinute: lastMinute,
      requestsLastHour: lastHour,
      requestsLastDay: lastDay,
      remainingMinute: this.config.maxRequestsPerMinute - lastMinute,
      remainingHour: this.config.maxRequestsPerHour - lastHour,
      remainingDay: this.config.maxRequestsPerDay - lastDay
    };
  }
  
  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('✅ Cache cleared');
  }
  
  /**
   * Reset rate limit counters (for testing)
   */
  public resetRateLimits(): void {
    this.requestLog = [];
    console.log('✅ Rate limits reset');
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// ===== USAGE WITH CLAUDE API =====

/**
 * Classify with caching and rate limiting
 */
export async function classifyWithCache<T>(
  message: string,
  context: any,
  classifyFunction: (msg: string, ctx: any) => Promise<T>,
  fallbackFunction?: (msg: string, ctx: any) => T
): Promise<T> {
  
  // 1. Check cache first
  const cached = rateLimiter.getCached<T>(message, context);
  if (cached) {
    return cached;
  }
  
  // 2. Check rate limits
  const rateLimitCheck = rateLimiter.canMakeRequest();
  if (!rateLimitCheck.allowed) {
    console.warn(`⚠️  Rate limit exceeded: ${rateLimitCheck.reason}`);
    console.warn(`   Retry after: ${rateLimitCheck.retryAfter}s`);
    
    // Fall back to rule-based if available
    if (fallbackFunction) {
      console.log('   → Falling back to rule-based classification');
      return fallbackFunction(message, context);
    }
    
    throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
  }
  
  // 3. Make request
  try {
    const result = await classifyFunction(message, context);
    
    // Log successful request
    rateLimiter.logRequest();
    
    // Cache result
    rateLimiter.setCache(message, result, context);
    
    return result;
  } catch (error: any) {
    // Handle rate limit errors from Claude
    if (error.status === 429 || error.message?.includes('rate limit')) {
      console.error('🚨 Claude API rate limit hit!');
      
      if (fallbackFunction) {
        console.log('   → Falling back to rule-based classification');
        return fallbackFunction(message, context);
      }
      
      throw new Error('Rate limit exceeded and no fallback available');
    }
    
    // Handle other errors
    throw error;
  }
}

/**
 * Example: Classify with hybrid fallback
 */
export async function classifyMessageWithCaching(
  message: string,
  context?: any
): Promise<any> {
  const { hybridClassifier } = await import('./hybridClassifier');
  
  return await classifyWithCache(
    message,
    context,
    // Main classification function (Claude)
    async (msg, ctx) => {
      const { claudeClassifier } = await import('./claudeClassifier');
      return await claudeClassifier.classifyMessage(msg, ctx?.recentMessages || []);
    },
    // Fallback function (regex)
    (msg, ctx) => {
      const { modernRAG } = await import('./modernRAG');
      const patterns = modernRAG.detectPatterns(msg);
      
      // Simple fallback classification
      if (patterns.isCrisis) {
        return {
          category: 'CRISIS',
          confidence: 1.0,
          method: 'regex_fallback'
        };
      }
      
      // Find most likely category based on patterns
      const categories = Object.entries(patterns)
        .filter(([key, value]) => value === true && key.startsWith('is'))
        .map(([key]) => key.replace('is', '').toUpperCase());
      
      return {
        category: categories[0] || 'GENERAL',
        confidence: 0.7,
        method: 'regex_fallback',
        note: 'Fallback due to rate limit'
      };
    }
  );
}






