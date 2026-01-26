// Example: Integrating Cultural Personalization into Chat with Amani
// This shows how to update your existing chat component

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  buildCulturallyAdaptiveSystemPrompt,
  detectAndSaveContextSignals,
  getPersonalizedCrisisResources,
  getUserCulturalProfile,
  createOrUpdateCulturalProfile,
  detectContextSignals,
} from '../lib/culturalPersonalizationService';

// ============================================================================
// CONSTANTS
// ============================================================================

const CULTURAL_BACKGROUNDS = [
  'African American',
  'African',
  'Caribbean',
  'Latino/Hispanic',
  'Mixed/Multiracial',
  'Other',
  'Prefer not to say',
];

const COMMUNITIES = [
  'LGBTQ+',
  'Veteran/Military',
  'Faith-based',
  'First-generation',
  'Formerly incarcerated',
  'Immigrant',
  'Rural',
  'Urban',
];

const COMMUNICATION_STYLES = [
  'Direct and straightforward',
  'Warm and supportive',
  'Professional and formal',
  'Casual and relaxed',
  'Faith-informed',
];

// ============================================================================
// PLACEHOLDER COMPONENTS (implement based on your UI framework)
// ============================================================================

const View = ({ style, children }: any) => <div style={style}>{children}</div>;
const ScrollView = ({ style, children }: any) => <div style={{ ...style, overflowY: 'auto' }}>{children}</div>;
const Text = ({ style, children }: any) => <span style={style}>{children}</span>;
const MessageBubble = ({ message }: any) => (
  <div style={{ padding: '10px', margin: '5px', background: message.role === 'user' ? '#e3f2fd' : '#f5f5f5', borderRadius: '8px' }}>
    {message.content}
  </div>
);
const ChatInput = ({ onSend }: any) => {
  const [text, setText] = useState('');
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder="Type a message..."
        style={{ flex: 1, padding: '8px' }}
      />
      <button onClick={() => { onSend(text); setText(''); }}>Send</button>
    </div>
  );
};
const LoadingSpinner = () => <div>Loading...</div>;
const PreferenceSection = ({ title, value, options, multiSelect, onUpdate }: any) => (
  <div style={{ marginBottom: '16px' }}>
    <h4>{title}</h4>
    <select 
      value={value || ''} 
      onChange={(e) => onUpdate(e.target.value)}
      multiple={multiSelect}
    >
      {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
const SwitchPreference = ({ label, value, onChange }: any) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>
);
const ContentForm = ({ onSubmit }: any) => <div>Content Form Placeholder</div>;
const ContentCard = ({ content, onEdit, onDelete }: any) => (
  <div style={{ border: '1px solid #ddd', padding: '12px', margin: '8px 0', borderRadius: '8px' }}>
    <strong>{content.title}</strong>
    <p>{content.content}</p>
  </div>
);
const MainNavigator = () => <div>Main App</div>;
const CulturalOnboarding = ({ userId, onComplete }: any) => (
  <div>
    <h2>Cultural Onboarding</h2>
    <button onClick={onComplete}>Complete Onboarding</button>
  </div>
);

// Placeholder for React Native components
const Alert = {
  alert: (title: string, message: string, buttons: any[]) => {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
  }
};
const Linking = {
  openURL: (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }
};

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px',
  },
  crisisBanner: {
    background: '#ffebee',
    border: '2px solid #ef5350',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  crisisTitle: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#c62828',
    marginBottom: '8px',
  },
  crisisResource: {
    fontSize: '14px',
    marginBottom: '4px',
  },
  settingsContainer: {
    padding: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    marginTop: '16px',
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  inferredContext: {
    background: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '16px',
  },
  contextItem: {
    display: 'flex',
    marginBottom: '4px',
  },
  contextKey: {
    fontWeight: 'bold',
    marginRight: '8px',
    textTransform: 'capitalize',
  },
  contextValue: {
    color: '#333',
  },
  privacySection: {
    marginTop: '24px',
    padding: '16px',
    background: '#e3f2fd',
    borderRadius: '8px',
  },
  privacyNote: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
  },
  adminContainer: {
    padding: '24px',
  },
  adminTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
};

// ============================================================================
// EXAMPLE: Updated Chat Component
// ============================================================================

