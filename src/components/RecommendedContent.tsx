import React, { useState, useEffect } from 'react';
import {
  getRecommendedContent,
  getDailyRecommendations,
  trackContentInteraction,
  saveContent,
  unsaveContent,
  getSavedContent,
  type RecommendedContent as ContentItem,
  type ContentType,
} from '../lib/contentRecommendationService';
import './RecommendedContent.css';

interface RecommendedContentProps {
  userId: string;
  onClose?: () => void;
  mode?: 'full' | 'compact' | 'widget';
}

type Tab = 'for-you' | 'articles' | 'exercises' | 'saved';

export default function RecommendedContent({ userId, onClose, mode = 'full' }: RecommendedContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('for-you');
  const [forYouContent, setForYouContent] = useState<{
    articles: ContentItem[];
    exercises: ContentItem[];
    affirmation: ContentItem | null;
  }>({ articles: [], exercises: [], affirmation: null });
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [exercises, setExercises] = useState<ContentItem[]>([]);
  const [savedItems, setSavedItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadContent();
  }, [userId]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [daily, allArticles, allExercises, saved] = await Promise.all([
        getDailyRecommendations(userId),
        getRecommendedContent(userId, { contentType: 'article', limit: 10 }),
        getRecommendedContent(userId, { contentType: 'exercise', limit: 10 }),
        getSavedContent(userId),
      ]);

      setForYouContent(daily);
      setArticles(allArticles);
      setExercises(allExercises);
      setSavedItems(saved);
      setSavedIds(new Set(saved.map(s => s.id)));
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = async (content: ContentItem) => {
    await trackContentInteraction(userId, content.id, 'click');
    
    if (content.url) {
      window.open(content.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSave = async (content: ContentItem) => {
    if (savedIds.has(content.id)) {
      await unsaveContent(userId, content.id);
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(content.id);
        return next;
      });
      setSavedItems(prev => prev.filter(s => s.id !== content.id));
    } else {
      await saveContent(userId, content.id);
      await trackContentInteraction(userId, content.id, 'save');
      setSavedIds(prev => new Set([...prev, content.id]));
      setSavedItems(prev => [content, ...prev]);
    }
  };

  const getContentTypeIcon = (type: ContentType): string => {
    const icons: Record<ContentType, string> = {
      article: '📖',
      video: '🎬',
      exercise: '🧘',
      resource: '🔗',
      podcast: '🎙️',
      book: '📚',
      tool: '🛠️',
      community: '👥',
      affirmation: '✨',
      quote: '💬',
    };
    return icons[type] || '📄';
  };

  const renderContentCard = (content: ContentItem, size: 'small' | 'medium' | 'large' = 'medium') => {
    const isSaved = savedIds.has(content.id);
    
    return (
      <div 
        key={content.id} 
        className={`content-card ${size}`}
        onClick={() => handleContentClick(content)}
      >
        {content.imageUrl && (
          <div className="content-image">
            <img src={content.imageUrl} alt={content.title} />
          </div>
        )}
        
        <div className="content-body">
          <div className="content-meta">
            <span className="content-type">
              {getContentTypeIcon(content.contentType)} {content.contentType}
            </span>
            {content.readingTime && (
              <span className="reading-time">⏱️ {content.readingTime} min</span>
            )}
          </div>
          
          <h3 className="content-title">{content.title}</h3>
          
          <p className="content-description">
            {content.description.substring(0, size === 'small' ? 80 : 150)}
            {content.description.length > (size === 'small' ? 80 : 150) ? '...' : ''}
          </p>
          
          {content.matchReasons && content.matchReasons.length > 0 && (
            <div className="match-reasons">
              {content.matchReasons.slice(0, 2).map((reason, i) => (
                <span key={i} className="reason-chip">✓ {reason}</span>
              ))}
            </div>
          )}
          
          {content.tags && content.tags.length > 0 && size !== 'small' && (
            <div className="content-tags">
              {content.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
        
        <button 
          className={`save-button ${isSaved ? 'saved' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleSave(content);
          }}
        >
          {isSaved ? '🔖' : '📑'}
        </button>
      </div>
    );
  };

  const renderAffirmation = () => {
    if (!forYouContent.affirmation) return null;
    
    return (
      <div className="affirmation-card">
        <div className="affirmation-icon">✨</div>
        <p className="affirmation-text">{forYouContent.affirmation.description}</p>
        <span className="affirmation-label">Daily Affirmation</span>
      </div>
    );
  };

  // Compact widget mode for dashboard
  if (mode === 'widget') {
    return (
      <div className="recommended-content-widget">
        <h3 className="widget-title">📚 Recommended for You</h3>
        
        {loading ? (
          <div className="loading-state small">Loading...</div>
        ) : (
          <>
            {renderAffirmation()}
            
            <div className="widget-items">
              {forYouContent.articles.slice(0, 2).map(content => 
                renderContentCard(content, 'small')
              )}
            </div>
            
            <button className="see-more-button" onClick={onClose}>
              See All Content →
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="recommended-content-container">
      {/* Header */}
      <div className="content-header">
        <div className="header-content">
          <h1 className="header-title">📚 Content Library</h1>
          <p className="header-subtitle">Articles and exercises personalized for you</p>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="content-tabs">
        <button 
          className={`tab ${activeTab === 'for-you' ? 'active' : ''}`}
          onClick={() => setActiveTab('for-you')}
        >
          ✨ For You
        </button>
        <button 
          className={`tab ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          📖 Articles
        </button>
        <button 
          className={`tab ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          🧘 Exercises
        </button>
        <button 
          className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          🔖 Saved
          {savedItems.length > 0 && (
            <span className="badge">{savedItems.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="content-area">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Finding content for you...</p>
          </div>
        ) : (
          <>
            {/* For You Tab */}
            {activeTab === 'for-you' && (
              <div className="for-you-content">
                {renderAffirmation()}
                
                <div className="section">
                  <h2 className="section-title">📖 Recommended Articles</h2>
                  <div className="content-grid">
                    {forYouContent.articles.length > 0 ? (
                      forYouContent.articles.map(content => renderContentCard(content))
                    ) : (
                      <p className="empty-text">No articles found yet. Complete your cultural profile for personalized recommendations.</p>
                    )}
                  </div>
                </div>

                <div className="section">
                  <h2 className="section-title">🧘 Exercises for Today</h2>
                  <div className="content-grid">
                    {forYouContent.exercises.length > 0 ? (
                      forYouContent.exercises.map(content => renderContentCard(content))
                    ) : (
                      <p className="empty-text">No exercises found yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div className="articles-content">
                <div className="content-grid">
                  {articles.length > 0 ? (
                    articles.map(content => renderContentCard(content, 'large'))
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">📖</span>
                      <h3>No articles yet</h3>
                      <p>Check back soon for new content</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exercises Tab */}
            {activeTab === 'exercises' && (
              <div className="exercises-content">
                <div className="content-grid">
                  {exercises.length > 0 ? (
                    exercises.map(content => renderContentCard(content, 'large'))
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">🧘</span>
                      <h3>No exercises yet</h3>
                      <p>Check back soon for new exercises</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div className="saved-content">
                {savedItems.length > 0 ? (
                  <div className="content-grid">
                    {savedItems.map(content => renderContentCard(content, 'large'))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">🔖</span>
                    <h3>No saved items</h3>
                    <p>Save articles and exercises to read later</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
