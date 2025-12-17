/**
 * Amani Intent Mapping Guide
 * 
 * Knowledge Base Reference System for Mind Brother AI
 * Maps user statements, questions, and emotional indicators to relevant KB sections
 */

// Priority Levels
export type PriorityLevel = 'crisis' | 'urgent' | 'moderate' | 'supportive';

export interface IntentCategory {
  id: string;
  name: string;
  priority: PriorityLevel;
  triggerPhrases: {
    direct: string[];
    indirect: string[];
    emotional?: string[];
    physical?: string[];
    behavioral?: string[];
  };
  kbReferences: {
    primary: string;
    supporting: string[];
  };
  responseStrategy: {
    validate: string[];
    context: string[];
    actions: string[];
    redFlags: string[];
  };
}

// ==================== INTENT CATEGORIES ====================

export const intentCategories: IntentCategory[] = [
  // CATEGORY 1: ISOLATION & LONELINESS
  {
    id: 'isolation_loneliness',
    name: 'Isolation & Loneliness',
    priority: 'moderate',
    triggerPhrases: {
      direct: [
        "i don't have any friends",
        "i'm so alone",
        "nobody understands me",
        "i feel invisible",
        "i haven't talked to anyone",
        "everyone has moved on without me",
        "i'm always by myself",
        "nobody would care if i disappeared",
        "i don't belong anywhere",
        "i have no one",
        "no friends",
        "feeling alone",
        "lonely"
      ],
      indirect: [
        "it's just easier to stay home",
        "people are exhausting",
        "i canceled plans again",
        "my phone never rings",
        "i'm the only one who doesn't have",
        "everyone else seems to have it figured out",
        "i used to have friends but",
        "i'm tired of being the one to reach out",
        "nobody texts me",
        "stay home alone"
      ],
      emotional: [
        "disconnected from others",
        "missing social connection",
        "fundamentally different",
        "jealousy of others' relationships",
        "shame about being alone",
        "bitterness about past friendships"
      ]
    },
    kbReferences: {
      primary: 'isolation_loneliness',
      supporting: ['relationships', 'resilience', 'support_systems']
    },
    responseStrategy: {
      validate: [
        "Loneliness is one of the hardest things men face, and it's incredibly common",
        "What you're feeling is real and it makes sense given your situation",
        "You can feel lonely in a crowd—that feeling is valid"
      ],
      context: [
        "Explain difference between isolation and loneliness",
        "Normalize that men struggle with this due to social conditioning",
        "Cite the health impacts to show this is serious, not trivial"
      ],
      actions: [
        "Start with low-pressure connections (online communities, commenting)",
        "Activity-based socializing suggestions",
        "Challenge thought patterns ('nobody wants to hear from me')",
        "Set one small social goal"
      ],
      redFlags: [
        "Combined with 'nobody would care if I died' → CRISIS protocol",
        "Using isolation to hide substance abuse",
        "Complete withdrawal from all relationships"
      ]
    }
  },

  // CATEGORY 2: DEPRESSION
  {
    id: 'depression',
    name: 'Depression',
    priority: 'urgent',
    triggerPhrases: {
      direct: [
        "i think i'm depressed",
        "nothing makes me happy anymore",
        "i can't get out of bed",
        "what's the point of anything",
        "i feel numb",
        "i feel empty inside",
        "i'm just going through the motions",
        "everything feels hopeless",
        "i feel hopeless",
        "there's no hope",
        "i've lost all hope",
        "things will never get better",
        "nothing will change",
        "i'm trapped",
        "there's no way out",
        "i used to enjoy",
        "don't care anymore",
        "depressed"
      ],
      indirect: [
        "i'm just tired all the time",
        "i can't focus on anything",
        "i'm irritable",
        "angry at everything",
        "i'm sleeping too much",
        "i can't sleep",
        "i don't want to see anyone",
        "i'm letting people down",
        "i'm working all the time but feel nothing",
        "food doesn't taste like anything"
      ],
      physical: [
        "my body hurts all over",
        "constant headaches",
        "stomach problems",
        "no energy no matter how much i sleep",
        "lost a lot of weight",
        "gained a lot of weight"
      ],
      behavioral: [
        "stopped responding to messages",
        "quit hobbies",
        "increased drinking",
        "not taking care of appearance",
        "missing work"
      ]
    },
    kbReferences: {
      primary: 'depression',
      supporting: ['mind_body', 'therapy', 'substance_use']
    },
    responseStrategy: {
      validate: [
        "Depression in men often shows up as anger, irritability, and physical pain rather than sadness",
        "This isn't weakness—it's a medical condition affecting your brain chemistry",
        "What you're feeling is real and you deserve support"
      ],
      context: [
        "Depression is highly treatable",
        "Multiple treatment options (therapy, medication, lifestyle)",
        "Recovery is possible, even if it doesn't feel that way"
      ],
      actions: [
        "Encourage professional evaluation within days",
        "Suggest one small self-care action today",
        "Provide therapy resources",
        "Check if they have support person"
      ],
      redFlags: [
        "'I want this to end'",
        "'I'm a burden to everyone'",
        "'Things will never get better'",
        "Combined with isolation or substance use"
      ]
    }
  },

  // CATEGORY 3: ANXIETY & STRESS
  {
    id: 'anxiety_stress',
    name: 'Anxiety & Stress',
    priority: 'moderate',
    triggerPhrases: {
      direct: [
        "i can't stop worrying",
        "i'm constantly on edge",
        "my mind won't shut off",
        "i feel like something bad is going to happen",
        "i can't breathe",
        "my chest feels tight",
        "i'm having panic attacks",
        "i'm afraid all the time",
        "i can't control my thoughts",
        "anxious",
        "anxiety",
        "stressed",
        "panic"
      ],
      physical: [
        "my heart is racing",
        "i'm sweating for no reason",
        "i feel dizzy",
        "lightheaded",
        "my muscles are always tense",
        "i can't catch my breath",
        "i feel like i'm going crazy"
      ],
      indirect: [
        "i can't go to",
        "i make excuses to get out of things",
        "i'm avoiding",
        "i call in sick when i'm not actually sick",
        "i can't handle crowds",
        "can't handle driving",
        "i'm overwhelmed at work",
        "i can't keep up with everything",
        "sunday nights are the worst",
        "wake up dreading"
      ]
    },
    kbReferences: {
      primary: 'anxiety',
      supporting: ['grounding_techniques', 'workplace_stress', 'substance_use']
    },
    responseStrategy: {
      validate: [
        "What you're experiencing is your body's alarm system",
        "Anxiety is treatable—you don't have to live like this",
        "Your nervous system is trying to protect you, even when there's no real danger"
      ],
      context: [
        "Describe fight-or-flight response",
        "Normalize anxiety as brain trying to protect you",
        "Distinguish between anxiety and panic attacks"
      ],
      actions: [
        "Teach box breathing or 5-4-3-2-1 grounding",
        "Limit caffeine",
        "Physical exercise",
        "Consider CBT therapy",
        "Address lifestyle stressors"
      ],
      redFlags: [
        "Panic attacks multiple times per week",
        "Completely avoiding major life areas",
        "Using substances to cope",
        "Suicidal thoughts from anxiety"
      ]
    }
  },

  // CATEGORY 4: ANGER & RAGE
  {
    id: 'anger_rage',
    name: 'Anger & Rage',
    priority: 'urgent',
    triggerPhrases: {
      direct: [
        "i'm angry all the time",
        "i keep losing my temper",
        "i said something i regret",
        "i did something i regret",
        "i broke something",
        "i punched a wall",
        "people are afraid of me",
        "i can't control my rage",
        "i black out when i get angry",
        "i'm going to explode",
        "angry",
        "rage",
        "pissed off",
        "furious"
      ],
      indirect: [
        "my partner is scared of me",
        "my kids won't talk to me",
        "i yelled at",
        "i'm destroying my relationships",
        "everyone walks on eggshells around me",
        "i don't know why i keep doing this",
        "i feel disrespected",
        "nobody listens to me",
        "i feel powerless",
        "people keep pushing my buttons"
      ],
      physical: [
        "i see red",
        "my body gets hot",
        "my jaw is always clenched",
        "i'm tense all the time",
        "this rage comes over me"
      ]
    },
    kbReferences: {
      primary: 'anger',
      supporting: ['depression', 'anxiety', 'trauma', 'relationships']
    },
    responseStrategy: {
      validate: [
        "Anger often masks deeper emotions—hurt, fear, shame, powerlessness",
        "For many men, anger is the only 'acceptable' emotion they were taught",
        "The fact that you recognize this is important"
      ],
      context: [
        "Explore the iceberg—what's underneath the anger",
        "Normalize that men are taught anger is acceptable",
        "Address underlying hurt, rejection, fear, anxiety, shame"
      ],
      actions: [
        "Timeout before escalation",
        "Physical release (push wall, squeeze stress ball, run)",
        "Breathing techniques",
        "Identify triggers",
        "Consider anger management or therapy"
      ],
      redFlags: [
        "Any physical violence → need immediate anger management/DV program",
        "Threatening others",
        "Violence toward self or others → CRISIS"
      ]
    }
  },

  // ===== NEW TRAUMA CATEGORIES (5A, 5B, 5C) =====
  
  // NEW: CATEGORY 5A: TRAUMA DISCLOSURE (GENERAL)
  {
    id: 'trauma_disclosure',
    name: 'Trauma Disclosure',
    priority: 'urgent',
    triggerPhrases: {
      direct: [
        "i saw someone die",
        "i saw someone get killed",
        "i saw someone get shot",
        "i saw someone get stabbed",
        "i witnessed a murder",
        "i witnessed someone die",
        "i was beaten",
        "i was abused",
        "my father beat me",
        "my mother beat me",
        "i was hit as a child",
        "i held them while they died",
        "i found the body",
        "i tried to save them",
        "there was too much blood",
        "i watched them die",
        "i couldn't save them",
        "someone hurt me when i was young",
        "i was attacked",
        "i got jumped",
        "i've been assaulted"
      ],
      indirect: [
        "something happened to me when i was a kid",
        "someone did something to me",
        "i've never told anyone this before",
        "i saw things i shouldn't have seen",
        "i had to watch",
        "i was there when it happened",
        "i grew up seeing violence",
        "home wasn't safe",
        "there was no one to protect me",
        "i've been to too many funerals",
        "i lost someone to violence",
        "someone close to me was killed"
      ],
      emotional: [
        "i feel guilty i couldn't stop it",
        "i should have done something",
        "i can't get the images out of my head",
        "i keep seeing it happen",
        "i feel dirty",
        "i feel broken",
        "i feel damaged",
        "i can't trust anyone",
        "i hate being touched",
        "i'm scared all the time"
      ],
      physical: [
        "i still have scars",
        "my body remembers",
        "i tense up when",
        "i can't sleep without nightmares",
        "i see it when i close my eyes",
        "certain smells trigger me",
        "i freeze when",
        "my heart races when i remember"
      ],
      behavioral: [
        "i avoid that area now",
        "i can't go back there",
        "i changed my route",
        "i don't let anyone get close",
        "i always need to know where exits are",
        "i need my back to the wall",
        "i can't be around",
        "i have to check every room"
      ]
    },
    kbReferences: {
      primary: 'trauma_ptsd',
      supporting: [
        'crisis_intervention',
        'cultural_considerations',
        'depression',
        'substance_use',
        'therapy_resources',
        'trauma_response_protocol'
      ]
    },
    responseStrategy: {
      validate: [
        "Thank you for trusting me with this. What you just shared took incredible strength",
        "What happened to you was not okay. You didn't deserve that",
        "I believe you. What you experienced was real trauma",
        "You're not alone in carrying this. Many men have experienced trauma and found ways to heal",
        "The pain you're carrying is valid and real"
      ],
      context: [
        "Acknowledge the courage it took to share",
        "Explicitly state it wasn't their fault",
        "Normalize trauma responses without pathologizing",
        "Explain that trauma changes the nervous system",
        "Provide hope that healing is possible",
        "Differentiate between past trauma and current safety"
      ],
      actions: [
        "Assess current safety: 'Are you safe right now?'",
        "Ground in present moment if flashbacks occurring",
        "Offer immediate grounding technique (5-4-3-2-1)",
        "Explain trauma therapy options (EMDR, PE, CPT)",
        "Recommend trauma-specialized therapist",
        "Provide crisis resources if needed",
        "Validate need for professional trauma treatment",
        "Do NOT ask for details or press for more information"
      ],
      redFlags: [
        "Combined with suicidal ideation → IMMEDIATE CRISIS",
        "Trauma occurred within 72 hours → Medical attention/SAFE kit",
        "Ongoing abuse → Safety planning needed",
        "Substance use to cope → Address both trauma and addiction",
        "Severe dissociation or detachment",
        "Self-harm as coping mechanism",
        "Expressing they 'deserved it' → Counter with validation",
        "Minimizing ('it wasn't that bad') → Gently validate it WAS serious"
      ]
    }
  },

  // NEW: CATEGORY 5B: SEXUAL TRAUMA (Male Survivors)
  {
    id: 'sexual_trauma',
    name: 'Sexual Trauma (Male Survivors)',
    priority: 'urgent',
    triggerPhrases: {
      direct: [
        "i was raped",
        "i was sexually assaulted",
        "i was molested",
        "someone raped me",
        "i was sexually abused as a child",
        "someone touched me inappropriately",
        "i was forced to",
        "i said no but",
        "i couldn't stop them",
        "i was too drunk to stop it",
        "i froze and couldn't move",
        "he did things to me",
        "she did things to me"
      ],
      indirect: [
        "something sexual happened that i didn't want",
        "i was pressured into",
        "i didn't consent but",
        "my body responded but i didn't want it",
        "i got an erection even though",
        "i'm confused about what happened",
        "was it assault if",
        "can men be raped",
        "do men get sexually abused"
      ],
      emotional: [
        "i feel disgusting",
        "i feel ashamed of what happened",
        "i hate my body now",
        "i'm confused about my sexuality because of it",
        "i've never told anyone",
        "nobody would believe me",
        "men aren't supposed to be victims",
        "i should have fought back",
        "i'm less of a man because"
      ],
      physical: [
        "i can't be intimate anymore",
        "i hate being touched",
        "sex triggers panic",
        "i feel sick when someone touches me",
        "my body betrayed me"
      ],
      behavioral: [
        "i avoid relationships",
        "i can't trust anyone sexually",
        "i've become hypersexual",
        "i've shut down sexually",
        "i shower constantly",
        "i can't stand certain smells"
      ]
    },
    kbReferences: {
      primary: 'trauma_ptsd',
      supporting: [
        'crisis_intervention',
        'relationships_intimacy',
        'trauma_response_protocol',
        'therapy_resources'
      ]
    },
    responseStrategy: {
      validate: [
        "What happened to you was sexual violence. It was not your fault",
        "Men can be raped and sexually assaulted. This is real trauma",
        "Your body responding doesn't mean you wanted it—that's a physiological reflex, not consent",
        "Not fighting back doesn't mean you consented. Freeze is a survival response",
        "You were brave to tell me. Male sexual assault survivors face unique stigma and you broke through it",
        "Whether it was a man or woman who assaulted you, it was assault. Gender doesn't change that"
      ],
      context: [
        "Explicitly address male sexual assault myths",
        "Normalize physiological responses during assault (erection, ejaculation)",
        "Explain freeze response vs. fight/flight",
        "Address impact on masculinity and identity",
        "Validate that this doesn't define sexuality",
        "Acknowledge societal dismissal of male victims",
        "Explain why men underreport (shame, disbelief, stigma)"
      ],
      actions: [
        "Assess if assault was recent (72-hour window for SAFE kit/PEP)",
        "Provide RAINN hotline: 1-800-656-HOPE",
        "Offer male survivor resources specifically",
        "Recommend trauma therapist specializing in sexual trauma",
        "Discuss reporting as optional, not required",
        "Address STI/pregnancy concerns if applicable",
        "Provide grounding if in flashback",
        "Do NOT ask for details about the assault"
      ],
      redFlags: [
        "Recent assault (within 72 hours) → Medical attention urgent",
        "Suicidal thoughts related to assault → CRISIS",
        "Self-harm or risky sexual behavior as coping",
        "Substance use to numb the trauma",
        "Confusion about sexuality due to assault",
        "Shame about 'not being a real man'",
        "Complete sexual shutdown or hypersexuality",
        "Blaming self ('I should have fought back')"
      ]
    }
  },

  // NEW: CATEGORY 5C: WITNESSED VIOLENCE/DEATH
  {
    id: 'witnessed_violence',
    name: 'Witnessed Violence or Death',
    priority: 'urgent',
    triggerPhrases: {
      direct: [
        "i saw someone die",
        "i watched someone get killed",
        "i witnessed a murder",
        "i saw them get shot",
        "i saw the shooting",
        "i was there when they died",
        "i held them while they died",
        "i tried to stop the bleeding",
        "i found the body",
        "i saw the accident",
        "i watched them take their last breath"
      ],
      indirect: [
        "i was there when it happened",
        "i couldn't save them",
        "i should have done something",
        "i keep seeing it",
        "i can't get the image out of my head",
        "the blood",
        "i hear the gunshots",
        "i see it when i close my eyes"
      ],
      emotional: [
        "i feel guilty i survived",
        "why am i alive and they're not",
        "i should have been able to stop it",
        "i feel responsible",
        "i was helpless",
        "i couldn't do anything"
      ]
    },
    kbReferences: {
      primary: 'trauma_ptsd',
      supporting: [
        'cultural_considerations',
        'depression',
        'trauma_response_protocol'
      ]
    },
    responseStrategy: {
      validate: [
        "Witnessing violence puts you in an impossible position—you see something terrible but can't stop it",
        "That helplessness is its own kind of trauma",
        "You being there doesn't make you responsible for what happened",
        "The person who committed the violence is responsible, not you",
        "Survivor's guilt is a cruel part of trauma—but your survival doesn't require justification"
      ],
      context: [
        "Explain witness trauma as distinct form of trauma",
        "Address visual flashbacks and intrusive memories",
        "Normalize survivor's guilt",
        "Explain why brain replays the scene",
        "Validate powerlessness in that moment"
      ],
      actions: [
        "Offer grounding if experiencing flashback right now",
        "Recommend EMDR specifically for visual trauma",
        "Address survivor's guilt directly",
        "Help separate 'being there' from 'being responsible'",
        "If community violence: acknowledge ongoing threat/chronic exposure"
      ],
      redFlags: [
        "Multiple losses (chronic community violence)",
        "Recent event (within days) → May need crisis support",
        "Avoiding all reminders of the person/place",
        "Substance use to avoid memories",
        "Suicidal ideation ('should have been me')",
        "Severe dissociation when triggered"
      ]
    }
  },

  // ===== END NEW TRAUMA CATEGORIES =====

  // CATEGORY 5D (ORIGINAL): TRAUMA & PTSD (General - keeping for backward compatibility)
  {
    id: 'trauma_ptsd',
    name: 'Trauma & PTSD',
    priority: 'urgent',
    triggerPhrases: {
      direct: [
        "i can't get over what happened",
        "i keep having nightmares",
        "i have flashbacks",
        "i can't stop thinking about it",
        "i feel like it's happening again",
        "i don't feel safe",
        "i'm broken",
        "i'm damaged",
        "i should have done something different",
        "trauma",
        "ptsd",
        "assault",
        "abuse"
      ],
      indirect: [
        "i saw things overseas",
        "things happened when i was a kid",
        "i was attacked",
        "i witnessed",
        "something happened to me",
        "i was in a bad crash",
        "i watched someone die",
        "i can't go near",
        "i avoid anything that reminds me",
        "i stay busy so i don't remember",
        "certain sounds make me panic",
        "certain smells make me panic"
      ],
      emotional: [
        "i can't relax",
        "i'm always scanning for danger",
        "i need to sit with my back to the wall",
        "i startle easily",
        "i don't trust anyone",
        "i'm always waiting for something bad",
        "i don't feel anything anymore",
        "i'm detached from everything",
        "i can't connect with people",
        "watching my life from outside"
      ]
    },
    kbReferences: {
      primary: 'trauma',
      supporting: ['racial_trauma', 'resilience', 'substance_use']
    },
    responseStrategy: {
      validate: [
        "What you're experiencing are normal reactions to abnormal events",
        "Trauma isn't weakness—it's an injury that needs treatment",
        "You don't have to 'tough it out.' That actually makes it worse"
      ],
      context: [
        "Explain why nervous system stays activated",
        "Flashbacks and nightmares are brain trying to process",
        "Avoidance makes sense but prolongs suffering"
      ],
      actions: [
        "Grounding techniques for flashbacks",
        "Creating safe spaces",
        "Building support network",
        "Consider EMDR, Trauma-Focused CBT",
        "Needs specialized trauma therapist"
      ],
      redFlags: [
        "Suicidal ideation",
        "Severe dissociation",
        "Dangerous risk-taking",
        "Violence toward self or others"
      ]
    }
  },

  // CATEGORY 6: SUBSTANCE USE & ADDICTION
  {
    id: 'substance_use',
    name: 'Substance Use & Addiction',
    priority: 'urgent',
    triggerPhrases: {
      direct: [
        "i probably drink too much",
        "everyone says i party too hard",
        "i need it to relax",
        "it's the only thing that helps",
        "i can stop whenever i want",
        "it's not that bad",
        "i think i have a problem",
        "i can't control my use",
        "i tried to quit but couldn't",
        "i need to get clean",
        "i'm scared of withdrawal",
        "i slipped up",
        "i used again",
        "drinking",
        "drugs",
        "using",
        "addiction",
        "addicted"
      ],
      indirect: [
        "it's affecting my life",
        "i'm hiding it from people",
        "i need more to get the same effect",
        "i wake up needing it",
        "my dad was an alcoholic",
        "addiction runs in my family",
        "i don't want to be like my dad",
        "i keep going back",
        "i'm a failure",
        "why can't i just stop"
      ]
    },
    kbReferences: {
      primary: 'substance_use',
      supporting: ['depression', 'anxiety', 'trauma', 'therapy']
    },
    responseStrategy: {
      validate: [
        "Addiction is a disease, not a moral failing",
        "Many men use substances to cope with pain",
        "Professional help gives you the best chance"
      ],
      context: [
        "Meet them where they are (pre-contemplation to action)",
        "Explain stages of change",
        "Normalize struggle without enabling"
      ],
      actions: [
        "Assess severity (what, how much, withdrawal, impact)",
        "Treatment levels (outpatient to inpatient)",
        "Harm reduction if not ready to quit",
        "AA/NA meetings, SMART Recovery",
        "Celebrate any progress"
      ],
      redFlags: [
        "Overdose risk → CRISIS",
        "Severe withdrawal → medical emergency",
        "Using alone with opioids"
      ]
    }
  },

  // CATEGORY 7: RELATIONSHIP STRUGGLES
  {
    id: 'relationships',
    name: 'Relationship Struggles',
    priority: 'moderate',
    triggerPhrases: {
      direct: [
        "i can't open up to my partner",
        "she says i'm emotionally unavailable",
        "i don't know how to be vulnerable",
        "we don't connect anymore",
        "we just argue all the time",
        "she doesn't understand me",
        "i shut down when we fight",
        "i can't express my feelings",
        "i can't trust anyone",
        "i've been hurt before",
        "she left me",
        "i'm going through a divorce",
        "relationship",
        "partner",
        "girlfriend",
        "wife",
        "breakup"
      ],
      indirect: [
        "i'm afraid of getting close",
        "i keep people at arm's length",
        "i'm waiting for them to leave",
        "i push people away",
        "i lost the love of my life",
        "i can't move on",
        "i'm better off alone",
        "i'll never love again"
      ],
      emotional: [
        "performance issues",
        "not interested in sex anymore",
        "porn is affecting my real relationships",
        "cheating",
        "infidelity",
        "betrayed",
        "trust issues"
      ]
    },
    kbReferences: {
      primary: 'relationships',
      supporting: ['anger', 'isolation_loneliness', 'trauma']
    },
    responseStrategy: {
      validate: [
        "Men aren't taught emotional language—this struggle makes sense",
        "Vulnerability isn't weakness",
        "Relationship pain is real pain"
      ],
      context: [
        "Explain difference between vulnerability and weakness",
        "Discuss fear of vulnerability being weaponized",
        "Communication frameworks"
      ],
      actions: [
        "Teach active listening skills",
        "Explain defensive patterns",
        "Suggest couples therapy if pattern is entrenched",
        "Timeout strategies during conflict",
        "For breakup: validate grief, discourage rebound"
      ],
      redFlags: [
        "Relationship violence → address immediately",
        "Breakup causing suicidal thoughts → CRISIS"
      ]
    }
  },

  // CATEGORY 8: WORK STRESS & IDENTITY CRISIS
  {
    id: 'work_identity',
    name: 'Work Stress & Identity Crisis',
    priority: 'moderate',
    triggerPhrases: {
      direct: [
        "i'm exhausted all the time",
        "i hate my job",
        "i can't keep doing this",
        "work is killing me",
        "i'm running on empty",
        "i dread monday",
        "i don't care anymore",
        "i don't know who i am without my job",
        "i feel like a failure",
        "i'm not living up to my potential",
        "i've lost my purpose",
        "i'm just a paycheck",
        "burnout",
        "burned out",
        "work stress"
      ],
      indirect: [
        "i got laid off",
        "i lost my job",
        "i'm unemployed",
        "i don't know what to do next",
        "i feel worthless without a job",
        "i can't provide for my family",
        "i have to be successful",
        "i'm the breadwinner",
        "everyone's counting on me",
        "i'm stuck in the wrong career",
        "i want to do something meaningful",
        "it's too late to change"
      ]
    },
    kbReferences: {
      primary: 'burnout',
      supporting: ['depression', 'anxiety', 'identity_crisis']
    },
    responseStrategy: {
      validate: [
        "Burnout is not weakness, it's exhaustion",
        "You are not your job title",
        "Your worth isn't determined by productivity"
      ],
      context: [
        "Address worth beyond work",
        "Build multifaceted identity",
        "Purpose doesn't have to come from career"
      ],
      actions: [
        "Set boundaries, take time off if possible",
        "Assess if job is sustainable",
        "Explore values and what matters",
        "Career counseling resources"
      ],
      redFlags: [
        "'I'm a burden' or suicidal ideation → CRISIS",
        "Substance use to cope with work stress"
      ]
    }
  },

  // CATEGORY 9: SUICIDAL IDEATION (CRISIS)
  {
    id: 'suicidal_ideation',
    name: 'Suicidal Ideation',
    priority: 'crisis',
    triggerPhrases: {
      direct: [
        "i want to die",
        "i want to kill myself",
        "i'm going to end it",
        "i have a plan",
        "i bought a gun",
        "i have pills",
        "this is goodbye",
        "i'm done with life",
        "i can't do this anymore",
        "suicide",
        "kill myself",
        "end my life"
      ],
      indirect: [
        "everyone would be better off without me",
        "i'm a burden",
        "there's no point in going on",
        "the pain won't stop",
        "i'm tired of fighting",
        "i want the pain to end",
        "i can't see a way out",
        "nothing will ever get better",
        "i just want it all to stop",
        "i wish i could disappear",
        "nobody would care if i was gone"
      ],
      behavioral: [
        "giving away possessions",
        "saying goodbye to people",
        "researching methods",
        "getting affairs in order",
        "sudden calmness after depression"
      ]
    },
    kbReferences: {
      primary: 'crisis_resources',
      supporting: ['suicide_warning_signs', 'safety_plan']
    },
    responseStrategy: {
      validate: [
        "I'm really glad you told me this",
        "You're not alone, and I want to help you",
        "These feelings are temporary even though they feel permanent",
        "Your life matters and there is hope"
      ],
      context: [
        "Assess imminent risk",
        "Ask directly about suicidal thoughts",
        "Check for plan, means, timeframe"
      ],
      actions: [
        "988 Suicide & Crisis Lifeline",
        "Crisis Text Line: Text HELLO to 741741",
        "Veterans Crisis Line: 988 then press 1",
        "Emergency Services: 911 if immediate danger",
        "Remove access to lethal means",
        "Never leave them alone"
      ],
      redFlags: [
        "Specific plan",
        "Access to lethal means",
        "Timeframe mentioned",
        "Previous attempt",
        "Intoxicated",
        "Alone"
      ]
    }
  },

  // CATEGORY 10: ASKING FOR HELP / THERAPY QUESTIONS
  {
    id: 'seeking_help',
    name: 'Asking for Help / Therapy Questions',
    priority: 'supportive',
    triggerPhrases: {
      direct: [
        "should i see a therapist",
        "do i need professional help",
        "is this serious enough for therapy",
        "i don't think therapy is for me",
        "therapy is for weak people",
        "will talking really help",
        "i don't want to be on medication",
        "how do i find a therapist",
        "what kind of therapist do i need",
        "what happens in therapy",
        "therapist",
        "therapy",
        "counselor",
        "help"
      ],
      indirect: [
        "i can't afford therapy",
        "i don't have time",
        "what if someone finds out",
        "i should be able to handle this myself",
        "real men don't need therapy",
        "i don't want to burden anyone",
        "i tried therapy before and it didn't work",
        "the therapist didn't get me",
        "i felt judged"
      ]
    },
    kbReferences: {
      primary: 'therapy',
      supporting: ['cultural_affirming_care', 'therapy_barriers', 'finding_therapist']
    },
    responseStrategy: {
      validate: [
        "Asking for help is strength, not weakness",
        "Therapy is skill-building, not just venting",
        "You don't have to be 'broken' to benefit"
      ],
      context: [
        "Explain what therapy actually is",
        "Describe different types and approaches",
        "Clarify confidentiality protections"
      ],
      actions: [
        "Address specific barriers (cost, time, privacy)",
        "Provide directories (Psychology Today, Therapy for Black Girls)",
        "Suggest sliding scale or community health centers",
        "Online therapy options"
      ],
      redFlags: [
        "If avoiding help due to crisis → address crisis first"
      ]
    }
  },

  // CATEGORY 11: RACIAL TRAUMA & DISCRIMINATION
  {
    id: 'racial_trauma',
    name: 'Racial Trauma & Discrimination',
    priority: 'moderate',
    triggerPhrases: {
      direct: [
        "i was racially profiled",
        "i get followed in stores",
        "i was pulled over for nothing",
        "they assumed i was the help",
        "they assumed i was criminal",
        "i'm exhausted from racism",
        "i have to code-switch constantly",
        "racism",
        "discrimination",
        "profiled",
        "microaggression"
      ],
      indirect: [
        "i have to work twice as hard for half the credit",
        "i was passed over for promotion again",
        "they hired a less qualified white guy",
        "i'm the only black person in the room",
        "i can't escape it",
        "the system is rigged against us",
        "they keep touching my hair",
        "people ask where i'm really from",
        "they act surprised i'm articulate",
        "i'm expected to speak for my entire race"
      ],
      emotional: [
        "another police shooting",
        "i can't watch the news anymore",
        "i'm scared for my son",
        "i'm angry all the time",
        "how many more times",
        "i'm traumatized watching this",
        "my ancestors went through worse",
        "generational trauma"
      ]
    },
    kbReferences: {
      primary: 'racial_trauma',
      supporting: ['trauma', 'anger', 'isolation_loneliness', 'resilience']
    },
    responseStrategy: {
      validate: [
        "What you're experiencing is real and it's wrong",
        "Racial trauma is real trauma with real impacts",
        "Your anger makes complete sense",
        "You're not imagining it or being oversensitive"
      ],
      context: [
        "Explain racial trauma as distinct form of trauma",
        "Acknowledge cumulative nature (death by a thousand cuts)",
        "Recognize vicarious trauma from news/social media"
      ],
      actions: [
        "Limit news consumption if overwhelming",
        "Grounding techniques when triggered",
        "Connect with community who understands",
        "Therapy with culturally competent therapist",
        "Build spaces where you can fully be yourself"
      ],
      redFlags: [
        "Combined with suicidal ideation → CRISIS",
        "Severe isolation from all support"
      ]
    }
  },

  // CATEGORY 12: PHYSICAL HEALTH CONCERNS
  {
    id: 'physical_health',
    name: 'Physical Health Concerns',
    priority: 'moderate',
    triggerPhrases: {
      direct: [
        "i'm exhausted all the time",
        "i have no energy",
        "i'm tired but can't sleep",
        "everything hurts",
        "constant headaches",
        "chest tightness",
        "chest pain",
        "stomach problems",
        "i can't get it up",
        "my sex drive is gone",
        "performance issues",
        "i can't fall asleep",
        "i wake up constantly",
        "i'm sleeping too much"
      ],
      indirect: [
        "i've lost a lot of weight",
        "i've gained a lot of weight",
        "nothing tastes good",
        "i'm eating constantly",
        "i forget to eat",
        "i can't stop eating",
        "i have no appetite",
        "i snore really loud",
        "i wake up gasping"
      ]
    },
    kbReferences: {
      primary: 'mind_body',
      supporting: ['depression', 'anxiety', 'sleep_mental_health', 'exercise_mental_health']
    },
    responseStrategy: {
      validate: [
        "Mental health and physical health are inseparable",
        "Physical symptoms from stress are real",
        "Taking care of your body is taking care of your mind"
      ],
      context: [
        "Depression often shows up as physical symptoms",
        "Anxiety creates real physical sensations",
        "Chronic stress damages the body"
      ],
      actions: [
        "Recommend medical checkup",
        "Address sleep hygiene",
        "Exercise increases energy",
        "Sexual dysfunction is treatable—see doctor"
      ],
      redFlags: [
        "Chest pain → medical emergency",
        "Sudden severe headache → see doctor immediately"
      ]
    }
  },

  // CATEGORY 13: SPIRITUALITY & FAITH QUESTIONS
  {
    id: 'spirituality',
    name: 'Spirituality & Faith Questions',
    priority: 'supportive',
    triggerPhrases: {
      direct: [
        "i've lost my faith",
        "i'm angry at god",
        "where is god in all this",
        "why is this happening to me",
        "i don't feel god anymore",
        "my pastor says i just need more faith",
        "is therapy against my religion",
        "medication feels like i'm not trusting god",
        "my church says depression is a sin",
        "i'm supposed to pray it away",
        "faith",
        "god",
        "pray",
        "church",
        "spiritual"
      ],
      indirect: [
        "what's the point of it all",
        "nothing has meaning anymore",
        "i feel spiritually empty",
        "dark night of the soul",
        "can i pray and get therapy",
        "i need spiritual support"
      ]
    },
    kbReferences: {
      primary: 'spirituality',
      supporting: ['purpose', 'cultural_challenges', 'therapy']
    },
    responseStrategy: {
      validate: [
        "Faith and mental health care work together, not against each other",
        "Even strong believers have doubts and anger",
        "It's okay to be angry at God"
      ],
      context: [
        "Address toxic religious teachings",
        "Depression is not lack of faith",
        "Mental illness is not sin or spiritual weakness"
      ],
      actions: [
        "Find faith leaders who are mental health literate",
        "Therapy with faith-based counselor if desired",
        "Prayer as complement to treatment",
        "Explore meaning and purpose"
      ],
      redFlags: [
        "Existential crisis with suicidal ideation → CRISIS"
      ]
    }
  },

  // CATEGORY 14: GENERAL WELLBEING & SELF-IMPROVEMENT
  {
    id: 'wellbeing',
    name: 'General Wellbeing & Self-Improvement',
    priority: 'supportive',
    triggerPhrases: {
      direct: [
        "i want to be better",
        "how do i improve myself",
        "i want to be healthier",
        "i'm ready to make changes",
        "how do i build good habits",
        "i want to be a better man",
        "how do i avoid burnout",
        "i want to stay mentally healthy",
        "what are good habits for mental health",
        "how do i build resilience",
        "self-improvement",
        "better myself",
        "growth"
      ],
      indirect: [
        "how do i manage stress",
        "i need to communicate better",
        "i want to be more emotionally intelligent",
        "how do i set boundaries",
        "i need better coping strategies",
        "i'm becoming a father",
        "i just retired",
        "i'm getting married",
        "i'm moving to a new city"
      ]
    },
    kbReferences: {
      primary: 'resilience',
      supporting: ['daily_resilience', 'mental_health_toolkit', 'mind_body']
    },
    responseStrategy: {
      validate: [
        "The fact that you're being proactive is huge",
        "Preventive mental health care is wise",
        "You're investing in yourself"
      ],
      context: [
        "Build comprehensive toolkit",
        "Balance physical, emotional, mental, social, spiritual",
        "Resilience is adapting over time, not never struggling"
      ],
      actions: [
        "Exercise routine",
        "Sleep hygiene",
        "Mindfulness/meditation",
        "Maintain friendships",
        "Set meaningful goals"
      ],
      redFlags: [
        "If positive talk masking deeper issues, explore gently"
      ]
    }
  }
];