export function ChatWithAmani({ userId, conversationId }: { userId: string; conversationId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [showCrisisResources, setShowCrisisResources] = useState(false);
  const [crisisResources, setCrisisResources] = useState<string[]>([]);

  // Load culturally adaptive system prompt
  useEffect(() => {
    loadSystemPrompt();
    loadCrisisResources();
  }, [userId]);

  const loadSystemPrompt = async () => {
    const prompt = await buildCulturallyAdaptiveSystemPrompt(userId);
    setSystemPrompt(prompt);
    console.log('📝 System prompt loaded with cultural context');
  };

  const loadCrisisResources = async () => {
    const resources = await getPersonalizedCrisisResources(userId);
    setCrisisResources(resources);
  };

  const sendMessage = async (userMessage: string) => {
    // 1. Detect and save context signals from user message
    await detectAndSaveContextSignals(userId, conversationId, userMessage);

    // 2. Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // 3. Call Claude API with culturally adaptive system prompt
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt, // ← This now includes cultural context!
          messages: [...messages, newUserMessage],
        }),
      });

      const data = await response.json();

      // 4. Extract response
      const aiMessage = {
        role: 'assistant',
        content: data.content[0].text,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // 5. Check if we should show crisis resources
      const shouldShowCrisis = 
        userMessage.toLowerCase().includes('suicide') ||
        userMessage.toLowerCase().includes('kill myself') ||
        data.content[0].text.toLowerCase().includes('crisis');

      if (shouldShowCrisis) {
        setShowCrisisResources(true);
      }

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Chat messages */}
      <ScrollView style={styles.messages}>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
      </ScrollView>

      {/* Crisis Resources Banner */}
      {showCrisisResources && (
        <View style={styles.crisisBanner}>
          <Text style={styles.crisisTitle}>🆘 Crisis Resources</Text>
          {crisisResources.map((resource, idx) => (
            <Text key={idx} style={styles.crisisResource}>
              {resource}
            </Text>
          ))}
        </View>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </View>
  );
}

// ============================================================================
// EXAMPLE: Navigation Integration
// ============================================================================

// In your main navigation or app entry point:

export function AppNavigator() {
  const [session, setSession] = useState<any>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Check if user needs cultural onboarding
    checkOnboardingStatus();
  }, [session]);

  const checkOnboardingStatus = async () => {
    if (!session?.user) return;

    const { data } = await supabase
      .from('user_cultural_profiles')
      .select('onboarding_completed, onboarding_skipped')
      .eq('user_id', session.user.id)
      .single();

    // Show onboarding if they haven't completed or skipped it
    if (!data || (!data.onboarding_completed && !data.onboarding_skipped)) {
      setNeedsOnboarding(true);
    }
  };

  if (needsOnboarding) {
    return (
      <CulturalOnboarding
        userId={session.user.id}
        onComplete={() => {
          setNeedsOnboarding(false);
          // Navigate to main app
        }}
      />
    );
  }

  return <MainNavigator />;
}

// ============================================================================
// EXAMPLE: Settings Screen with Preference Updates
// ============================================================================

export function CulturalPreferencesSettings({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const data = await getUserCulturalProfile(userId);
    setProfile(data);
    setLoading(false);
  };

  const updatePreference = async (field: string, value: any) => {
    await createOrUpdateCulturalProfile(userId, {
      ...profile,
      [field]: value,
    });
    loadProfile();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>Cultural Preferences</Text>

      {/* Cultural Background */}
      <PreferenceSection
        title="Cultural Background"
        value={profile?.culturalBackground}
        options={CULTURAL_BACKGROUNDS}
        onUpdate={(value: string) => updatePreference('culturalBackground', value)}
      />

      {/* Communities */}
      <PreferenceSection
        title="Communities"
        value={profile?.communities}
        options={COMMUNITIES}
        multiSelect
        onUpdate={(value: string) => updatePreference('communities', value)}
      />

      {/* Communication Style */}
      <PreferenceSection
        title="Communication Style"
        value={profile?.communicationStyle}
        options={COMMUNICATION_STYLES}
        onUpdate={(value: string) => updatePreference('communicationStyle', value)}
      />

      {/* View Inferred Context */}
      <View style={styles.inferredContext}>
        <Text style={styles.sectionTitle}>What Amani Has Learned About You</Text>
        <Text style={styles.sectionDescription}>
          Based on your conversations, Amani has learned:
        </Text>
        {Object.entries(profile?.inferredContext || {}).map(([key, value]) => (
          <View key={key} style={styles.contextItem}>
            <Text style={styles.contextKey}>{key.replace(/_/g, ' ')}:</Text>
            <Text style={styles.contextValue}>{String(value)}</Text>
          </View>
        ))}
      </View>

      {/* Privacy Controls */}
      <View style={styles.privacySection}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <SwitchPreference
          label="Allow Personalization"
          value={profile?.allowsPersonalization}
          onChange={(value: boolean) => updatePreference('allowsPersonalization', value)}
        />
        <Text style={styles.privacyNote}>
          When enabled, Amani adapts to your cultural background and communication preferences.
          Your data is private and never shared.
        </Text>
      </View>
    </ScrollView>
  );
}

