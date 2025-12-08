// CommonJS Smart Resource Matcher
// Pre-computes resource relevance scores for fast lookups

class SmartResourceMatcher {
  constructor() {
    this.resourceIndex = new Map();
    this.categoryIndex = new Map();
    this.culturalIndex = new Map();
    this.resources = [];
    this.indexed = false;
  }
  
  /**
   * Index resources for fast lookup
   */
  indexResources(resources) {
    console.log(`📚 Indexing ${resources.length} resources...`);
    
    this.resources = resources;
    this.resourceIndex.clear();
    this.categoryIndex.clear();
    this.culturalIndex.clear();
    
    for (const resource of resources) {
      // Extract and index keywords
      const keywords = this.extractKeywords(resource.description + ' ' + resource.title);
      resource.keywords = keywords;
      
      for (const keyword of keywords) {
        if (!this.resourceIndex.has(keyword)) {
          this.resourceIndex.set(keyword, []);
        }
        this.resourceIndex.get(keyword).push(resource);
      }
      
      // Index by category
      const category = resource.category.toLowerCase();
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, []);
      }
      this.categoryIndex.get(category).push(resource);
      
      // Index by subcategory
      if (resource.subcategory) {
        const subcategory = resource.subcategory.toLowerCase();
        if (!this.categoryIndex.has(subcategory)) {
          this.categoryIndex.set(subcategory, []);
        }
        this.categoryIndex.get(subcategory).push(resource);
      }
      
