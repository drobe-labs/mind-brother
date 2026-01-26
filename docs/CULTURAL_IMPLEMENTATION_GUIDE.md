# Cultural Personalization System - Implementation Guide

Complete guide to implementing adaptive, culturally-aware AI for Mind Brother.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [File Organization](#file-organization)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Testing & Validation](#testing--validation)
6. [Content Management](#content-management)
7. [Analytics & Insights](#analytics--insights)
8. [Best Practices](#best-practices)

---

## Overview

This system provides culturally adaptive AI that:
- ✅ Learns from user conversations (behavioral learning)
- ✅ Adapts based on self-reported preferences
- ✅ Provides personalized crisis resources
- ✅ Respects privacy with optional sharing
- ✅ Supports intersectional identities

**User Experience:**
1. Optional onboarding after signup (5 screens, ~2 minutes)
2. AI adapts to cultural background automatically
3. Users can update preferences anytime in settings
4. System learns from conversations and improves over time

---

## Database Setup

### Step 1: Run SQL Schema

Open Supabase SQL Editor and run `cultural_personalization_schema.sql`:

```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Click "New Query"
# 3. Paste entire cultural_personalization_schema.sql file
# 4. Click "Run"
```

This creates:
- `user_cultural_profiles` - User preferences
- `cultural_content` - Content library
- `conversation_context_signals` - AI learning data

### Step 2: Verify Tables

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%cultural%';

-- Should return:
-- user_cultural_profiles
-- cultural_content
-- conversation_context_signals
```

### Step 3: Verify Functions

```sql
-- Test personalized content function
SELECT * FROM get_personalized_content(
  'YOUR_USER_ID_HERE'::uuid,
  'crisis_resource',
  5
);
```

---

## File Organization

Copy files to your project:

```
src/lib/
├── culturalPersonalizationService.ts  (NEW)
└── supabase.ts (existing)

src/components/
├── CulturalOnboarding.tsx            (NEW)
└── Chat.tsx (existing - will update)

src/screens/
├── Settings.tsx (existing - will update)
└── Onboarding.tsx (existing - will add step)
```

---

## Step-by-Step Implementation

### Phase 1: Basic Setup (30 minutes)

**1. Add Cultural Onboarding to Navigation**

In your `App.tsx` or main navigator:

```typescript
import CulturalOnboarding from './components/CulturalOnboarding';
import { getUserCulturalProfile } from './lib/culturalPersonalizationService';

// In your authentication flow:
export function AuthenticatedApp() {
  const [session, setSession] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkOnboardingStatus();
    }
  }, [session]);

  const checkOnboardingStatus = async () => {
    const profile = await getUserCulturalProfile(session.user.id);
    
    // Show onboarding if never completed or skipped
    if (!profile || (!profile.onboardingCompleted && !profile.onboardingSkipped)) {
      setShowOnboarding(true);
    }
  };

  if (showOnboarding) {
    return (
      <CulturalOnboarding
        userId={session.user.id}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return <MainNavigator />;
}
```

**2. Test Onboarding Flow**

- Sign up a new user
- ✅ Should see cultural onboarding after signup
- ✅ Can skip or complete
- ✅ Data saves to `user_cultural_profiles` table

---

### Phase 2: Chat Integration (45 minutes)

**1. Update Chat Component**

In `src/components/Chat.tsx` or wherever you call Claude API:

```typescript
import {
  buildCulturallyAdaptiveSystemPrompt,
  detectAndSaveContextSignals,
} from '../lib/culturalPersonalizationService';

export function ChatScreen({ userId }: { userId: string }) {
  const [systemPrompt, setSystemPrompt] = useState('');

  // Load culturally adaptive prompt on mount
  useEffect(() => {
    loadSystemPrompt();
  }, [userId]);

  const loadSystemPrompt = async () => {
    const prompt = await buildCulturallyAdaptiveSystemPrompt(userId);
    setSystemPrompt(prompt);
  };

  const sendMessage = async (userMessage: string, conversationId: string) => {
    // STEP 1: Detect context signals
    await detectAndSaveContextSignals(userId, conversationId, userMessage);

    // STEP 2: Call Claude with cultural context
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt, // ← Cultural context is here!
        messages: [...conversationHistory, { role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const aiResponse = data.content[0].text;

    // Handle response...
  };

  // Rest of your chat component...
}
```

**2. Test Cultural Adaptation**

Create test users with different backgrounds:

```typescript
// Test user 1: Black/African American
await createOrUpdateCulturalProfile(userId1, {
  culturalBackground: 'black_african_american',
  communities: ['fathers'],
  communicationStyle: 'direct',
  onboardingCompleted: true,
});

// Test user 2: Latino
await createOrUpdateCulturalProfile(userId2, {
  culturalBackground: 'latino_hispanic',
  communities: ['immigrant'],
  communicationStyle: 'empathetic',
  onboardingCompleted: true,
});
```

Then chat with Amani and observe responses:
- User 1 should get more direct, Black cultural references
- User 2 should get more empathetic, Latino cultural context

---

### Phase 3: Crisis Resources (20 minutes)

**1. Add Personalized Crisis Banner**

```typescript
import { getPersonalizedCrisisResources } from '../lib/culturalPersonalizationService';

export function CrisisResourcesBanner({ userId }: { userId: string }) {
  const [resources, setResources] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadResources();
  }, [userId]);

  const loadResources = async () => {
    const data = await getPersonalizedCrisisResources(userId);
    setResources(data);
  };

  const show = () => setVisible(true);

  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>🆘 Crisis Resources</Text>
      {resources.map((resource, idx) => (
        <Text key={idx} style={styles.resource}>{resource}</Text>
      ))}
      <TouchableOpacity onPress={() => Linking.openURL('tel:988')}>
        <Text style={styles.callButton}>Call 988 Now</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**2. Trigger When Needed**

In your chat or moderation code:

```typescript
// When high-risk content detected:
if (moderationResult.severity === 'critical' || moderationResult.crisisResourcesNeeded) {
  crisisResourcesRef.current?.show();
}
```

---

### Phase 4: Settings Integration (30 minutes)

**1. Add Cultural Preferences to Settings**

```typescript
import {
  getUserCulturalProfile,
  createOrUpdateCulturalProfile,
  CULTURAL_BACKGROUNDS,
  COMMUNITIES,
  COMMUNICATION_STYLES,
} from '../lib/culturalPersonalizationService';

export function SettingsScreen({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getUserCulturalProfile(userId);
    setProfile(data);
  };

  const updateBackground = async (background: any) => {
    await createOrUpdateCulturalProfile(userId, {
      culturalBackground: background,
    });
    loadProfile();
  };

  return (
    <ScrollView>
      <SettingsSection title="Personalization">
        <Picker
          label="Cultural Background"
          value={profile?.culturalBackground}
          options={CULTURAL_BACKGROUNDS}
          onChange={updateBackground}
        />
        
        {/* Add similar pickers for communities, communication style, etc. */}
      </SettingsSection>

      <SettingsSection title="Privacy">
        <Switch
          label="Allow Personalization"
          value={profile?.allowsPersonalization}
          onChange={(value) => {
            createOrUpdateCulturalProfile(userId, {
              allowsPersonalization: value,
            });
          }}
        />
      </SettingsSection>
    </ScrollView>
  );
}
```

---

### Phase 5: Content Management (Optional for Admins)

**Add Cultural Content via Supabase Dashboard**

```sql
-- Add crisis resource for LGBTQ+ community
INSERT INTO cultural_content (
  content_type,
  title,
  content,
  target_communities,
  priority
) VALUES (
  'crisis_resource',
  'Trevor Project',
  'Call 1-866-488-7386 or text START to 678678 for 24/7 LGBTQ+ crisis support',
  '["lgbtq"]'::jsonb,
  90
);

-- Add therapist directory for Black men
INSERT INTO cultural_content (
  content_type,
  title,
  content,
  target_cultural_backgrounds,
  priority
) VALUES (
  'therapist_directory',
  'Therapy for Black Men',
  'Find Black male therapists at therapyforblackmen.org',
  '["black_african_american"]'::jsonb,
  80
);
```

---

## Testing & Validation

### Test Checklist

**Onboarding:**
- [ ] New users see onboarding after signup
- [ ] Can skip onboarding (saves to DB)
- [ ] Can complete onboarding (saves to DB)
- [ ] Onboarding doesn't show again after completion/skip
- [ ] All selections save correctly

**Chat Adaptation:**
- [ ] System prompt includes cultural context
- [ ] Different backgrounds get different responses
- [ ] Context signals are detected and saved
- [ ] Inferred context updates in database

**Crisis Resources:**
- [ ] Personalized resources show correct content
- [ ] Universal resources always included
- [ ] Cultural-specific resources show for right users
- [ ] Community-specific resources show for right users

**Settings:**
- [ ] Can view current preferences
- [ ] Can update preferences
- [ ] Changes reflect in next chat session
- [ ] Privacy toggle works (disables personalization)

### Test User Profiles

Create these test accounts:

**Test 1: Black Male, LGBTQ+, Direct**
```typescript
{
  culturalBackground: 'black_african_american',
  communities: ['lgbtq'],
  communicationStyle: 'direct',
  primaryConcerns: ['identity_questions', 'mental_health_stigma']
}
```

**Test 2: Latino Immigrant, Father, Empathetic**
```typescript
{
  culturalBackground: 'latino_hispanic',
  communities: ['immigrant', 'fathers'],
  communicationStyle: 'empathetic',
  primaryConcerns: ['family_dynamics', 'financial_stress']
}
```

**Test 3: White Veteran, Solution-Focused**
```typescript
{
  culturalBackground: 'white',
  communities: ['veterans'],
  communicationStyle: 'solution_focused',
  primaryConcerns: ['trauma_ptsd', 'anger_management']
}
```

Send same message to all three: "I'm really struggling lately"

Observe different responses based on cultural context!

---

## Content Management

### Adding New Cultural Content

**Via Supabase Dashboard:**

1. Go to Table Editor → `cultural_content`
2. Click "Insert row"
3. Fill in:
   - `content_type`: crisis_resource, therapist_directory, article, etc.
   - `title`: Name of resource
   - `content`: Full description/text
   - `target_cultural_backgrounds`: `["black_african_american"]` or `["universal"]`
   - `target_communities`: `["lgbtq", "veterans"]`
   - `priority`: 0-100 (higher = shown first)
   - `is_active`: true

**Programmatically:**

```typescript
await supabase.from('cultural_content').insert({
  content_type: 'article',
  title: 'Understanding Black Male Depression',
  content: 'Article text here...',
  target_cultural_backgrounds: ['black_african_american'],
  target_concerns: ['mental_health_stigma'],
  priority: 70,
  is_active: true,
});
```

### Content Best Practices

**Universal Content:**
- Always have 988 and Crisis Text Line
- General mental health resources
- Self-help strategies that work for everyone

**Cultural-Specific Content:**
- Therapist directories for specific communities
- Culturally relevant articles
- Community-specific hotlines
- Language-specific resources

**Community-Specific Content:**
- LGBTQ+ resources (Trevor Project, etc.)
- Veterans resources (Veterans Crisis Line)
- Faith-based resources when appropriate

---

## Analytics & Insights

### Track Community Health

```typescript
// Get demographic breakdown
const { data } = await supabase
  .from('user_cultural_profiles')
  .select('cultural_background');

const breakdown = data.reduce((acc, profile) => {
  const bg = profile.cultural_background || 'not_specified';
  acc[bg] = (acc[bg] || 0) + 1;
  return acc;
}, {});

console.log('User Demographics:', breakdown);
```

### Monitor Context Learning

```sql
-- See what signals are being detected
SELECT 
  signal_type,
  COUNT(*) as frequency,
  AVG(confidence_score) as avg_confidence
FROM conversation_context_signals
WHERE detected_at > NOW() - INTERVAL '7 days'
GROUP BY signal_type
ORDER BY frequency DESC;
```

### Track Personalization Adoption

```sql
-- How many users completed onboarding?
SELECT 
  COUNT(*) FILTER (WHERE onboarding_completed = true) as completed,
  COUNT(*) FILTER (WHERE onboarding_skipped = true) as skipped,
  COUNT(*) FILTER (WHERE onboarding_completed = false AND onboarding_skipped = false) as pending,
  COUNT(*) as total
FROM user_cultural_profiles;
```

---

## Best Practices

### Privacy & Ethics

✅ **DO:**
- Make all cultural questions optional
- Explain why you're asking
- Allow "prefer not to say"
- Let users update preferences anytime
- Encrypt sensitive data
- Use data only for personalization

❌ **DON'T:**
- Force users to select race/ethnicity
- Make assumptions based on appearance
- Share cultural data with third parties
- Use data for marketing/advertising
- Make users feel "othered"

### Cultural Sensitivity

✅ **DO:**
- Honor cultural strengths and resilience
- Acknowledge systemic barriers
- Provide culturally relevant resources
- Use inclusive, respectful language
- Update content based on feedback

❌ **DON'T:**
- Reinforce stereotypes
- Make assumptions about individuals
- Pathologize cultural practices
- Ignore intersectionality
- Use appropriative language

### AI System Prompts

✅ **DO:**
- Acknowledge both individual and systemic factors
- Validate cultural experiences
- Provide context-appropriate resources
- Use culturally relevant examples
- Maintain professional boundaries

❌ **DON'T:**
- Overgeneralize about cultures
- Assume all members of a group are the same
- Ignore individual differences
- Make medical/legal claims
- Replace professional help

---

## Troubleshooting

**Problem: Onboarding not showing**
- Check if `onboarding_completed` or `onboarding_skipped` is already true
- Verify user is authenticated
- Check RLS policies on `user_cultural_profiles`

**Problem: System prompt not updating**
- Call `buildCulturallyAdaptiveSystemPrompt()` when user updates preferences
- Check that profile data is saving correctly
- Verify function is being called before each chat session

**Problem: Crisis resources not personalized**
- Check if cultural content exists in database
- Verify `get_personalized_content()` function works
- Check `target_cultural_backgrounds` and `target_communities` arrays

**Problem: Context signals not detecting**
- Check `detectContextSignals()` patterns
- Verify conversation ID is being passed correctly
- Check RLS policies on `conversation_context_signals`

---

## Next Steps

After basic implementation:

1. **Gather Feedback**
   - Ask users about personalization quality
   - Track which cultural content is most helpful
   - Iterate on system prompts

2. **Expand Content Library**
   - Add more culturally specific resources
   - Create community-specific articles
   - Build therapist directories

3. **Improve AI Learning**
   - Analyze context signals
   - Refine detection patterns
   - Add more cultural nuances

4. **Add Advanced Features**
   - Multi-language support
   - Voice/tone adaptation
   - Visual design personalization
   - Community-specific features

---

## Support

Questions? Check:
- Code comments in `culturalPersonalizationService.ts`
- Example implementations in `integration_examples.tsx`
- Database schema comments in `cultural_personalization_schema.sql`

---

**You're ready to build a culturally adaptive mental health app! 🚀**

Remember: The goal isn't perfection—it's genuine respect, cultural humility, and continuous learning.
