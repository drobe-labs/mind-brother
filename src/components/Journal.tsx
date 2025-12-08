import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizeInput, validateJournalEntry, rateLimiter } from '../lib/securityUtils';
import { auditHelpers } from '../lib/auditService';
import { feelingCheckInOptions } from '../lib/mentalHealthResources';
import AmaniMemoji from './AmaniMemoji';
import {
  encryptContent,
  decryptContent,
  isEncrypted,
  getEncryptionStatus,
  enableEncryption,
  unlockJournal,
  lockJournal,
  getSessionPassphrase,
  disableEncryption,
  changePassphrase,
  type EncryptionStatus
} from '../lib/journalEncryption';

// Fallback prompts in case database is not available
const getFallbackPrompts = (): JournalPrompt[] => [
  {
    id: '1',
    title: 'Three Good Things',
    prompt: 'What are three things you\'re grateful for today? No matter how small, write them down and reflect on why they matter to you.',
    category: 'gratitude',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '2',
    title: 'Daily Reflection',
    prompt: 'How did you show up for yourself today? What choices did you make that aligned with your values?',
    category: 'self_reflection',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '3',
    title: 'Emotional Weather',
    prompt: 'If your emotions today were weather, what would it be like? Sunny, stormy, cloudy, or mixed? Describe the emotional climate of your day.',
    category: 'emotions',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '4',
    title: 'Challenge Response',
    prompt: 'What challenge did you face today, and how did you handle it? What would you do differently next time?',
    category: 'challenges',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '5',
    title: 'Relationship Appreciation',
    prompt: 'Write about a person who made a positive impact on your day. What did they do, and how did it make you feel?',
    category: 'relationships',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '6',
    title: 'Goal Progress',
    prompt: 'What goal are you working toward right now? What progress have you made, and what\'s your next step?',
    category: 'goals',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '7',
    title: 'Present Moment',
    prompt: 'Describe a moment today when you felt completely present and engaged. What were you doing? How did it feel?',
    category: 'mindfulness',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '8',
    title: 'Self-Care Check',
    prompt: 'How did you care for yourself today? What self-care practices make you feel most refreshed and recharged?',
    category: 'self_care',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '9',
    title: 'Joy Moments',
    prompt: 'What brought you joy today? How can you create more moments like this in your life?',
    category: 'joy',
    difficulty_level: 'beginner',
    is_active: true
  },
  {
    id: '10',
    title: 'Growth Moment',
    prompt: 'Describe a moment today when you felt proud of yourself. What did you do that made you feel this way?',
    category: 'self_reflection',
    difficulty_level: 'beginner',
    is_active: true
  }
];

interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood_rating?: number;
  mood_emoji?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface JournalPrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'write' | 'view' | 'prompts'>('list');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const selectedPromptRef = useRef<JournalPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodRating, setMoodRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Encryption state
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus>({
    isEnabled: false,
    isUnlocked: false,
    passphraseHash: null
  });
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);
  const [showUnlockScreen, setShowUnlockScreen] = useState(false);
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [encryptionError, setEncryptionError] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [lockClosing, setLockClosing] = useState(false);

  // Check encryption status on mount
  useEffect(() => {
    const status = getEncryptionStatus();
    setEncryptionStatus(status);
    
    // If encryption is enabled but not unlocked, show unlock screen
    if (status.isEnabled && !status.isUnlocked) {
      setShowUnlockScreen(true);
    }
  }, []);

  useEffect(() => {
    // Only load entries if encryption is not enabled, or if it's unlocked
    if (!encryptionStatus.isEnabled || encryptionStatus.isUnlocked) {
      loadEntries();
      loadPrompts();
    }
    
    // Load saved prompt from localStorage
    const savedPrompt = localStorage.getItem('selectedJournalPrompt');
    if (savedPrompt) {
      try {
        const prompt = JSON.parse(savedPrompt);
        selectedPromptRef.current = prompt;
        setSelectedPrompt(prompt);
      } catch (error) {
        console.error('Error loading saved prompt:', error);
        localStorage.removeItem('selectedJournalPrompt');
      }
    }
  }, [encryptionStatus.isEnabled, encryptionStatus.isUnlocked]);

  const loadEntries = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Decrypt entries if encryption is enabled
      const sessionPassphrase = getSessionPassphrase();
      if (sessionPassphrase && data) {
        const decryptedEntries = await Promise.all(
          data.map(async (entry) => {
            try {
              // Check if content is encrypted
              if (isEncrypted(entry.content)) {
                const decryptedContent = await decryptContent(entry.content, sessionPassphrase);
                const decryptedTitle = entry.title && isEncrypted(entry.title) 
                  ? await decryptContent(entry.title, sessionPassphrase)
                  : entry.title;
                return { ...entry, content: decryptedContent, title: decryptedTitle };
              }
              return entry;
            } catch (decryptError) {
              console.error('Error decrypting entry:', decryptError);
              // Return entry with placeholder if decryption fails
              return { ...entry, content: '[Unable to decrypt - incorrect passphrase?]', title: entry.title };
            }
          })
        );
        setEntries(decryptedEntries);
      } else {
        setEntries(data || []);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_prompts')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
      // If database fails, use fallback prompts
      setPrompts(getFallbackPrompts());
    }
  };

  const saveEntry = async () => {
    if (!content.trim()) return;
    if (moodRating === null) {
      alert('Please select how you are feeling before saving your entry.');
      return;
    }

    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Rate limiting
      if (!rateLimiter.checkLimit(`journal_save_${user.user.id}`, 5, 60000)) {
        alert('Too many journal entries. Please wait a moment before saving another entry.');
        auditHelpers.logRateLimitExceeded(user.user.id, 'journal_save');
        setIsLoading(false);
        return;
      }

      // Sanitize inputs
      const sanitizedTitle = title ? sanitizeInput(title, 'text') : null;
      const sanitizedContent = sanitizeInput(content, 'text');
      const sanitizedTags = tags.map(tag => sanitizeInput(tag, 'text'));

      // Validate entry
      const validation = validateJournalEntry({
        title: sanitizedTitle || '',
        content: sanitizedContent,
        mood_rating: moodRating
      });

      if (!validation.isValid) {
        alert('Invalid entry: ' + validation.errors.join(', '));
        auditHelpers.logInvalidInput(user.user.id, 'journal_entry', validation.errors);
        setIsLoading(false);
        return;
      }

      // Encrypt content if encryption is enabled
      let finalContent = sanitizedContent;
      let finalTitle = sanitizedTitle;
      const sessionPassphrase = getSessionPassphrase();
      
      if (encryptionStatus.isEnabled && sessionPassphrase) {
        try {
          finalContent = await encryptContent(sanitizedContent, sessionPassphrase);
          if (finalTitle) {
            finalTitle = await encryptContent(finalTitle, sessionPassphrase);
          }
        } catch (encryptError) {
          console.error('Encryption failed:', encryptError);
          alert('Failed to encrypt entry. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      const entryData = {
        user_id: user.user.id,
        title: finalTitle,
        content: finalContent,
        mood_rating: moodRating,
        mood_emoji: moodRating ? feelingCheckInOptions.find(opt => opt.value === moodRating)?.emoji : null,
        tags: sanitizedTags.length > 0 ? sanitizedTags : null,
      };

      if (selectedEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', selectedEntry.id);

        if (error) throw error;
        
        // Log the update
        auditHelpers.logJournalEntryUpdated(user.user.id, selectedEntry.id, {
          title: sanitizedTitle,
          mood_rating: moodRating,
          tags: sanitizedTags
        });
      } else {
        // Create new entry
        const { data: newEntry, error } = await supabase
          .from('journal_entries')
          .insert(entryData)
          .select()
          .single();

        if (error) throw error;
        
        // Log the creation
        auditHelpers.logJournalEntryCreated(user.user.id, newEntry.id, moodRating);
      }

      // Reset form
      setTitle('');
      setContent('');
      setMoodRating(null);
      setTags([]);
      setSelectedEntry(null);
      // Don't clear selectedPrompt - keep it for future use
      // setSelectedPrompt(null);
      setCurrentView('list');
      
      // Reload entries
      await loadEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      await loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const usePrompt = (prompt: JournalPrompt) => {
    // Store in localStorage for persistence
    localStorage.setItem('selectedJournalPrompt', JSON.stringify(prompt));
    selectedPromptRef.current = prompt;
    setSelectedPrompt(prompt);
    setContent(`Prompt: ${prompt.prompt}\n\n`);
    setCurrentView('write');
  };

  const editEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setTitle(entry.title || '');
    setContent(entry.content);
    setMoodRating(entry.mood_rating || null);
    setTags(entry.tags || []);
    setCurrentView('write');
  };

  // Date filtering helper functions
  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return { start: monthStart, end: monthEnd };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear() + 1, 0, 1);
        return { start: yearStart, end: yearEnd };
      case 'custom':
        return {
          start: customDateRange.start ? new Date(customDateRange.start) : null,
          end: customDateRange.end ? new Date(customDateRange.end) : null
        };
      default:
        return { start: null, end: null };
    }
  };

  const isEntryInDateRange = (entry: JournalEntry, range: {start: Date | null, end: Date | null}) => {
    if (!range.start || !range.end) return true;
    
    const entryDate = new Date(entry.created_at);
    return entryDate >= range.start && entryDate < range.end;
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMood = !filterMood || entry.mood_rating === filterMood;
    
    const dateRange = getDateRange(dateFilter);
    const matchesDate = isEntryInDateRange(entry, dateRange);
    
    return matchesSearch && matchesMood && matchesDate;
  });

  const promptsToUse = prompts.length > 0 ? prompts : getFallbackPrompts();
  const groupedPrompts = promptsToUse.reduce((acc, prompt) => {
    if (!acc[prompt.category]) acc[prompt.category] = [];
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, JournalPrompt[]>);

  // Encryption Setup Screen
  const handleSetupEncryption = async () => {
    setEncryptionError('');
    
    if (passphrase.length < 8) {
      setEncryptionError('Passphrase must be at least 8 characters');
      return;
    }
    
    if (passphrase !== confirmPassphrase) {
      setEncryptionError('Passphrases do not match');
      return;
    }
    
    setIsEncrypting(true);
    try {
      await enableEncryption(passphrase);
      setEncryptionStatus(getEncryptionStatus());
      setShowEncryptionSetup(false);
      setPassphrase('');
      setConfirmPassphrase('');
      
      // Reload and encrypt existing entries
      alert('🔐 Encryption enabled! Your future entries will be encrypted. Note: Existing entries will remain unencrypted until you edit and save them.');
    } catch (error) {
      setEncryptionError('Failed to enable encryption. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  // Unlock Journal Handler
  const handleUnlockJournal = async () => {
    setEncryptionError('');
    setIsEncrypting(true);
    
    try {
      const success = await unlockJournal(passphrase);
      if (success) {
        setEncryptionStatus(getEncryptionStatus());
        setShowUnlockScreen(false);
        setPassphrase('');
      } else {
        setEncryptionError('Incorrect passphrase. Please try again.');
      }
    } catch (error) {
      setEncryptionError('Failed to unlock. Please try again.');
    } finally {
      setIsEncrypting(false);
    }
  };

  // Lock Journal Handler
  const handleLockJournal = () => {
    lockJournal();
    setEncryptionStatus(getEncryptionStatus());
    setShowUnlockScreen(true);
    setEntries([]);
  };

  // Disable Encryption Handler
  const handleDisableEncryption = async () => {
    if (!confirm('⚠️ Warning: Disabling encryption will NOT decrypt your existing entries. They will remain encrypted and unreadable. Are you sure?')) {
      return;
    }
    
    setEncryptionError('');
    setIsEncrypting(true);
    
    try {
      const success = await disableEncryption(passphrase);
      if (success) {
        setEncryptionStatus(getEncryptionStatus());
        setShowEncryptionSettings(false);
        setPassphrase('');
        alert('Encryption disabled. New entries will not be encrypted.');
      } else {
        setEncryptionError('Incorrect passphrase');
      }
    } catch (error) {
      setEncryptionError('Failed to disable encryption');
    } finally {
      setIsEncrypting(false);
    }
  };

  // Unlock Screen
  if (showUnlockScreen && encryptionStatus.isEnabled) {
    return (
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Journal Locked</h1>
          <p className="text-gray-600 mb-6">
            Your journal is encrypted for privacy. Enter your passphrase to unlock.
          </p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlockJournal()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your passphrase"
              autoFocus
            />
            
            {encryptionError && (
              <p className="text-red-600 text-sm">{encryptionError}</p>
            )}
            
            <button
              onClick={handleUnlockJournal}
              disabled={isEncrypting || !passphrase}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEncrypting ? 'Unlocking...' : 'Unlock Journal'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            ⚠️ If you've forgotten your passphrase, your encrypted entries cannot be recovered. Please write your passphrase down and keep it in a safe space.
          </p>
        </div>
      </div>
    );
  }

  // Encryption Setup Screen
  if (showEncryptionSetup) {
    return (
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <button
            onClick={() => {
              setShowEncryptionSetup(false);
              setPassphrase('');
              setConfirmPassphrase('');
              setEncryptionError('');
            }}
            className="text-indigo-600 hover:text-indigo-700 mb-4"
          >
            ← Back
          </button>
          
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enable Encryption</h1>
            <p className="text-gray-600 text-sm">
              Protect your journal with end-to-end encryption. Only you can read your entries.
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>⚠️ Important:</strong> If you forget your passphrase, your encrypted entries cannot be recovered. There is no "forgot password" option. Please write your passphrase down and keep it in a safe space.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Create Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Minimum 8 characters"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a memorable phrase that's different from your login password
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Passphrase
              </label>
              <input
                type="password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter passphrase again"
              />
            </div>
            
            {encryptionError && (
              <p className="text-red-600 text-sm">{encryptionError}</p>
            )}
            
            <button
              onClick={handleSetupEncryption}
              disabled={isEncrypting || passphrase.length < 8 || passphrase !== confirmPassphrase}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEncrypting ? 'Enabling Encryption...' : 'Enable Encryption'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Encryption Settings Screen
  if (showEncryptionSettings) {
    return (
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <button
            onClick={() => {
              setShowEncryptionSettings(false);
              setPassphrase('');
              setEncryptionError('');
            }}
            className="text-indigo-600 hover:text-indigo-700 mb-4"
          >
            ← Back to Journal
          </button>
          
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">⚙️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Encryption Settings</h1>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-green-800 font-medium">Encryption is enabled</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your journal entries are encrypted end-to-end
              </p>
            </div>
            
            <button
              onClick={handleLockJournal}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              🔒 Lock Journal Now
            </button>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Danger Zone</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter passphrase to disable encryption
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Current passphrase"
                />
              </div>
              
              {encryptionError && (
                <p className="text-red-600 text-sm mt-2">{encryptionError}</p>
              )}
              
              <button
                onClick={handleDisableEncryption}
                disabled={isEncrypting || !passphrase}
                className="w-full mt-3 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEncrypting ? 'Disabling...' : 'Disable Encryption'}
              </button>
              
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Disabling encryption will NOT decrypt existing entries
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prompts list view
  if (currentView === 'prompts') {
    const promptsToUse = prompts.length > 0 ? prompts : getFallbackPrompts();
    const groupedPrompts = promptsToUse.reduce((acc, prompt) => {
      if (!acc[prompt.category]) acc[prompt.category] = [];
      acc[prompt.category].push(prompt);
      return acc;
    }, {} as Record<string, JournalPrompt[]>);

    return (
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('list')}
            className="text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            ← Back to Journal
          </button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Prompt</h1>
          <p className="text-gray-600">
            Select a prompt to help guide your journaling
          </p>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                {category.replace('_', ' ')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => {
                      usePrompt(prompt);
                      setCurrentView('write');
                    }}
                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                  >
                    <div className="font-semibold text-gray-900 mb-1">{prompt.title}</div>
                    <div className="text-sm text-gray-600">{prompt.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentView === 'write') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setCurrentView('list');
              setSelectedEntry(null);
              localStorage.removeItem('selectedJournalPrompt');
              selectedPromptRef.current = null;
              setSelectedPrompt(null); // Clear prompt when going back to list
              setTitle('');
              setContent('');
              setMoodRating(null);
              setTags([]);
            }}
            className="text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            ← Back to Journal
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedEntry ? 'Edit Entry' : 'New Journal Entry'}
          </h1>

          {(selectedPrompt || selectedPromptRef.current) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-blue-900">{(selectedPrompt || selectedPromptRef.current)?.title}</h3>
                <button
                  onClick={() => {
                    localStorage.removeItem('selectedJournalPrompt');
                    selectedPromptRef.current = null;
                    setSelectedPrompt(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  title="Remove prompt"
                >
                  ✕
                </button>
              </div>
              <p className="text-blue-700 text-sm">{(selectedPrompt || selectedPromptRef.current)?.prompt}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Give your entry a title..."
              />
            </div>

            {/* Mood Rating with Amani Memojis - 2 Row Layout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How are you feeling? *
              </label>
              
              {/* Row 1: Great and Good (centered) */}
              <div className="flex justify-center gap-6 mb-4">
                {feelingCheckInOptions.slice(0, 2).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMoodRating(moodRating === option.value ? null : option.value)}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                      moodRating === option.value
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ minWidth: '110px' }}
                  >
                    <AmaniMemoji 
                      expression={option.expression || 'neutral'}
                      size="lg"
                      animated={false}
                    />
                    <div className="text-sm font-semibold text-gray-700 mt-2">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Row 2: Okay, Not Great, Struggling (evenly spaced) */}
              <div className="flex justify-center gap-6">
                {feelingCheckInOptions.slice(2).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMoodRating(moodRating === option.value ? null : option.value)}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                      moodRating === option.value
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ minWidth: '110px' }}
                  >
                    <AmaniMemoji 
                      expression={option.expression || 'neutral'}
                      size="lg"
                      animated={false}
                    />
                    <div className="text-sm font-semibold text-gray-700 mt-2 whitespace-pre-line text-center">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your thoughts *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={12}
                placeholder="Write your thoughts, feelings, experiences... This is your safe space."
                required
              />
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span>{content.length} characters</span>
                <span>•</span>
                {encryptionStatus.isEnabled ? (
                  <span className="text-green-600 flex items-center gap-1">
                    🔐 End-to-end encrypted
                  </span>
                ) : (
                  <span>Write freely, your entries are private</span>
                )}
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a tag (e.g., anxiety, work, gratitude)"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCurrentView('list')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                disabled={!content.trim() || isLoading}
                className={`px-6 py-2 rounded-md font-medium ${
                  content.trim() && !isLoading
                    ? 'text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={content.trim() && !isLoading ? {
                  backgroundColor: '#99AFD7',
                  ':hover': { backgroundColor: '#8BA5D1' }
                } : undefined}
              >
                {isLoading ? 'Saving...' : selectedEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Personal Journal</h1>
        
        {/* Journaling intro text and CTA - shown when no entries */}
        {entries.length === 0 && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-2">
              Journaling can act as a cathartic release, reducing stress levels.
            </p>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Start your Private Journal Journey
            </h2>
            <button
              onClick={() => setCurrentView('write')}
              className="text-white px-8 py-3 rounded-md transition-colors"
              style={{
                backgroundColor: '#99AFD7'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8BA5D1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#99AFD7'}
            >
              Begin
            </button>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {/* Statistics Button - only shown when there are entries */}
          {entries.length > 0 && (
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-sm px-4 py-2 rounded-md transition-colors"
              style={{
                backgroundColor: '#99AFD7',
                color: 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8BA5D1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#99AFD7'}
            >
              {showStats ? 'Hide Statistics' : 'View Statistics'}
            </button>
          )}
          
          {/* Encryption Button */}
          {encryptionStatus.isEnabled ? (
            <button
              onClick={() => setShowEncryptionSettings(true)}
              className="text-sm px-4 py-2 rounded-md transition-colors bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1"
            >
              🔐 Encrypted
            </button>
          ) : (
            <button
              onClick={() => {
                setLockClosing(true);
                setTimeout(() => {
                  setShowEncryptionSetup(true);
                  setLockClosing(false);
                }, 400);
              }}
              className="text-sm px-4 py-2 rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
            >
              <span className={`inline-block transition-transform duration-300 ${lockClosing ? 'scale-110' : ''}`}>
                {lockClosing ? '🔐' : '🔓'}
              </span>
              <span>Enable Encryption</span>
            </button>
          )}
        </div>
      </div>

      {/* Journal Stats - Collapsible */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-black">{entries.length}</div>
            <div className="text-sm text-gray-600">Total Entries</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-black">
              {entries.filter(entry => {
                const today = new Date();
                const entryDate = new Date(entry.created_at);
                return entryDate.toDateString() === today.toDateString();
              }).length}
            </div>
            <div className="text-sm text-gray-600">Today's Entries</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-black">
              {entries.filter(entry => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(entry.created_at) >= weekAgo;
              }).length}
            </div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-black">
              {entries.length > 0 ? Math.round(entries.reduce((sum, entry) => sum + (entry.mood_rating || 0), 0) / entries.filter(e => e.mood_rating).length) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Mood</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => {
            setCurrentView('write');
            // Clear any existing prompt when starting a new entry
            localStorage.removeItem('selectedJournalPrompt');
            selectedPromptRef.current = null;
            setSelectedPrompt(null);
            setTitle('');
            setContent('');
            setMoodRating(null);
            setTags([]);
            setSelectedEntry(null);
          }}
          className="text-white p-4 rounded-lg transition-colors text-left"
          style={{backgroundColor: '#99AFD7'}}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8BA5D1'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#99AFD7'}
        >
          <div className="font-semibold">New Journal Entry</div>
        </button>

        <button
          onClick={() => setCurrentView('prompts')}
          className="text-white p-4 rounded-lg transition-colors text-left"
          style={{backgroundColor: '#99AFD7'}}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8BA5D1'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#99AFD7'}
        >
          <div className="font-semibold">Prompt</div>
        </button>

        <button
          onClick={() => {
            const today = new Date().toDateString();
            const todayEntry = entries.find(entry => 
              new Date(entry.created_at).toDateString() === today
            );
            if (todayEntry) {
              editEntry(todayEntry);
            } else {
              setContent(`Today's Date: ${new Date().toLocaleDateString()}\n\nHow was my day?\n\n`);
              setCurrentView('write');
            }
          }}
          className="text-white p-4 rounded-lg transition-colors text-left"
          style={{backgroundColor: '#99AFD7'}}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8BA5D1'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#99AFD7'}
        >
          <div className="font-semibold">Today's Entry</div>
          <div className="text-sm opacity-90">Reflect on how you felt</div>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="space-y-4">
          {/* Search and Basic Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search your entries..."
              />
            </div>
            
            <select
              value={filterMood || ''}
              onChange={(e) => setFilterMood(e.target.value ? parseInt(e.target.value) : null)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All moods</option>
              {feelingCheckInOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-500">
              {filteredEntries.length} of {entries.length} entries
            </div>
          </div>

          {/* Date Filter */}
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-medium text-gray-700">Time Period:</span>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'year', label: 'This Year' },
                  { value: 'custom', label: 'Custom Range' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDateFilter(option.value as any);
                      if (option.value === 'custom') {
                        setShowDatePicker(true);
                      }
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      dateFilter === option.value
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: dateFilter === option.value ? '#99AFD7' : undefined,
                      ':hover': dateFilter === option.value ? { backgroundColor: '#8BA5D1' } : undefined
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {showDatePicker && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setDateFilter('custom');
                        setShowDatePicker(false);
                      }}
                      className="px-4 py-2 text-white rounded-md transition-colors"
                      style={{
                        backgroundColor: '#99AFD7',
                        ':hover': { backgroundColor: '#8BA5D1' }
                      }}
                    >
                      Apply Range
                    </button>
                    <button
                      onClick={() => {
                        setShowDatePicker(false);
                        setDateFilter('all');
                        setCustomDateRange({ start: '', end: '' });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Date Filter Summary */}
            {dateFilter !== 'all' && (
              <div className="mt-2 text-sm text-gray-600">
                {dateFilter === 'custom' && customDateRange.start && customDateRange.end ? (
                  <>Showing entries from {new Date(customDateRange.start).toLocaleDateString()} to {new Date(customDateRange.end).toLocaleDateString()}</>
                ) : dateFilter === 'today' ? (
                  <>Showing today's entries</>
                ) : dateFilter === 'week' ? (
                  <>Showing this week's entries</>
                ) : dateFilter === 'month' ? (
                  <>Showing this month's entries</>
                ) : dateFilter === 'year' ? (
                  <>Showing this year's entries</>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {filteredEntries.length === 0 && entries.length > 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No entries match your search
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or mood filter to find entries.
            </p>
          </div>
        ) : filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entry.title || `Entry from ${new Date(entry.created_at).toLocaleDateString()}`}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    {entry.mood_rating && (
                      <span className="flex items-center">
                        {feelingCheckInOptions.find(opt => opt.value === entry.mood_rating)?.emoji}
                        <span className="ml-1">
                          {feelingCheckInOptions.find(opt => opt.value === entry.mood_rating)?.label}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editEntry(entry)}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                    title="Edit entry"
                  >
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Delete entry"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3 line-clamp-3">
                {entry.content.substring(0, 200)}
                {entry.content.length > 200 && '...'}
              </p>
              
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
