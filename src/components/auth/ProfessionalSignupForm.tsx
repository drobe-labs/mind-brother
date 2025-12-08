import { useState } from 'react';
import { Mail, Lock, User, Phone, Upload, CheckCircle, AlertCircle, FileText, Shield } from 'lucide-react';
import type { ProfessionalSignupData } from '../../types/auth.types';
import {
  CREDENTIALS,
  PRACTICE_TYPES,
  YEARS_OPTIONS,
  SPECIALIZATIONS,
  AGE_GROUPS,
  US_STATES
} from '../../types/auth.types';

interface ProfessionalSignupFormProps {
  onSubmit: (data: ProfessionalSignupData) => Promise<void>;
  loading: boolean;
}

export default function ProfessionalSignupForm({ onSubmit, loading }: ProfessionalSignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProfessionalSignupData>({
    // Step 1: Basic Info
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    professionalTitle: '',
    primaryCredential: '',
    
    // Step 2: Licensure
    licenseType: '',
    licenseNumber: '',
    licenseState: '',
    licenseExpirationDate: '',
    npiNumber: '',
    
    // Step 3: Practice Info
    practiceType: '',
    yearsInPractice: '',
    specializations: [],
    ageGroupsServed: [],
    therapeuticApproach: '',
    bio: '',
    
    // Step 4: Compliance
    hasLiabilityInsurance: false,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpirationDate: '',
    agreedToTerms: false,
    agreedToEthicsCode: false,
    consentedToBackgroundCheck: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (updates: Partial<ProfessionalSignupData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.professionalTitle) newErrors.professionalTitle = 'Professional title is required';
      if (!formData.primaryCredential) newErrors.primaryCredential = 'Credential is required';
    }

    if (step === 2) {
      if (!formData.licenseType) newErrors.licenseType = 'License type is required';
      if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required';
      if (!formData.licenseState) newErrors.licenseState = 'License state is required';
      if (!formData.licenseExpirationDate) newErrors.licenseExpirationDate = 'Expiration date is required';
      if (!formData.licenseDocument) newErrors.licenseDocument = 'License document is required';
    }

    if (step === 3) {
      if (!formData.practiceType) newErrors.practiceType = 'Practice type is required';
      if (!formData.yearsInPractice) newErrors.yearsInPractice = 'Years in practice is required';
      if (formData.specializations.length === 0) {
        newErrors.specializations = 'Select at least one specialization';
      }
      if (formData.ageGroupsServed.length === 0) {
        newErrors.ageGroupsServed = 'Select at least one age group';
      }
    }

    if (step === 4) {
      if (!formData.hasLiabilityInsurance) {
        newErrors.hasLiabilityInsurance = 'Liability insurance is required';
      }
      if (formData.hasLiabilityInsurance && !formData.insuranceProvider) {
        newErrors.insuranceProvider = 'Insurance provider is required';
      }
      if (!formData.insuranceCertificate) {
        newErrors.insuranceCertificate = 'Insurance certificate is required';
      }
      if (!formData.governmentId) {
        newErrors.governmentId = 'Government ID is required';
      }
      if (!formData.agreedToTerms) {
        newErrors.agreedToTerms = 'You must agree to Terms of Service';
      }
      if (!formData.agreedToEthicsCode) {
        newErrors.agreedToEthicsCode = 'You must agree to professional ethics';
      }
      if (!formData.consentedToBackgroundCheck) {
        newErrors.consentedToBackgroundCheck = 'Background check consent is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      await onSubmit(formData);
    }
  };

  const handleFileChange = (field: 'licenseDocument' | 'insuranceCertificate' | 'governmentId', file: File | undefined) => {
    updateFormData({ [field]: file });
  };

  // Progress bar
  const progress = (currentStep / 4) * 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-2">
      {/* Progress Bar */}
      <div className="space-y-2 sticky top-0 bg-slate-900/95 backdrop-blur pb-4 z-10">
        <div className="flex justify-between text-sm text-white/60">
          <span>Step {currentStep} of 4</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/40">
          <span className={currentStep >= 1 ? 'text-orange-400' : ''}>Basic</span>
          <span className={currentStep >= 2 ? 'text-orange-400' : ''}>License</span>
          <span className={currentStep >= 3 ? 'text-orange-400' : ''}>Practice</span>
          <span className={currentStep >= 4 ? 'text-orange-400' : ''}>Compliance</span>
        </div>
      </div>

      {/* STEP 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">Basic Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => updateFormData({ firstName: e.target.value })}
                  className={`w-full bg-white/5 border ${errors.firstName ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                  placeholder="John"
                />
              </div>
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
                className={`w-full bg-white/5 border ${errors.lastName ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                placeholder="Smith"
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Professional Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                className={`w-full bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                placeholder="dr.smith@practice.com"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                className={`w-full bg-white/5 border ${errors.phoneNumber ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                placeholder="(555) 123-4567"
              />
            </div>
            {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => updateFormData({ password: e.target.value })}
                className={`w-full bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                placeholder="••••••••"
              />
            </div>
            <p className="text-white/40 text-xs mt-1">At least 8 characters</p>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Professional Title *
            </label>
            <input
              type="text"
              required
              value={formData.professionalTitle}
              onChange={(e) => updateFormData({ professionalTitle: e.target.value })}
              className={`w-full bg-white/5 border ${errors.professionalTitle ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
              placeholder="e.g., Licensed Clinical Psychologist"
            />
            {errors.professionalTitle && <p className="text-red-400 text-xs mt-1">{errors.professionalTitle}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Primary Credential *
            </label>
            <select
              required
              value={formData.primaryCredential}
              onChange={(e) => updateFormData({ primaryCredential: e.target.value })}
              className={`w-full bg-white/5 border ${errors.primaryCredential ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
            >
              <option value="">Select credential</option>
              {CREDENTIALS.map(cred => (
                <option key={cred} value={cred}>{cred}</option>
              ))}
            </select>
            {errors.primaryCredential && <p className="text-red-400 text-xs mt-1">{errors.primaryCredential}</p>}
          </div>
        </div>
      )}

      {/* STEP 2: Licensure */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">Licensure Information</h3>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              License Type *
            </label>
            <input
              type="text"
              required
              value={formData.licenseType}
              onChange={(e) => updateFormData({ licenseType: e.target.value })}
              className={`w-full bg-white/5 border ${errors.licenseType ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
              placeholder="e.g., Licensed Professional Counselor"
            />
            {errors.licenseType && <p className="text-red-400 text-xs mt-1">{errors.licenseType}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              License Number *
            </label>
            <input
              type="text"
              required
              value={formData.licenseNumber}
              onChange={(e) => updateFormData({ licenseNumber: e.target.value })}
              className={`w-full bg-white/5 border ${errors.licenseNumber ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
              placeholder="e.g., PSY12345"
            />
            <p className="text-white/40 text-xs mt-1">We'll verify this with your state licensing board</p>
            {errors.licenseNumber && <p className="text-red-400 text-xs mt-1">{errors.licenseNumber}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              License State *
            </label>
            <select
              required
              value={formData.licenseState}
              onChange={(e) => updateFormData({ licenseState: e.target.value })}
              className={`w-full bg-white/5 border ${errors.licenseState ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
            >
              <option value="">Select state</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.licenseState && <p className="text-red-400 text-xs mt-1">{errors.licenseState}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              License Expiration Date *
            </label>
            <input
              type="date"
              required
              value={formData.licenseExpirationDate}
              onChange={(e) => updateFormData({ licenseExpirationDate: e.target.value })}
              className={`w-full bg-white/5 border ${errors.licenseExpirationDate ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
            />
            {errors.licenseExpirationDate && <p className="text-red-400 text-xs mt-1">{errors.licenseExpirationDate}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              NPI Number (Optional)
            </label>
            <input
              type="text"
              value={formData.npiNumber}
              onChange={(e) => updateFormData({ npiNumber: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              placeholder="10-digit NPI number"
            />
            <p className="text-white/40 text-xs mt-1">National Provider Identifier (US only)</p>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Upload Professional License *
            </label>
            <div className={`border-2 border-dashed ${errors.licenseDocument ? 'border-red-500' : 'border-white/20'} rounded-xl p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer`}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('licenseDocument', e.target.files?.[0])}
                className="hidden"
                id="license-upload"
              />
              <label htmlFor="license-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-3 text-white/40" size={32} />
                <p className="text-white/80 font-medium mb-1">
                  {formData.licenseDocument ? formData.licenseDocument.name : 'Click to upload license'}
                </p>
                <p className="text-white/40 text-xs">PDF, JPG, or PNG (max 10MB)</p>
              </label>
            </div>
            {errors.licenseDocument && <p className="text-red-400 text-xs mt-1">{errors.licenseDocument}</p>}
          </div>
        </div>
      )}

      {/* STEP 3: Practice Information */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">Practice Information</h3>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Practice Type *
            </label>
            <select
              required
              value={formData.practiceType}
              onChange={(e) => updateFormData({ practiceType: e.target.value })}
              className={`w-full bg-white/5 border ${errors.practiceType ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
            >
              <option value="">Select practice type</option>
              {PRACTICE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.practiceType && <p className="text-red-400 text-xs mt-1">{errors.practiceType}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Years in Practice *
            </label>
            <select
              required
              value={formData.yearsInPractice}
              onChange={(e) => updateFormData({ yearsInPractice: e.target.value })}
              className={`w-full bg-white/5 border ${errors.yearsInPractice ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
            >
              <option value="">Select experience level</option>
              {YEARS_OPTIONS.map(years => (
                <option key={years} value={years}>{years}</option>
              ))}
            </select>
            {errors.yearsInPractice && <p className="text-red-400 text-xs mt-1">{errors.yearsInPractice}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Specializations * (Select all that apply)
            </label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {SPECIALIZATIONS.map(spec => (
                  <label key={spec} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(spec)}
                      onChange={() => updateFormData({ 
                        specializations: toggleArrayItem(formData.specializations, spec)
                      })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                    <span className="text-white/80 text-sm">{spec}</span>
                  </label>
                ))}
              </div>
            </div>
            {errors.specializations && <p className="text-red-400 text-xs mt-1">{errors.specializations}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Age Groups Served * (Select all that apply)
            </label>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="space-y-2">
                {AGE_GROUPS.map(group => (
                  <label key={group} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.ageGroupsServed.includes(group)}
                      onChange={() => updateFormData({ 
                        ageGroupsServed: toggleArrayItem(formData.ageGroupsServed, group)
                      })}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                    <span className="text-white/80 text-sm">{group}</span>
                  </label>
                ))}
              </div>
            </div>
            {errors.ageGroupsServed && <p className="text-red-400 text-xs mt-1">{errors.ageGroupsServed}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Therapeutic Approach (Optional)
            </label>
            <input
              type="text"
              value={formData.therapeuticApproach}
              onChange={(e) => updateFormData({ therapeuticApproach: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              placeholder="e.g., Cognitive Behavioral Therapy (CBT)"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Professional Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => updateFormData({ bio: e.target.value })}
              rows={4}
              maxLength={500}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
              placeholder="Brief professional biography (500 characters max)"
            />
            <p className="text-white/40 text-xs mt-1">{formData.bio?.length || 0}/500 characters</p>
          </div>
        </div>
      )}

      {/* STEP 4: Compliance */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">Compliance & Verification</h3>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">Verification Process</p>
                <p className="text-white/70 text-xs">
                  We'll review your credentials and documents within 1-3 business days. 
                  You'll receive an email once your account is verified.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={formData.hasLiabilityInsurance}
                onChange={(e) => updateFormData({ hasLiabilityInsurance: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <div className="flex-1">
                <span className="text-white font-medium">I have professional liability insurance *</span>
                <p className="text-white/60 text-xs mt-1">Required for all professionals</p>
              </div>
            </label>
            {errors.hasLiabilityInsurance && <p className="text-red-400 text-xs mt-1">{errors.hasLiabilityInsurance}</p>}
          </div>

          {formData.hasLiabilityInsurance && (
            <>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Insurance Provider *
                </label>
                <input
                  type="text"
                  required
                  value={formData.insuranceProvider}
                  onChange={(e) => updateFormData({ insuranceProvider: e.target.value })}
                  className={`w-full bg-white/5 border ${errors.insuranceProvider ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
                  placeholder="e.g., HPSO, The Hartford"
                />
                {errors.insuranceProvider && <p className="text-red-400 text-xs mt-1">{errors.insuranceProvider}</p>}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  value={formData.insurancePolicyNumber}
                  onChange={(e) => updateFormData({ insurancePolicyNumber: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Policy number"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Insurance Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.insuranceExpirationDate}
                  onChange={(e) => updateFormData({ insuranceExpirationDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Upload Insurance Certificate *
            </label>
            <div className={`border-2 border-dashed ${errors.insuranceCertificate ? 'border-red-500' : 'border-white/20'} rounded-xl p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer`}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('insuranceCertificate', e.target.files?.[0])}
                className="hidden"
                id="insurance-upload"
              />
              <label htmlFor="insurance-upload" className="cursor-pointer">
                <FileText className="mx-auto mb-3 text-white/40" size={32} />
                <p className="text-white/80 font-medium mb-1">
                  {formData.insuranceCertificate ? formData.insuranceCertificate.name : 'Click to upload certificate'}
                </p>
                <p className="text-white/40 text-xs">PDF, JPG, or PNG (max 10MB)</p>
              </label>
            </div>
            {errors.insuranceCertificate && <p className="text-red-400 text-xs mt-1">{errors.insuranceCertificate}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Upload Government-Issued ID *
            </label>
            <div className={`border-2 border-dashed ${errors.governmentId ? 'border-red-500' : 'border-white/20'} rounded-xl p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer`}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('governmentId', e.target.files?.[0])}
                className="hidden"
                id="id-upload"
              />
              <label htmlFor="id-upload" className="cursor-pointer">
                <Shield className="mx-auto mb-3 text-white/40" size={32} />
                <p className="text-white/80 font-medium mb-1">
                  {formData.governmentId ? formData.governmentId.name : 'Click to upload ID'}
                </p>
                <p className="text-white/40 text-xs">Driver's license or passport (max 10MB)</p>
              </label>
            </div>
            {errors.governmentId && <p className="text-red-400 text-xs mt-1">{errors.governmentId}</p>}
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => updateFormData({ agreedToTerms: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500/20 mt-0.5"
              />
              <span className="text-white/80 text-sm">
                I agree to the{' '}
                <a href="/terms" className="text-orange-400 hover:underline" target="_blank">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-orange-400 hover:underline" target="_blank">
                  Privacy Policy
                </a>{' '}
                *
              </span>
            </label>
            {errors.agreedToTerms && <p className="text-red-400 text-xs">{errors.agreedToTerms}</p>}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreedToEthicsCode}
                onChange={(e) => updateFormData({ agreedToEthicsCode: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500/20 mt-0.5"
              />
              <span className="text-white/80 text-sm">
                I agree to adhere to professional ethics codes and maintain client confidentiality *
              </span>
            </label>
            {errors.agreedToEthicsCode && <p className="text-red-400 text-xs">{errors.agreedToEthicsCode}</p>}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consentedToBackgroundCheck}
                onChange={(e) => updateFormData({ consentedToBackgroundCheck: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-2 focus:ring-orange-500/20 mt-0.5"
              />
              <span className="text-white/80 text-sm">
                I consent to a background check as part of the verification process *
              </span>
            </label>
            {errors.consentedToBackgroundCheck && <p className="text-red-400 text-xs">{errors.consentedToBackgroundCheck}</p>}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur pb-2">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold transition-all"
          >
            Back
          </button>
        )}
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : (
              <>
                <CheckCircle size={20} />
                Submit Application
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

