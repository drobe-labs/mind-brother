// Smart Resource Matcher
// Pre-computes resource relevance scores for fast lookups

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  url?: string;
  phone?: string;
  type: 'crisis_hotline' | 'therapy' | 'support_group' | 'article' | 'video' | 'app' | 'book';
  relevanceScore?: number;
  keywords?: string[];
  culturalRelevance?: string[]; // e.g., ['black', 'african-american', 'poc']
  tags?: string[];
}

export interface ResourceMatch {
  resource: Resource;
  relevanceScore: number;
  matchedKeywords: string[];
  reason: string;
}

export class SmartResourceMatcher {
  private resourceIndex: Map<string, Resource[]> = new Map();
  private categoryIndex: Map<string, Resource[]> = new Map();
  private culturalIndex: Map<string, Resource[]> = new Map();
  private resources: Resource[] = [];
  private indexed = false;
  
  /**
   * Index resources for fast lookup
   */
  public indexResources(resources: Resource[]): void {
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
        this.resourceIndex.get(keyword)!.push(resource);
      }
      
      // Index by category
      const category = resource.category.toLowerCase();
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, []);
      }
      this.categoryIndex.get(category)!.push(resource);
      
      // Index by subcategory
      if (resource.subcategory) {
        const subcategory = resource.subcategory.toLowerCase();
        if (!this.categoryIndex.has(subcategory)) {
          this.categoryIndex.set(subcategory, []);
        }
        this.categoryIndex.get(subcategory)!.push(resource);
      }
      
      // Index by cultural relevance
      if (resource.culturalRelevance) {
        for (const cultural of resource.culturalRelevance) {
          const key = cultural.toLowerCase();
          if (!this.culturalIndex.has(key)) {
            this.culturalIndex.set(key, []);
          }
          this.culturalIndex.get(key)!.push(resource);
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
  public fastResourceMatch(classification: {
    category: string;
    subcategory?: string;
    emotional_intensity?: number;
    cultural_context?: boolean;
  }, limit: number = 5): ResourceMatch[] {
    
    if (!this.indexed) {
      console.warn('⚠️  Resources not indexed yet');
      return [];
    }
    
    const matches: Map<string, ResourceMatch> = new Map();
    
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
  public searchResources(query: string, limit: number = 10): ResourceMatch[] {
    if (!this.indexed) {
      console.warn('⚠️  Resources not indexed yet');
      return [];
    }
    
    const queryKeywords = this.extractKeywords(query);
    const matches: Map<string, ResourceMatch> = new Map();
    
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
  public getResourcesByCategory(category: string): Resource[] {
    return this.categoryIndex.get(category.toLowerCase()) || [];
  }
  
  /**
   * Get crisis resources (fast)
   */
  public getCrisisResources(): Resource[] {
    return this.categoryIndex.get('crisis') || [];
  }
  
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
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
  public getStats() {
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
let resourceMatcher: SmartResourceMatcher | null = null;

/**
 * Get or create the resource matcher
 */
export function getResourceMatcher(): SmartResourceMatcher {
  if (!resourceMatcher) {
    resourceMatcher = new SmartResourceMatcher();
  }
  return resourceMatcher;
}

/**
 * Initialize with default resources
 */
export function initializeResourceMatcher(resources: Resource[]): void {
  const matcher = getResourceMatcher();
  matcher.indexResources(resources);
}

/**
 * Fast resource lookup
 */
export function findResources(classification: {
  category: string;
  subcategory?: string;
  emotional_intensity?: number;
  cultural_context?: boolean;
}, limit?: number): ResourceMatch[] {
  return getResourceMatcher().fastResourceMatch(classification, limit);
}

/**
 * Search resources by text
 */
export function searchResourcesByText(query: string, limit?: number): ResourceMatch[] {
  return getResourceMatcher().searchResources(query, limit);
}






