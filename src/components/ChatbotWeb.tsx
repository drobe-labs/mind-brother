/**
 * ChatbotWeb Component
 * 
 * ⭐ CULTURAL PERSONALIZATION UPDATES:
 * ===================================
 * This component has been updated to support culturally adaptive AI responses.
 * 
 * Key Changes:
 * 1. Imports buildCulturallyAdaptiveSystemPrompt and detectAndSaveContextSignals
 * 2. Loads user's cultural preferences on mount (loadCulturalSystemPrompt)
 * 3. Passes culturalSystemPrompt to claudeEnhancedChatbot.generateResponse()
 * 4. Detects context signals from user messages for AI learning
 * 
 * How It Works:
 * - When component mounts, loads user's cultural profile from database
 * - Builds custom system prompt based on user's background, communities, preferences
 * - Each user message is analyzed for cultural context signals
 * - AI responses adapt to user's cultural context and communication style
 * 
 * Dependencies:
 * - culturalPersonalizationService.ts (new file)
 * - user_cultural_profiles table in Supabase
 * - claudeEnhancedChatbot.ts (updated to accept culturalSystemPrompt parameter)
 */

import React, { useState, useEffect, useRef } from 'react';
import { claudeEnhancedChatbot } from '../lib/claudeEnhancedChatbot';
import { supabase } from '../lib/supabase';
import { feedbackAnalytics } from '../lib/feedbackAnalytics';
// ⭐ CULTURAL PERSONALIZATION: Import adaptive AI system
import {
  buildCulturallyAdaptiveSystemPrompt,
  detectAndSaveContextSignals,
} from '../lib/culturalPersonalizationService';
// ⭐ CONTENT RECOMMENDATIONS: Import recommendation service
import {
  getContextualSuggestions,
  trackContentInteraction,
  formatContentSuggestionForChat,
  type ContentSuggestion,
} from '../lib/contentRecommendationService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  messageId?: string; // For feedback tracking
  feedback?: 'thumbs_up' | 'thumbs_down' | null; // User feedback
  handoffInfo?: { // ⭐ HUMAN HANDOFF: Handoff information
    ticketId: string | null;
    estimatedWait: string | null;
    displayMode?: string;
    crisisResources?: any;
  } | null;
  usedFallback?: boolean; // ⭐ GRACEFUL DEGRADATION: Indicates fallback was used
}

interface ChatbotWebProps {
  user?: any;
  profile?: any;
  onNavigateToBreathing?: (exercise?: string) => void;
  onNavigateToWorkout?: (workoutType?: string) => void;
}

