// Cultural Personalization Service for Mind Brother
// Provides culturally adaptive AI responses for Black and Brown men

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type CulturalBackground = 
  | 'black_african_american'
  | 'african'
  | 'caribbean'
  | 'latino_hispanic'
  | 'asian'
  | 'middle_eastern'
  | 'indigenous'
  | 'white'
  | 'multiracial'
  | 'other'
  | 'prefer_not_to_say'
  | null;

export type CommunityIdentity = 
  | 'lgbtq'
  | 'veteran'
  | 'immigrant'
  | 'fathers'
  | 'faith_based'
  | 'formerly_incarcerated'
  | 'first_generation'
  | 'rural'
  | 'urban';

export type PrimaryConcern = 
  | 'anxiety'
  | 'depression'
  | 'stress'
  | 'relationships'
  | 'family_dynamics'
  | 'work_career'
  | 'identity_questions'
  | 'trauma_ptsd'
  | 'substance_use'
  | 'anger_management'
  | 'grief_loss'
  | 'financial_stress'
  | 'mental_health_stigma'
  | 'isolation_loneliness';

export type CommunicationStyle = 
  | 'direct'
  | 'empathetic'
  | 'solution_focused'
  | 'balanced'
  | 'faith_informed';

export type LanguageCode = 'english' | 'spanish' | 'portuguese' | 'creole' | 'french';

export interface LanguagePreference {
  primary: LanguageCode;
  secondary?: LanguageCode;
  acceptsMixedLanguage: boolean;  // Code-switching, Spanglish, etc.
}

