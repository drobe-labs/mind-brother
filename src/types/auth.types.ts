// types/auth.types.ts
// TypeScript interfaces for authentication and signup

export interface UserSignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber?: string;
  ageRange?: string;
}

export interface ProfessionalSignupData {
  // Step 1: Basic Info
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  professionalTitle: string;
  primaryCredential: string;

  // Step 2: Licensure
  licenseType: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpirationDate: string;
  npiNumber?: string;
  licenseDocument?: File;

  // Step 3: Practice Info
  practiceType: string;
  yearsInPractice: string;
  specializations: string[];
  ageGroupsServed: string[];
  therapeuticApproach?: string;
  bio?: string;

  // Step 4: Compliance
  hasLiabilityInsurance: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpirationDate?: string;
  insuranceCertificate?: File;
  governmentId?: File;
  agreedToTerms: boolean;
  agreedToEthicsCode: boolean;
  consentedToBackgroundCheck: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

// Credential options
export const CREDENTIALS = [
  'PhD',
  'PsyD',
  'LCSW',
  'LPC',
  'LMFT',
  'LMHC',
  'LPCC',
  'Licensed Psychologist',
  'Licensed Psychiatrist',
  'Other'
];

// Practice types
export const PRACTICE_TYPES = [
  'Private Practice',
  'Group Practice',
  'Community Mental Health',
  'Hospital/Medical Center',
  'University Counseling Center',
  'Telehealth Only',
  'Other'
];

// Years in practice options
export const YEARS_OPTIONS = [
  'Less than 1 year',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10-20 years',
  '20+ years'
];

// Specializations
export const SPECIALIZATIONS = [
  'Anxiety',
  'Depression',
  'Trauma/PTSD',
  'Relationship Issues',
  'Grief/Loss',
  'Stress Management',
  'Anger Management',
  'Self-Esteem',
  'Life Transitions',
  'Substance Abuse',
  'Eating Disorders',
  'OCD',
  'Bipolar Disorder',
  'ADHD',
  "Men's Issues",
  'Cultural/Racial Identity',
  'LGBTQ+ Issues',
  'Career Counseling',
  'Family Conflict',
  'Parenting'
];

// Age groups
export const AGE_GROUPS = [
  'Children (5-12)',
  'Adolescents (13-17)',
  'Young Adults (18-25)',
  'Adults (26-64)',
  'Older Adults (65+)'
];

// US States
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];






