import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { chatbotService } from '../../lib/chatbotService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversationHistory();
  }, [user]);

  const loadConversationHistory = async () => {
    if (!user) return;
    
    try {
      const history = await chatbotService.loadConversation(user.id);
      if (history.length === 0) {
        // Show welcome message for new conversations
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content: "Hi there! I'm Amani, your mental health companion. I'm here to listen and support you through whatever you're going through. How are you feeling today?",
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

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
      // Check for crisis content
      if (chatbotService.isCrisisMessage(userMessage.content)) {
        const crisisResponse: ChatMessage = {
          role: 'assistant',
          content: chatbotService.getCrisisResponse(),
          timestamp: new Date().toISOString()
        };
        
        const finalMessages = [...updatedMessages, crisisResponse];
        setMessages(finalMessages);
        await chatbotService.saveConversation(user.id, finalMessages);
        
        Alert.alert(
          'Crisis Support Available',
          'I notice you might be in distress. Please reach out for immediate help if needed.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get AI response
      const response = await chatbotService.getChatResponse(
        userMessage.content,
        messages
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save to database
      await chatbotService.saveConversation(user.id, finalMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Sorry, I had trouble responding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to start a new conversation? This will delete your current chat history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const welcomeMessage: ChatMessage = {
              role: 'assistant',
              content: "Hi! I'm Amani, your mental health companion. I'm here to listen and support you. How are you feeling today?",
              timestamp: new Date().toISOString()
            };
            setMessages([welcomeMessage]);
            if (user) {
              await chatbotService.saveConversation(user.id, [welcomeMessage]);
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.botInfo}>
            <View style={styles.botAvatar}>
              <Ionicons name="heart" size={24} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.botName}>Amani</Text>
              <Text style={styles.botStatus}>Mental Health Companion</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearConversation} style={styles.clearButton}>
            <Ionicons name="refresh" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Share what's on your mind..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <Ionicons name="hourglass" size={20} color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  botInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  botName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  botStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  clearButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#ffffff',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: '#6b7280',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