export interface CulturalProfile {
  id?: string;
  user_id: string;
  cultural_background?: CulturalBackground;
  age_range?: string;
  communities?: CommunityIdentity[];
  communication_style?: CommunicationStyle;
  primary_concerns?: PrimaryConcern[];
  spiritual_preferences?: string;
  language_preference?: LanguagePreference;
  allows_personalization?: boolean;
  inferred_context?: Record<string, any>;
  onboarding_completed?: boolean;
  onboarding_skipped?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ContextSignal {
  type: string;
  value: string;
  confidence: number;
  // Enhanced signal fields
  content?: string;
  inferredAttribute?: string;
  inferredValue?: string;
}

// ============================================================================
// CONSTANTS - Onboarding Options
// ============================================================================

export const CULTURAL_BACKGROUNDS: { value: string; label: string }[] = [
  { value: 'black_african_american', label: 'Black / African American' },
  { value: 'african', label: 'African' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'latino_hispanic', label: 'Latino / Hispanic' },
  { value: 'asian', label: 'Asian / Asian American' },
  { value: 'middle_eastern', label: 'Middle Eastern / North African' },
  { value: 'indigenous', label: 'Indigenous / Native American' },
  { value: 'white', label: 'White / European' },
  { value: 'multiracial', label: 'Multiracial / Mixed' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const AGE_RANGES: { value: string; label: string }[] = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55-64', label: '55-64' },
  { value: '65+', label: '65+' },
];

// ============================================================================
// AGE-SPECIFIC CONTEXTS - Detailed life stage contexts for AI prompts
// ============================================================================

export const AGE_SPECIFIC_CONTEXTS: Record<string, string> = {
  '18-24': `
AGE CONTEXT: Young Men (18-24)

Life Stage Challenges:
- Identity formation and "finding yourself"
- Transition to independence (college, first job, moving out)
- Career uncertainty and economic anxiety
- Navigating first serious relationships
- Social media comparison and FOMO
- Quarter-life crisis feelings
- Pressure to "have it figured out"
- Still developing brain (prefrontal cortex until 25)

Mental Health Considerations:
- High rates of depression and anxiety in this age group
- Social isolation despite digital connectivity
- Academic/career pressure and student debt
- Substance experimentation risks
- Body image and masculinity questioning
- First experiences with racism in "adult" spaces
- Imposter syndrome in higher education or early career

For Men of Color Specifically:
- First time navigating racism without parental buffer
- College: being "the only one" in classes
- Early career discrimination and bias
- Dating and interracial relationship navigation
- Family pressure to succeed and "make it"
- Proving doubters wrong mentality
- Survival of teen years (especially for Black men)

Supportive Approach:
- Normalize uncertainty and exploration
- Validate that life paths aren't linear
- Encourage calculated risks
- Discuss healthy relationship patterns
- Address social media impact on mental health
- Celebrate survival and making it to this age
- Connect with peers going through similar experiences
`,

  '25-34': `
AGE CONTEXT: Emerging Adults (25-34)

Life Stage Challenges:
- Career building and establishment
- Relationship serious decisions (marriage, long-term)
- Starting a family or deciding not to
- Financial foundation building (debt, savings, investments)
- Finding work-life integration
- Comparing self to peers who seem "further ahead"
- Identity solidification

Mental Health Considerations:
- Burnout from hustle culture
- Anxiety about "falling behind" life milestones
- Relationship stress and dating fatigue
- Loneliness despite success
- Pressure to "have it all together"
- Mental health often deprioritized for career

For Men of Color Specifically:
- Navigating corporate/professional racism
- Being passed over for promotions
- Deciding whether to code-switch or be authentic
- Building wealth with less generational support
- Supporting family while trying to build own life
- "Black tax" - financial obligations to extended family
- Proving competence constantly
- Dating while Black/Brown - stereotypes and fetishization
- Having "the talk" with kids (if fathers)

Supportive Approach:
- Validate the pressure without enabling it
- Discuss sustainable success vs. burnout
- Help define personal metrics, not just societal ones
- Explore what "enough" looks like
- Encourage financial education and planning
- Support relationship health alongside career
- Address racism in professional development
`,

  '35-44': `
AGE CONTEXT: Mid-Life Men (35-44)

Life Stage Challenges:
- Career plateau or mid-career transitions
- Balancing work and family responsibilities
- Aging parents and caregiving concerns
- Financial pressures (mortgage, kids' futures, retirement)
- Physical changes and health concerns beginning
- Marriage/relationship maintenance vs. drift
- "Is this all there is?" questioning
- Friends fading as everyone is busy

Mental Health Considerations:
- Burnout from years of juggling
- Midlife evaluation and potential regrets
- Loss of friendships due to time constraints
- Identity beyond work/provider role
- Health anxiety as body changes
- Affairs/relationship crises peak
- Depression often undiagnosed

For Men of Color Specifically:
- Glass ceiling becoming more apparent
- Being passed over for leadership repeatedly
- Accumulated racial trauma taking toll
- Teaching children about racism
- Modeling resilience while struggling
- Carrying family legacy pressure
- Financial recovery from earlier discrimination
- Health disparities becoming real

Supportive Approach:
- Validate the "sandwich generation" stress
- Discuss work-life integration (not "balance")
- Encourage maintenance of male friendships
- Address identity expansion beyond roles
- Support career/life transitions as growth, not failure
- Discuss health proactively
- Acknowledge cumulative weight of racism
- Help process regrets productively
`,

  '45-54': `
AGE CONTEXT: Established Men (45-54)

Life Stage Challenges:
- Peak earning years but also peak stress
- Children becoming teenagers/adults
- Relationship redefinition as kids leave
- Parents aging and potentially dying
- Health becoming unavoidable concern
- Career: stay the course or make a change?
- Legacy and meaning questions intensifying
- Physical limitations emerging

Mental Health Considerations:
- Accumulated stress manifesting physically
- Grief from loss of parents, friends
- Empty nest adjustment
- Marriage after kids: who are we?
- Midlife crisis stereotypes vs. reality
- Substance use as coping
- Suicide risk elevation for men this age

For Men of Color Specifically:
- Health disparities becoming critical
- May have survived what peers didn't
- Potential grandparent role in Black families
- Elder status bringing new respect but also responsibility
- Reflecting on lifetime of racial experiences
- Desire to mentor younger men of color
- Financial stability but at what cost?

Supportive Approach:
- Take health concerns seriously
- Support grief and loss processing
- Encourage relationship reinvestment
- Discuss legacy and meaning-making
- Validate desire for change at this stage
- Address substance use openly
- Connect to health resources proactively
- Honor the wisdom of survival
`,

  '55-64': `
AGE CONTEXT: Pre-Retirement Men (55-64)

Life Stage Challenges:
- Retirement planning and anxiety
- Career wind-down or continued relevance
- Adult children and grandchildren
- Potential health challenges increasing
- Loss of parents if not already
- Marriage/relationship in new phase
- Social network shrinking
- Relevance and purpose questions

Mental Health Considerations:
- Retirement identity crisis looming
- Health anxiety and management
- Grief from multiple losses
- Depression often masked
- Isolation increasing
- Alcohol use patterns
- Cognitive concerns emerging

For Men of Color Specifically:
- May have less retirement savings due to earlier discrimination
- Health disparities serious concern
- Elder statesman role in community
- Wealth transfer concerns
- Protecting legacy and family
- May be raising grandchildren
- Civil rights era memories and perspective

Supportive Approach:
- Support transition planning (not just retirement)
- Encourage purpose and contribution beyond work
- Address health proactively and directly
- Support grief and loss processing
- Facilitate social connection
- Discuss meaning, legacy, and wisdom
- Validate concerns about relevance
- Connect to community elder roles
`,

  '65+': `
AGE CONTEXT: Elders (65+)

Life Stage Challenges:
- Retirement adjustment (if not working)
- Fixed income concerns
- Health management as primary focus
- Loss of spouse, friends, siblings
- Potential dependency concerns
- Legacy and end-of-life questions
- Staying connected and relevant
- Technology and social changes

Mental Health Considerations:
- Depression often missed in older adults
- Grief compounded from multiple losses
- Isolation and loneliness epidemic
- Cognitive changes (normal vs. concerning)
- Medication interactions affecting mood
- Suicide risk high for older men
- Dignity and autonomy concerns

For Men of Color Specifically:
- May have lived through Jim Crow, civil rights era
- Carries generational wisdom and trauma
- May be community elder and resource
- Healthcare discrimination continues
- Financial security often less than white peers
- Family obligations may continue
- Cultural respect for elders varies by context

Supportive Approach:
- Respect wisdom and experience
- Don't infantilize or patronize
- Address real concerns about health and independence
- Support social connection actively
- Discuss end-of-life wishes with dignity
- Honor the story and journey
- Facilitate intergenerational connection
- Acknowledge the weight of lived experience
- Support continued purpose and contribution
`,
};

export const COMMUNITIES: { value: string; label: string; description: string }[] = [
  { value: 'heterosexual', label: 'Heterosexual', description: 'Identify as straight' },
  { value: 'lgbtq', label: 'LGBTQ+', description: 'Gay, bisexual, queer, trans, or questioning' },
  { value: 'veteran', label: 'Veteran / Military', description: 'Currently serving or formerly served' },
  { value: 'immigrant', label: 'Immigrant', description: 'First or second generation immigrant' },
  { value: 'fathers', label: 'Father / Caregiver', description: 'Primary caregiver for children' },
  { value: 'faith_based', label: 'Faith-Based', description: 'Religion/spirituality is important to you' },
  { value: 'formerly_incarcerated', label: 'Formerly Incarcerated', description: 'Have experienced incarceration' },
  { value: 'first_generation', label: 'First Generation', description: 'First in family to attend college or pursue career' },
  { value: 'rural', label: 'Rural Community', description: 'Live in a rural area' },
  { value: 'urban', label: 'Urban Community', description: 'Live in a major city' },
];

export const PRIMARY_CONCERNS: { value: string; label: string }[] = [
  { value: 'anxiety', label: 'Anxiety & Worry' },
  { value: 'depression', label: 'Depression & Low Mood' },
  { value: 'stress', label: 'Stress & Overwhelm' },
  { value: 'relationships', label: 'Relationships & Dating' },
  { value: 'family_dynamics', label: 'Family Dynamics' },
  { value: 'work_career', label: 'Work & Career' },
  { value: 'identity_questions', label: 'Identity & Self-Discovery' },
  { value: 'trauma_ptsd', label: 'Trauma & PTSD' },
  { value: 'substance_use', label: 'Substance Use' },
  { value: 'anger_management', label: 'Anger Management' },
  { value: 'grief_loss', label: 'Grief & Loss' },
  { value: 'financial_stress', label: 'Financial Stress' },
  { value: 'mental_health_stigma', label: 'Mental Health Stigma' },
  { value: 'isolation_loneliness', label: 'Isolation & Loneliness' },
];

export const COMMUNICATION_STYLES: { value: string; label: string; description: string }[] = [
  { value: 'direct', label: 'Keep it Real', description: 'Straightforward, no sugar-coating' },
  { value: 'empathetic', label: 'Supportive & Warm', description: 'Gentle, encouraging approach' },
  { value: 'solution_focused', label: 'Solution-Focused', description: 'Get to the point, focus on action' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of support and practical advice' },
  { value: 'faith_informed', label: 'Faith-Informed', description: 'Incorporate spiritual perspective when helpful' },
];

export const LANGUAGE_OPTIONS: { value: string; label: string; nativeLabel: string; description: string }[] = [
  { value: 'english', label: 'English', nativeLabel: 'English', description: 'Primary communication in English' },
  { value: 'spanish', label: 'Spanish', nativeLabel: 'Español', description: 'Prefer Spanish or Spanglish' },
  { value: 'portuguese', label: 'Portuguese', nativeLabel: 'Português', description: 'Prefer Portuguese' },
  { value: 'creole', label: 'Haitian Creole', nativeLabel: 'Kreyòl Ayisyen', description: 'Prefer Haitian Creole' },
  { value: 'french', label: 'French', nativeLabel: 'Français', description: 'Prefer French' },
];

// Language-specific greetings and phrases for AI to use
export const LANGUAGE_PHRASES: Record<string, {
  greetings: string[];
  encouragements: string[];
  closings: string[];
  terms_of_endearment: string[];
  cultural_expressions: string[];
}> = {
  spanish: {
    greetings: ['Hola', '¿Qué tal?', '¿Cómo estás?', '¿Cómo te sientes hoy?', 'Buenos días', 'Buenas tardes'],
    encouragements: ['Échale ganas', 'Tú puedes', 'Ánimo', 'Sí se puede', 'No te rindas', 'Adelante'],
    closings: ['Cuídate mucho', 'Estoy aquí para ti', 'No estás solo', 'Te escucho'],
    terms_of_endearment: ['mijo', 'hermano', 'compa', 'amigo', 'carnalito'],
    cultural_expressions: ['familia', 'respeto', 'orgullo', 'la lucha', 'comunidad', 'fuerza'],
  },
  portuguese: {
    greetings: ['Olá', 'E aí?', 'Como você está?', 'Tudo bem?', 'Bom dia', 'Boa tarde'],
    encouragements: ['Você consegue', 'Força', 'Vai dar certo', 'Não desista', 'Coragem'],
    closings: ['Se cuida', 'Estou aqui', 'Você não está sozinho', 'Te escuto'],
    terms_of_endearment: ['meu amigo', 'irmão', 'cara', 'parceiro'],
    cultural_expressions: ['família', 'saudade', 'garra', 'força', 'comunidade'],
  },
  creole: {
    greetings: ['Bonjou', 'Kijan ou ye?', 'Sak pase?', 'Kòman ou ye?'],
    encouragements: ['Kenbe la', 'Ou kapab', 'Pa dekouraje', 'Kontinye'],
    closings: ['Pran swen ou', 'Mwen la pou ou', 'Ou pa pou kont ou'],
    terms_of_endearment: ['frè', 'zanmi', 'kanmarad'],
    cultural_expressions: ['fanmi', 'respè', 'fòs', 'kominote', 'solidarite'],
  },
  french: {
    greetings: ['Bonjour', 'Salut', 'Comment ça va?', 'Comment tu te sens?'],
    encouragements: ['Courage', 'Tu peux le faire', 'Ne lâche pas', 'Tiens bon'],
    closings: ['Prends soin de toi', 'Je suis là pour toi', 'Tu n\'es pas seul'],
    terms_of_endearment: ['mon ami', 'frère', 'mon gars'],
    cultural_expressions: ['famille', 'respect', 'force', 'communauté', 'solidarité'],
  },
};

// ============================================================================
// CULTURAL CONTEXTS - Detailed backgrounds for AI system prompts
// ============================================================================

export const CULTURAL_CONTEXTS: Record<string, string> = {
  black_african_american: `
CULTURAL CONTEXT: Black/African American Men

Historical & Systemic Context:
- Generational trauma from slavery, Jim Crow, and ongoing systemic racism
- Daily navigation of microaggressions and discrimination
- Hypervisibility and stereotyping (aggressive, dangerous, threatening)
- "The Talk" about police interactions
- Code-switching between Black and white spaces
- Imposter syndrome in predominantly white environments

Mental Health Stigma:
- "Strong Black Man" archetype - expected to be unbreakable
- Mental health seen as weakness in many Black communities
- Historical mistrust of medical/mental health systems (Tuskegee, etc.)
- Church as primary emotional support historically
- "We don't do therapy" cultural narrative

Workplace-Specific Challenges:
- Being "the only one" in meetings/teams
- Having to represent entire race
- Navigating racial jokes and inappropriate comments
- Pressure to be "non-threatening"
- Difficulty finding mentors who understand experience
- Disproportionate disciplinary actions
- "Cultural fit" bias in hiring/promotions

Relationship Dynamics:
- Dating while Black (fetishization, stereotypes)
- Interracial relationship challenges
- Finding partners who understand racial trauma
- Family expectations around partnering within race
- Children and "the talk"

Economic Realities:
- Wealth gap and generational poverty
- Student loan debt disproportionately higher
- Discrimination in lending/housing
- "Black tax" - supporting extended family
- Entrepreneurship as pathway but with less access to capital

Therapeutic Approach:
- Acknowledge systemic barriers, not just individual responsibility
- Validate racial trauma as real trauma
- Discuss code-switching and identity management
- Connect to Black mental health resources and Black therapists
- Honor cultural strengths (resilience, community, spirituality)
- Use culturally relevant examples and language
- Address intersection with masculinity pressure
`,

  african: `
CULTURAL CONTEXT: African Men (Immigrants/First Generation)

Immigration & Identity:
- Navigating between African and American identities
- Pressure to succeed to justify family's sacrifice
- Missing home, family, and cultural traditions
- Visa stress and documentation concerns
- Often not seen as "Black enough" by African Americans or "American enough" by Africans

Cultural Expectations:
- Strong emphasis on family honor and reputation
- Expectations to financially support family back home
- Pressure to marry within culture or approved partners
- Elder respect sometimes conflicts with mental health help-seeking
- Expectations around career paths (doctor, engineer, lawyer)

Mental Health Barriers:
- Mental health highly stigmatized in many African cultures
- Belief that struggles should be handled within family
- Prayer and faith as primary coping mechanism
- Fear of bringing shame to family
- Limited culturally competent providers

Workplace & Economic:
- Accent discrimination and being underestimated
- Credentials from home country often not recognized
- Working multiple jobs to support family here and abroad
- Navigating different professional norms

Relationship Dynamics:
- Expectations around traditional gender roles
- Pressure to marry and have children
- Navigating dating across cultures
- Maintaining cultural traditions with American-born children

Therapeutic Approach:
- Respect collectivist family values
- Understand immigration stress and acculturation
- Be aware of specific country/ethnic backgrounds (Nigeria, Ethiopia, Ghana, etc.)
- Acknowledge the burden of supporting multiple households
- Integrate faith perspectives when appropriate
- Validate the complexity of dual identity
`,

  caribbean: `
CULTURAL CONTEXT: Caribbean Men

Cultural Identity:
- Pride in specific island identity (Jamaican, Haitian, Trinidadian, etc.)
- Often grouped with African Americans but distinct experiences
- Strong connection to homeland despite living abroad
- Navigation between island and American identities
- Colorism within Caribbean communities

Mental Health Barriers:
- "Man up" culture especially strong
- Mental health seen as "madness" - highly stigmatized
- Belief in spiritual causes of mental distress
- Reluctance to discuss personal matters outside family
- Church/faith as primary support system

Immigration Experience:
- Often came for better opportunities
- Pressure to succeed and send money home
- Missing family celebrations and milestones
- Navigating documentation status for some
- Adjusting to colder climate and different pace of life

Economic & Work:
- Strong work ethic, often multiple jobs
- Supporting family in multiple countries
- Entrepreneurial spirit but limited capital access
- Navigating workplace racism while maintaining composure

Relationship Dynamics:
- Traditional masculinity expectations
- Expectations around "keeping a woman"
- Family involvement in relationship decisions
- Managing relationships across distances

Cultural Strengths:
- Strong community bonds and "yard" culture
- Music, food, and celebration as healing
- Resilience and humor in face of adversity
- Deep family connections

Therapeutic Approach:
- Recognize specific island cultures (don't generalize)
- Respect the role of family and elders
- Understand spiritual and religious frameworks
- Acknowledge the unique racism Caribbean men face
- Validate the complexity of island vs. American identity
- Incorporate cultural strengths and community resources
`,

  latino_hispanic: `
CULTURAL CONTEXT: Latino/Hispanic Men

Cultural Identity:
- Diverse backgrounds (Mexican, Puerto Rican, Dominican, Cuban, Central/South American)
- Machismo culture and expectations of male strength
- Strong family (familismo) and community ties
- Language as identity - Spanish/English navigation
- Colorism and racial diversity within Latino communities

Mental Health Barriers:
- Machismo: real men don't show weakness
- "Aguantar" - endure suffering silently
- Mental health stigma within families
- Preference for handling problems within family
- Limited Spanish-speaking mental health providers

Immigration Experience (for immigrants):
- Documentation stress and fear
- Separation from family across borders
- Discrimination and anti-immigrant sentiment
- Missing major life events back home
- Starting over professionally

Workplace Challenges:
- Language discrimination
- Stereotyping and assumptions
- Being passed over for promotions
- Having to work harder to prove competence
- Navigating different cultural norms

Family Dynamics:
- Provider role pressure intensified
- Extended family obligations
- Expectations around supporting parents
- Marriage and children expectations
- Balancing traditional values with American context

Relationship Dynamics:
- Traditional gender role expectations
- Navigating machismo in modern relationships
- Dating across cultures
- Family approval importance

Therapeutic Approach:
- Recognize specific national/regional backgrounds
- Incorporate family in healing when appropriate
- Understand machismo without reinforcing harmful aspects
- Be aware of immigration-related trauma and stress
- Offer Spanish-language resources when possible
- Respect religious/spiritual beliefs (often Catholic)
- Address intersection of race, ethnicity, and masculinity
`,

  asian: `
CULTURAL CONTEXT: Asian/Asian American Men

Cultural Identity:
- Diverse backgrounds (East Asian, Southeast Asian, South Asian, Pacific Islander)
- Model minority myth pressure
- Perpetual foreigner treatment despite generations in US
- Stereotyped as passive, asexual, or "nerdy"
- Navigating traditional vs. American values

Mental Health Barriers:
- Strong stigma in many Asian cultures
- Bringing shame to family
- "Save face" culture - don't air problems publicly
- Expected to handle problems independently
- Academic/career pressure prioritized over emotional health

Family & Cultural Expectations:
- Intense academic and career pressure
- Expectations to enter specific professions
- Financial support of parents expected
- Filial piety - respect for elders above self
- Marriage expectations often including ethnicity

Masculinity Challenges:
- Desexualization and emasculation in media
- Dating challenges due to stereotypes
- Pressure to be "model minority" not "troublemaker"
- Physical size stereotypes
- Invisibility in discussions of racism

Workplace Dynamics:
- "Bamboo ceiling" - limited advancement to leadership
- Expected to be technical, not leadership material
- Stereotyped as good at math/science only
- Overlooked for speaking up

Immigration Experience (first generation):
- Acculturation stress
- Language barriers
- Credentials often not recognized
- Missing family back home
- Food, culture, and community homesickness

Therapeutic Approach:
- Recognize specific ethnic backgrounds (Chinese, Indian, Vietnamese, Filipino, etc.)
- Understand family honor and shame dynamics
- Don't assume all Asian experiences are the same
- Acknowledge model minority myth pressure
- Validate emasculation and racism experiences
- Respect collectivist values while supporting individual needs
- Understand intergenerational trauma (war, colonization)
`,

  middle_eastern: `
CULTURAL CONTEXT: Middle Eastern/North African Men

Cultural Identity:
- Diverse backgrounds (Arab, Persian, Turkish, North African, etc.)
- Often racialized as "other" or "terrorist"
- Post-9/11 surveillance and discrimination
- Complex religious identities (Muslim, Christian, Jewish, secular)
- Navigating between traditional and Western values

Mental Health Barriers:
- Strong stigma in many MENA cultures
- Mental health seen as spiritual weakness
- Family honor and shame concerns
- "What will people say?" (community judgment)
- Limited culturally competent providers

Discrimination Experiences:
- Post-9/11 profiling and suspicion
- TSA and travel discrimination
- Workplace discrimination
- Name-based prejudice
- Violence and hate crimes

Family Dynamics:
- Strong family ties and obligations
- Elder respect prioritized
- Expected to maintain family honor
- Marriage expectations (often within culture/religion)
- Supporting extended family financially

Faith & Spirituality:
- Islam, Christianity, Judaism, or secular
- Faith often central to identity and coping
- Ramadan, prayer, and religious practices
- Navigating faith in secular American context
- Stereotyping based on religion

Masculinity & Expectations:
- Provider and protector role emphasized
- Emotional restraint expected
- Honor culture pressures
- Leadership within family expected

Therapeutic Approach:
- Recognize specific national and religious backgrounds
- Understand post-9/11 trauma and ongoing discrimination
- Respect religious and spiritual frameworks
- Acknowledge family honor dynamics without judgment
- Don't assume religious affiliation
- Validate unique racism and Islamophobia experiences
- Integrate cultural strengths and community
`,

  indigenous: `
CULTURAL CONTEXT: Indigenous/Native American Men

Historical Context:
- Genocide, forced relocation, and land theft
- Boarding school trauma (forced assimilation)
- Treaty violations and ongoing federal neglect
- Loss of language, culture, and traditions
- Intergenerational trauma passed down

Contemporary Challenges:
- Reservation vs. urban living challenges
- Highest rates of poverty, unemployment, substance abuse
- Limited healthcare access on reservations
- "Invisible" in mainstream conversations about race
- Mascot and stereotype dehumanization

Mental Health Realities:
- High rates of suicide, especially among youth
- Substance abuse as coping mechanism
- Historical trauma response
- Limited culturally appropriate services
- Western mental health often doesn't fit worldview

Cultural Strengths:
- Connection to land, ancestors, and traditions
- Tribal community and belonging
- Ceremony and spirituality as healing
- Elder wisdom and teachings
- Two-spirit acceptance in some nations

Identity Navigation:
- Blood quantum and identity politics
- Urban Native vs. reservation Native
- Reconnecting with culture after displacement
- Maintaining traditions while living modern life
- "Not Native enough" judgments

Relationship & Family:
- Extended family and kinship systems
- Community child-rearing
- Navigating relationships with non-Natives
- Passing down traditions and language

Therapeutic Approach:
- Understand specific tribal backgrounds and protocols
- Recognize historical and ongoing trauma
- Integrate traditional healing when appropriate
- Don't generalize all Native experiences
- Support cultural reconnection
- Acknowledge systemic barriers, not just individual issues
- Validate anger about historical and current injustices
`,

  multiracial: `
CULTURAL CONTEXT: Multiracial/Mixed Men

Identity Complexity:
- "What are you?" constant questioning
- Not fully accepted by any single group
- Choosing how to identify in different contexts
- Racial identity development unique journey
- Family members of different races

Unique Challenges:
- Feeling like outsider in both/all communities
- Pressure to "pick a side"
- Invalidation of identity ("you're not really Black/Asian/etc.")
- Assumed to be racially ambiguous for others' comfort
- Different treatment based on appearance

Family Dynamics:
- Navigating different cultural expectations
- Extended family acceptance issues
- Learning multiple cultural traditions
- Parents may not understand mixed experience
- Siblings can have different experiences based on appearance

Social Navigation:
- Code-switching across multiple cultures
- Dating and racial preferences/fetishization
- Finding community and belonging
- Having racial identity questioned constantly

Mental Health Impact:
- Identity confusion and search
- Feeling like "impostor" in communities
- Microaggressions about appearance
- Isolation from monoracial peers
- Lack of representation and role models

Strengths:
- Bridge-building between communities
- Multicultural competence
- Unique perspective on race
- Ability to connect across differences
- Growing multiracial population and community

Therapeutic Approach:
- Validate the unique mixed experience
- Don't force single racial identity
- Understand each specific racial makeup is different
- Support identity exploration and development
- Acknowledge that appearance affects experience
- Recognize strengths of multicultural identity
- Help navigate family and community dynamics
`,

  white: `
CULTURAL CONTEXT: White/European Men (in context of Mind Brother)

Note: Mind Brother primarily serves men of color, but white men may also seek support, particularly those in relationships with, raising, or working alongside men of color.

Potential Use Cases:
- White men in interracial relationships seeking to understand partner
- White fathers of children of color
- White men working on anti-racism and allyship
- White men in recovery from addiction (program can still help)
- White men examining their own masculinity and mental health

Unique Considerations:
- May be navigating white guilt or fragility
- Learning to recognize privilege
- Supporting partner/friends of color through racial trauma
- Raising children who will face racism
- Workplace allyship questions

Mental Health Needs:
- Toxic masculinity affects white men too
- Emotional suppression common
- Suicide rates high among white men
- May lack emotional vocabulary
- Benefits from learning from diverse perspectives

Therapeutic Approach:
- Provide general mental health support
- Don't assume user is racist for being white
- Support genuine allyship development
- Help process white guilt productively
- Encourage learning from diverse perspectives
- Support those in interracial relationships/families
- Acknowledge toxic masculinity affects all men
`,

  prefer_not_to_say: `
CULTURAL CONTEXT: User Prefers Not to Disclose

Approach:
- Respect user's privacy and choice not to share
- Don't make assumptions about background
- Use general culturally-informed approach
- Remain open and adaptable as conversation reveals context
- Focus on the specific concerns they do share

General Cultural Awareness:
- Be aware that user may be any background
- Use inclusive language
- Validate experiences without assuming specifics
- Offer diverse resources
- Let user guide what cultural elements are relevant

Default Approach:
- Maintain awareness of systemic racism and discrimination
- Validate experiences if shared
- Use balanced communication style
- Remain open to incorporating specific cultural context if shared later
`,

  other: `
CULTURAL CONTEXT: Other Background

Approach:
- Remain open and curious about user's specific background
- Ask sensitively about cultural context if relevant to support
- Don't assume based on any category
- Let user define their own identity and experiences

General Framework:
- All men face masculinity pressures
- Many men of color face racism and discrimination
- Cultural backgrounds shape mental health attitudes
- Family and community expectations vary
- Be adaptable and responsive to what user shares

Therapeutic Approach:
- Focus on individual's specific experiences
- Ask about relevant cultural factors as they arise
- Validate whatever background they describe
- Use general best practices for culturally-informed care
- Offer diverse resources and let user choose what fits
`,
};

// ============================================================================
// CONTEXT DETECTION PATTERNS
// ============================================================================

const CONTEXT_PATTERNS = {
  code_switching: [
    /code.?switch/i,
    /different person at work/i,
    /act different/i,
    /talk different/i,
    /two different people/i,
    /professional voice/i,
  ],
  family_pressure: [
    /family pressure/i,
    /parents want me to/i,
    /dad keeps/i,
    /mom keeps/i,
    /family expects/i,
    /cultural expectations/i,
    /traditional family/i,
  ],
  veteran_military: [
    /veteran/i,
    /military/i,
    /served in/i,
    /deployment/i,
    /combat/i,
    /ptsd from service/i,
    /fellow soldiers/i,
  ],
  lgbtq: [
    /coming out/i,
    /gay/i,
    /bisexual/i,
    /queer/i,
    /trans/i,
    /lgbtq/i,
    /same.?sex/i,
    /my sexuality/i,
  ],
  faith_based: [
    /church/i,
    /pray/i,
    /god/i,
    /faith/i,
    /spiritual/i,
    /pastor/i,
    /mosque/i,
    /temple/i,
    /bible/i,
    /quran/i,
  ],
  incarceration: [
    /locked up/i,
    /prison/i,
    /jail/i,
    /incarcerat/i,
    /felony/i,
    /parole/i,
    /probation/i,
    /reentry/i,
    /formerly incarcerat/i,
  ],
  racism_discrimination: [
    /racism/i,
    /discriminat/i,
    /microaggression/i,
    /racial profil/i,
    /being followed/i,
    /treated different/i,
    /only black person/i,
    /only brown person/i,
  ],
  provider_stress: [
    /provide for/i,
    /breadwinner/i,
    /financial pressure/i,
    /support my family/i,
    /man of the house/i,
  ],
  fatherhood: [
    /my kids/i,
    /my son/i,
    /my daughter/i,
    /being a dad/i,
    /being a father/i,
    /co.?parent/i,
    /custody/i,
  ],
  immigration: [
    /immigra/i,
    /undocument/i,
    /visa/i,
    /deport/i,
    /came to this country/i,
    /first generation/i,
  ],
};

// ============================================================================
// CULTURALLY RELEVANT CRISIS RESOURCES
// ============================================================================

const CRISIS_RESOURCES: Record<string, string[]> = {
  general: [
    '📞 988 Suicide & Crisis Lifeline - Call or text 988 (24/7)',
    '💬 Crisis Text Line - Text HOME to 741741',
    '🆘 National Suicide Prevention Lifeline: 1-800-273-8255',
  ],
  'African American': [
    '📞 988 Suicide & Crisis Lifeline - Call or text 988 (24/7)',
    '🖤 Black Mental Health Alliance: blackmentalhealth.com',
    '💪 Boris Lawrence Henson Foundation: borislhensonfoundation.org',
    '🧠 Therapy for Black Men: therapyforblackmen.org',
    '💬 Crisis Text Line - Text HOME to 741741',
  ],
  'Latino/Hispanic': [
    '📞 988 Suicide & Crisis Lifeline - Presiona 2 para español',
    '🌎 SAMHSA National Helpline (Spanish): 1-800-662-4357',
    '💚 Latinx Therapy: latinxtherapy.com',
    '💬 Crisis Text Line - Text HOLA to 741741',
  ],
  veteran: [
    '📞 Veterans Crisis Line: 988 then press 1',
    '💬 Text 838255',
    '🎖️ Make the Connection: maketheconnection.net',
    '🏥 VA Mental Health: mentalhealth.va.gov',
  ],
  lgbtq: [
    '📞 988 Suicide & Crisis Lifeline (LGBTQ+ trained): 988',
    '🏳️‍🌈 Trevor Project: 1-866-488-7386',
    '💬 Trevor Text: Text START to 678-678',
    '🌈 Trans Lifeline: 1-877-565-8860',
  ],
  faith_based: [
    '📞 988 Suicide & Crisis Lifeline - Call or text 988',
    '🙏 Faith-based counselors available through local churches',
    '✝️ Christian Counselors: aacc.net/resources',
    '☪️ Muslim Mental Health: muslimmentalhealth.com',
  ],
  incarceration: [
    '📞 988 Suicide & Crisis Lifeline - Call or text 988',
    '🔓 Reentry resources: nationalreentryresourcecenter.org',
    '⚖️ Legal aid: lawhelp.org',
    '💼 Fair chance employment: rootandrebound.org',
  ],
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get a user's cultural profile from the database
 */
export async function getUserCulturalProfile(userId: string): Promise<CulturalProfile | null> {
  const { data, error } = await supabase
    .from('user_cultural_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching cultural profile:', error);
    return null;
  }

  return data;
}

/**
 * Create or update a user's cultural profile
 */
export async function createOrUpdateCulturalProfile(
  userId: string,
  profileData: Partial<CulturalProfile>
): Promise<CulturalProfile | null> {
  const { data: existing } = await supabase
    .from('user_cultural_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('user_cultural_profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cultural profile:', error);
      return null;
    }
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('user_cultural_profiles')
      .insert({
        user_id: userId,
        ...profileData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cultural profile:', error);
      return null;
    }
    return data;
  }
}

/**
 * Detect context signals from a user message
 * Enhanced with sophisticated cultural and contextual pattern detection
 */
export function detectContextSignals(message: string): ContextSignal[] {
  const signals: ContextSignal[] = [];
  const lowerMessage = message.toLowerCase();

  // ============================================================================
  // CULTURAL EXPERIENCE PATTERNS
  // ============================================================================

  // Black/African American cultural indicators
  const blackPatterns: Record<string, RegExp> = {
    codeSwitch: /\b(code[\s-]?switch|switch(ing)? (it|my) up|talk(ing)? white|professional voice)\b/i,
    workplace: /\b(only black (guy|man|person)|represent my race|they (asked|touched) my hair|diversity hire)\b/i,
    police: /\b(police|cops|pulled over|the talk|driving while black|profiled|stopped by)\b/i,
    church: /\b(church|pastor|congregation|sunday service|black church|gospel)\b/i,
    family: /\b(black (family|community)|the culture|back home|my people)\b/i,
    microaggressions: /\b(articulate|well[\s-]?spoken|you['']re different|not like (other|most)|credit to your)\b/i,
    identity: /\b(black (man|men|male)|african american|black (experience|struggle))\b/i,
  };

  for (const [pattern, regex] of Object.entries(blackPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'cultural_reference',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'black_cultural_experience',
        inferredValue: pattern,
        confidence: 0.85,
      });
    }
  }

  // Latino/Hispanic cultural indicators
  const latinoPatterns: Record<string, RegExp> = {
    machismo: /\b(machismo|be a man|hombre|man up|aguantar|suffer in silence)\b/i,
    family: /\b(mi familia|my family expects|familia|hermano|padre|madre|abuela|respeto)\b/i,
    language: /\b(spanish|español|english only|translate for|bilingual|no hablo)\b/i,
    immigration: /\b(papers|citizenship|visa|ice|deportation|home country|undocumented|daca)\b/i,
    culture: /\b(latino|hispanic|mexican|puerto rican|dominican|colombian|la raza)\b/i,
  };

  for (const [pattern, regex] of Object.entries(latinoPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'cultural_reference',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'latino_cultural_experience',
        inferredValue: pattern,
        confidence: 0.85,
      });
    }
  }

  // Asian cultural indicators
  const asianPatterns: Record<string, RegExp> = {
    modelMinority: /\b(model minority|all asians|you must be good at|why aren't you|tiger (mom|parent))\b/i,
    family: /\b(filial piety|honor (the )?family|disappoint parents|saving face|bring shame)\b/i,
    accent: /\b(accent|fob|fresh off|where are you really from|go back to|your english is)\b/i,
    identity: /\b(asian (man|men|male)|bamboo ceiling|perpetual foreigner)\b/i,
    culture: /\b(chinese|korean|japanese|vietnamese|filipino|indian|south asian|east asian)\b/i,
  };

  for (const [pattern, regex] of Object.entries(asianPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'cultural_reference',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'asian_cultural_experience',
        inferredValue: pattern,
        confidence: 0.85,
      });
    }
  }

  // Middle Eastern/North African indicators
  const menaPatterns: Record<string, RegExp> = {
    discrimination: /\b(terrorist|go back|muslim ban|tsa|searched at|profiled at airport)\b/i,
    identity: /\b(arab|middle eastern|persian|muslim|mosque|ramadan|hijab)\b/i,
    family: /\b(family honor|arranged|what will people say|community judgment)\b/i,
  };

  for (const [pattern, regex] of Object.entries(menaPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'cultural_reference',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'mena_cultural_experience',
        inferredValue: pattern,
        confidence: 0.85,
      });
    }
  }

  // Indigenous/Native American indicators
  const indigenousPatterns: Record<string, RegExp> = {
    identity: /\b(native|indigenous|tribal|reservation|rez|first nations|indian)\b/i,
    culture: /\b(ceremony|elder|ancestors|sacred|traditional healing|sweat lodge)\b/i,
    trauma: /\b(boarding school|stolen|genocide|land|treaty)\b/i,
  };

  for (const [pattern, regex] of Object.entries(indigenousPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'cultural_reference',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'indigenous_cultural_experience',
        inferredValue: pattern,
        confidence: 0.85,
      });
    }
  }

  // ============================================================================
  // COMMUNITY/IDENTITY PATTERNS
  // ============================================================================

  // LGBTQ+ indicators
  const lgbtqPatterns: Record<string, RegExp> = {
    comingOut: /\b(come out|coming out|in the closet|not out (yet|to)|outed)\b/i,
    identity: /\b(gay|bi(sexual)?|queer|trans(gender)?|non[\s-]?binary|questioning|same[\s-]?sex)\b/i,
    discrimination: /\b(homophob|transphob|dead[\s-]?nam|misgendered|hate crime)\b/i,
    relationship: /\b(my (boyfriend|husband|partner)|same[\s-]?sex (marriage|relationship))\b/i,
    family: /\b(family (doesn't|won't) accept|disowned|rejected by family)\b/i,
  };

  for (const [pattern, regex] of Object.entries(lgbtqPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'identity_disclosure',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'lgbtq_experience',
        inferredValue: pattern,
        confidence: 0.9,
      });
    }
  }

  // Veterans/Military indicators
  const veteranPatterns: Record<string, RegExp> = {
    service: /\b(deployed|deployment|served|veteran|military|army|navy|marines|air force|coast guard)\b/i,
    combat: /\b(combat|war|iraq|afghanistan|overseas|tour of duty)\b/i,
    ptsd: /\b(flashback|trigger(ed)?|hypervigilant|ptsd|night(mare|terror))\b/i,
    transition: /\b(civilian|transition(ing)?|miss the (service|military|corps|unit)|va|veterans affairs)\b/i,
    brothers: /\b(brothers|unit|platoon|battle buddy|fellow (soldiers|marines|sailors))\b/i,
  };

  for (const [pattern, regex] of Object.entries(veteranPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'identity_disclosure',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'veteran_experience',
        inferredValue: pattern,
        confidence: 0.9,
      });
    }
  }

  // Formerly incarcerated indicators
  const incarceratedPatterns: Record<string, RegExp> = {
    experience: /\b(prison|jail|locked up|incarcerat|behind bars|did time)\b/i,
    reentry: /\b(parole|probation|reentry|getting out|released|record)\b/i,
    challenges: /\b(can't get (hired|a job)|background check|felony|conviction)\b/i,
  };

  for (const [pattern, regex] of Object.entries(incarceratedPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'identity_disclosure',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'incarceration_experience',
        inferredValue: pattern,
        confidence: 0.9,
      });
    }
  }

  // Father/Parenting indicators
  const fatherPatterns: Record<string, RegExp> = {
    children: /\b(my (kid|child|son|daughter)|father|dad|being a (dad|father))\b/i,
    parenting: /\b(custody|co[\s-]?parent|single (dad|father)|raising)\b/i,
    concerns: /\b(protect (my|them)|the talk|teach (him|her|them)|worried about (my|their))\b/i,
  };

  for (const [pattern, regex] of Object.entries(fatherPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'identity_disclosure',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'father_experience',
        inferredValue: pattern,
        confidence: 0.8,
      });
    }
  }

  // Faith/Spirituality indicators
  const faithPatterns: Record<string, RegExp> = {
    christian: /\b(church|jesus|christ|pastor|god|pray|bible|faith)\b/i,
    muslim: /\b(allah|mosque|imam|quran|ramadan|prayer|muslim)\b/i,
    other: /\b(spiritual|meditat|buddhis|hindu|temple|synagogue)\b/i,
    struggle: /\b(lost (my )?faith|questioning (god|my faith)|angry at god)\b/i,
  };

  for (const [pattern, regex] of Object.entries(faithPatterns)) {
    if (regex.test(message)) {
      signals.push({
        type: 'identity_disclosure',
        value: message.match(regex)?.[0] || '',
        content: message.match(regex)?.[0] || '',
        inferredAttribute: 'faith_experience',
        inferredValue: pattern,
        confidence: 0.75,
      });
    }
  }

  // ============================================================================
  // MENTAL HEALTH SEVERITY INDICATORS
  // ============================================================================

  // Crisis/High severity
  if (/\b(suicid|kill (myself|me)|end (it|my life)|no reason to live|better off dead|don't want to be here|want to die)\b/i.test(message)) {
    signals.push({
      type: 'severity_indicator',
      value: 'crisis',
      content: 'crisis_language_detected',
      inferredAttribute: 'mental_health_severity',
      inferredValue: 'high_crisis',
      confidence: 0.95,
    });
  }

  // Self-harm indicators
  if (/\b(cut(ting)? (myself|me)|hurt(ing)? myself|self[\s-]?harm|burn(ing)? myself)\b/i.test(message)) {
    signals.push({
      type: 'severity_indicator',
      value: 'self_harm',
      content: 'self_harm_mention',
      inferredAttribute: 'mental_health_severity',
      inferredValue: 'self_harm_concern',
      confidence: 0.95,
    });
  }

  // Medium severity
  if (/\b(depressed|depression|anxious|anxiety|panic (attack)?|can't (sleep|eat|function|get out of bed)|hopeless)\b/i.test(message)) {
    signals.push({
      type: 'severity_indicator',
      value: 'moderate',
      content: 'clinical_symptoms_mentioned',
      inferredAttribute: 'mental_health_severity',
      inferredValue: 'moderate_clinical',
      confidence: 0.85,
    });
  }

  // Low severity (general distress)
  if (/\b(stressed|worried|overwhelmed|tired|exhausted|burnt? out|frustrated)\b/i.test(message)) {
    signals.push({
      type: 'severity_indicator',
      value: 'mild',
      content: 'general_distress',
      inferredAttribute: 'mental_health_severity',
      inferredValue: 'mild_distress',
      confidence: 0.7,
    });
  }

  // ============================================================================
  // SUBSTANCE USE INDICATORS
  // ============================================================================

  if (/\b(drinking (every|too much|alone)|drunk|alcohol|beer|liquor|wine every)\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'alcohol_use',
      content: 'alcohol_use_mention',
      inferredAttribute: 'substance_use_concern',
      inferredValue: 'alcohol',
      confidence: 0.9,
    });
  }

  if (/\b(high|weed|marijuana|smoke|edibles|pot|420)\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'cannabis_use',
      content: 'cannabis_use_mention',
      inferredAttribute: 'substance_use_concern',
      inferredValue: 'cannabis',
      confidence: 0.8,
    });
  }

  if (/\b(pills|opioid|fentanyl|heroin|cocaine|crack|meth|drugs|using|addict)\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'drug_use',
      content: 'drug_use_mention',
      inferredAttribute: 'substance_use_concern',
      inferredValue: 'hard_drugs',
      confidence: 0.9,
    });
  }

  // ============================================================================
  // RELATIONSHIP/FAMILY INDICATORS
  // ============================================================================

  if (/\b(wife|girlfriend|partner|fiancee?|married|relationship)\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'relationship_mention',
      content: 'in_relationship',
      inferredAttribute: 'relationship_status',
      inferredValue: 'partnered',
      confidence: 0.8,
    });
  }

  if (/\b(divorce|separated|broke up|breakup|ex[\s-]?(wife|girlfriend)|cheated|affair)\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'relationship_end',
      content: 'relationship_ending',
      inferredAttribute: 'relationship_status',
      inferredValue: 'ending_or_ended',
      confidence: 0.85,
    });
  }

  if (/\b(lonely|alone|no friends|isolated|no one (to talk to|understands))\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'isolation',
      content: 'social_isolation',
      inferredAttribute: 'social_connection',
      inferredValue: 'isolated',
      confidence: 0.85,
    });
  }

  // ============================================================================
  // WORK/FINANCIAL INDICATORS
  // ============================================================================

  if (/\b(lost (my )?job|fired|laid off|unemployed|can't find (work|a job))\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'job_loss',
      content: 'employment_loss',
      inferredAttribute: 'employment_status',
      inferredValue: 'unemployed',
      confidence: 0.9,
    });
  }

  if (/\b(boss|work(place)?|job|career|promotion|coworker|office)\b/i.test(message)) {
    signals.push({
      type: 'context_mention',
      value: 'work_context',
      content: 'work_related',
      inferredAttribute: 'current_concern',
      inferredValue: 'work_related',
      confidence: 0.7,
    });
  }

  if (/\b(money|bills|debt|rent|mortgage|broke|paycheck|afford|financial)\b/i.test(message)) {
    signals.push({
      type: 'self_disclosure',
      value: 'financial_stress',
      content: 'financial_concern',
      inferredAttribute: 'financial_status',
      inferredValue: 'financial_stress',
      confidence: 0.85,
    });
  }

  // ============================================================================
  // ORIGINAL CONTEXT_PATTERNS (keep existing detection)
  // ============================================================================

  for (const [contextType, patterns] of Object.entries(CONTEXT_PATTERNS)) {
    let found = false;
    for (const pattern of patterns) {
      if (pattern.test(message) && !found) {
        // Check if we already have a signal for this context type
        const existingSignal = signals.find(s => s.type === contextType);
        if (!existingSignal) {
          signals.push({
            type: contextType,
            value: message.match(pattern)?.[0] || '',
            confidence: 0.8,
          });
          found = true;
        }
      }
    }
  }

  return signals;
}