// ==================== INTENT DETECTION ====================

export interface DetectedIntent {
  category: IntentCategory;
  confidence: number;
  matchedPhrases: string[];
  priority: PriorityLevel;
}

/**
 * Helper function to detect trauma disclosures specifically
 */
export function detectTraumaDisclosure(message: string): boolean {
  const traumaCategories = intentCategories.filter(cat => 
    cat.id === 'trauma_disclosure' || 
    cat.id === 'sexual_trauma' || 
    cat.id === 'witnessed_violence'
  );
  
  const lowerMessage = message.toLowerCase();
  
  for (const category of traumaCategories) {
    const allPhrases = [
      ...category.triggerPhrases.direct,
      ...category.triggerPhrases.indirect,
      ...(category.triggerPhrases.emotional || []),
      ...(category.triggerPhrases.physical || []),
      ...(category.triggerPhrases.behavioral || [])
    ];
    
    for (const phrase of allPhrases) {
      if (lowerMessage.includes(phrase.toLowerCase())) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Detect user intent from message
 */
export function detectIntent(message: string): DetectedIntent[] {
  const lowerMessage = message.toLowerCase();
  const detectedIntents: DetectedIntent[] = [];

  // CHECK FOR TRAUMA FIRST - High priority detection
  if (detectTraumaDisclosure(message)) {
    const traumaIntents = intentCategories.filter(cat => 
      cat.id === 'trauma_disclosure' || 
      cat.id === 'sexual_trauma' || 
      cat.id === 'witnessed_violence'
    );
    
    for (const intent of traumaIntents) {
      const allPhrases = [
        ...intent.triggerPhrases.direct,
        ...intent.triggerPhrases.indirect,
        ...(intent.triggerPhrases.emotional || []),
        ...(intent.triggerPhrases.physical || []),
        ...(intent.triggerPhrases.behavioral || [])
      ];
      
      const matchedPhrases = allPhrases.filter(phrase => 
        lowerMessage.includes(phrase.toLowerCase())
      );
      
      if (matchedPhrases.length > 0) {
        detectedIntents.push({
          category: intent,
          confidence: 0.95, // High confidence for trauma disclosure
          matchedPhrases: matchedPhrases,
          priority: intent.priority
        });
      }
    }
  }

  // Continue with regular detection for all categories
  for (const category of intentCategories) {
    // Skip trauma categories if already detected above
    if (category.id === 'trauma_disclosure' || 
        category.id === 'sexual_trauma' || 
        category.id === 'witnessed_violence') {
      continue;
    }

    const matchedPhrases: string[] = [];
    let matchCount = 0;

    // Check all phrase types
    const allPhrases = [
      ...(category.triggerPhrases.direct || []),
      ...(category.triggerPhrases.indirect || []),
      ...(category.triggerPhrases.emotional || []),
      ...(category.triggerPhrases.physical || []),
      ...(category.triggerPhrases.behavioral || [])
    ];

    for (const phrase of allPhrases) {
      if (lowerMessage.includes(phrase)) {
        matchedPhrases.push(phrase);
        matchCount++;
      }
    }

    if (matchCount > 0) {
      // Calculate confidence based on matches
      const directMatches = (category.triggerPhrases.direct || [])
        .filter(p => lowerMessage.includes(p)).length;
      
      // Direct phrases have higher weight
      const confidence = Math.min(1, (directMatches * 0.3 + matchCount * 0.1));

      detectedIntents.push({
        category,
        confidence,
        matchedPhrases,
        priority: category.priority
      });
    }
  }

  // Sort by priority (crisis first) and confidence
  const priorityOrder: { [key in PriorityLevel]: number } = {
    'crisis': 4,
    'urgent': 3,
    'moderate': 2,
    'supportive': 1
  };

  return detectedIntents.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
}

/**
 * Get response strategy based on detected intents
 */
export function getResponseStrategy(intents: DetectedIntent[]): {
  primaryIntent: IntentCategory | null;
  supportingIntents: IntentCategory[];
  kbSections: string[];
  responseGuidelines: string[];
  priorityLevel: PriorityLevel;
} {
  if (intents.length === 0) {
    return {
      primaryIntent: null,
      supportingIntents: [],
      kbSections: [],
      responseGuidelines: [],
      priorityLevel: 'supportive'
    };
  }

  const primaryIntent = intents[0].category;
  const supportingIntents = intents.slice(1, 3).map(i => i.category);

  // Collect KB sections
  const kbSections = [
    primaryIntent.kbReferences.primary,
    ...primaryIntent.kbReferences.supporting,
    ...supportingIntents.flatMap(i => [i.kbReferences.primary, ...i.kbReferences.supporting])
  ];

  // Build response guidelines
  const responseGuidelines = [
    ...primaryIntent.responseStrategy.validate,
    ...primaryIntent.responseStrategy.actions.slice(0, 2)
  ];

  return {
    primaryIntent,
    supportingIntents,
    kbSections: [...new Set(kbSections)], // Remove duplicates
    responseGuidelines,
    priorityLevel: intents[0].priority
  };
}

// ==================== AMANI TONE GUIDELINES ====================

export const amaniToneGuidelines = {
  voice: {
    characteristics: [
      "Warm but real (not overly soft)",
      "Direct and clear",
      "Culturally attuned",
      "Non-judgmental",
      "Action-oriented",
      "Hopeful but realistic"
    ],
    languageStyle: [
      "Conversational, not clinical",
      "'Man-to-man' feel",
      "Uses 'I' statements when appropriate",
      "Avoids jargon",
      "Concrete examples",
      "Accessible analogies"
    ]
  },
  balance: [
    "Validation AND accountability",
    "Empathy AND solutions",
    "Understanding AND challenge",
    "Support AND growth"
  ],
  culturalConsiderations: [
    "'Brother' when appropriate",
    "Acknowledge the weight carried",
    "Honor cultural strength",
    "Validate racial realities",
    "Connect to community",
    "Respect spiritual roots"
  ],
  responseFramework: {
    opening: [
      "Validate: 'What you're going through is real, and it makes sense you're struggling with this.'",
      "Normalize: 'Many men face this, especially [demographic context]. You're not alone.'",
      "Strength reframe: 'Reaching out and talking about this takes real strength.'"
    ],
    middle: [
      "Education: Explain what they're experiencing and why",
      "Validation: Reflect back what they've shared",
      "Options: Provide 2-3 actionable next steps",
      "Resources: Specific tools, practices, or referrals"
    ],
    closing: [
      "Empowerment: 'You have more control over this than it might feel like right now.'",
      "Next steps: Clear, achievable action items",
      "Check-in: 'How does this land with you?'",
      "Support: 'I'm here to support you through this'"
    ]
  }
};

// ==================== CRISIS PROTOCOL ====================

export const crisisProtocol = {
  immediateActions: [
    "Assess imminent risk",
    "Ask directly: 'Are you thinking about suicide right now?'",
    "Check for plan, means, timeframe",
    "NEVER leave them alone"
  ],
  highRiskIndicators: [
    "Specific plan",
    "Access to lethal means",
    "Timeframe mentioned",
    "Previous attempt",
    "Intoxicated",
    "Alone",
    "Recent significant loss",
    "Giving away possessions"
  ],
  resources: {
    primary: [
      { name: "988 Suicide & Crisis Lifeline", contact: "Call or text 988" },
      { name: "Crisis Text Line", contact: "Text HELLO to 741741" },
      { name: "Veterans Crisis Line", contact: "988 then press 1" },
      { name: "Emergency Services", contact: "911" }
    ],
    additional: [
      { name: "SAMHSA National Helpline", contact: "1-800-662-4357" },
      { name: "The Trevor Project (LGBTQ+)", contact: "1-866-488-7386" },
      { name: "Trans Lifeline", contact: "1-877-565-8860" },
      { name: "RAINN (Sexual Assault)", contact: "1-800-656-HOPE (4673)" }
    ]
  },
  whatToSay: [
    "I'm really glad you told me this",
    "You're not alone, and I want to help you",
    "These feelings are temporary even though they feel permanent",
    "Let's get you connected with someone who can help right now",
    "Your life matters and there is hope"
  ],
  whatNotToSay: [
    "You have so much to live for (feels invalidating)",
    "Think about your family (increases guilt)",
    "It's not that bad (dismissive)",
    "You're not really going to do that (minimizing)",
    "Suicide is selfish (shaming)"
  ]
};

export default {
  intentCategories,
  detectIntent,
  detectTraumaDisclosure,
  getResponseStrategy,
  amaniToneGuidelines,
  crisisProtocol
};