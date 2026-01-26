// Default Mental Health Resources for Mind Brother
// Culturally relevant resources for men seeking mental health support

const defaultResources = [
  // CRISIS RESOURCES
  {
    id: 'crisis_988',
    title: '988 Suicide & Crisis Lifeline',
    description: '24/7 free confidential support for people in distress prevention and crisis resources',
    category: 'crisis',
    subcategory: 'suicide',
    phone: '988',
    type: 'crisis_hotline',
    culturalRelevance: ['all'],
    tags: ['24/7', 'confidential', 'free']
  },
  {
    id: 'crisis_text',
    title: 'Crisis Text Line',
    description: 'Text HOME to 741741 for free 24/7 crisis support via text message',
    category: 'crisis',
    subcategory: 'suicide',
    phone: '741741',
    type: 'crisis_hotline',
    culturalRelevance: ['all'],
    tags: ['24/7', 'text', 'confidential']
  },
  {
    id: 'crisis_samhsa',
    title: 'SAMHSA National Helpline',
    description: 'Substance Abuse and Mental Health Services Administration free confidential 24/7 helpline for mental health and substance abuse',
    category: 'crisis',
    subcategory: 'substance_abuse',
    phone: '1-800-662-4357',
    type: 'crisis_hotline',
    culturalRelevance: ['all'],
    tags: ['24/7', 'substance-abuse', 'free']
  },
  
  // THERAPY & PROFESSIONAL HELP
  {
    id: 'therapy_inclusivetherapists',
    title: 'Inclusive Therapists',
    description: 'Directory of culturally-responsive mental health professionals specializing in serving diverse communities',
    category: 'mental_health',
    subcategory: 'therapy',
    url: 'https://www.inclusivetherapists.com',
    type: 'therapy',
    culturalRelevance: ['black', 'african-american', 'poc', 'lgbtq'],
    tags: ['directory', 'culturally-responsive', 'lgbtq']
  },
  {
    id: 'therapy_therapyforblackmen',
    title: 'Therapy for Black Men',
    description: 'Non-profit organization connecting Black men with Black male therapists who understand their unique experiences',
    category: 'mental_health',
    subcategory: 'therapy',
    url: 'https://www.therapyforblackmen.org',
    type: 'therapy',
    culturalRelevance: ['black', 'african-american'],
    tags: ['black-men', 'culturally-specific', 'therapist-directory']
  },
  {
    id: 'therapy_betterhelp',
    title: 'BetterHelp',
    description: 'Online therapy platform with diverse therapists specializing in men issues depression anxiety relationships',
    category: 'mental_health',
    subcategory: 'therapy',
    url: 'https://www.betterhelp.com',
    type: 'therapy',
    culturalRelevance: ['all'],
    tags: ['online', 'affordable', 'flexible']
  },
  
  // EMPLOYMENT & CAREER
  {
    id: 'employment_dol',
    title: 'Department of Labor Career Centers',
    description: 'Free job search assistance resume help interview prep unemployment benefits career counseling',
    category: 'employment',
    subcategory: 'job_loss',
    url: 'https://www.careeronestop.org',
    type: 'article',
    culturalRelevance: ['all'],
    tags: ['job-search', 'free', 'government']
  },
  {
    id: 'employment_blackcareernetwork',
    title: 'Black Career Network',
    description: 'Job board and career resources specifically for Black professionals networking mentorship opportunities',
    category: 'employment',
    subcategory: 'career',
    url: 'https://www.blackcareernetwork.com',
    type: 'article',
    culturalRelevance: ['black', 'african-american'],
    tags: ['job-board', 'networking', 'mentorship']
  },
  
  // RELATIONSHIP SUPPORT
  {
    id: 'relationship_couples_therapy',
    title: 'Couples Therapy Inc',
    description: 'Online couples therapy and relationship counseling with culturally-aware therapists',
    category: 'relationship',
    subcategory: 'couples',
    url: 'https://couplestherapyinc.com',
    type: 'therapy',
    culturalRelevance: ['all'],
    tags: ['couples', 'online', 'culturally-aware']
  },
  {
    id: 'relationship_gottman',
    title: 'The Gottman Institute',
    description: 'Research-based relationship advice tools for improving communication trust intimacy',
    category: 'relationship',
    subcategory: 'couples',
    url: 'https://www.gottman.com',
    type: 'article',
    culturalRelevance: ['all'],
    tags: ['research-based', 'communication', 'tools']
  },
  
  // ANXIETY & DEPRESSION
  {
    id: 'anxiety_calm',
    title: 'Calm - Meditation & Sleep',
    description: 'Meditation sleep stories breathing exercises anxiety management mindfulness for men',
    category: 'mental_health',
    subcategory: 'anxiety',
    url: 'https://www.calm.com',
    type: 'app',
    culturalRelevance: ['all'],
    tags: ['meditation', 'sleep', 'anxiety', 'app']
  },
  {
    id: 'depression_headspace',
    title: 'Headspace',
    description: 'Guided meditation mindfulness exercises for stress depression anxiety management',
    category: 'mental_health',
    subcategory: 'depression',
    url: 'https://www.headspace.com',
    type: 'app',
    culturalRelevance: ['all'],
    tags: ['meditation', 'mindfulness', 'app']
  },
  {
    id: 'depression_nami',
    title: 'NAMI Depression Support',
    description: 'National Alliance on Mental Illness free support groups education resources for depression',
    category: 'mental_health',
    subcategory: 'depression',
    url: 'https://www.nami.org',
    type: 'support_group',
    culturalRelevance: ['all'],
    tags: ['support-group', 'free', 'education']
  },
  
  // CULTURAL & IDENTITY
  {
    id: 'identity_blackmentalhealth',
    title: 'Black Mental Health Matters',
    description: 'Resources community support advocacy for Black mental health reducing stigma promoting wellness',
    category: 'identity',
    subcategory: 'cultural',
    url: 'https://blackmentalhealthmatters.com',
    type: 'article',
    culturalRelevance: ['black', 'african-american'],
    tags: ['advocacy', 'community', 'stigma']
  },
  {
    id: 'identity_brothers',
    title: 'Brothers Standing Together',
    description: 'Support group for Black men addressing mental health masculinity fatherhood brotherhood',
    category: 'identity',
    subcategory: 'masculinity',
    type: 'support_group',
    culturalRelevance: ['black', 'african-american'],
    tags: ['support-group', 'black-men', 'masculinity']
  },
  
  // STRESS & BURNOUT
  {
    id: 'stress_apa',
    title: 'APA Stress Management',
    description: 'American Psychological Association stress management techniques coping strategies work-life balance',
    category: 'mental_health',
    subcategory: 'stress',
    url: 'https://www.apa.org/topics/stress',
    type: 'article',
    culturalRelevance: ['all'],
    tags: ['stress', 'coping', 'work-life-balance']
  },
  {
    id: 'burnout_mindtools',
    title: 'Burnout Self-Test & Recovery',
    description: 'Assess your burnout level and get personalized recovery strategies workplace stress management',
    category: 'mental_health',
    subcategory: 'burnout',
    url: 'https://www.mindtools.com/burnout',
    type: 'article',
    culturalRelevance: ['all'],
    tags: ['burnout', 'self-test', 'recovery']
  },
  
  // FATHERHOOD
  {
    id: 'fatherhood_nationalmec',
    title: 'National Fatherhood Initiative',
    description: 'Resources for fathers parenting tips co-parenting support work-family balance',
    category: 'relationship',
    subcategory: 'fatherhood',
    url: 'https://www.fatherhood.org',
    type: 'article',
    culturalRelevance: ['all'],
    tags: ['fatherhood', 'parenting', 'co-parenting']
  },
  {
    id: 'fatherhood_blackdads',
    title: 'Black Fathers Matter',
    description: 'Community and resources specifically for Black fathers challenging stereotypes celebrating Black fatherhood',
    category: 'relationship',
    subcategory: 'fatherhood',
    type: 'support_group',
    culturalRelevance: ['black', 'african-american'],
    tags: ['black-fathers', 'community', 'advocacy']
  },
  
  // LGBTQ+
  {
    id: 'lgbtq_thetrevorproject',
    title: 'The Trevor Project',
    description: '24/7 crisis support for LGBTQ youth text chat phone counseling resources',
    category: 'crisis',
    subcategory: 'lgbtq',
    phone: '1-866-488-7386',
    url: 'https://www.thetrevorproject.org',
    type: 'crisis_hotline',
    culturalRelevance: ['lgbtq', 'poc'],
    tags: ['lgbtq', '24/7', 'crisis']
  },
  {
    id: 'lgbtq_blackline',
    title: 'BlackLine',
    description: 'Crisis support hotline for Black LGBTQ communities by and for Black people',
    category: 'crisis',
    subcategory: 'lgbtq',
    phone: '1-800-604-5841',
    type: 'crisis_hotline',
    culturalRelevance: ['black', 'african-american', 'lgbtq'],
    tags: ['crisis', 'black', 'lgbtq']
  }
];

module.exports = defaultResources;