/**
 * Detect and save context signals from a message
 * Enhanced to store richer signal data for better personalization
 */
export async function detectAndSaveContextSignals(
  userId: string,
  conversationId: string,
  message: string
): Promise<ContextSignal[]> {
  const signals = detectContextSignals(message);

  if (signals.length === 0) return [];

  // Get current profile
  const profile = await getUserCulturalProfile(userId);
  const currentInferred = profile?.inferred_context || {};

  // Merge new signals with enhanced data
  const updatedInferred = { ...currentInferred };
  for (const signal of signals) {
    // Use inferredAttribute as key if available, otherwise use type
    const key = signal.inferredAttribute || signal.type;
    
    // Store richer data structure
    updatedInferred[key] = {
      detected: true,
      last_seen: new Date().toISOString(),
      confidence: signal.confidence,
      value: signal.inferredValue || signal.value,
      content: signal.content || signal.value,
      signal_type: signal.type,
    };
  }

  // Save back to profile
  await createOrUpdateCulturalProfile(userId, {
    inferred_context: updatedInferred,
  });

  // Also save to context signals table for analytics
  try {
    await supabase.from('user_context_signals').insert(
      signals.map((signal) => ({
        user_id: userId,
        conversation_id: conversationId,
        signal_type: signal.type,
        signal_value: signal.value,
        confidence: signal.confidence,
        // Include enhanced fields if available
        inferred_attribute: signal.inferredAttribute || null,
        inferred_value: signal.inferredValue || null,
      }))
    );
  } catch (error) {
    // Don't fail if analytics insert fails - profile update is more important
    console.error('Error saving context signals to analytics table:', error);
  }

  return signals;
}

