import { useState } from 'react';
import { 
  Mail, Lock, User, Phone, Eye, EyeOff, 
  Upload, Check, AlertCircle, ArrowLeft, ArrowRight,
  Award, Briefcase, Shield, FileText
} from 'lucide-react';
import type { ProfessionalSignupData } from '../../types/auth.types';
import { 
  CREDENTIALS, PRACTICE_TYPES, YEARS_OPTIONS, 
  SPECIALIZATIONS, AGE_GROUPS, US_STATES 
} from '../../types/auth.types';

interface ProfessionalSignupProps {
  onSignUp?: (data: ProfessionalSignupData) => Promise<void>;
  onBack?: () => void;
}

export default function ProfessionalSignup({ onSignUp, onBack }: ProfessionalSignupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form data state
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
    licenseDocument: undefined,
    
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
    insuranceCertificate: undefined,
    governmentId: undefined,
    agreedToTerms: false,
    agreedToEthicsCode: false,
    consentedToBackgroundCheck: false,
  });

  // File upload handlers
  const handleFileUpload = (field: 'licenseDocument' | 'insuranceCertificate' | 'governmentId') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  // Toggle specialization
  const toggleSpecialization = (spec: string) => {
    const current = formData.specializations;
    if (current.includes(spec)) {
      setFormData({ ...formData, specializations: current.filter(s => s !== spec) });
    } else {
      setFormData({ ...formData, specializations: [...current, spec] });
    }
  };

  // Toggle age group
  const toggleAgeGroup = (group: string) => {
    const current = formData.ageGroupsServed;
    if (current.includes(group)) {
      setFormData({ ...formData, ageGroupsServed: current.filter(g => g !== group) });
    } else {
      setFormData({ ...formData, ageGroupsServed: [...current, group] });
    }
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && 
                  formData.password && formData.phoneNumber && formData.professionalTitle && 
                  formData.primaryCredential);
      case 2:
        return !!(formData.licenseType && formData.licenseNumber && formData.licenseState && 
                  formData.licenseExpirationDate && formData.licenseDocument);
      case 3:
        return !!(formData.practiceType && formData.yearsInPractice && 
                  formData.specializations.length > 0 && formData.ageGroupsServed.length > 0);
      case 4:
        return !!(formData.hasLiabilityInsurance && formData.insuranceCertificate && 
                  formData.governmentId && formData.agreedToTerms && 
                  formData.agreedToEthicsCode && formData.consentedToBackgroundCheck);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError(null);
      setCurrentStep(currentStep + 1);
    } else {
      setError('Please complete all required fields');
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Please complete all required fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (onSignUp) {
        await onSignUp(formData);
      } else {
        console.log('Professional signup submitted:', formData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Progress bar
  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step < currentStep ? 'bg-green-500 text-white' :
              step === currentStep ? 'bg-blue-500 text-white' :
              'bg-white/10 text-white/40'
            }`}>
              {step < currentStep ? <Check size={20} /> : step}
            </div>
            {step < 4 && (
              <div className={`flex-1 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-white/10'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-white/60">
        <span>Basic Info</span>
        <span>Licensure</span>
        <span>Practice</span>
        <span>Compliance</span>
      </div>
    </div>
  );

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <User className="text-blue-400" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Basic Information</h3>
          <p className="text-white/60 text-sm">Tell us about yourself</p>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="John"
            required
          />
        </div>
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="Doe"
            required
          />
        </div>
      </div>

      {/* Professional Title */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Professional Title *
        </label>
        <input
          type="text"
          value={formData.professionalTitle}
          onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          placeholder="Licensed Clinical Psychologist"
          required
        />
      </div>

      {/* Primary Credential */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Primary Credential *
        </label>
        <select
          value={formData.primaryCredential}
          onChange={(e) => setFormData({ ...formData, primaryCredential: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" className="bg-slate-800">Select credential</option>
          {CREDENTIALS.map((cred) => (
            <option key={cred} value={cred} className="bg-slate-800">{cred}</option>
          ))}
        </select>
      </div>

      {/* Email */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Phone Number *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="(555) 123-4567"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-11 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
            required
            minLength={10}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-white/40 text-xs mt-1">At least 10 characters (strong password required)</p>
      </div>
    </div>
  );

  // Step 2: Licensure Information
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
          <Award className="text-green-400" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Licensure Information</h3>
          <p className="text-white/60 text-sm">Verify your professional license</p>
        </div>
      </div>

      {/* License Type */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          License Type *
        </label>
        <input
          type="text"
          value={formData.licenseType}
          onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          placeholder="e.g., Licensed Clinical Psychologist"
          required
        />
      </div>

      {/* License Number */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          License Number *
        </label>
        <input
          type="text"
          value={formData.licenseNumber}
          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          placeholder="PSY12345"
          required
        />
      </div>

      {/* License State */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          License State *
        </label>
        <select
          value={formData.licenseState}
          onChange={(e) => setFormData({ ...formData, licenseState: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" className="bg-slate-800">Select state</option>
          {US_STATES.map((state) => (
            <option key={state} value={state} className="bg-slate-800">{state}</option>
          ))}
        </select>
      </div>

      {/* License Expiration Date */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          License Expiration Date *
        </label>
        <input
          type="date"
          value={formData.licenseExpirationDate}
          onChange={(e) => setFormData({ ...formData, licenseExpirationDate: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      {/* NPI Number (Optional) */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          NPI Number <span className="text-white/50 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.npiNumber}
          onChange={(e) => setFormData({ ...formData, npiNumber: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          placeholder="1234567890"
        />
      </div>

      {/* License Document Upload */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          License Document * <span className="text-white/50 text-xs">(PDF, JPG, PNG)</span>
        </label>
        <div className="relative">
          <input
            type="file"
            onChange={handleFileUpload('licenseDocument')}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            id="license-upload"
            required
          />
          <label
            htmlFor="license-upload"
            className="flex items-center justify-center w-full bg-white/5 border-2 border-dashed border-white/20 rounded-lg py-6 px-4 cursor-pointer hover:bg-white/10 transition-all"
          >
            <div className="text-center">
              <Upload className="mx-auto text-white/40 mb-2" size={32} />
              <p className="text-white/80 font-medium">
                {formData.licenseDocument ? formData.licenseDocument.name : 'Click to upload license'}
              </p>
              <p className="text-white/40 text-xs mt-1">
                PDF, JPG, or PNG (max 10MB)
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  // Step 3: Practice Information
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Briefcase className="text-purple-400" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Practice Information</h3>
          <p className="text-white/60 text-sm">Tell us about your practice</p>
        </div>
      </div>

      {/* Practice Type */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Practice Type *
        </label>
        <select
          value={formData.practiceType}
          onChange={(e) => setFormData({ ...formData, practiceType: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" className="bg-slate-800">Select practice type</option>
          {PRACTICE_TYPES.map((type) => (
            <option key={type} value={type} className="bg-slate-800">{type}</option>
          ))}
        </select>
      </div>

      {/* Years in Practice */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Years in Practice *
        </label>
        <select
          value={formData.yearsInPractice}
          onChange={(e) => setFormData({ ...formData, yearsInPractice: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" className="bg-slate-800">Select years</option>
          {YEARS_OPTIONS.map((years) => (
            <option key={years} value={years} className="bg-slate-800">{years}</option>
          ))}
        </select>
      </div>

      {/* Specializations */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Specializations * <span className="text-white/50 text-xs">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white/5 rounded-lg border border-white/10">
          {SPECIALIZATIONS.map((spec) => (
            <label key={spec} className="flex items-center cursor-pointer hover:bg-white/5 p-2 rounded">
              <input
                type="checkbox"
                checked={formData.specializations.includes(spec)}
                onChange={() => toggleSpecialization(spec)}
                className="mr-2"
              />
              <span className="text-white/80 text-sm">{spec}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Age Groups Served */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Age Groups Served * <span className="text-white/50 text-xs">(select all that apply)</span>
        </label>
        <div className="space-y-2">
          {AGE_GROUPS.map((group) => (
            <label key={group} className="flex items-center cursor-pointer hover:bg-white/5 p-2 rounded">
              <input
                type="checkbox"
                checked={formData.ageGroupsServed.includes(group)}
                onChange={() => toggleAgeGroup(group)}
                className="mr-2"
              />
              <span className="text-white/80 text-sm">{group}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Therapeutic Approach (Optional) */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Therapeutic Approach <span className="text-white/50 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.therapeuticApproach}
          onChange={(e) => setFormData({ ...formData, therapeuticApproach: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          placeholder="e.g., CBT, DBT, Psychodynamic"
        />
      </div>

      {/* Bio (Optional) */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Professional Bio <span className="text-white/50 text-xs">(optional - 500 chars max)</span>
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
          placeholder="Brief description of your practice and approach..."
          rows={4}
          maxLength={500}
        />
      </div>
    </div>
  );

  // Step 4: Compliance & Verification
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
          <Shield className="text-orange-400" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Compliance & Verification</h3>
          <p className="text-white/60 text-sm">Final verification documents</p>
        </div>
      </div>

      {/* Liability Insurance */}
      <div>
        <label className="flex items-center cursor-pointer hover:bg-white/5 p-3 rounded-lg">
          <input
            type="checkbox"
            checked={formData.hasLiabilityInsurance}
            onChange={(e) => setFormData({ ...formData, hasLiabilityInsurance: e.target.checked })}
            className="mr-3"
            required
          />
          <span className="text-white/80 font-medium">I have active professional liability insurance *</span>
        </label>
      </div>

      {formData.hasLiabilityInsurance && (
        <>
          {/* Insurance Provider */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Insurance Provider
            </label>
            <input
              type="text"
              value={formData.insuranceProvider}
              onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              placeholder="Provider name"
            />
          </div>

          {/* Insurance Certificate Upload */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Insurance Certificate * <span className="text-white/50 text-xs">(PDF, JPG, PNG)</span>
            </label>
            <input
              type="file"
              onChange={handleFileUpload('insuranceCertificate')}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="insurance-upload"
              required
            />
            <label
              htmlFor="insurance-upload"
              className="flex items-center justify-center w-full bg-white/5 border-2 border-dashed border-white/20 rounded-lg py-4 px-4 cursor-pointer hover:bg-white/10 transition-all"
            >
              <div className="text-center">
                <FileText className="mx-auto text-white/40 mb-2" size={24} />
                <p className="text-white/80 text-sm">
                  {formData.insuranceCertificate ? formData.insuranceCertificate.name : 'Upload insurance certificate'}
                </p>
              </div>
            </label>
          </div>
        </>
      )}

      {/* Government ID Upload */}
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Government-Issued ID * <span className="text-white/50 text-xs">(Driver's License, Passport, etc.)</span>
        </label>
        <input
          type="file"
          onChange={handleFileUpload('governmentId')}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          id="id-upload"
          required
        />
        <label
          htmlFor="id-upload"
          className="flex items-center justify-center w-full bg-white/5 border-2 border-dashed border-white/20 rounded-lg py-4 px-4 cursor-pointer hover:bg-white/10 transition-all"
        >
          <div className="text-center">
            <FileText className="mx-auto text-white/40 mb-2" size={24} />
            <p className="text-white/80 text-sm">
              {formData.governmentId ? formData.governmentId.name : 'Upload government ID'}
            </p>
          </div>
        </label>
      </div>

      {/* Terms Agreement */}
      <div className="space-y-3 border border-white/10 rounded-lg p-4 bg-white/5">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreedToTerms}
            onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
            className="mr-3 mt-1"
            required
          />
          <span className="text-white/80 text-sm">
            I agree to the <a href="#" className="text-blue-400 underline">Terms of Service</a> and <a href="#" className="text-blue-400 underline">Privacy Policy</a> *
          </span>
        </label>

        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreedToEthicsCode}
            onChange={(e) => setFormData({ ...formData, agreedToEthicsCode: e.target.checked })}
            className="mr-3 mt-1"
            required
          />
          <span className="text-white/80 text-sm">
            I agree to abide by professional ethics codes and maintain HIPAA compliance *
          </span>
        </label>

        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentedToBackgroundCheck}
            onChange={(e) => setFormData({ ...formData, consentedToBackgroundCheck: e.target.checked })}
            className="mr-3 mt-1"
            required
          />
          <span className="text-white/80 text-sm">
            I consent to a background check for verification purposes *
          </span>
        </label>
      </div>

      {/* Review Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-blue-300 text-sm font-medium mb-1">Application Review Process</p>
          <p className="text-blue-200/80 text-xs">
            Your application will be reviewed within 1-3 business days. We'll verify your license with the state board and review all submitted documents. You'll receive an email notification once your application is approved.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Professional Signup</h1>
          <p className="text-white/80">Join Mind Brother's verified provider network</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8">
          {renderProgressBar()}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Render Current Step */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all"
              >
                <ArrowLeft size={20} />
                Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
              >
                Continue
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            )}
          </div>

          {/* Back to Selector */}
          {currentStep === 1 && onBack && (
            <div className="text-center mt-4">
              <button
                onClick={onBack}
                className="text-white/60 hover:text-white/80 text-sm underline"
              >
                ← Back to signup options
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







