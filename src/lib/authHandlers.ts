// src/lib/authHandlers.ts
// Complete Supabase authentication handlers for Mind Brother

import { supabase } from './supabase';
import type { SignInData, UserSignupData, ProfessionalSignupData } from '../types/auth.types';

// ============================================
// USER AUTHENTICATION
// ============================================

/**
 * Sign in an existing user
 */
export const handleUserSignIn = async (data: SignInData) => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });
    
    if (error) throw error;
    
    // Get user profile to verify they're a regular user
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, first_name, last_name')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }
    
    // Optional: Verify user type
    if (profile && profile.user_type === 'professional') {
      throw new Error('Professional accounts should use the professional sign-in');
    }
    
    return { user: authData.user, profile };
  } catch (error: any) {
    console.error('User sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

/**
 * Sign up a new user
 */
export const handleUserSignUp = async (data: UserSignupData) => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName
        }
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('No user data returned');
    
    // 2. Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        email: data.email,
        phone_number: data.phoneNumber || null,
        age_range: data.ageRange || null,
        user_type: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error('Failed to create user profile');
    }
    
    console.log('✅ User signup successful:', profile);
    
    return { user: authData.user, profile };
  } catch (error: any) {
    console.error('User sign up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

// ============================================
// PROFESSIONAL AUTHENTICATION
// ============================================

/**
 * Sign in an existing professional
 */
export const handleProfessionalSignIn = async (data: SignInData) => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });
    
    if (error) throw error;
    
    // Get professional profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, first_name, last_name, professional_title, verification_status')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to load profile');
    }
    
    // Verify they're actually a professional
    if (profile.user_type !== 'professional') {
      throw new Error('This account is not registered as a professional. Please use the user sign-in.');
    }
    
    return { user: authData.user, profile };
  } catch (error: any) {
    console.error('Professional sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

/**
 * Sign up a new professional with complete verification
 */
export const handleProfessionalSignUp = async (data: ProfessionalSignupData) => {
  try {
    // 1. Create auth user
    console.log('📝 Creating professional auth account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          user_type: 'professional'
        }
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('No user data returned');
    
    const userId = authData.user.id;
    console.log('✅ Auth account created:', userId);
    
    // 2. Upload documents to storage
    console.log('📤 Uploading documents...');
    let licenseUrl = '';
    let insuranceUrl = '';
    let idUrl = '';
    
    try {
      // Upload license document
      if (data.licenseDocument) {
        const licenseExt = data.licenseDocument.name.split('.').pop();
        const licensePath = `${userId}/license.${licenseExt}`;
        
        const { data: licenseData, error: licenseError } = await supabase.storage
          .from('documents')
          .upload(licensePath, data.licenseDocument, {
            upsert: true,
            contentType: data.licenseDocument.type
          });
        
        if (licenseError) {
          console.error('License upload error:', licenseError);
        } else {
          licenseUrl = licensePath;
          console.log('✅ License uploaded:', licensePath);
        }
      }
      
      // Upload insurance certificate
      if (data.insuranceCertificate) {
        const insuranceExt = data.insuranceCertificate.name.split('.').pop();
        const insurancePath = `${userId}/insurance.${insuranceExt}`;
        
        const { data: insuranceData, error: insuranceError } = await supabase.storage
          .from('documents')
          .upload(insurancePath, data.insuranceCertificate, {
            upsert: true,
            contentType: data.insuranceCertificate.type
          });
        
        if (insuranceError) {
          console.error('Insurance upload error:', insuranceError);
        } else {
          insuranceUrl = insurancePath;
          console.log('✅ Insurance certificate uploaded:', insurancePath);
        }
      }
      
      // Upload government ID
      if (data.governmentId) {
        const idExt = data.governmentId.name.split('.').pop();
        const idPath = `${userId}/government_id.${idExt}`;
        
        const { data: idData, error: idError } = await supabase.storage
          .from('documents')
          .upload(idPath, data.governmentId, {
            upsert: true,
            contentType: data.governmentId.type
          });
        
        if (idError) {
          console.error('ID upload error:', idError);
        } else {
          idUrl = idPath;
          console.log('✅ Government ID uploaded:', idPath);
        }
      }
    } catch (uploadError) {
      console.error('⚠️ Document upload error (continuing anyway):', uploadError);
      // Continue with profile creation even if uploads fail
    }
    
    // 3. Create professional profile
    console.log('👨‍⚕️ Creating professional profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        // Basic Info
        user_id: userId,
        user_type: 'professional',
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phoneNumber,
        professional_title: data.professionalTitle,
        primary_credential: data.primaryCredential,
        
        // Licensure
        license_type: data.licenseType,
        license_number: data.licenseNumber,
        license_state: data.licenseState,
        license_expiration_date: data.licenseExpirationDate,
        npi_number: data.npiNumber || null,
        
        // Practice Info
        practice_type: data.practiceType,
        years_in_practice: data.yearsInPractice,
        specialties: data.specializations,
        age_groups_served: data.ageGroupsServed,
        therapeutic_approach: data.therapeuticApproach || null,
        bio: data.bio || null,
        
        // Compliance
        has_liability_insurance: data.hasLiabilityInsurance,
        insurance_provider: data.insuranceProvider || null,
        insurance_policy_number: data.insurancePolicyNumber || null,
        insurance_expiration_date: data.insuranceExpirationDate || null,
        consented_to_background_check: data.consentedToBackgroundCheck,
        
        // Documents
        license_document_url: licenseUrl || null,
        insurance_certificate_url: insuranceUrl || null,
        government_id_url: idUrl || null,
        
        // Verification Status
        verification_status: 'pending',
        verification_submitted_at: new Date().toISOString(),
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      
      // Clean up: Delete the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(userId);
      
      throw new Error('Failed to create professional profile. Please try again.');
    }
    
    console.log('✅ Professional profile created successfully:', profile);
    
    // 4. Create verification record (this should happen via trigger, but we can verify)
    const { data: verification } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (verification) {
      console.log('✅ Verification record created:', verification);
    } else {
      console.log('⚠️ No verification record found (may be created by trigger)');
    }
    
    return { 
      user: authData.user, 
      profile,
      message: 'Application submitted successfully! We\'ll review your credentials within 1-3 business days.'
    };
  } catch (error: any) {
    console.error('❌ Professional sign up error:', error);
    throw new Error(error.message || 'Failed to create professional account');
  }
};

// ============================================
// SHARED AUTHENTICATION
// ============================================

/**
 * Sign out the current user
 */
export const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    console.log('✅ User signed out');
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

/**
 * Get the current user session
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    if (!user) return null;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return { user, profile: null };
    }
    
    return { user, profile };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Reset password
 */
export const handlePasswordReset = async (email: string) => {
  try {
    console.log('🔐 Attempting to send password reset email to:', email);
    
    // Use the current origin and point to auth page where user can reset
    // The actual reset will happen via the hash fragment in the URL
    const redirectUrl = `${window.location.origin}/auth?type=reset`;
    console.log('🔗 Redirect URL will be:', redirectUrl);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    console.log('📧 Password reset response:', { data, error });
    
    if (error) {
      console.error('❌ Password reset error:', error);
      console.error('❌ Error code:', error.status);
      console.error('❌ Error message:', error.message);
      
      // Check for specific error types
      if (error.message?.includes('rate limit') || error.status === 429) {
        throw new Error('Too many requests. Please wait a few minutes and try again.');
      }
      if (error.message?.includes('email') || error.status === 400) {
        throw new Error('Invalid email address or email not found. Please check and try again.');
      }
      
      throw error;
    }
    
    console.log('✅ Password reset email sent successfully');
    console.log('💡 Note: If you don\'t see the email, check:');
    console.log('   1. Spam/Junk folder');
    console.log('   2. Supabase Dashboard > Authentication > Email Templates');
    console.log('   3. Supabase Dashboard > Settings > Auth > Email Settings');
    
    return { 
      message: 'Password reset email sent! Please check your inbox (and spam folder). If you don\'t see it within a few minutes, check your Supabase email settings.' 
    };
  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name
    });
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to send reset email';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please wait a few minutes and try again.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid email address. Please check and try again.';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Update password (when user clicks reset link)
 */
export const handlePasswordUpdate = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    return { message: 'Password updated successfully!' };
  } catch (error: any) {
    console.error('Password update error:', error);
    throw new Error(error.message || 'Failed to update password');
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};

/**
 * Get professional verification status
 */
export const getProfessionalVerificationStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    console.error('Get verification status error:', error);
    return null;
  }
};

/**
 * Update professional profile
 */
export const updateProfessionalProfile = async (
  userId: string, 
  updates: Partial<ProfessionalSignupData>
) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};