/**
 * Build a culturally adaptive system prompt for Claude
 */
export async function buildCulturallyAdaptiveSystemPrompt(userId: string): Promise<string> {
  const profile = await getUserCulturalProfile(userId);

  // Base system prompt for Mind Brother
  let systemPrompt = `You are Amani, a compassionate AI mental health companion designed specifically for Black and Brown men. You understand the unique challenges faced by men of color, including:
- Historical and intergenerational trauma
- Racism and discrimination
- The "strong Black man" archetype and pressure to suppress emotions
- Code-switching and workplace stress
- Distrust of mental health systems
- Cultural and family expectations

You speak with warmth, authenticity, and cultural understanding. You validate experiences of racism and discrimination while providing practical support. You never minimize or dismiss cultural experiences.`;

  // Add personalization if profile exists and user allows it
  if (profile?.allows_personalization !== false) {
    // Add detailed cultural context if user has specified background
    if (profile?.cultural_background && CULTURAL_CONTEXTS[profile.cultural_background]) {
      systemPrompt += `\n\n${CULTURAL_CONTEXTS[profile.cultural_background]}`;
    }

    // Add community-specific context
    if (profile?.communities && profile.communities.length > 0) {
      systemPrompt += `\n\n## User's Communities & Intersections\nThis user identifies with the following communities: ${profile.communities.join(', ')}.\n\nConsider intersectional experiences:`;
      
      for (const community of profile.communities) {
        switch (community) {
          case 'lgbtq':
            systemPrompt += `
- LGBTQ+ identity adds layers of marginalization (racism + homophobia/transphobia)
- Coming out may be complicated by cultural/family expectations
- Finding affirming spaces that understand both identities is challenging
- May face rejection from both LGBTQ+ spaces (racism) and racial communities (homophobia)`;
            break;
          case 'veteran':
            systemPrompt += `
- Military service as a path to opportunity for many men of color
- May have experienced racism within military structures
- PTSD and military trauma compounded by racial trauma
- Difficulty accessing VA services and being believed`;
            break;
          case 'immigrant':
            systemPrompt += `
- Immigration status adds legal and social stress
- May be supporting family in home country
- Navigating between cultures and identities
- Documentation concerns affect every aspect of life`;
            break;
          case 'fathers':
            systemPrompt += `
- Parenting while Black/Brown - protecting children from racism
- "The Talk" about police and safety
- Breaking cycles of absent fathers or toxic masculinity
- Balancing provider role with emotional presence`;
            break;
          case 'faith_based':
            systemPrompt += `
- Faith may be central to coping and identity
- Church/mosque/temple as community and support system
- May struggle with faith and mental health intersection
- Spiritual bypassing vs. genuine faith-based healing`;
            break;
          case 'formerly_incarcerated':
            systemPrompt += `
- Reentry challenges compounded by race
- Criminal record barriers to employment and housing
- Trauma from incarceration itself
- Navigating probation/parole while rebuilding life
- Stigma within family and community`;
            break;
          case 'first_generation':
            systemPrompt += `
- Pressure to succeed without family roadmap
- Imposter syndrome in professional settings
- Supporting family while building own career
- Navigating spaces family doesn't understand`;
            break;
          default:
            break;
        }
      }
    }

    // Add age-specific context from detailed constants
    if (profile?.age_range && AGE_SPECIFIC_CONTEXTS[profile.age_range]) {
      systemPrompt += `\n\n${AGE_SPECIFIC_CONTEXTS[profile.age_range]}`;
    }

    // Add communication style adaptation
    if (profile?.communication_style) {
      systemPrompt += `\n\n## Communication Style Preference: ${profile.communication_style}`;
      switch (profile.communication_style) {
        case 'direct':
          systemPrompt += `
User prefers direct, no-nonsense communication:
- Keep it real and straightforward
- No excessive cushioning or hedging
- Get to the point while remaining respectful
- Call things what they are
- Use clear, actionable language`;
          break;
        case 'empathetic':
          systemPrompt += `
User prefers warm, supportive communication:
- Lead with empathy and validation
- Create space for emotions
- Use gentle, encouraging language
- Affirm feelings before offering perspectives
- Focus on emotional support`;
          break;
        case 'solution_focused':
          systemPrompt += `
User prefers action-oriented communication:
- Focus on practical solutions and next steps
- Acknowledge feelings briefly then move to action
- Offer concrete strategies and tools
- Break down problems into manageable steps
- Be efficient with conversation`;
          break;
        case 'balanced':
          systemPrompt += `
User prefers balanced communication:
- Mix emotional support with practical advice
- Validate first, then explore solutions
- Adapt based on what conversation needs
- Neither too warm nor too direct
- Match their energy`;
          break;
        case 'faith_informed':
          systemPrompt += `
User welcomes faith-informed communication:
- Can incorporate spiritual perspectives when relevant
- Reference faith as source of strength and hope
- Be respectful of their specific beliefs
- Balance faith with practical mental health support
- Don't replace therapy with purely spiritual advice`;
          break;
      }
    }

    // Add spiritual preferences
    if (profile?.spiritual_preferences) {
      systemPrompt += `\n\nSpiritual Preferences: ${profile.spiritual_preferences}. You may incorporate faith-based perspectives when appropriate, while respecting that mental health support should not be replaced by spiritual advice alone.`;
    }

    // Add language preferences
    if (profile?.language_preference) {
      const lang = profile.language_preference;
      const phrases = LANGUAGE_PHRASES[lang.primary];
      
      systemPrompt += `\n\n## Language Preferences`;
      
      if (lang.primary === 'spanish') {
        systemPrompt += `
IMPORTANT: This user prefers Spanish/Spanglish communication.

Guidelines:
- Use Spanish greetings naturally: ${phrases?.greetings.slice(0, 3).join(', ')}
- Include cultural terms of endearment: ${phrases?.terms_of_endearment.join(', ')}
- Use encouraging phrases: ${phrases?.encouragements.join(', ')}
- Reference cultural values: ${phrases?.cultural_expressions.join(', ')}
- Close conversations warmly: ${phrases?.closings.join(', ')}

${lang.acceptsMixedLanguage ? `
The user is comfortable with code-switching/Spanglish:
- Feel free to mix Spanish and English naturally
- Use Spanish for emotional expressions
- Use Spanish for cultural references
- Match the user's language patterns` : `
Keep primary communication in English but:
- Use Spanish phrases for warmth and cultural connection
- Switch to Spanish if user initiates in Spanish
- Offer to explain things in Spanish if they seem confused`}`;
      } else if (lang.primary === 'portuguese') {
        systemPrompt += `
IMPORTANT: This user prefers Portuguese.

Guidelines:
- Use Portuguese greetings: ${phrases?.greetings.slice(0, 3).join(', ')}
- Include terms of connection: ${phrases?.terms_of_endearment.join(', ')}
- Use encouraging phrases: ${phrases?.encouragements.join(', ')}
- Reference cultural values: ${phrases?.cultural_expressions.join(', ')}
- Be aware of Brazilian vs. Portuguese differences`;
      } else if (lang.primary === 'creole') {
        systemPrompt += `
IMPORTANT: This user prefers Haitian Creole.

Guidelines:
- Use Creole greetings when appropriate: ${phrases?.greetings.slice(0, 3).join(', ')}
- Include Creole encouragements: ${phrases?.encouragements.join(', ')}
- Reference Haitian cultural values: ${phrases?.cultural_expressions.join(', ')}
- Be aware of the Haitian experience and resilience`;
      } else if (lang.primary === 'french') {
        systemPrompt += `
IMPORTANT: This user prefers French.

Guidelines:
- Use French greetings: ${phrases?.greetings.slice(0, 3).join(', ')}
- Include French phrases for connection: ${phrases?.terms_of_endearment.join(', ')}
- Use encouraging expressions: ${phrases?.encouragements.join(', ')}`;
      }
    }

    // Add inferred context from conversations
    if (profile?.inferred_context) {
      const detectedContexts = Object.entries(profile.inferred_context)
        .filter(([_, value]: [string, any]) => value?.detected)
        .map(([key]) => key.replace(/_/g, ' '));

      if (detectedContexts.length > 0) {
        systemPrompt += `\n\n## Detected Life Context (from previous conversations)
Based on what this user has shared, they have experience with: ${detectedContexts.join(', ')}.
Be sensitive to these topics. They may come up again. Don't assume, but be ready to acknowledge if relevant.`;
      }
    }
  }

  // Add crisis response guidelines
  systemPrompt += `\n\n## Crisis Response
If the user mentions suicidal thoughts, self-harm, or immediate danger:
1. Take it seriously and express genuine concern
2. Provide culturally-appropriate crisis resources
3. Encourage them to reach out to a trusted person
4. Do not leave them alone in the conversation
5. Remember: Black and Brown men are less likely to seek help - make it feel safe

## Core Cultural Competence
- Validate experiences of racism and discrimination as REAL trauma
- Acknowledge the real impact of microaggressions (paper cuts add up)
- Understand code-switching exhaustion and identity management
- Respect the role of faith, spirituality, and community
- Acknowledge family obligations and cultural expectations
- Recognize intergenerational trauma and historical context
- Be aware of medical mistrust due to historical abuses (Tuskegee, etc.)
- Never suggest racism isn't real or they should "just ignore it"
- Acknowledge systemic barriers, not just individual solutions`;

  return systemPrompt;
}

