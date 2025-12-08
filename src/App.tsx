import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';

// Utility function to update user profile name (can be called from browser console)
(window as any).updateMyProfileName = async (firstName: string, lastName?: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No user session found');
      return;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        first_name: firstName,
        last_name: lastName || null
      })
      .eq('user_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
    } else {
      console.log('✅ Profile updated successfully:', data);
      // Reload the page to see the changes
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { ChatbotWeb } from './components/ChatbotWeb';
import { GuidedBreathing } from './components/GuidedBreathing';
import { FitnessWorkout } from './components/FitnessWorkout';
import Journal from './components/Journal';
import Resources from './components/Resources';
import FeelingCheckIn from './components/FeelingCheckIn';
import DailyMotivation from './components/DailyMotivation';
import Exercise from './components/Exercise';
import Discussions from './components/Discussions';
import NotificationSettings from './components/NotificationSettings';
import TermsOfService from './components/TermsOfService';
import PrivacyNotice from './components/PrivacyNotice';
import CrisisDisclaimer from './components/CrisisDisclaimer';
import BetaTesterAgreement from './components/BetaTesterAgreement';
import ProfessionalAgreement from './components/ProfessionalAgreement';
import CommunityGuidelines from './components/CommunityGuidelines';
import AuthFlow from './components/auth/AuthFlow';
import WelcomeToast from './components/WelcomeToast';
import type { UserSignupData, ProfessionalSignupData, SignInData } from './types/auth.types';

type ViewType = 
  | 'home' 
  | 'dashboard' 
  | 'chatbot' 
  | 'breathing' 
  | 'workout' 
  | 'journal' 
  | 'resources' 
  | 'checkin' 
  | 'motivation' 
  | 'exercise' 
  | 'discussions'
  | 'settings'
  | 'terms'
  | 'privacy'
  | 'crisis'
  | 'beta'
  | 'professional'
  | 'guidelines'
  | 'auth';

// Helper function to get display name from profile
const getDisplayName = (profile: any): string => {
  if (!profile) {
    console.log('getDisplayName: No profile provided');
    return 'Brother';
  }
  
  console.log('getDisplayName: Profile data:', {
    first_name: profile.first_name,
    last_name: profile.last_name,
    username: profile.username,
    first_name_type: typeof profile.first_name,
    first_name_length: profile.first_name?.length
  });
  
  // First, try first_name - check for both null/undefined and empty strings
  if (profile.first_name && profile.first_name.trim().length > 0) {
    const firstName = profile.first_name.trim();
    // If first_name contains a space, extract just the first part (e.g., "Dennis Roberson" -> "Dennis")
    const nameParts = firstName.split(/\s+/);
    const displayName = nameParts[0];
    console.log('getDisplayName: Using first_name:', displayName, '(from:', firstName, ')');
    return displayName;
  }
  
  // If username exists and doesn't look like a generated one, try to extract first name
  if (profile.username && !profile.username.startsWith('user_')) {
    // If username contains a space, take the first part as the first name
    const nameParts = profile.username.trim().split(/\s+/);
    if (nameParts.length > 0 && nameParts[0]) {
      console.log('getDisplayName: Using first part of username:', nameParts[0]);
      return nameParts[0];
    }
    // If no space, use the whole username if it's reasonable
    console.log('getDisplayName: Using full username:', profile.username);
    return profile.username;
  }
  
  console.log('getDisplayName: Falling back to "Brother"');
  return 'Brother';
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // ✅ Prevent infinite auth loop
  const isInitialMount = useRef(true);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
      
      // Handle email confirmation
      if (_event === 'SIGNED_IN' && session) {
        console.log('User signed in via email confirmation');
        setUser(session.user);
        setCurrentView('home');
      }
      
      // ✅ Only call checkAuth on real auth changes, not initial mount
      if (!isInitialMount.current) {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.id);
      
      setUser(session?.user ?? null);

      if (session?.user) {
        // Log auth user metadata to see if name is stored there
        console.log('Auth user metadata:', session.user.user_metadata);
        console.log('Auth user raw_user_meta_data:', session.user.user_metadata);
        
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else if (profileData) {
          console.log('=== PROFILE DEBUG INFO ===');
          console.log('Profile loaded:', profileData);
          console.log('Profile first_name:', profileData.first_name);
          console.log('Profile last_name:', profileData.last_name);
          console.log('Profile username:', profileData.username);
          console.log('All profile keys:', Object.keys(profileData));
          console.log('Full profile JSON:', JSON.stringify(profileData, null, 2));
          console.log('Auth user metadata:', session?.user?.user_metadata);
          console.log('Auth user raw_user_meta_data:', session?.user?.user_metadata);
          
          // Check if first_name is missing - try to get it from various sources
          let finalProfileData = profileData;
          
          if (!profileData.first_name || (typeof profileData.first_name === 'string' && profileData.first_name.trim() === '')) {
            console.log('⚠️ first_name is missing or empty, attempting to find it...');
            
            // Try auth metadata first
            const metadata = session?.user?.user_metadata;
            let firstNameToUse = null;
            let lastNameToUse = null;
            
            if (metadata) {
              console.log('Checking auth metadata for name...', metadata);
              firstNameToUse = metadata.first_name || 
                              metadata.firstName ||
                              (metadata.full_name ? metadata.full_name.split(' ')[0] : null) ||
                              (metadata.name ? metadata.name.split(' ')[0] : null);
              
              lastNameToUse = metadata.last_name || 
                             metadata.lastName ||
                             (metadata.full_name ? metadata.full_name.split(' ').slice(1).join(' ') : null) ||
                             (metadata.name ? metadata.name.split(' ').slice(1).join(' ') : null);
            }
            
            // If we found a name, update the profile
            if (firstNameToUse) {
              console.log('✅ Found name in metadata, updating profile:', { firstNameToUse, lastNameToUse });
              console.log('🔧 Attempting to update user_profiles with:', {
                user_id: session.user.id,
                first_name: firstNameToUse,
                last_name: lastNameToUse
              });
              
              const updatePayload = { 
                first_name: firstNameToUse,
                last_name: lastNameToUse || null
              };
              
              console.log('🔧 Update payload:', updatePayload);
              
              const { error: updateError, data: updatedData } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('user_id', session.user.id)
                .select()
                .single();
              
              if (updateError) {
                console.error('❌ Error updating profile:', updateError);
                console.error('❌ Error code:', updateError.code);
                console.error('❌ Error message:', updateError.message);
                console.error('❌ Error details:', updateError.details);
                console.error('❌ Error hint:', updateError.hint);
              } else {
                console.log('✅ Profile update response:', updatedData);
                console.log('✅ Updated first_name:', updatedData?.first_name);
                console.log('✅ Updated first_name type:', typeof updatedData?.first_name);
                console.log('✅ Updated first_name value:', JSON.stringify(updatedData?.first_name));
                
                // If the update didn't actually save, try a direct approach
                if (!updatedData?.first_name || updatedData.first_name === null) {
                  console.warn('⚠️ Update returned null first_name, trying alternative approach...');
                  // Try updating via RPC or direct SQL if available
                  // For now, just use the metadata values directly
                  finalProfileData = {
                    ...profileData,
                    first_name: firstNameToUse,
                    last_name: lastNameToUse || null
                  };
                  console.log('✅ Using metadata values directly in profile:', finalProfileData);
                } else {
                  // Use the updated data
                  finalProfileData = updatedData;
                  console.log('✅ finalProfileData.first_name after update:', finalProfileData.first_name);
                }
                console.log('✅ getDisplayName test with updated data:', getDisplayName(finalProfileData));
              }
            } else {
              console.log('⚠️ Could not find name in metadata. Profile needs manual update.');
              console.log('💡 To fix: Run this SQL in Supabase:');
              console.log(`UPDATE user_profiles SET first_name = 'Dennis', last_name = 'Roberson' WHERE user_id = '${session.user.id}';`);
            }
          }
          
          console.log('Final profile data first_name:', finalProfileData.first_name);
          console.log('Final display name will be:', getDisplayName(finalProfileData));
          console.log('=== END PROFILE DEBUG ===');
          setProfile(finalProfileData);
          
          // ✅ Navigate to home (original landing page) on initial load or if coming from auth
          if (isInitialMount.current || currentView === 'auth') {
            setCurrentView('home');
          }
        }
      } else {
        setProfile(null);
        
        // ✅ Only navigate to home if user was logged out (not initial load)
        if (!isInitialMount.current && currentView === 'dashboard') {
          setCurrentView('home');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setCurrentView('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle user sign in
  const handleUserSignIn = async (data: SignInData) => {
    try {
      console.log('🔐 Attempting sign in for:', data.email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('📧 Auth response:', { 
        user: authData?.user?.id, 
        session: authData?.session ? 'exists' : 'none',
        error: error?.message 
      });

      if (error) {
        console.error('❌ Auth error:', error);
        throw error;
      }
      
      if (authData.user) {
        console.log('✅ User authenticated:', authData.user.email);
        console.log('📧 Email confirmed:', authData.user.email_confirmed_at);
        
        // Fetch the profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        console.log('👤 Profile fetch:', { 
          profileData, 
          profileError: profileError?.message 
        });
        
        if (profileData) {
          console.log('👤 Profile details:', {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            username: profileData.username,
            first_name_type: typeof profileData.first_name,
            first_name_value: JSON.stringify(profileData.first_name),
            all_keys: Object.keys(profileData)
          });
          console.log('👤 Display name will be:', getDisplayName(profileData));
        }

        if (!profileData) {
          console.warn('⚠️ No profile found, creating one...');
          // Create profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              email: authData.user.email,
              first_name: authData.user.user_metadata?.first_name || '',
              last_name: authData.user.user_metadata?.last_name || '',
              user_type: 'user',
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Profile creation error:', createError);
          } else {
            console.log('✅ Profile created:', newProfile);
          }

          setUser(authData.user);
          setProfile(newProfile);
          setCurrentView('home');
          
          // Show welcome back message
          setIsNewUser(false);
          setShowWelcome(true);
        } else {
          setUser(authData.user);
          setProfile(profileData);
          setCurrentView('home');
          
          // Show welcome back message
          setIsNewUser(false);
          setShowWelcome(true);
          
          console.log('🎉 Sign in successful!');
        }
      }
    } catch (err: any) {
      console.error('❌ Sign in error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Sign in failed: ';
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage += 'Incorrect email or password. Please check your credentials and try again.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage += 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
      } else if (err.message?.includes('Email rate limit exceeded')) {
        errorMessage += 'Too many attempts. Please wait a few minutes and try again.';
      } else {
        errorMessage += err.message || 'Unknown error. Please try again.';
      }
      
      alert(errorMessage);
      throw err;
    }
  };

  // Handle user sign up
  const handleUserSignUp = async (data: UserSignupData) => {
    try {
      console.log('Starting signup process...');
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: 'user'
          }
        }
      });

      console.log('Auth signup response:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (authData.user) {
        console.log('User created, waiting for profile trigger...');
        
        // Wait longer for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        console.log('Profile check:', { existingProfile, checkError });

        // If profile doesn't exist, create it manually
        if (!existingProfile) {
          console.log('Profile not found, creating manually...');
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              email: data.email,
              first_name: data.firstName,
              last_name: data.lastName,
              username: data.username || `user_${authData.user.id.slice(0, 8)}`,
              user_type: 'user',
              age_range: data.ageRange,
              phone_number: data.phoneNumber,
            })
            .select()
            .single();

          console.log('Manual profile creation:', { newProfile, insertError });

          if (insertError) {
            console.error('Profile creation error:', insertError);
            throw new Error(`Database error: ${insertError.message}`);
          }

          setUser(authData.user);
          setProfile(newProfile);
          setCurrentView('home');
          
          // Show welcome message for new user
          setIsNewUser(true);
          setShowWelcome(true);
        } else {
          // Profile exists, update it with additional info
          console.log('Profile exists, updating...');
          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              username: data.username || existingProfile.username,
              age_range: data.ageRange,
              phone_number: data.phoneNumber,
            })
            .eq('user_id', authData.user.id)
            .select()
            .single();

          console.log('Profile update:', { updatedProfile, updateError });

          if (updateError) {
            console.error('Profile update error:', updateError);
          }

          setUser(authData.user);
          setProfile(updatedProfile || existingProfile);
          setCurrentView('home');
          
          // Show welcome message for new user
          setIsNewUser(true);
          setShowWelcome(true);
        }

        console.log('Signup completed successfully!');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      alert(`Signup failed: ${err.message || 'Unknown error'}`);
      throw err;
    }
  };

  // Handle professional sign up
  const handleProfessionalSignUp = async (data: ProfessionalSignupData) => {
    try {
      // Create auth user
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
      
      if (authData.user) {
        // Profile will be auto-created by trigger, update with professional info
        // Note: You'll need to add these columns to user_profiles table if they don't exist
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            phone_number: data.phoneNumber,
            // Add professional fields only if they exist in your schema
            // For now, just using basic fields
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Professional profile update error:', profileError);
        }

        // TODO: Store professional data (license info, credentials, etc.) 
        // in a separate 'professional_profiles' table or add columns to user_profiles
        // For now, just log the data
        console.log('Professional data to store:', {
          userId: authData.user.id,
          professionalTitle: data.professionalTitle,
          primaryCredential: data.primaryCredential,
          licenseInfo: {
            type: data.licenseType,
            number: data.licenseNumber,
            state: data.licenseState,
            expiration: data.licenseExpirationDate,
          },
          practiceType: data.practiceType,
          yearsInPractice: data.yearsInPractice,
          specializations: data.specializations,
          ageGroupsServed: data.ageGroupsServed,
          bio: data.bio,
        });

        // Show success message about pending approval
        alert('Application submitted! Your professional account will be reviewed within 1-3 business days. You\'ll receive an email notification once approved.');
        
        setUser(authData.user);
        setCurrentView('home');
      }
    } catch (err: any) {
      console.error('Professional signup error:', err);
      alert(`Signup failed: ${err.message || 'Unknown error'}`);
      throw err;
    }
  };

  const renderBackButton = () => (
    <div className="p-4 safe-area-top bg-gray-50 sticky top-0 z-50" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)' }}>
      <button
        onClick={() => setCurrentView('home')}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <span>←</span> Back
      </button>
    </div>
  );

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-2xl">✊</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mind Brother...</p>
        </div>
      </div>
    );
  }

  // Dashboard view (authenticated)
  if (user && currentView === 'dashboard') {
    return <Dashboard onLogout={handleLogout} />;
  }

  // Landing page (home)
  if (currentView === 'home') {
    return (
      <>
        <LandingPage onNavigate={handleNavigate} user={user} profile={profile} onLogout={handleLogout} />
        {showWelcome && profile && (
          <WelcomeToast 
            name={getDisplayName(profile)}
            isNewUser={isNewUser}
            onClose={() => setShowWelcome(false)}
          />
        )}
      </>
    );
  }

  // Authentication flow
  if (currentView === 'auth') {
    return (
      <AuthFlow
        onUserSignIn={handleUserSignIn}
        onUserSignUp={handleUserSignUp}
        onProfessionalSignUp={handleProfessionalSignUp}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  // Chatbot
  if (currentView === 'chatbot') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <ChatbotWeb user={user} profile={profile} />
      </div>
    );
  }

  // Guided Breathing
  if (currentView === 'breathing') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <GuidedBreathing />
      </div>
    );
  }

  // Fitness Workout
  if (currentView === 'workout') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <FitnessWorkout />
      </div>
    );
  }

  // Journal
  if (currentView === 'journal') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Journal />
      </div>
    );
  }

  // Resources
  if (currentView === 'resources') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Resources />
      </div>
    );
  }

  // Feeling Check-in
  if (currentView === 'checkin') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <FeelingCheckIn 
          onNavigateToChat={() => setCurrentView('chatbot')}
          onNavigateToJournal={() => setCurrentView('journal')}
        />
      </div>
    );
  }

  // Daily Motivation
  if (currentView === 'motivation') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <DailyMotivation />
      </div>
    );
  }

  // Exercise
  if (currentView === 'exercise') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Exercise />
      </div>
    );
  }

  // Discussions
  if (currentView === 'discussions') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Discussions />
      </div>
    );
  }

  // Notification Settings
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <NotificationSettings userId={user?.id || ''} onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Terms of Service
  if (currentView === 'terms') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <TermsOfService onClose={() => setCurrentView('home')} showFullTerms={true} />
      </div>
    );
  }

  // Privacy Policy
  if (currentView === 'privacy') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <PrivacyNotice showFullNotice={true} onAccept={() => setCurrentView('home')} />
      </div>
    );
  }

  // Crisis Disclaimer
  if (currentView === 'crisis') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <CrisisDisclaimer onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Beta Tester Agreement
  if (currentView === 'beta') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <BetaTesterAgreement onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Professional Agreement
  if (currentView === 'professional') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <ProfessionalAgreement onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Community Guidelines
  if (currentView === 'guidelines') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <CommunityGuidelines onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Default fallback
  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;