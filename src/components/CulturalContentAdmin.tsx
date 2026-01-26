import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  CULTURAL_BACKGROUNDS,
  COMMUNITIES,
  PRIMARY_CONCERNS,
} from '../lib/culturalPersonalizationService';
import './CulturalContentAdmin.css';

interface CulturalContent {
  id: string;
  content_type: string;
  title: string;
  content: string;
  target_cultural_backgrounds: string[];
  target_communities: string[];
  target_concerns: string[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentFormData {
  content_type: string;
  title: string;
  content: string;
  target_cultural_backgrounds: string[];
  target_communities: string[];
  target_concerns: string[];
  priority: number;
  is_active: boolean;
}

const CONTENT_TYPES = [
  { value: 'affirmation', label: '🌟 Affirmation', description: 'Positive affirmations and encouragements' },
  { value: 'coping_strategy', label: '🧘 Coping Strategy', description: 'Techniques for managing stress and emotions' },
  { value: 'resource', label: '📚 Resource', description: 'Links, hotlines, and external resources' },
  { value: 'educational', label: '🎓 Educational', description: 'Mental health education and information' },
  { value: 'quote', label: '💬 Quote', description: 'Inspirational quotes from cultural figures' },
  { value: 'grounding', label: '🌍 Grounding Exercise', description: 'Mindfulness and grounding techniques' },
  { value: 'crisis', label: '🚨 Crisis Resource', description: 'Emergency and crisis intervention resources' },
  { value: 'community', label: '🤝 Community Resource', description: 'Community support and organizations' },
];

const emptyForm: ContentFormData = {
  content_type: 'affirmation',
  title: '',
  content: '',
  target_cultural_backgrounds: [],
  target_communities: [],
  target_concerns: [],
  priority: 50,
  is_active: true,
};

interface CulturalContentAdminProps {
  onClose?: () => void;
}

export default function CulturalContentAdmin({ onClose }: CulturalContentAdminProps) {
  const [content, setContent] = useState<CulturalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingContent, setEditingContent] = useState<CulturalContent | null>(null);
  const [formData, setFormData] = useState<ContentFormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cultural_content')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
      showMessage('error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      showMessage('error', 'Title and content are required');
      return;
    }

    setSaving(true);
    try {
      if (editingContent) {
        // Update existing
        const { error } = await supabase
          .from('cultural_content')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingContent.id);

        if (error) throw error;
        showMessage('success', 'Content updated successfully');
      } else {
        // Insert new
        const { error } = await supabase
          .from('cultural_content')
          .insert(formData);

        if (error) throw error;
        showMessage('success', 'Content added successfully');
      }

      // Reset form and reload
      setFormData(emptyForm);
      setEditingContent(null);
      setShowForm(false);
      await loadContent();
    } catch (error) {
      console.error('Error saving content:', error);
      showMessage('error', 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: CulturalContent) => {
    setEditingContent(item);
    setFormData({
      content_type: item.content_type,
      title: item.title,
      content: item.content,
      target_cultural_backgrounds: item.target_cultural_backgrounds || [],
      target_communities: item.target_communities || [],
      target_concerns: item.target_concerns || [],
      priority: item.priority,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('cultural_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showMessage('success', 'Content deleted');
      await loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      showMessage('error', 'Failed to delete content');
    }
  };

  const handleToggleActive = async (item: CulturalContent) => {
    try {
      const { error } = await supabase
        .from('cultural_content')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      await loadContent();
    } catch (error) {
      console.error('Error toggling active status:', error);
      showMessage('error', 'Failed to update status');
    }
  };

  const handleArrayToggle = (field: keyof ContentFormData, value: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    setFormData({ ...formData, [field]: newArray });
  };

  const cancelEdit = () => {
    setEditingContent(null);
    setFormData(emptyForm);
    setShowForm(false);
  };

  // Filter and search content
  const filteredContent = content.filter(item => {
    const matchesFilter = filter === 'all' || item.content_type === filter;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getContentTypeInfo = (type: string) => {
    return CONTENT_TYPES.find(t => t.value === type) || { value: type, label: type, description: '' };
  };

  return (
    <div className="cultural-admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1 className="admin-title">🌍 Cultural Content Library</h1>
          <p className="admin-subtitle">Manage culturally relevant resources, affirmations, and educational content</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setEditingContent(null);
              setFormData(emptyForm);
              setShowForm(true);
            }}
          >
            + Add Content
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="admin-form-container">
          <div className="admin-form">
            <div className="form-header">
              <h2>{editingContent ? '✏️ Edit Content' : '➕ Add New Content'}</h2>
              <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Content Type */}
              <div className="form-group">
                <label>Content Type *</label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                >
                  {CONTENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  {getContentTypeInfo(formData.content_type).description}
                </span>
              </div>

              {/* Title */}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter a clear, descriptive title"
                  required
                />
              </div>

              {/* Content */}
              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the full content, resource URL, or detailed description"
                  rows={5}
                  required
                />
              </div>

              {/* Target Cultural Backgrounds */}
              <div className="form-group">
                <label>Target Cultural Backgrounds</label>
                <p className="form-hint">Leave empty to target all backgrounds</p>
                <div className="checkbox-grid">
                  {CULTURAL_BACKGROUNDS.filter(bg => bg.value !== 'prefer_not_to_say').map(bg => (
                    <label key={bg.value} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.target_cultural_backgrounds.includes(bg.value)}
                        onChange={() => handleArrayToggle('target_cultural_backgrounds', bg.value)}
                      />
                      <span>{bg.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Communities */}
              <div className="form-group">
                <label>Target Communities</label>
                <p className="form-hint">Leave empty to target all communities</p>
                <div className="checkbox-grid">
                  {COMMUNITIES.map(comm => (
                    <label key={comm.value} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.target_communities.includes(comm.value)}
                        onChange={() => handleArrayToggle('target_communities', comm.value)}
                      />
                      <span>{comm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Concerns */}
              <div className="form-group">
                <label>Target Concerns</label>
                <p className="form-hint">What concerns is this content most relevant for?</p>
                <div className="checkbox-grid">
                  {PRIMARY_CONCERNS.map(concern => (
                    <label key={concern.value} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.target_concerns.includes(concern.value)}
                        onChange={() => handleArrayToggle('target_concerns', concern.value)}
                      />
                      <span>{concern.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label>Priority (1-100)</label>
                <div className="priority-input">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  />
                  <span className="priority-value">{formData.priority}</span>
                </div>
                <span className="form-hint">Higher priority content appears first</span>
              </div>

              {/* Active Status */}
              <div className="form-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="toggle-text">Active</span>
                </label>
                <span className="form-hint">Inactive content won't be shown to users</span>
              </div>

              {/* Submit */}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingContent ? 'Update Content' : 'Add Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="admin-filters">
        <div className="filter-group">
          <label>Filter by Type:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Types</option>
            {CONTENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="search-group">
          <input
            type="text"
            placeholder="🔍 Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="stats">
          <span>{filteredContent.length} items</span>
          <span className="stat-separator">•</span>
          <span className="active-count">{filteredContent.filter(c => c.is_active).length} active</span>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading content...</p>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="empty-state">
          <p>📭 No content found</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Add your first content
          </button>
        </div>
      ) : (
        <div className="content-list">
          {filteredContent.map((item) => (
            <div key={item.id} className={`content-card ${!item.is_active ? 'inactive' : ''}`}>
              <div className="content-main">
                <div className="content-header">
                  <span className={`content-type type-${item.content_type}`}>
                    {getContentTypeInfo(item.content_type).label}
                  </span>
                  <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                    {item.is_active ? '✓ Active' : '○ Inactive'}
                  </span>
                </div>
                
                <h3 className="content-title">{item.title}</h3>
                <p className="content-text">{item.content}</p>
                
                <div className="content-targets">
                  {item.target_cultural_backgrounds?.length > 0 && (
                    <div className="target-group">
                      <span className="target-label">🌍</span>
                      {item.target_cultural_backgrounds.slice(0, 3).map(bg => (
                        <span key={bg} className="target-tag background">
                          {CULTURAL_BACKGROUNDS.find(b => b.value === bg)?.label || bg}
                        </span>
                      ))}
                      {item.target_cultural_backgrounds.length > 3 && (
                        <span className="target-more">+{item.target_cultural_backgrounds.length - 3}</span>
                      )}
                    </div>
                  )}
                  {item.target_communities?.length > 0 && (
                    <div className="target-group">
                      <span className="target-label">🤝</span>
                      {item.target_communities.slice(0, 3).map(comm => (
                        <span key={comm} className="target-tag community">
                          {COMMUNITIES.find(c => c.value === comm)?.label || comm}
                        </span>
                      ))}
                      {item.target_communities.length > 3 && (
                        <span className="target-more">+{item.target_communities.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="content-meta">
                  <span className="priority">Priority: {item.priority}</span>
                  <span className="date">
                    Updated: {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="content-actions">
                <button
                  className="action-btn edit"
                  onClick={() => handleEdit(item)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="action-btn toggle"
                  onClick={() => handleToggleActive(item)}
                  title={item.is_active ? 'Deactivate' : 'Activate'}
                >
                  {item.is_active ? '👁️' : '👁️‍🗨️'}
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