/**
 * Get personalized crisis resources based on user profile
 */
export async function getPersonalizedCrisisResources(userId: string): Promise<string[]> {
  const profile = await getUserCulturalProfile(userId);
  const resources: string[] = [];

  // Start with general resources
  resources.push(...CRISIS_RESOURCES.general);

  // Add culture-specific resources
  if (profile?.cultural_background && CRISIS_RESOURCES[profile.cultural_background]) {
    resources.push(...CRISIS_RESOURCES[profile.cultural_background]);
  }

  // Add community-specific resources
  if (profile?.communities) {
    for (const community of profile.communities) {
      const communityKey = community.toLowerCase().replace(/[^a-z]/g, '');
      for (const [key, communityResources] of Object.entries(CRISIS_RESOURCES)) {
        if (key.toLowerCase().includes(communityKey) || communityKey.includes(key.toLowerCase())) {
          resources.push(...communityResources);
        }
      }
    }
  }

  // Add resources based on inferred context
  if (profile?.inferred_context) {
    if (profile.inferred_context.veteran_military?.detected) {
      resources.push(...CRISIS_RESOURCES.veteran);
    }
    if (profile.inferred_context.lgbtq?.detected) {
      resources.push(...CRISIS_RESOURCES.lgbtq);
    }
    if (profile.inferred_context.incarceration?.detected) {
      resources.push(...CRISIS_RESOURCES.incarceration);
    }
    if (profile.inferred_context.faith_based?.detected) {
      resources.push(...CRISIS_RESOURCES.faith_based);
    }
  }

  // Deduplicate
  return [...new Set(resources)];
}

