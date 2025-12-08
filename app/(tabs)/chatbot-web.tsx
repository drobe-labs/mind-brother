import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { claudeEnhancedChatbot } from '../../lib/claudeEnhancedChatbot';
import { useRouter } from 'expo-router';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatbotWeb() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    try {
      // Show welcome message regardless of user state
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error loading conversation:', error);
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
      const lowerInput = userMessage.content.toLowerCase().trim();
      
      // Check if user wants to do breathing exercise
      // Look for "yes", "yeah", "sure", "okay", "ok" when last message mentions breathing
      const wantsBreathing = lowerInput === 'yes' || 
                            lowerInput === 'yeah' || 
                            lowerInput === 'sure' || 
                            lowerInput === 'okay' || 
                            lowerInput === 'ok' ||
                            lowerInput === 'yep' ||
                            lowerInput.includes('breathing');
      
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : '';
      const lastMessageMentionsBreathing = lastMessage.includes('breathing') || 
                                          lastMessage.includes('guide you through');
      
      if (wantsBreathing && lastMessageMentionsBreathing) {
        // Determine which exercise was recommended from the last assistant message
        let recommendedExercise = null;
        if (lastMessage.includes('3-6 breathing') || lastMessage.includes('extended')) {
          recommendedExercise = 'extended';
        } else if (lastMessage.includes('physiological sigh')) {
          recommendedExercise = 'physiological';
        } else if (lastMessage.includes('box breathing')) {
          recommendedExercise = 'box';
        } else if (lastMessage.includes('4-7-8 breathing') || lastMessage.includes('4-7-8')) {
          recommendedExercise = 'fourSevenEight';
        } else if (lastMessage.includes('belly breathing')) {
          recommendedExercise = 'belly';
        } else if (lastMessage.includes('equal breathing') || lastMessage.includes('5-5-5')) {
          recommendedExercise = 'equal';
        }
        
        // Navigate to breathing exercise - for now navigate to dashboard
        // You can create a dedicated breathing route later if needed
        console.log('🧘 Navigating to breathing exercise:', recommendedExercise || 'default');
        if (recommendedExercise) {
          router.push(`/(tabs)/dashboard?breathing=${recommendedExercise}`);
        } else {
          router.push('/(tabs)/dashboard?breathing=true');
        }
        return;
      }
      
      // Also check if user explicitly mentions breathing
      if (lowerInput.includes('breathing') && !lowerInput.includes('not')) {
        router.push('/(tabs)/dashboard?breathing=true');
        return;
      }

      // Get user's name from profile if available
      const profile = null; // You can get this from context if needed
      const userName = profile?.first_name || profile?.username || null;
      
      // Get AI response using enhanced chatbot
      const response = await claudeEnhancedChatbot.generateResponse(
        userMessage.content,
        user.id,
        updatedMessages,
        userName
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

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
      if (user) {
        chatbotService.saveConversation(user.id, [welcomeMessage]);
      }
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Loading your conversation...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white">❤️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Amani</h1>
              <p className="text-sm text-gray-600">Mental Health Companion</p>
            </div>
          </div>
          <button
            onClick={clearConversation}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            title="Start new conversation"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={`${message.timestamp}-${index}`}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
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
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start">
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

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Share what's on your mind..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={1}
              style={{ maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-3 rounded-full transition-colors ${
              inputText.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    </div>
  );
}