// ============================================================================
// EXAMPLE: Crisis Intervention Integration
// ============================================================================

// In your existing crisis detection code, update to use personalized resources:

export async function showCrisisIntervention(userId: string) {
  const resources = await getPersonalizedCrisisResources(userId);

  Alert.alert(
    '🆘 Crisis Support',
    'If you\'re in crisis, please reach out:\n\n' + resources.join('\n\n'),
    [
      {
        text: 'Call 988 Now',
        onPress: () => Linking.openURL('tel:988'),
      },
      {
        text: 'Text Crisis Line',
        onPress: () => Linking.openURL('sms:741741&body=HOME'),
      },
      {
        text: 'Close',
        style: 'cancel',
      },
    ]
  );
}

// ============================================================================
// EXAMPLE: Analytics & Insights
// ============================================================================

export async function getCommunityInsights() {
  // Get aggregate stats (anonymized)
  const { data: culturalStats } = await supabase
    .from('user_cultural_profiles')
    .select('cultural_background')
    .not('cultural_background', 'is', null);

  const breakdown: Record<string, number> = {};
  culturalStats?.forEach((profile) => {
    const bg = profile.cultural_background;
    breakdown[bg] = (breakdown[bg] || 0) + 1;
  });

  console.log('Community Breakdown:', breakdown);

  // Get most common concerns
  const { data: concernStats } = await supabase
    .from('user_cultural_profiles')
    .select('primary_concerns');

  const concernCounts: Record<string, number> = {};
  concernStats?.forEach((profile) => {
    profile.primary_concerns?.forEach((concern: string) => {
      concernCounts[concern] = (concernCounts[concern] || 0) + 1;
    });
  });

  console.log('Top Concerns:', concernCounts);

  return { breakdown, concernCounts };
}

// ============================================================================
// EXAMPLE: Admin Dashboard - Cultural Content Management
// ============================================================================

export function CulturalContentAdmin() {
  const [content, setContent] = useState<any[]>([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    const { data } = await supabase
      .from('cultural_content')
      .select('*')
      .order('priority', { ascending: false });

    setContent(data || []);
  };

  const addContent = async (newContent: any) => {
    await supabase.from('cultural_content').insert({
      content_type: newContent.type,
      title: newContent.title,
      content: newContent.content,
      target_cultural_backgrounds: newContent.backgrounds,
      target_communities: newContent.communities,
      priority: newContent.priority,
      is_active: true,
    });

    loadContent();
  };

  return (
    <View style={styles.adminContainer}>
      <Text style={styles.adminTitle}>Cultural Content Library</Text>

      {/* Add New Content Form */}
      <ContentForm onSubmit={addContent} />

      {/* Existing Content List */}
      {content.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      ))}
    </View>
  );
}

// ============================================================================
// HELPER: Test Cultural Context Detection
// ============================================================================

export async function testContextDetection() {
  const testMessages = [
    "Man, code-switching at work is exhausting",
    "My dad keeps pressuring me about getting married",
    "Being a veteran, nobody really understands what I went through",
    "I'm struggling with coming out to my family",
  ];

  for (const message of testMessages) {
    console.log('\n📝 Testing message:', message);
    const signals = detectContextSignals(message);
    console.log('🎯 Detected signals:', signals);
  }
}