// Amani Avatar Component
const AmaniAvatar = ({ size = 'md', isTyping = false }: { size?: 'sm' | 'md' | 'lg', isTyping?: boolean }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  // Fallback avatar if image doesn't load
  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0`}>
        <span className="text-white font-bold text-lg">A</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      {!imageLoaded && (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-300 animate-pulse`} />
      )}
      
      <img 
        src="/amani-avatar.png" 
        alt="Amani"
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-blue-500/30 shadow-lg transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      
      {isTyping && imageLoaded && (
        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full px-1.5 py-0.5">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default function ChatbotWeb({ user, profile, onNavigateToBreathing, onNavigateToWorkout }: ChatbotWebProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ⭐ CULTURAL PERSONALIZATION: Store culturally adaptive system prompt
  const [culturalSystemPrompt, setCulturalSystemPrompt] = useState<string>('');
  const [promptLoaded, setPromptLoaded] = useState(false);

  // Unlock audio context on user interaction (required for autoplay)
  const unlockAudio = async () => {
    if (audioUnlocked) return;
    
    try {
      // Create and play a silent audio to unlock audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Create a tiny silent buffer and play it
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        
        console.log('🔓 Audio context unlocked');
      }
      
      setAudioUnlocked(true);
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }
  };

  // Preload voices on mount
  useEffect(() => {
    // Voices may not be immediately available, need to wait for them
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices();
      if (voices && voices.length > 0) {
        console.log('🎤 Voices loaded:', voices.length);
      }
    };
    
    loadVoices();
    
    // Chrome/Firefox load voices asynchronously
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // ⭐ CULTURAL PERSONALIZATION: Load culturally adaptive system prompt
  useEffect(() => {
    if (user?.id) {
      loadCulturalSystemPrompt();
    }
  }, [user?.id]);

  // ⭐ CULTURAL PERSONALIZATION: Reload prompt when preferences change in settings
  useEffect(() => {
    const handlePreferencesUpdate = () => {
      console.log('🔄 Preferences updated, reloading cultural prompt');
      loadCulturalSystemPrompt();
    };

    window.addEventListener('cultural-preferences-updated', handlePreferencesUpdate);
    
    return () => {
      window.removeEventListener('cultural-preferences-updated', handlePreferencesUpdate);
    };
  }, []);

  const loadCulturalSystemPrompt = async () => {
    if (!user?.id) {
      console.warn('⚠️ No user ID available for cultural personalization');
      setPromptLoaded(true);
      return;
    }

    try {
      console.log('🌍 Loading culturally adaptive system prompt for user:', user.id);
      const prompt = await buildCulturallyAdaptiveSystemPrompt(user.id);
      setCulturalSystemPrompt(prompt);
      setPromptLoaded(true);
      console.log('✅ Cultural context loaded:', prompt.length, 'characters');
    } catch (error) {
      console.error('❌ Error loading cultural system prompt:', error);
      // Fallback: use empty string, claudeEnhancedChatbot will use its default
      setCulturalSystemPrompt('');
      setPromptLoaded(true);
    }
  };

  // Toggle voice with audio unlock
  const toggleVoice = async () => {
    if (!voiceEnabled) {
      await unlockAudio();
      // Force reload voices when enabling
      window.speechSynthesis?.getVoices();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Play ElevenLabs voice for a specific message (triggered by user click)
  const playMessageAudio = async (text: string) => {
    // Clean text for better speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
    
    setIsVoicePlaying(true);
    
    try {
      // For Capacitor apps, use the configured backend URL or Mac's IP for device testing
      const isCapacitor = window.location.protocol === 'capacitor:';
      const backendUrl = import.meta.env.VITE_BACKEND_URL 
        || 'https://mind-brother-production.up.railway.app';
      
      console.log('🎤 Calling ElevenLabs via backend...');
      
      const response = await fetch(`${backendUrl}/api/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice_id: '1YBpxMFAafA83t7u1xof' // Amani voice
        })
      });
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsVoicePlaying(false);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        setIsVoicePlaying(false);
      };

      await audio.play();
      console.log('🔊 Playing ElevenLabs audio');
      
    } catch (error) {
      console.error('❌ ElevenLabs TTS failed:', error);
      setIsVoicePlaying(false);
    }
  };

  // Reference to keep Audio object alive for autoplay
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Auto-play message using ElevenLabs - called directly after response
  const autoPlayMessage = async (text: string) => {
    if (!voiceEnabled) return;
    
    // Clean text for better speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
    
    setIsVoicePlaying(true);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL 
        || 'https://mind-brother-production.up.railway.app';
      
      console.log('🎤 Auto-playing ElevenLabs voice...');
      
      const response = await fetch(`${backendUrl}/api/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice_id: '1YBpxMFAafA83t7u1xof' // Amani voice
        })
      });
      
      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsVoicePlaying(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        setIsVoicePlaying(false);
        audioRef.current = null;
      };

      // Try to play - this should work since we're in async chain from user gesture
      try {
        await audio.play();
        console.log('🔊 Auto-playing ElevenLabs audio');
      } catch (playError: any) {
        // If autoplay fails, show a subtle indicator that audio is ready
        console.warn('Autoplay blocked, user needs to tap:', playError.message);
        setIsVoicePlaying(false);
      }
      
    } catch (error) {
      console.error('❌ ElevenLabs TTS failed:', error);
      setIsVoicePlaying(false);
    }
  };

  useEffect(() => {
    loadConversationHistory();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ⭐ NEW: Save conversation to local storage as backup
  const saveToLocalStorage = (msgs: ChatMessage[]) => {
    try {
      if (user) {
        localStorage.setItem(`chatHistory_${user.id}`, JSON.stringify(msgs));
        console.log('💾 Chat saved to local storage');
      }
    } catch (e) {
      console.error('Error saving to local storage:', e);
    }
  };

  // ⭐ NEW: Load conversation from local storage
  const loadFromLocalStorage = (): ChatMessage[] | null => {
    try {
      if (user) {
        const stored = localStorage.getItem(`chatHistory_${user.id}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.error('Error loading from local storage:', e);
    }
    return null;
  };

  // ⭐ NEW: Save conversation to Supabase (with local backup)
  const saveConversation = async (msgs: ChatMessage[]) => {
    if (!user) return;
    
    // Always save to local storage first (instant, reliable)
    saveToLocalStorage(msgs);
    
    // Then save to Supabase
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .upsert({
          user_id: user.id,
          messages: msgs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        
      if (error) {
        console.error('Error saving to Supabase:', error);
      } else {
        console.log('☁️ Chat saved to cloud');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversationHistory = async () => {
    if (!user) {
      setIsLoadingHistory(false);
      return;
    }
    
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
      timestamp: new Date().toISOString()
    };
    
    try {
      // First, try loading from Supabase
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('messages')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.messages && data.messages.length > 0) {
        // ✅ Found in Supabase - use it and update local storage
        console.log('☁️ Loaded chat history from cloud');
        setMessages(data.messages);
        saveToLocalStorage(data.messages); // Sync to local
        setIsLoadingHistory(false);
        return;
      }
      
      // ⭐ Fallback: Try local storage
      const localMessages = loadFromLocalStorage();
      if (localMessages && localMessages.length > 0) {
        console.log('💾 Loaded chat history from local storage');
        setMessages(localMessages);
        // Sync back to Supabase
        saveConversation(localMessages);
        setIsLoadingHistory(false);
        return;
      }
      
      // No history found anywhere - show welcome
      console.log('👋 No chat history found, showing welcome');
      setMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      
      // ⭐ Fallback: Try local storage on error
      const localMessages = loadFromLocalStorage();
      if (localMessages && localMessages.length > 0) {
        console.log('💾 Loaded chat history from local storage (after error)');
        setMessages(localMessages);
      } else {
        setMessages([welcomeMessage]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    if (!user) {
      alert('Please sign in to chat with Amani.');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const lowerInput = userMessage.content.toLowerCase();
      
      if (lowerInput.includes('breathing') || (lowerInput.includes('yes') && messages.length > 0 && 
          messages[messages.length - 1].content.includes('breathing exercise'))) {
        
        let recommendedExercise = null;
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1].content;
          if (lastMessage.includes('3-6 breathing exercise')) recommendedExercise = 'extended';
          else if (lastMessage.includes('physiological sigh')) recommendedExercise = 'physiological';
          else if (lastMessage.includes('box breathing')) recommendedExercise = 'box';
          else if (lastMessage.includes('4-7-8 breathing')) recommendedExercise = 'fourSevenEight';
          else if (lastMessage.includes('belly breathing')) recommendedExercise = 'belly';
          else if (lastMessage.includes('equal breathing')) recommendedExercise = 'equal';
        }
        
        if (onNavigateToBreathing) {
          onNavigateToBreathing(recommendedExercise || undefined);
          return;
        }
        
        const breathingResponse: ChatMessage = {
          role: 'assistant',
          content: "Great! I'd love to guide you through a breathing exercise. You can find our guided breathing exercises in the main menu under 'Guided Breathing'. They include sound and voice guidance to help you through different techniques.",
          timestamp: new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, breathingResponse];
        setMessages(finalMessages);
        
        // Save conversation to database and local storage
        await saveConversation(finalMessages);
        
        if (voiceEnabled) {
          autoPlayMessage(breathingResponse.content);
        }
        
        return;
      }

      if (lowerInput.includes('workout') || lowerInput.includes('exercise') || 
          (lowerInput.includes('yes') && messages.length > 0 && 
          messages[messages.length - 1].content.includes('workout'))) {
        
        let recommendedWorkoutType = null;
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1].content;
          if (lastMessage.includes('stress relief')) recommendedWorkoutType = 'stress_relief';
          else if (lastMessage.includes('anxiety relief')) recommendedWorkoutType = 'anxiety_relief';
          else if (lastMessage.includes('anger management')) recommendedWorkoutType = 'anger_management';
          else if (lastMessage.includes('mood boost')) recommendedWorkoutType = 'mood_boost';
          else if (lastMessage.includes('energy boost')) recommendedWorkoutType = 'energy_boost';
          else if (lastMessage.includes('confidence building')) recommendedWorkoutType = 'confidence_building';
        }
        
        if (onNavigateToWorkout) {
          onNavigateToWorkout(recommendedWorkoutType || undefined);
          return;
        }
        
        const workoutResponse: ChatMessage = {
          role: 'assistant',
          content: "Perfect! I'd love to guide you through a workout. You can find our guided workout in the main menu under 'Move Your Body'. It includes voice coaching, haptic feedback, and tracks your progress.",
          timestamp: new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, workoutResponse];
        setMessages(finalMessages);
        
        // Save conversation to database and local storage
        await saveConversation(finalMessages);
        
        if (voiceEnabled) {
          autoPlayMessage(workoutResponse.content);
        }
        
        return;
      }

      // Get user's name from profile - prefer first_name, extract first name from username if needed
      let userName = profile?.first_name || null;
      if (!userName && profile?.username && !profile.username.startsWith('user_')) {
        // Extract first name from username (e.g., "James Doe" -> "James")
        const nameParts = profile.username.trim().split(/\s+/);
        userName = nameParts.length > 0 ? nameParts[0] : null;
      }
      
      // ⭐ CULTURAL PERSONALIZATION: Detect and save context signals for AI learning
      // This helps the AI understand the user's cultural context over time
      if (user?.id) {
        try {
          await detectAndSaveContextSignals(
            user.id,
            'main-chat', // conversationId - you might want to use a dynamic ID
            userMessage.content
          );
          console.log('🧠 Context signals detected and saved');
        } catch (error) {
          console.error('⚠️ Error detecting context signals:', error);
          // Non-critical error, continue with chat
        }
      }
      
      // ⭐ DEBUGGING: Log the actual request being sent
      console.log('🔍 DEBUG: Calling claudeEnhancedChatbot.generateResponse with:', {
        message: userMessage.content,
        userId: user.id,
        messageCount: messages.length,
        userName,
        culturalContextLoaded: !!culturalSystemPrompt,
        culturalContextLength: culturalSystemPrompt.length
      });
      
      // ⭐ CULTURAL PERSONALIZATION: Pass adaptive system prompt to chatbot
      const response = await claudeEnhancedChatbot.generateResponse(
        userMessage.content,
        user.id,
        messages,
        userName,
        culturalSystemPrompt // ← Cultural context injected here!
      );

      // ⭐ DEBUGGING: Log the actual response received
      console.log('🔍 DEBUG: Received response:', {
        responseType: typeof response,
        isObject: typeof response === 'object',
        hasResponseKey: response && typeof response === 'object' && 'response' in response,
        responsePreview: typeof response === 'string' ? response.substring(0, 100) : 
                        (response && typeof response === 'object' && 'response' in response) ? 
                        (response as any).response.substring(0, 100) : 'unknown'
      });

      // ⭐ HUMAN HANDOFF & GRACEFUL DEGRADATION: Check if response includes metadata
      const responseData = response as any;
      let responseContent: string;
      let handoffInfo = null;
      let usedFallback = false;
      
      // Check if response is an object with metadata (from backend)
      if (typeof response === 'object' && response !== null && response.response) {
        responseContent = response.response;
        
        // Extract handoff metadata
        if (response.metadata?.handoffInitiated) {
          handoffInfo = {
            ticketId: response.metadata.handoffTicketId,
            estimatedWait: response.metadata.handoffEstimatedWait,
            displayMode: response.metadata.displayMode || 'HANDOFF_NORMAL',
            crisisResources: response.metadata.crisisResources
          };
        }
        
        // Check if fallback was used
        usedFallback = response.metadata?.usedFallback || false;
        
        // ⭐ DEBUGGING: Log the metadata
        console.log('🔍 DEBUG: Response metadata:', {
          method: response.metadata?.method,
          usedFallback,
          intents: response.metadata?.intents
        });
      } else {
        // String response (backward compatibility)
        responseContent = typeof response === 'string' ? response : JSON.stringify(response);
        console.log('🔍 DEBUG: String response (no metadata)');
      }
      
      // ⭐ CONTENT RECOMMENDATIONS: Check for contextual content suggestions
      let contentSuggestionText = '';
      if (user?.id) {
        try {
          const suggestions = await getContextualSuggestions(
            user.id,
            userMessage.content,
            { conversationMood: 'neutral' }
          );
          
          if (suggestions.length > 0) {
            // Append first suggestion to response (don't overwhelm user)
            const suggestion = suggestions[0];
            contentSuggestionText = formatContentSuggestionForChat(suggestion);
            console.log('📚 Content suggestion found:', suggestion.content.title);
            
            // Track that we showed this content
            trackContentInteraction(user.id, suggestion.content.id, 'view').catch(console.error);
          }
        } catch (error) {
          console.error('⚠️ Error getting content suggestions:', error);
          // Non-critical, continue without suggestions
        }
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: responseContent + contentSuggestionText,
        timestamp: new Date().toISOString(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID for feedback
        feedback: null,
        handoffInfo: handoffInfo, // ⭐ HUMAN HANDOFF: Store handoff info
        // ⭐ FIX: Don't show the warning - the fallback responses are actually good!
        // usedFallback: usedFallback
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save conversation to database and local storage
      await saveConversation(finalMessages);
      
      if (voiceEnabled) {
        autoPlayMessage(responseContent); // Only speak main response, not content suggestion
      }

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Sorry, I had trouble responding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ⭐ FEEDBACK COLLECTION: Handle user feedback on messages
  const handleFeedback = async (messageId: string, rating: 'thumbs_up' | 'thumbs_down', messageContent: string) => {
    // Update message feedback state
    setMessages(prev => prev.map(msg => 
      msg.messageId === messageId 
        ? { ...msg, feedback: rating }
        : msg
    ));

    // Find the user message that prompted this response
    const messageIndex = messages.findIndex(m => m.messageId === messageId);
    const userMessage = messageIndex > 0 ? messages[messageIndex - 1]?.content : '';
    
    // Detect topic from the conversation
    const content = (userMessage + ' ' + messageContent).toLowerCase();
    let topic = 'general';
    if (content.match(/job|work|career|employ|sales|project management/)) topic = 'work';
    else if (content.match(/anxi|stress|worried|overwhelm/)) topic = 'anxiety';
    else if (content.match(/depress|sad|hopeless|down/)) topic = 'depression';
    else if (content.match(/relationship|partner|wife|husband|family/)) topic = 'relationship';

    // Track feedback in analytics (now saves to Supabase too!)
    if (user) {
      feedbackAnalytics.trackMessageFeedback(
        user.id,
        messageId,
        rating,
        messageContent
      );
      
      // ⭐ NEW: Also save to Supabase with full context for learning
      try {
        await supabase.from('chatbot_feedback').insert({
          user_id: user.id,
          message_id: messageId,
          user_message: userMessage,
          ai_response: messageContent,
          rating: rating,
          topic: topic,
          response_type: 'claude'
        });
        console.log(`✅ Feedback saved to database: ${rating} for topic: ${topic}`);
      } catch (error) {
        console.error('Error saving feedback to database:', error);
      }
    }
  };

  const clearConversation = async () => {
    if (!user) return;
    
    const confirmClear = window.confirm('Are you sure you want to clear this conversation? This cannot be undone.');
    if (!confirmClear) return;

    try {
      // Clear from database
      await supabase
        .from('chatbot_conversations')
        .delete()
        .eq('user_id', user.id);

      // Show fresh welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
      alert('Failed to clear conversation. Please try again.');
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AmaniAvatar size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Amani</h2>
              <p className="text-sm text-gray-500">Your Mental Health Companion</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
            >
              {voiceEnabled ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              )}
              Voice
            </button>
            
            <button
              onClick={clearConversation}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Voice playing indicator */}
        {isVoicePlaying && voiceEnabled && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-white rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-4 bg-white rounded animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-2 bg-white rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
              <div className="w-1 h-5 bg-white rounded animate-pulse" style={{ animationDelay: '450ms' }}></div>
              <div className="w-1 h-3 bg-white rounded animate-pulse" style={{ animationDelay: '600ms' }}></div>
            </div>
            Amani is speaking...
          </div>
        )}
        
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={`${message.timestamp}-${index}`}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && <AmaniAvatar size="md" />}
              
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* ⭐ HUMAN HANDOFF: Display handoff banner for crisis situations */}
                {!isUser && message.handoffInfo && message.handoffInfo.ticketId && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    message.handoffInfo.displayMode === 'HANDOFF_URGENT'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className="text-lg">🤝</div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          message.handoffInfo.displayMode === 'HANDOFF_URGENT'
                            ? 'text-red-800'
                            : 'text-blue-800'
                        }`}>
                          {message.handoffInfo.displayMode === 'HANDOFF_URGENT'
                            ? 'A professional counselor is being connected to you'
                            : 'Your conversation has been escalated to a professional counselor'}
                        </p>
                        {message.handoffInfo.estimatedWait && (
                          <p className="text-xs text-gray-600 mt-1">
                            Estimated wait: {message.handoffInfo.estimatedWait}
                          </p>
                        )}
                        {message.handoffInfo.crisisResources && (
                          <div className="mt-2 text-xs">
                            <p className="font-medium text-gray-700 mb-1">Immediate resources:</p>
                            {message.handoffInfo.crisisResources.primary && (
                              <p className="text-gray-600">
                                • {message.handoffInfo.crisisResources.primary.name}: {message.handoffInfo.crisisResources.primary.phone || message.handoffInfo.crisisResources.primary.text}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ⭐ FIX: REMOVED THE MISLEADING "SIMPLIFIED RESPONSE MODE" WARNING */}
                {/* The fallback responses from the backend are actually GOOD responses, not simplified ones */}
                
                <div className={`flex items-center justify-between mt-2`}>
                  <p
                    className={`text-xs ${
                      isUser ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  
                  {/* ⭐ FEEDBACK COLLECTION: Thumbs up/down for assistant messages */}
                  {!isUser && message.messageId && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFeedback(message.messageId!, 'thumbs_up', message.content)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          message.feedback === 'thumbs_up'
                            ? 'bg-green-100 text-green-600'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
                        }`}
                        title="This was helpful"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a1 1 0 001.364.97l5.108-2.188a1 1 0 00.528-.97V8.466a1 1 0 00-.528-.97L7.364 5.308a1 1 0 00-1.364.97v4.055zM15.657 8.5h-1.414a1 1 0 00-.949.684l-.95 2.85a1 1 0 00.95 1.316h1.414a1 1 0 00.949-1.316l-.95-2.85a1 1 0 00-.949-.684z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleFeedback(message.messageId!, 'thumbs_down', message.content)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          message.feedback === 'thumbs_down'
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
                        }`}
                        title="This was not helpful"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.834a1 1 0 00-1.364-.97l-5.108 2.188a1 1 0 00-.528.97v5.468a1 1 0 00.528.97l5.108 2.188a1 1 0 001.364-.97v-4.055zM4.343 11.5h1.414a1 1 0 00.949-.684l.95-2.85a1 1 0 00-.95-1.316H4.343a1 1 0 00-.949 1.316l.95 2.85a1 1 0 00.949.684z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <AmaniAvatar size="md" isTyping={true} />
            <div className="bg-white text-gray-900 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export { ChatbotWeb };