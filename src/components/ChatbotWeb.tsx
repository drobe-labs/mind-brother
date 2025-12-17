import React, { useState, useEffect, useRef } from 'react';
import { claudeEnhancedChatbot } from '../lib/claudeEnhancedChatbot';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsVoicePlaying(false);
      };

      // This will work because it's triggered by user click
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

  const loadConversationHistory = async () => {
    if (!user) {
      setIsLoadingHistory(false);
      return;
    }
    
    try {
      // Load conversation from database
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('messages')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No conversation found - show welcome message
          const welcomeMessage: ChatMessage = {
            role: 'assistant',
            content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        } else {
          console.error('Error loading conversation:', error);
          // Show welcome message on error
          const welcomeMessage: ChatMessage = {
            role: 'assistant',
            content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      } else {
        // Load existing conversation
        const savedMessages = data?.messages || [];
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // No messages found - show welcome
          const welcomeMessage: ChatMessage = {
            role: 'assistant',
            content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Show welcome message on error
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
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
        
        // Save conversation to database
        if (user) {
          try {
            await supabase
              .from('chatbot_conversations')
              .upsert({
                user_id: user.id,
                messages: finalMessages,
                updated_at: new Date().toISOString()
              });
          } catch (error) {
            console.error('Error saving conversation:', error);
          }
        }
        
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
        
        // Save conversation to database
        if (user) {
          try {
            await supabase
              .from('chatbot_conversations')
              .upsert({
                user_id: user.id,
                messages: finalMessages,
                updated_at: new Date().toISOString()
              });
          } catch (error) {
            console.error('Error saving conversation:', error);
          }
        }
        
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
      
      const response = await claudeEnhancedChatbot.generateResponse(
        userMessage.content,
        user.id,
        messages,
        userName
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save conversation to database
      if (user) {
        try {
          await supabase
            .from('chatbot_conversations')
            .upsert({
              user_id: user.id,
              messages: finalMessages,
              updated_at: new Date().toISOString()
            });
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      }
      
      if (voiceEnabled) {
        autoPlayMessage(response);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Sorry, I had trouble responding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    if (confirm('Are you sure you want to start a new conversation? This will delete your current chat history.')) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Hi! I'm Amani, your mental health companion. I'm here to listen and support you. How are you feeling today?",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-gray-600">Loading your conversation...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AmaniAvatar size="lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Amani</h1>
              <p className="text-sm text-gray-600">Your AI Mental Health Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                voiceEnabled 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isVoicePlaying ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.846l3.537-2.816a1 1 0 011.617.816zM16 10a6 6 0 01-1.671 4.025l-1.414-1.414A4 4 0 0016 10a4 4 0 00-3.085-3.611l1.414-1.414A6 6 0 0116 10z" clipRule="evenodd" />
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