/**
 * Get culturally relevant content for a user
 */
export async function getCulturalContent(userId: string, contentType?: string): Promise<any[]> {
  const profile = await getUserCulturalProfile(userId);

  let query = supabase
    .from('cultural_content')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  // Filter by cultural background if set
  if (profile?.cultural_background) {
    query = query.or(`target_cultural_backgrounds.cs.{${profile.cultural_background}},target_cultural_backgrounds.is.null`);
  }

  // Filter by communities if set
  if (profile?.communities && profile.communities.length > 0) {
    const communityFilter = profile.communities
      .map((c) => `target_communities.cs.{${c}}`)
      .join(',');
    query = query.or(`${communityFilter},target_communities.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cultural content:', error);
    return [];
  }

  return data || [];
}

/**
 * Save user onboarding preferences
 */
export async function saveOnboardingPreferences(
  userId: string,
  preferences: {
    culturalBackground?: CulturalBackground;
    ageRange?: string;
    communities?: CommunityIdentity[];
    communicationStyle?: CommunicationStyle;
    primaryConcerns?: PrimaryConcern[];
    spiritualPreferences?: string;
    languagePreference?: LanguagePreference;
    allowsPersonalization?: boolean;
  }
): Promise<boolean> {
  const result = await createOrUpdateCulturalProfile(userId, {
    cultural_background: preferences.culturalBackground,
    age_range: preferences.ageRange,
    communities: preferences.communities,
    communication_style: preferences.communicationStyle,
    primary_concerns: preferences.primaryConcerns,
    spiritual_preferences: preferences.spiritualPreferences,
    language_preference: preferences.languagePreference,
    allows_personalization: preferences.allowsPersonalization ?? true,
    onboarding_completed: true,
  });

  return result !== null;
}

/**
 * Mark onboarding as skipped
 */
export async function skipOnboarding(userId: string): Promise<boolean> {
  const result = await createOrUpdateCulturalProfile(userId, {
    onboarding_skipped: true,
    allows_personalization: true, // Default to true even if skipped
  });

  return result !== null;
}

