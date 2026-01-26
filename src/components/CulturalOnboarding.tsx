import React, { useState, useEffect } from 'react';
import {
  CULTURAL_BACKGROUNDS,
  AGE_RANGES,
  COMMUNICATION_STYLES,
  PRIMARY_CONCERNS,
  COMMUNITIES,
  LANGUAGE_OPTIONS,
  createOrUpdateCulturalProfile,
  skipOnboarding,
  type CulturalBackground,
  type CommunityIdentity,
  type PrimaryConcern,
  type CommunicationStyle,
  type LanguagePreference,
  type LanguageCode,
} from '../lib/culturalPersonalizationService';
import './CulturalOnboarding.css';

interface Props {
  userId: string;
  onComplete: () => void;
}

// Backgrounds that may prefer non-English options
const MULTILINGUAL_BACKGROUNDS = ['latino_hispanic', 'caribbean', 'african'];

export default function CulturalOnboarding({ userId, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [culturalBackground, setCulturalBackground] = useState<CulturalBackground>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [communicationStyle, setCommunicationStyle] = useState<CommunicationStyle>('balanced');
  const [primaryConcerns, setPrimaryConcerns] = useState<PrimaryConcern[]>([]);
  const [communities, setCommunities] = useState<CommunityIdentity[]>([]);
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>({
    primary: 'english',
    acceptsMixedLanguage: true,
  });
  const [showLanguageStep, setShowLanguageStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we should show language step based on cultural background
  useEffect(() => {
    if (culturalBackground && MULTILINGUAL_BACKGROUNDS.includes(culturalBackground)) {
      setShowLanguageStep(true);
    } else {
      setShowLanguageStep(false);
      setLanguagePreference({ primary: 'english', acceptsMixedLanguage: true });
    }
  }, [culturalBackground]);

  const totalSteps = showLanguageStep ? 6 : 5;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = async () => {
    const confirmed = window.confirm(
      'Skip Personalization?\n\nYou can always set your preferences later in Settings.'
    );
    if (confirmed) {
      setIsSubmitting(true);
      await skipOnboarding(userId);
      onComplete();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await createOrUpdateCulturalProfile(userId, {
        cultural_background: culturalBackground,
        age_range: ageRange || undefined,
        communication_style: communicationStyle,
        primary_concerns: primaryConcerns,
        communities: communities,
        language_preference: showLanguageStep ? languagePreference : undefined,
        onboarding_completed: true,
      });
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Could not save your preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  const toggleArraySelection = <T,>(
    item: T,
    array: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <div className="cultural-onboarding">
      {/* Header */}
      <div className="onboarding-header">
        <h1 className="onboarding-title">Personalize Your Experience</h1>
        <p className="onboarding-subtitle">
          Step {step + 1} of {totalSteps}
        </p>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }} 
          />
        </div>
      </div>

      {/* Content */}
      <div className="onboarding-content">
        {step === 0 && <WelcomeStep />}
        {step === 1 && (
          <CulturalBackgroundStep
            selected={culturalBackground}
            onSelect={setCulturalBackground}
          />
        )}
        {step === 2 && showLanguageStep && (
          <LanguageStep
            culturalBackground={culturalBackground}
            preference={languagePreference}
            onUpdate={setLanguagePreference}
          />
        )}
        {step === (showLanguageStep ? 3 : 2) && (
          <CommunitiesStep
            selected={communities}
            onToggle={(item) => toggleArraySelection(item, communities, setCommunities)}
          />
        )}
        {step === (showLanguageStep ? 4 : 3) && (
          <ConcernsStep
            selected={primaryConcerns}
            onToggle={(item) => toggleArraySelection(item, primaryConcerns, setPrimaryConcerns)}
          />
        )}
        {step === (showLanguageStep ? 5 : 4) && (
          <CommunicationStyleStep
            selected={communicationStyle}
            onSelect={setCommunicationStyle}
            ageRange={ageRange}
            onSelectAge={setAgeRange}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="onboarding-navigation">
        <button
          className="skip-button"
          onClick={handleSkip}
          disabled={isSubmitting}
        >
          Skip for now
        </button>

        <div className="nav-buttons">
          {step > 0 && (
            <button 
              className="back-button" 
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}

          <button
            className={`next-button ${step === 0 ? 'full-width' : ''}`}
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : step === totalSteps - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function WelcomeStep() {
  return (
    <div className="step-container">
      <span className="step-icon">👋</span>
      <h2 className="step-title">Welcome to Mind Brother</h2>
      <p className="step-description">
        Mind Brother is here for <strong>ALL men</strong>.
      </p>
      <p className="step-description">
        Mind Brother was developed by men for all men and their journey to better mental health
        navigating mental health challenges.
      </p>

      <div className="info-box">
        <h4 className="info-title">Why we're asking</h4>
        <p className="info-text">
          Sharing your background helps us provide culturally relevant support—but it's{' '}
          <strong>completely optional</strong>. You can skip any question or update
          your preferences anytime.
        </p>
      </div>

      <div className="bullet-points">
        <BulletPoint text="Your data is private and encrypted" />
        <BulletPoint text="You control what you share" />
        <BulletPoint text="Personalization improves your experience" />
        <BulletPoint text="You can change preferences anytime" />
      </div>
    </div>
  );
}

function CulturalBackgroundStep({
  selected,
  onSelect,
}: {
  selected: CulturalBackground;
  onSelect: (value: CulturalBackground) => void;
}) {
  return (
    <div className="step-container">
      <span className="step-icon">🌍</span>
      <h2 className="step-title">Cultural Background</h2>
      <p className="step-description">
        This helps us provide culturally relevant support and resources.{' '}
        <span className="optional">(Optional)</span>
      </p>

      <div className="options-list">
        {CULTURAL_BACKGROUNDS.map((option) => (
          <button
            key={option.value}
            className={`option-card ${selected === option.value ? 'selected' : ''}`}
            onClick={() => onSelect(option.value as CulturalBackground)}
          >
            <div className="option-content">
              <span className="option-label">{option.label}</span>
            </div>
            {selected === option.value && <span className="checkmark">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function LanguageStep({
  culturalBackground,
  preference,
  onUpdate,
}: {
  culturalBackground: CulturalBackground;
  preference: LanguagePreference;
  onUpdate: (value: LanguagePreference) => void;
}) {
  // Filter language options based on cultural background
  const getRelevantLanguages = () => {
    switch (culturalBackground) {
      case 'latino_hispanic':
        return LANGUAGE_OPTIONS.filter(l => ['english', 'spanish', 'portuguese'].includes(l.value));
      case 'caribbean':
        return LANGUAGE_OPTIONS.filter(l => ['english', 'spanish', 'french', 'creole'].includes(l.value));
      case 'african':
        return LANGUAGE_OPTIONS.filter(l => ['english', 'french', 'portuguese'].includes(l.value));
      default:
        return LANGUAGE_OPTIONS;
    }
  };

  const relevantLanguages = getRelevantLanguages();

  return (
    <div className="step-container">
      <span className="step-icon">🗣️</span>
      <h2 className="step-title">Language Preferences</h2>
      <p className="step-description">
        How would you like Amani to communicate with you?{' '}
        <span className="optional">(Optional)</span>
      </p>

      <div className="language-section">
        <h3 className="section-subtitle">Primary Language</h3>
        <div className="options-list">
          {relevantLanguages.map((option) => (
            <button
              key={option.value}
              className={`option-card ${preference.primary === option.value ? 'selected' : ''}`}
              onClick={() => onUpdate({ ...preference, primary: option.value as LanguageCode })}
            >
              <div className="option-content">
                <span className="option-label">
                  {option.nativeLabel} {option.label !== option.nativeLabel && `(${option.label})`}
                </span>
                <span className="option-description">{option.description}</span>
              </div>
              {preference.primary === option.value && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {preference.primary !== 'english' && (
        <div className="language-section">
          <h3 className="section-subtitle">Code-Switching</h3>
          <button
            className={`option-card toggle-card ${preference.acceptsMixedLanguage ? 'selected' : ''}`}
            onClick={() => onUpdate({ ...preference, acceptsMixedLanguage: !preference.acceptsMixedLanguage })}
          >
            <div className="option-content">
              <span className="option-label">
                {preference.primary === 'spanish' ? 'Spanglish' : 'Mixed Language'}
              </span>
              <span className="option-description">
                {preference.primary === 'spanish' 
                  ? 'Amani can naturally mix Spanish and English, like how familia really talks'
                  : 'Amani can mix languages naturally when it feels right'}
              </span>
            </div>
            <div className="toggle-switch">
              <div className={`toggle-track ${preference.acceptsMixedLanguage ? 'active' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </button>

          <div className="info-box language-examples">
            <h4 className="info-title">
              {preference.primary === 'spanish' ? '¿Cómo suena?' : 'Example phrases'}
            </h4>
            <p className="info-text">
              {preference.primary === 'spanish' && (
                <>
                  "Hola hermano, ¿cómo te sientes hoy?"<br />
                  "Échale ganas - tú puedes, I believe in you."<br />
                  "La familia es importante, tell me more about what's going on."
                </>
              )}
              {preference.primary === 'creole' && (
                <>
                  "Bonjou frè, kijan ou ye?"<br />
                  "Kenbe la - you're not alone."
                </>
              )}
              {preference.primary === 'portuguese' && (
                <>
                  "Olá, como você está?"<br />
                  "Você não está sozinho - I'm here for you."
                </>
              )}
              {preference.primary === 'french' && (
                <>
                  "Bonjour, comment tu te sens?"<br />
                  "Courage - you've got this."
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CommunitiesStep({
  selected,
  onToggle,
}: {
  selected: CommunityIdentity[];
  onToggle: (value: CommunityIdentity) => void;
}) {
  return (
    <div className="step-container">
      <span className="step-icon">🤝</span>
      <h2 className="step-title">Your Communities</h2>
      <p className="step-description">
        Select any communities or experiences that resonate with you.{' '}
        <span className="optional">(Select all that apply)</span>
      </p>

      <div className="options-list">
        {COMMUNITIES.map((option) => (
          <button
            key={option.value}
            className={`option-card ${selected.includes(option.value as CommunityIdentity) ? 'selected' : ''}`}
            onClick={() => onToggle(option.value as CommunityIdentity)}
          >
            <div className="option-content">
              <span className="option-label">{option.label}</span>
              <span className="option-description">{option.description}</span>
            </div>
            {selected.includes(option.value as CommunityIdentity) && (
              <span className="checkmark">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConcernsStep({
  selected,
  onToggle,
}: {
  selected: PrimaryConcern[];
  onToggle: (value: PrimaryConcern) => void;
}) {
  return (
    <div className="step-container">
      <span className="step-icon">💭</span>
      <h2 className="step-title">What brings you here?</h2>
      <p className="step-description">
        Select your main concerns. <span className="optional">(Select all that apply)</span>
      </p>

      <div className="options-grid">
        {PRIMARY_CONCERNS.map((option) => (
          <button
            key={option.value}
            className={`option-card compact ${selected.includes(option.value as PrimaryConcern) ? 'selected' : ''}`}
            onClick={() => onToggle(option.value as PrimaryConcern)}
          >
            <div className="option-content">
              <span className="option-label">{option.label}</span>
            </div>
            {selected.includes(option.value as PrimaryConcern) && (
              <span className="checkmark">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function CommunicationStyleStep({
  selected,
  onSelect,
  ageRange,
  onSelectAge,
}: {
  selected: CommunicationStyle;
  onSelect: (value: CommunicationStyle) => void;
  ageRange: string | null;
  onSelectAge: (value: string) => void;
}) {
  return (
    <div className="step-container">
      <span className="step-icon">💬</span>
      <h2 className="step-title">How should Amani talk to you?</h2>
      <p className="step-description">Choose your preferred communication style.</p>

      <div className="options-list">
        {COMMUNICATION_STYLES.map((option) => (
          <button
            key={option.value}
            className={`option-card ${selected === option.value ? 'selected' : ''}`}
            onClick={() => onSelect(option.value as CommunicationStyle)}
          >
            <div className="option-content">
              <span className="option-label">{option.label}</span>
              <span className="option-description">{option.description}</span>
            </div>
            {selected === option.value && <span className="checkmark">✓</span>}
          </button>
        ))}
      </div>

      {/* Age Range */}
      <h3 className="substep-title">Age Range</h3>
      <p className="step-description">
        Helps us provide relevant life-stage content. <span className="optional">(Optional)</span>
      </p>

      <div className="age-grid">
        {AGE_RANGES.map((option) => (
          <button
            key={option.value}
            className={`age-button ${ageRange === option.value ? 'selected' : ''}`}
            onClick={() => onSelectAge(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function BulletPoint({ text }: { text: string }) {
  return (
    <div className="bullet-point">
      <span className="bullet-icon">✓</span>
      <span className="bullet-text">{text}</span>
    </div>
  );
}