      // Index by cultural relevance
      if (resource.culturalRelevance) {
        for (const cultural of resource.culturalRelevance) {
          const key = cultural.toLowerCase();
          if (!this.culturalIndex.has(key)) {
            this.culturalIndex.set(key, []);
          }
          this.culturalIndex.get(key).push(resource);
        }
      }
    }
    
    this.indexed = true;
    console.log(`✅ Indexed ${this.resourceIndex.size} unique keywords`);
    console.log(`✅ Indexed ${this.categoryIndex.size} categories`);
    console.log(`✅ Indexed ${this.culturalIndex.size} cultural contexts`);
  }
  
  /**
   * Fast resource matching based on classification
   */
  fastResourceMatch(classification, limit = 5) {
    if (!this.indexed) {
      console.warn('⚠️  Resources not indexed yet');
      return [];
    }
    
    const matches = new Map();
    
    // 1. Match by category (high relevance)
    const categoryResources = this.categoryIndex.get(classification.category.toLowerCase()) || [];
    for (const resource of categoryResources) {
      const existing = matches.get(resource.id);
      if (existing) {
        existing.relevanceScore += 10;
        existing.matchedKeywords.push(classification.category);
      } else {
        matches.set(resource.id, {
          resource,
          relevanceScore: 10,
          matchedKeywords: [classification.category],
          reason: `Matches category: ${classification.category}`
        });
      }
    }
    
    // 2. Match by subcategory (very high relevance)
    if (classification.subcategory) {
      const subcategoryResources = this.categoryIndex.get(classification.subcategory.toLowerCase()) || [];
      for (const resource of subcategoryResources) {
        const existing = matches.get(resource.id);
        if (existing) {
          existing.relevanceScore += 15;
          existing.matchedKeywords.push(classification.subcategory);
          existing.reason = `Matches subcategory: ${classification.subcategory}`;
        } else {
          matches.set(resource.id, {
            resource,
            relevanceScore: 15,
            matchedKeywords: [classification.subcategory],
            reason: `Matches subcategory: ${classification.subcategory}`
          });
        }
      }
    }
    
    // 3. Boost crisis resources for high emotional intensity
    if (classification.emotional_intensity && classification.emotional_intensity >= 8) {
      const crisisResources = this.categoryIndex.get('crisis') || [];
      for (const resource of crisisResources) {
        const existing = matches.get(resource.id);
        if (existing) {
          existing.relevanceScore += 20; // High boost for crisis
          existing.reason = `Crisis resource - high emotional intensity (${classification.emotional_intensity})`;
        } else {
          matches.set(resource.id, {
            resource,
            relevanceScore: 20,
            matchedKeywords: ['crisis'],
            reason: `Crisis resource - high emotional intensity (${classification.emotional_intensity})`
          });
        }
      }
    }
    
    // 4. Boost culturally relevant resources if needed
    if (classification.cultural_context) {
      const culturalResources = [
        ...(this.culturalIndex.get('black') || []),
        ...(this.culturalIndex.get('african-american') || []),
        ...(this.culturalIndex.get('poc') || [])
      ];
      
      for (const resource of culturalResources) {
        const existing = matches.get(resource.id);
        if (existing) {
          existing.relevanceScore += 5;
          existing.matchedKeywords.push('culturally-relevant');
        } else {
          matches.set(resource.id, {
            resource,
            relevanceScore: 5,
            matchedKeywords: ['culturally-relevant'],
            reason: 'Culturally relevant resource'
          });
        }
      }
    }
    
    // Sort by relevance score (descending)
    const sortedMatches = Array.from(matches.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
    
    return sortedMatches;
  }
  
  /**
   * Search resources by query text
   */
  searchResources(query, limit = 10) {
    if (!this.indexed) {
      console.warn('⚠️  Resources not indexed yet');
      return [];
    }
    
    const queryKeywords = this.extractKeywords(query);
    const matches = new Map();
    
    for (const keyword of queryKeywords) {
      const resources = this.resourceIndex.get(keyword) || [];
      for (const resource of resources) {
        const existing = matches.get(resource.id);
        if (existing) {
          existing.relevanceScore += 1;
          existing.matchedKeywords.push(keyword);
        } else {
          matches.set(resource.id, {
            resource,
            relevanceScore: 1,
            matchedKeywords: [keyword],
            reason: `Matches keywords: ${keyword}`
          });
        }
      }
    }
    
    // Sort by relevance score (descending)
    return Array.from(matches.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }
  
  /**
   * Get resources by category
   */
  getResourcesByCategory(category) {
    return this.categoryIndex.get(category.toLowerCase()) || [];
  }
  
  /**
   * Get crisis resources (fast)
   */
  getCrisisResources() {
    return this.categoryIndex.get('crisis') || [];
  }
  
  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    // Convert to lowercase and remove special characters
    const cleaned = text.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split into words
    const words = cleaned.split(' ');
    
    // Remove stop words
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'you', 'your', 'their', 'our', 'can'
    ]);
    
    const keywords = words
      .filter(word => word.length > 2) // At least 3 characters
      .filter(word => !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Unique
    
    return keywords;
  }
  
  /**
   * Get indexing stats
   */
  getStats() {
    return {
      totalResources: this.resources.length,
      uniqueKeywords: this.resourceIndex.size,
      categories: this.categoryIndex.size,
      culturalContexts: this.culturalIndex.size,
      indexed: this.indexed
    };
  }
}

// Singleton instance
let resourceMatcher = null;

/**
 * Get or create the resource matcher
 */
function getResourceMatcher() {
  if (!resourceMatcher) {
    resourceMatcher = new SmartResourceMatcher();
  }
  return resourceMatcher;
}

/**
 * Initialize with default resources
 */
function initializeResourceMatcher(resources) {
  const matcher = getResourceMatcher();
  matcher.indexResources(resources);
}

/**
 * Fast resource lookup
 */
function findResources(classification, limit) {
  return getResourceMatcher().fastResourceMatch(classification, limit);
}

/**
 * Search resources by text
 */
function searchResourcesByText(query, limit) {
  return getResourceMatcher().searchResources(query, limit);
}

module.exports = {
  SmartResourceMatcher,
  getResourceMatcher,
  initializeResourceMatcher,
  findResources,
  searchResourcesByText
};












