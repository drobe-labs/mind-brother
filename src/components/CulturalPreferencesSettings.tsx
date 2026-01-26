import React, { useState, useEffect } from 'react';
import {
  getUserCulturalProfile,
  createOrUpdateCulturalProfile,
  CULTURAL_BACKGROUNDS,
  COMMUNITIES,
  COMMUNICATION_STYLES,
  PRIMARY_CONCERNS,
  LANGUAGE_OPTIONS,
  type CulturalProfile,
  type LanguagePreference,
  type LanguageCode,
} from '../lib/culturalPersonalizationService';
import './CulturalPreferencesSettings.css';

// Backgrounds that show language options
const MULTILINGUAL_BACKGROUNDS = ['latino_hispanic', 'caribbean', 'african'];

interface CulturalPreferencesSettingsProps {
  userId: string;
  onClose?: () => void;
}

export default function CulturalPreferencesSettings({ userId, onClose }: CulturalPreferencesSettingsProps) {
  const [profile, setProfile] = useState<CulturalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for form values (allows editing without immediate save)
  const [formValues, setFormValues] = useState<{
    cultural_background: string | null;
    communities: string[];
    primary_concerns: string[];
    communication_style: string | null;
    language_preference: LanguagePreference | null;
    allows_personalization: boolean;
  }>({
    cultural_background: null,
    communities: [],
    primary_concerns: [],
    communication_style: null,
    language_preference: null,
    allows_personalization: true,
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserCulturalProfile(userId);
      setProfile(data);
      
      // Initialize form values from profile
      if (data) {
        setFormValues({
          cultural_background: data.cultural_background || null,
          communities: data.communities || [],
          primary_concerns: data.primary_concerns || [],
          communication_style: data.communication_style || null,
          language_preference: data.language_preference || null,
          allows_personalization: data.allows_personalization !== false,
        });
      }
    } catch (error) {
      console.error('Error loading cultural profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormValue = (field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const toggleCommunity = (communityValue: string) => {
    const currentCommunities = formValues.communities || [];
    const updated = currentCommunities.includes(communityValue)
      ? currentCommunities.filter((c: string) => c !== communityValue)
      : [...currentCommunities, communityValue];
    updateFormValue('communities', updated);
  };

  const toggleConcern = (concernValue: string) => {
    const currentConcerns = formValues.primary_concerns || [];
    const updated = currentConcerns.includes(concernValue)
      ? currentConcerns.filter((c: string) => c !== concernValue)
      : [...currentConcerns, concernValue];
    updateFormValue('primary_concerns', updated);
  };

  const saveAllPreferences = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      await createOrUpdateCulturalProfile(userId, {
        ...profile,
        cultural_background: formValues.cultural_background as any,
        communities: formValues.communities as any,
        primary_concerns: formValues.primary_concerns as any,
        communication_style: formValues.communication_style as any,
        language_preference: formValues.language_preference as any,
        allows_personalization: formValues.allows_personalization,
      });
      
      // Notify chat to reload prompt
      window.dispatchEvent(new CustomEvent('cultural-preferences-updated'));
      
      await loadProfile();
      setHasChanges(false);
      setSaveMessage('✓ Preferences saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cultural-settings-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cultural-settings-container">
      {/* Header */}
      <div className="cultural-settings-header">
        <div className="header-content">
          <h1 className="header-title">Personalization Preferences</h1>
          <p className="header-subtitle">
            Help Amani understand you better for more relevant support
          </p>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="settings-content">
        {/* Cultural Background */}
        <section className="settings-section">
          <h2 className="section-title">🌍 Cultural Background</h2>
          <p className="section-description">
            This helps us provide culturally relevant support and resources. <span className="optional">(Optional)</span>
          </p>
          <div className="background-options">
            {CULTURAL_BACKGROUNDS.map((bg) => (
              <label
                key={bg.value}
                className={`background-option ${formValues.cultural_background === bg.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="cultural_background"
                  checked={formValues.cultural_background === bg.value}
                  onChange={() => updateFormValue('cultural_background', bg.value)}
                  disabled={saving}
                />
                <span className="background-label">{bg.label}</span>
                {formValues.cultural_background === bg.value && <span className="checkmark">✓</span>}
              </label>
            ))}
          </div>
        </section>

        {/* Language Preferences - only show for multilingual backgrounds */}
        {formValues.cultural_background && MULTILINGUAL_BACKGROUNDS.includes(formValues.cultural_background) && (
          <section className="settings-section">
            <h2 className="section-title">🗣️ Language Preferences</h2>
            <p className="section-description">
              How would you like Amani to communicate with you?
            </p>
            
            <div className="language-options">
              <h3 className="subsection-title">Primary Language</h3>
              <div className="radio-group">
                {LANGUAGE_OPTIONS.filter(lang => {
                  if (formValues.cultural_background === 'latino_hispanic') {
                    return ['english', 'spanish', 'portuguese'].includes(lang.value);
                  }
                  if (formValues.cultural_background === 'caribbean') {
                    return ['english', 'spanish', 'french', 'creole'].includes(lang.value);
                  }
                  if (formValues.cultural_background === 'african') {
                    return ['english', 'french', 'portuguese'].includes(lang.value);
                  }
                  return true;
                }).map((lang) => (
                  <label
                    key={lang.value}
                    className={`radio-card ${formValues.language_preference?.primary === lang.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="language_primary"
                      checked={formValues.language_preference?.primary === lang.value}
                      onChange={() => updateFormValue('language_preference', {
                        ...formValues.language_preference,
                        primary: lang.value as LanguageCode,
                        acceptsMixedLanguage: formValues.language_preference?.acceptsMixedLanguage ?? true,
                      })}
                      disabled={saving}
                    />
                    <div className="radio-content">
                      <span className="radio-label">{lang.nativeLabel} {lang.label !== lang.nativeLabel && `(${lang.label})`}</span>
                    </div>
                    {formValues.language_preference?.primary === lang.value && <span className="checkmark">✓</span>}
                  </label>
                ))}
              </div>

              {formValues.language_preference?.primary && formValues.language_preference.primary !== 'english' && (
                <div className="code-switching-option">
                  <h3 className="subsection-title">
                    {formValues.language_preference.primary === 'spanish' ? 'Spanglish' : 'Code-Switching'}
                  </h3>
                  <label className={`toggle-card ${formValues.language_preference?.acceptsMixedLanguage ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formValues.language_preference?.acceptsMixedLanguage !== false}
                      onChange={(e) => updateFormValue('language_preference', {
                        ...formValues.language_preference,
                        acceptsMixedLanguage: e.target.checked,
                      })}
                      disabled={saving}
                    />
                    <div className="toggle-content">
                      <span className="toggle-label">
                        {formValues.language_preference.primary === 'spanish' 
                          ? 'Mix Spanish and English naturally'
                          : 'Mix languages naturally'}
                      </span>
                      <span className="toggle-description">
                        {formValues.language_preference.primary === 'spanish'
                          ? 'Amani will use Spanglish, mixing languages like familia really talks.'
                          : 'Amani will naturally mix languages when it feels right.'}
                      </span>
                    </div>
                    {formValues.language_preference?.acceptsMixedLanguage && <span className="checkmark">✓</span>}
                  </label>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Communities */}
        <section className="settings-section">
          <h2 className="section-title">🤝 Communities</h2>
          <p className="section-description">
            Select any communities or experiences that resonate with you. <span className="optional">(Select all that apply)</span>
          </p>
          <div className="checkbox-grid">
            {COMMUNITIES.map((community) => (
              <label
                key={community.value}
                className={`checkbox-card ${formValues.communities?.includes(community.value) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={formValues.communities?.includes(community.value) || false}
                  onChange={() => toggleCommunity(community.value)}
                  disabled={saving}
                />
                <div className="checkbox-content">
                  <span className="checkbox-label">{community.label}</span>
                  <span className="checkbox-description">{community.description}</span>
                </div>
                {formValues.communities?.includes(community.value) && <span className="checkmark">✓</span>}
              </label>
            ))}
          </div>
        </section>

        {/* Primary Concerns */}
        <section className="settings-section">
          <h2 className="section-title">💭 What brings you here?</h2>
          <p className="section-description">
            Select your main concerns so Amani can better support you. <span className="optional">(Select all that apply)</span>
          </p>
          <div className="concerns-grid">
            {PRIMARY_CONCERNS.map((concern) => (
              <label
                key={concern.value}
                className={`concern-chip ${formValues.primary_concerns?.includes(concern.value) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={formValues.primary_concerns?.includes(concern.value) || false}
                  onChange={() => toggleConcern(concern.value)}
                  disabled={saving}
                />
                <span>{concern.label}</span>
                {formValues.primary_concerns?.includes(concern.value) && <span className="chip-check">✓</span>}
              </label>
            ))}
          </div>
        </section>

        {/* Communication Style */}
        <section className="settings-section">
          <h2 className="section-title">💬 Communication Style</h2>
          <p className="section-description">
            How should Amani talk to you?
          </p>
          <div className="radio-group">
            {COMMUNICATION_STYLES.map((style) => (
              <label
                key={style.value}
                className={`radio-card ${formValues.communication_style === style.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="communication_style"
                  checked={formValues.communication_style === style.value}
                  onChange={() => updateFormValue('communication_style', style.value)}
                  disabled={saving}
                />
                <div className="radio-content">
                  <span className="radio-label">{style.label}</span>
                  <span className="radio-description">{style.description}</span>
                </div>
                {formValues.communication_style === style.value && <span className="checkmark">✓</span>}
              </label>
            ))}
          </div>
        </section>

        {/* Privacy Toggle */}
        <section className="settings-section privacy-section">
          <h2 className="section-title">🔒 Privacy</h2>
          <label className={`toggle-card ${formValues.allows_personalization ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={formValues.allows_personalization}
              onChange={(e) => updateFormValue('allows_personalization', e.target.checked)}
              disabled={saving}
            />
            <div className="toggle-content">
              <span className="toggle-label">Allow Personalization</span>
              <span className="toggle-description">
                When enabled, Amani adapts to your cultural background and communication preferences.
                Your data is private and never shared.
              </span>
            </div>
            {formValues.allows_personalization && <span className="checkmark">✓</span>}
          </label>
        </section>

        {/* What AI Has Learned */}
        {profile?.inferred_context && Object.keys(profile.inferred_context).length > 0 && (
          <section className="settings-section learned-section">
            <h2 className="section-title">🧠 What Amani Has Learned</h2>
            <p className="section-description">
              Based on your conversations, Amani has picked up on:
            </p>
            <div className="learned-items">
              {Object.entries(profile.inferred_context)
                .filter(([_, value]: [string, any]) => value?.detected)
                .map(([key, value]: [string, any]) => (
                  <div key={key} className="learned-item">
                    <span className="learned-key">{key.replace(/_/g, ' ')}</span>
                    <span className="learned-value">
                      {typeof value === 'object' ? 'Detected in conversation' : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="save-button-container">
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        )}
        <button 
          className={`save-button ${hasChanges ? 'has-changes' : ''} ${saving ? 'saving' : ''}`}
          onClick={saveAllPreferences}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <span className="save-spinner"></span>
              Saving...
            </>
          ) : hasChanges ? (
            'Save Preferences'
          ) : (
            'Preferences Saved'
          )}
        </button>
      </div>
    </div>
  );
}
