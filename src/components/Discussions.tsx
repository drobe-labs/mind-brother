import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import NotificationSettings from './NotificationSettings';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  analyzeContent, 
  getCrisisResources, 
  getBlockedMessage,
  formatTriggerWarning
} from '../lib/communityModeration';
import {
  analyzeContentWithAI,
  trackUserBehavior,
  logCrisisResponse,
  createContentReport as createReport,
  createContentDispute
} from '../lib/moderationService';

// Safely import quill-mention CSS and module
// This prevents errors on platforms where it might not load correctly
let mentionModuleLoaded = false;
try {
  // Import CSS first
  require('quill-mention/dist/quill.mention.css');
  // Then import the module (this registers itself with Quill)
  require('quill-mention');
  mentionModuleLoaded = true;
  console.log('✅ quill-mention module loaded successfully');
} catch (e) {
  console.warn('⚠️ quill-mention not loaded - @mentions will be disabled:', e);
  mentionModuleLoaded = false;
}

// Extract mentioned usernames from HTML content
const extractMentions = (htmlContent: string): string[] => {
  const mentions: string[] = [];
  
  // Match mention spans: <span class="mention" data-value="username">@username</span>
  const mentionRegex = /data-value="([^"]+)"/g;
  let match;
  while ((match = mentionRegex.exec(htmlContent)) !== null) {
    if (match[1] && !mentions.includes(match[1])) {
      mentions.push(match[1]);
    }
  }
  
  // Also match plain @username patterns (fallback)
  const plainMentionRegex = /@([a-zA-Z0-9_-]+)/g;
  while ((match = plainMentionRegex.exec(htmlContent)) !== null) {
    if (match[1] && !mentions.includes(match[1])) {
      mentions.push(match[1]);
    }
  }
  
  console.log('📝 Extracted mentions from content:', mentions);
  return mentions;
};

// Send notifications to mentioned users
const sendMentionNotifications = async (
  mentionedUsernames: string[],
  mentionerUserId: string,
  topicId: string,
  topicTitle: string,
  replyPreview: string,
  replyId?: string
) => {
  console.log('🔔 === MENTION NOTIFICATION DEBUG ===');
  console.log('🔔 Mentioned usernames:', mentionedUsernames);
  console.log('🔔 Mentioner ID:', mentionerUserId);
  console.log('🔔 Topic ID:', topicId);
  
  if (mentionedUsernames.length === 0) {
    console.log('📭 No mentions to notify');
    return;
  }
  
  try {
    console.log('📬 Sending mention notifications to:', mentionedUsernames);
    
    const { supabase } = await import('../lib/supabase');
    
    // Get the mentioner's profile for the notification
    const { data: mentionerProfile, error: mentionerError } = await supabase
      .from('user_profiles')
      .select('username, first_name')
      .eq('user_id', mentionerUserId)
      .single();
    
    console.log('🔔 Mentioner profile:', mentionerProfile, 'Error:', mentionerError);
    
    const mentionerName = mentionerProfile?.username || mentionerProfile?.first_name || 'Someone';
    
    // First, let's see what users exist with these usernames (without filtering by mention_notifications)
    const { data: allMatchingUsers, error: debugError } = await supabase
      .from('user_profiles')
      .select('user_id, username, mention_notifications')
      .in('username', mentionedUsernames);
    
    console.log('🔔 All matching users (before filters):', allMatchingUsers, 'Error:', debugError);
    
    // Get mentioned users who have mention_notifications enabled (or null - treat null as enabled)
    const { data: mentionedUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, username, mention_notifications')
      .in('username', mentionedUsernames)
      .neq('user_id', mentionerUserId); // Don't notify yourself
    
    console.log('🔔 Mentioned users (after excluding self):', mentionedUsers, 'Error:', usersError);
    
    if (usersError) {
      console.error('❌ Error fetching mentioned users:', usersError);
      return;
    }
    
    // Filter to users with mention_notifications enabled or null (default to enabled)
    const usersToNotify = mentionedUsers?.filter(u => 
      u.mention_notifications === true || u.mention_notifications === null
    ) || [];
    
    if (usersToNotify.length === 0) {
      console.log('📭 No users with mention notifications enabled. Checked users:', mentionedUsers);
      return;
    }
    
    console.log('📬 Users to notify:', usersToNotify.length, usersToNotify);
    
    // Debug: Check auth state
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('🔐 Auth session check:', authData?.session ? 'Valid session' : 'No session', 'Error:', authError);
    console.log('🔐 Current user ID:', authData?.session?.user?.id);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Create in-app notifications for each mentioned user
    for (const user of usersToNotify) {
      try {
        console.log('🔔 Creating notification for user:', user.username, 'ID:', user.user_id);
        
        const notificationData = {
          user_id: user.user_id,
          type: 'mention',
          title: `${mentionerName} mentioned you`,
          message: `${mentionerName} mentioned you in "${topicTitle}": "${replyPreview.substring(0, 100)}${replyPreview.length > 100 ? '...' : ''}"`,
          data: {
            topic_id: topicId,
            mentioner_id: mentionerUserId,
            mentioner_name: mentionerName
          },
          read: false
        };
        
        console.log('🔔 Notification payload:', JSON.stringify(notificationData));
        
        // Insert notification record
        const { data: insertData, error: notifError } = await supabase
          .from('notifications')
          .insert(notificationData)
          .select();
        
        if (notifError) {
          console.error('❌ Could not create notification record:', notifError);
          console.error('❌ Error details:', JSON.stringify(notifError));
          errorCount++;
        } else {
          console.log('✅ Notification created successfully:', insertData);
          successCount++;
          
          // 🔥 Send real push notification via Edge Function
          try {
            console.log('🔥 Sending push notification to user:', user.user_id);
            const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: user.user_id,
                title: notificationData.title,
                body: notificationData.message,
                data: {
                  type: 'mention',
                  topic_id: topicId,
                  reply_id: replyId || '',
                  mentioner_id: mentionerUserId
                }
              }
            });
            
            if (pushError) {
              console.warn('⚠️ Push notification failed (user may not have push token):', pushError);
            } else {
              console.log('✅ Push notification sent:', pushData);
            }
          } catch (pushErr) {
            console.warn('⚠️ Push notification error:', pushErr);
          }
        }
        
      } catch (err) {
        console.error('❌ Error notifying user:', user.username, err);
        errorCount++;
      }
    }
    
    console.log(`✅ Mention notifications complete. Success: ${successCount}, Errors: ${errorCount}`);
    console.log('🔔 === END MENTION NOTIFICATION DEBUG ===');
  } catch (error) {
    console.error('❌ Error sending mention notifications:', error);
    console.log('🔔 === END MENTION NOTIFICATION DEBUG (WITH ERROR) ===');
  }
};

// Search users function - defined outside component to avoid closure issues
const searchUsersForMention = async (searchTerm: string): Promise<{ id: string; value: string; username: string }[]> => {
  if (!searchTerm || searchTerm.length < 1) {
    console.log('🔍 Empty search term, returning empty array');
    return [];
  }
  
  try {
    console.log('🔍 Searching for users with term:', searchTerm);
    
    // Import supabase dynamically to avoid circular dependency issues
    const { supabase } = await import('../lib/supabase');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, first_name, last_name')
      .or(`username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('❌ Error searching users:', error);
      return [];
    }

    console.log('📋 Found users:', data?.length || 0, data);

    const results = (data || [])
      .filter(user => user.username) // Only include users with usernames
      .map(user => ({
        id: user.user_id,
        value: user.username || `${user.first_name || 'User'}`,
        username: user.username || ''
      }));
    
    console.log('📝 Returning mention results:', results);
    return results;
  } catch (error) {
    console.error('❌ Exception in searchUsersForMention:', error);
    return [];
  }
};

// User mention interface
interface MentionUser {
  id: string;
  value: string;
  username: string;
}

interface DiscussionTopic {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  description?: string;
  category: string;
  tags?: string[];
  is_anonymous: boolean;
  reply_count: number;
  view_count: number;
  created_at: string;
  last_activity_at: string;
  auto_mod_status?: string;
  is_removed?: boolean;
  user_profiles?: {
    username?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface DiscussionReply {
  id: string;
  topic_id: string;
  user_id: string;
  parent_reply_id?: string;
  content: string;
  is_anonymous: boolean;
  helpful_count: number;
  created_at: string;
  auto_mod_status?: string;
  is_removed?: boolean;
  user_profiles?: {
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  replies?: DiscussionReply[];
}

const categories = [
  { value: 'anxiety', label: 'Anxiety & Stress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'depression', label: 'Depression & Mood', color: 'bg-blue-100 text-blue-800' },
  { value: 'relationships', label: 'Relationships', color: 'bg-pink-100 text-pink-800' },
  { value: 'work', label: 'Work & Career', color: 'bg-blue-100 text-blue-800' },
  { value: 'therapy', label: 'Therapy & Treatment', color: 'bg-green-100 text-green-800' },
  { value: 'self_care', label: 'Self-Care', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'cultural', label: 'Cultural Issues', color: 'bg-red-100 text-red-800' },
  { value: 'general', label: 'General Support', color: 'bg-gray-100 text-gray-800' }
];

interface DiscussionsProps {
  initialTopicId?: string | null;
  initialReplyId?: string | null;
  onTopicViewed?: () => void;
}

export default function Discussions({ initialTopicId, initialReplyId, onTopicViewed }: DiscussionsProps = {}) {
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'topic' | 'create'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Create topic form
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('general');
  const [newTopicTags, setNewTopicTags] = useState<string[]>([]);
  const [newTopicAnonymous, setNewTopicAnonymous] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Reply form
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Moderation state
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [disputingPost, setDisputingPost] = useState<{ id: string; type: 'topic' | 'reply' } | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [showDisputesAdmin, setShowDisputesAdmin] = useState(false);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  // Ref for quill editor
  const quillRef = useRef<any>(null);
  
  // Ref for reply form - to scroll when clicking Reply on a comment
  const replyFormRef = useRef<HTMLDivElement>(null);
  
  // Get the username of the reply being replied to
  const getReplyingToUsername = (): string | null => {
    if (!replyingTo || !replies) return null;
    const targetReply = replies.find(r => r.id === replyingTo);
    if (!targetReply) return null;
    if (targetReply.is_anonymous) return 'Anonymous';
    return targetReply.user_profiles?.username || 
           (targetReply.user_profiles?.first_name && targetReply.user_profiles?.last_name 
             ? `${targetReply.user_profiles.first_name} ${targetReply.user_profiles.last_name}`
             : 'User');
  };
  
  // Auto-scroll to reply form when replying to a comment
  useEffect(() => {
    if (replyingTo && replyFormRef.current) {
      console.log('📜 Scrolling to reply form for:', replyingTo);
      replyFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the editor after scrolling
      setTimeout(() => {
        if (quillRef.current) {
          const editor = quillRef.current.getEditor?.();
          if (editor) {
            editor.focus();
          }
        }
      }, 500);
    }
  }, [replyingTo]);

  // Quill modules configuration - conditionally include mention support
  const quillModules = useMemo(() => {
    console.log('📝 Building Quill modules, mentionModuleLoaded:', mentionModuleLoaded);
    
    const baseModules: any = {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
      ]
    };
    
    // Only add mention module if it was loaded successfully
    if (mentionModuleLoaded) {
      console.log('✅ Adding mention module to Quill config');
      baseModules.mention = {
        allowedChars: /^[A-Za-z0-9_\-]*$/,
        mentionDenotationChars: ['@'],
        showDenotationChar: true,
        spaceAfterInsert: true,
        defaultMenuOrientation: 'bottom',
        blotName: 'mention',
        dataAttributes: ['id', 'value', 'username'],
        renderItem: (item: MentionUser) => {
          return `<span class="mention-item">@${item.value}</span>`;
        },
        source: async function(searchTerm: string, renderList: (items: MentionUser[], searchTerm: string) => void) {
          console.log('🔎 Mention source triggered with:', searchTerm);
          try {
            const users = await searchUsersForMention(searchTerm);
            console.log('📝 Rendering user list:', users);
            renderList(users, searchTerm);
          } catch (err) {
            console.error('❌ Error in mention source:', err);
            renderList([], searchTerm);
          }
        },
        onSelect: (item: MentionUser, insertItem: (item: MentionUser) => void) => {
          console.log('✅ User selected:', item);
          insertItem(item);
        }
      };
    } else {
      console.log('⚠️ Mention module not loaded, skipping mention config');
    }
    
    return baseModules;
  }, []);

  // Quill formats to allow mentions (include mention only if module loaded)
  const quillFormats = useMemo(() => {
    const formats = ['bold', 'italic', 'underline', 'list', 'bullet', 'link'];
    if (mentionModuleLoaded) {
      formats.push('mention');
    }
    return formats;
  }, []);

  useEffect(() => {
    loadCurrentUser();
    loadTopics();
  }, [selectedCategory]);

  // Handle deep link navigation from push notifications
  useEffect(() => {
    const loadInitialTopic = async () => {
      if (initialTopicId) {
        console.log('🔗 Deep link: Loading topic from notification:', initialTopicId, 'reply:', initialReplyId);
        
        // Fetch the topic
        const { data: topic, error } = await supabase
          .from('discussion_topics')
          .select('*')
          .eq('id', initialTopicId)
          .single();
        
        if (topic && !error) {
          console.log('🔗 Deep link: Topic found, selecting:', topic.title);
          setSelectedTopic(topic);
          setCurrentView('topic');
          await loadReplies(topic.id);
          
          // Increment view count for deep-linked topic
          try {
            await supabase
              .from('discussion_topics')
              .update({ view_count: (topic.view_count || 0) + 1 })
              .eq('id', topic.id);
            setSelectedTopic(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
          } catch (e) {
            console.error('Failed to increment view count:', e);
          }
          
          // Scroll to specific reply if provided
          if (initialReplyId) {
            // Wait for replies to render, then scroll
            setTimeout(() => {
              const replyElement = document.getElementById(`reply-${initialReplyId}`);
              if (replyElement) {
                console.log('🔗 Deep link: Scrolling to reply:', initialReplyId);
                replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight the reply briefly
                replyElement.style.backgroundColor = '#fef3c7';
                setTimeout(() => {
                  replyElement.style.backgroundColor = '';
                  replyElement.style.transition = 'background-color 0.5s ease';
                }, 2000);
              } else {
                console.log('🔗 Deep link: Reply element not found:', initialReplyId);
              }
            }, 500);
          }
          
          // Notify parent that we've handled the topic
          if (onTopicViewed) {
            onTopicViewed();
          }
        } else {
          console.error('🔗 Deep link: Topic not found:', error);
        }
      }
    };
    
    loadInitialTopic();
  }, [initialTopicId, initialReplyId]);

  const loadCurrentUser = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      // Load user profile with role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username, first_name, last_name, user_type')
        .eq('user_id', user.user.id)
        .single();
      
      setCurrentUser({
        ...user.user,
        profile: profile
      });
      if (profile) {
        setIsModerator(profile.user_type === 'admin' || profile.user_type === 'moderator');
      }
    }
  };

  const loadOpenDisputes = async () => {
    try {
      setDisputesLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const { data, error } = await supabase
        .from('content_disputes')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error loading disputes:', error);
        setDisputes([]);
        return;
      }
      const topicIds = (data || []).filter(d => d.content_type === 'topic').map(d => d.content_id);
      const replyIds = (data || []).filter(d => d.content_type === 'reply').map(d => d.content_id);
      const [topicsRes, repliesRes] = await Promise.all([
        topicIds.length > 0
          ? supabase.from('discussion_topics').select('id, title, content, auto_mod_status, user_id').in('id', topicIds)
          : Promise.resolve({ data: [] as any[] }),
        replyIds.length > 0
          ? supabase.from('discussion_replies').select('id, content, auto_mod_status, user_id').in('id', replyIds)
          : Promise.resolve({ data: [] as any[] })
      ]);
      const topicMap = new Map((topicsRes as any).data?.map((t: any) => [t.id, t]) || []);
      const replyMap = new Map((repliesRes as any).data?.map((r: any) => [r.id, r]) || []);
      const enriched = (data || []).map(d => {
        const content =
          d.content_type === 'topic'
            ? topicMap.get(d.content_id)
            : replyMap.get(d.content_id);
        return { ...d, contentPreview: content || null };
      });
      setDisputes(enriched);
    } catch (e) {
      console.error('Disputes load failed:', e);
      setDisputes([]);
    } finally {
      setDisputesLoading(false);
    }
  };

  const resolveDispute = async (id: string, resolution: 'accepted' | 'rejected' | 'withdrawn') => {
    try {
      const notes = resolutionNotes[id] || '';
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://mind-brother-production.up.railway.app'}/api/moderation/disputes/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolvedBy: user.user.id,
          resolution,
          notes
        })
      });
      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to resolve dispute');
      }
      setDisputes(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Resolve dispute error:', err);
      alert('Failed to resolve dispute. Please try again.');
    }
  };

  const loadTopics = async () => {
    try {
      // First, load all topics (exclude deleted)
      let query = supabase
        .from('discussion_topics')
        .select('*')
        .eq('is_removed', false) // Filter out deleted topics
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data: topicsData, error: topicsError } = await query;

      if (topicsError) {
        console.error('Error loading topics:', topicsError);
        alert(`Error loading discussions: ${topicsError.message}`);
        throw topicsError;
      }
      
      // Then, load user profiles separately for each topic
      if (topicsData && topicsData.length > 0) {
        const userIds = [...new Set(topicsData.map(t => t.user_id))];
        
        // Try to load profiles - if it fails, just show topics without profiles
        const { data: profilesData, error: profileError } = await supabase
          .from('user_profiles')
          .select('user_id, username, first_name, last_name')
          .in('user_id', userIds);
        
        if (profileError) {
          console.warn('Could not load user profiles:', profileError);
          // Just show topics without profile info
          console.log('Loaded topics (no profiles):', topicsData);
          setTopics(topicsData);
          return;
        }
        
        // Map profiles to topics
        const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const enrichedTopics = topicsData.map(topic => ({
          ...topic,
          user_profiles: profileMap.get(topic.user_id) || null
        }));
        
        console.log('Loaded topics:', enrichedTopics);
        setTopics(enrichedTopics);
      } else {
        console.log('No topics found');
        setTopics([]);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadReplies = async (topicId: string) => {
    try {
      console.log('📥 Loading replies for topic:', topicId);
      
      // First get replies - simpler query to avoid potential issues
      const { data: repliesData, error: repliesError } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });
      
      console.log('📋 Raw replies query result:', {
        count: repliesData?.length || 0,
        error: repliesError,
        errorMessage: repliesError?.message,
        errorCode: repliesError?.code,
        errorDetails: repliesError?.details,
        errorHint: repliesError?.hint
      });

      if (repliesError) {
        console.error('❌ Supabase error loading replies:', JSON.stringify(repliesError, null, 2));
        throw repliesError;
      }
      
      // Filter out removed replies in JS (more reliable than DB filter)
      const activeReplies = (repliesData || []).filter(r => !r.is_removed && !r.parent_reply_id);
      console.log('📋 Active replies after filtering:', activeReplies.length);

      // Then get user profiles for each reply
      if (activeReplies && activeReplies.length > 0) {
        const userIds = [...new Set(activeReplies.map(r => r.user_id))];
        console.log('📋 Fetching profiles for user IDs:', userIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, username, first_name, last_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('⚠️ Could not load user profiles:', profilesError);
          setReplies(activeReplies); // Still show replies without profile data
          return;
        }

        console.log('📋 Profiles loaded:', profilesData?.length || 0);

        // Merge profile data into replies
        const repliesWithProfiles = activeReplies.map(reply => ({
          ...reply,
          user_profiles: profilesData?.find(p => p.user_id === reply.user_id) || null
        }));

        console.log('✅ Setting replies with profiles:', repliesWithProfiles.length);
        setReplies(repliesWithProfiles);
      } else {
        console.log('📭 No active replies found');
        setReplies([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading replies:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack?.substring(0, 500)
      });
      setReplies([]); // Show empty instead of failing
    }
  };

  const createTopic = async () => {
    if (!newTopicTitle.trim()) return;

    // Strip HTML tags for validation
    const stripHtml = (html: string) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    // Validate description has actual content
    const descriptionText = stripHtml(newTopicDescription);
    if (!descriptionText.trim()) {
      alert('Please provide a description for your discussion.');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // ⭐ LAYER 1: Keyword-based moderation (fast, blocks immediately)
      const analysis = analyzeContent(descriptionText);
      
      // If content is blocked, prevent posting
      if (analysis.blocked) {
        const crisisResources = getCrisisResources();
        const fullMessage = getBlockedMessage(analysis.reason || '') + '\n\n' + crisisResources;
        alert(fullMessage);
        return;
      }

      // ⭐ LAYER 2: Pattern Detection (duplicate content, rapid posting)
      const behaviorTracking = await trackUserBehavior(user.user.id, 'post', descriptionText);
      
      if (behaviorTracking?.isDuplicate) {
        alert('This content appears to be a duplicate of a recent post. Please check if you\'ve already posted this.');
        return;
      }

      // Rate limit removed - no posting limits in community discussions
      // if (behaviorTracking?.isRapid) { ... }

      // ⭐ LAYER 3: Prepare content with trigger warnings
      let finalContent = newTopicDescription;
      let riskLevel = analysis.riskLevel || 'none';
      let autoModStatus = 'approved';

      if (analysis.needsTriggerWarning || selectedTriggers.length > 0) {
        const triggers = selectedTriggers.length > 0 
          ? selectedTriggers 
          : analysis.suggestedTriggers;
        const warning = formatTriggerWarning(triggers);
        finalContent = `${warning}\n\n${finalContent}`;
      }

      // If flagged for review, add crisis resources and set status
      if (analysis.flagged) {
        if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
          const crisisResources = getCrisisResources();
          finalContent = `${finalContent}\n\n---\n\n${crisisResources}`;
          autoModStatus = 'flagged';
          
          // Log crisis response
          const topicId = crypto.randomUUID(); // Will be replaced with actual ID after insert
          await logCrisisResponse(
            user.user.id,
            topicId,
            'topic',
            analysis.riskLevel === 'critical' ? 'critical' : 'high',
            'add_resources'
          );
        }
      }

      // Insert topic with moderation metadata
      const { data: topicData, error } = await supabase
        .from('discussion_topics')
        .insert({
          user_id: user.user.id,
          title: newTopicTitle.trim(),
          content: finalContent,
          category: newTopicCategory,
          tags: newTopicTags.length > 0 ? newTopicTags : null,
          is_anonymous: newTopicAnonymous,
          auto_mod_status: autoModStatus,
          risk_level: riskLevel,
          crisis_resources_added: (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical')
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        alert(`Database error: ${error.message}\n\nCode: ${error.code}\n\nHint: ${error.hint || 'Check browser console for details'}`);
        throw error;
      }

      // ⭐ LAYER 4: AI-Powered Analysis (background, async - doesn't block posting)
      if (topicData?.id) {
        // Run AI analysis in background
        analyzeContentWithAI(descriptionText, 'topic').then(async (aiResult) => {
          if (aiResult.success && aiResult.analysis) {
            // Update topic with AI analysis
            await supabase
              .from('discussion_topics')
              .update({
                ai_analysis_json: aiResult.analysis,
                ai_analyzed_at: new Date().toISOString(),
                risk_level: aiResult.analysis.riskLevel || riskLevel,
                auto_mod_status: aiResult.analysis.recommendedAction === 'remove' ? 'blocked' 
                  : aiResult.analysis.recommendedAction === 'flag' ? 'flagged' 
                  : 'approved'
              })
              .eq('id', topicData.id);

            // If AI detects crisis, trigger response
            if (aiResult.analysis.riskLevel === 'critical' || aiResult.analysis.riskLevel === 'high') {
              await logCrisisResponse(
                user.user.id,
                topicData.id,
                'topic',
                aiResult.analysis.riskLevel === 'critical' ? 'critical' : 'high',
                'ai_detected'
              );
            }
          }
        }).catch(err => {
          console.error('Background AI analysis failed:', err);
          // Don't block the user, just log the error
        });
      }

      // Reset form
      setNewTopicTitle('');
      setNewTopicDescription('');
      setNewTopicCategory('general');
      setNewTopicTags([]);
      setNewTopicAnonymous(false);
      setNewTag('');
      setSelectedTriggers([]);

      // Reload topics
      await loadTopics();
      setCurrentView('list');
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Failed to create topic. Please try again.');
    }
  };

  const reportPost = async (postId: string, postType: 'topic' | 'reply') => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting this content.');
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Use moderation service to create report
      const result = await createReport(postId, postType, reportReason);
      
      if (result.success) {
        alert('Thank you for your report. Our moderation team will review this content.');
        setReportingPostId(null);
        setReportReason('');
      } else {
        throw new Error('Failed to create report');
      }
    } catch (error: any) {
      console.error('Error reporting content:', error);
      if (error.message && error.message.includes('Daily report limit')) {
        alert(error.message);
      } else {
        alert('Thank you for your report. Our moderation team has been notified.');
      }
      setReportingPostId(null);
      setReportReason('');
    }
  };

  const createReply = async () => {
    if (!selectedTopic || !selectedTopic.id) {
      console.error('Cannot create reply: selectedTopic is null or missing id');
      alert('Error: No topic selected. Please try again.');
      return;
    }

    // Strip HTML tags for validation
    const stripHtml = (html: string) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    // Validate reply has actual content
    const replyText = stripHtml(replyContent);
    if (!replyText.trim()) {
      alert('Please provide a reply.');
      return;
    }

    try {
      // Check if user is logged in
      if (!currentUser) {
        alert('Please log in to reply.\n\nYou need to be signed in to participate in discussions.');
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        alert('Your session has expired. Please log in again to reply.');
        return;
      }

      // ⭐ LAYER 1: Keyword-based moderation
      const analysis = analyzeContent(replyText);
      
      // Block prohibited content
      if (analysis.blocked) {
        const crisisResources = getCrisisResources();
        const fullMessage = getBlockedMessage(analysis.reason || '') + '\n\n' + crisisResources;
        alert(fullMessage);
        return;
      }

      // ⭐ LAYER 2: Pattern Detection
      const behaviorTracking = await trackUserBehavior(user.user.id, 'reply', replyText);
      
      if (behaviorTracking?.isDuplicate) {
        alert('This content appears to be a duplicate. Please check if you\'ve already posted this.');
        return;
      }

      // Rate limit removed - no posting limits in community discussions
      // if (behaviorTracking?.isRapid) { ... }

      let riskLevel = analysis.riskLevel || 'none';
      let autoModStatus = 'approved';
      let finalContent = replyContent;

      // Add crisis resources if high risk
      if (analysis.flagged && (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical')) {
        const crisisResources = getCrisisResources();
        finalContent = `${replyContent}\n\n---\n\n${crisisResources}`;
        autoModStatus = 'flagged';
        
        // Log crisis response
        await logCrisisResponse(
          user.user.id,
          selectedTopic.id,
          'reply',
          analysis.riskLevel === 'critical' ? 'critical' : 'high',
          'add_resources'
        );
      }

      setIsLoading(true);

      const replyData = {
        topic_id: selectedTopic.id,
        user_id: user.user.id,
        content: finalContent,
        parent_reply_id: replyingTo || null,
        auto_mod_status: autoModStatus,
        risk_level: riskLevel,
        crisis_resources_added: (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical')
      };

      const { data, error } = await supabase
        .from('discussion_replies')
        .insert(replyData)
        .select();

      if (error) {
        console.error('❌ Database error creating reply:', error);
        console.error('📋 Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Show more specific error message
        let errorMessage = 'Failed to create reply.\n\n';
        if (error.message) {
          errorMessage += `Error: ${error.message}\n`;
        }
        if (error.code) {
          errorMessage += `Code: ${error.code}\n`;
        }
        if (error.details) {
          errorMessage += `Details: ${error.details}\n`;
        }
        if (error.hint) {
          errorMessage += `Hint: ${error.hint}\n`;
        }
        errorMessage += '\nPlease check the browser console for more details.';
        alert(errorMessage);
        return;
      }

      console.log('Reply created successfully:', data);

      // Get the reply ID for notifications and AI analysis
      const newReplyId = data && data.length > 0 ? data[0].id : null;

      // Increment reply count on the topic
      if (selectedTopic) {
        try {
          await supabase
            .from('discussion_topics')
            .update({ 
              reply_count: (selectedTopic.reply_count || 0) + 1,
              last_activity_at: new Date().toISOString()
            })
            .eq('id', selectedTopic.id);
        } catch (e) {
          console.error('Failed to increment reply count:', e);
        }
      }

      // ⭐ LAYER 4: AI-Powered Analysis (background, async)
      if (newReplyId) {
        analyzeContentWithAI(replyText, 'reply').then(async (aiResult) => {
          if (aiResult.success && aiResult.analysis) {
            // Update reply with AI analysis
            await supabase
              .from('discussion_replies')
              .update({
                ai_analysis_json: aiResult.analysis,
                ai_analyzed_at: new Date().toISOString(),
                risk_level: aiResult.analysis.riskLevel || riskLevel,
                auto_mod_status: aiResult.analysis.recommendedAction === 'remove' ? 'blocked' 
                  : aiResult.analysis.recommendedAction === 'flag' ? 'flagged' 
                  : autoModStatus
              })
              .eq('id', newReplyId);

            // If AI detects crisis, trigger response
            if (aiResult.analysis.riskLevel === 'critical' || aiResult.analysis.riskLevel === 'high') {
              await logCrisisResponse(
                user.user.id,
                newReplyId,
                'reply',
                aiResult.analysis.riskLevel === 'critical' ? 'critical' : 'high',
                'ai_detected'
              );
            }
          }
        }).catch(err => {
          console.error('Background AI analysis failed:', err);
        });
      }

      // Reset form first
      setReplyContent('');
      setReplyAnonymous(false);
      setReplyingTo(null);

      // Reload the topic to get updated reply count and other data
      if (selectedTopic && selectedTopic.id) {
        // Reload the topic data
        const { data: updatedTopicData, error: topicError } = await supabase
          .from('discussion_topics')
          .select('*')
          .eq('id', selectedTopic.id)
          .single();

        if (!topicError && updatedTopicData) {
          // Update selectedTopic with fresh data
          const userIds = [updatedTopicData.user_id];
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('user_id, username, first_name, last_name')
            .in('user_id', userIds);

          setSelectedTopic({
            ...updatedTopicData,
            user_profiles: profileData?.[0] || null
          });
        }

        // ⭐ LAYER 5: Send mention notifications
        const mentionedUsernames = extractMentions(replyContent);
        if (mentionedUsernames.length > 0) {
          // Get topic title for notification
          const topicTitle = selectedTopic.title || 'a discussion';
          const replyPreview = replyText.substring(0, 150);
          
          // Send notifications (async, don't block)
          sendMentionNotifications(
            mentionedUsernames,
            user.user.id,
            selectedTopic.id,
            topicTitle,
            replyPreview,
            newReplyId || undefined
          ).catch(err => console.error('Error sending mention notifications:', err));
        }

        // Reload replies
        await loadReplies(selectedTopic.id);
      }
    } catch (error: any) {
      console.error('❌ Exception creating reply:', error);
      console.error('📋 Exception details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      let errorMessage = 'Failed to create reply.\n\n';
      if (error?.message) {
        errorMessage += `Error: ${error.message}\n`;
      }
      if (error?.name) {
        errorMessage += `Type: ${error.name}\n`;
      }
      errorMessage += '\nPlease check the browser console for more details.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openTopic = async (topic: DiscussionTopic) => {
    setSelectedTopic(topic);
    setCurrentView('topic');
    await loadReplies(topic.id);
    
    // Increment view count
    try {
      const { error } = await supabase
        .from('discussion_topics')
        .update({ view_count: (topic.view_count || 0) + 1 })
        .eq('id', topic.id);
      
      if (!error) {
        // Update local state with new view count
        setSelectedTopic(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
      }
    } catch (e) {
      console.error('Failed to increment view count:', e);
    }
  };

  const addTopicTag = () => {
    if (newTag.trim() && !newTopicTags.includes(newTag.trim().toLowerCase())) {
      setNewTopicTags([...newTopicTags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTopicTag = (tagToRemove: string) => {
    setNewTopicTags(newTopicTags.filter(tag => tag !== tagToRemove));
  };

  const getUserDisplayName = (userProfile: any, isAnonymous: boolean) => {
    if (isAnonymous) return 'Anonymous';
    if (!userProfile) return 'Unknown User';
    // Use username if available, otherwise fall back to first name + last initial
    if (userProfile.username) return `@${userProfile.username}`;
    return `${userProfile.first_name || ''} ${(userProfile.last_name || '').charAt(0)}`.trim() || 'User';
  };

  const filteredTopics = (topics || []).filter(topic => {
    if (!topic || !topic.title) return false;
    const matchesSearch = !searchTerm || 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Delete reply function
  const deleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Check if user is the author or a moderator
      const reply = replies.find(r => r.id === replyId);
      if (!reply) throw new Error('Reply not found');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', user.user.id)
        .single();

      const isModerator = profile?.user_type === 'admin' || profile?.user_type === 'moderator';
      const isAuthor = reply.user_id === user.user.id;

      if (!isAuthor && !isModerator) {
        alert('You do not have permission to delete this reply.');
        return;
      }

      // Soft delete: mark as removed
      const { error } = await supabase
        .from('discussion_replies')
        .update({
          is_removed: true,
          removed_at: new Date().toISOString(),
          removed_by: user.user.id,
          content: '[This reply has been deleted]'
        })
        .eq('id', replyId);

      if (error) throw error;

      // Reload replies
      if (selectedTopic?.id) {
        await loadReplies(selectedTopic.id);
      }

      // Log moderation action if moderator
      if (isModerator && !isAuthor) {
        await supabase
          .from('moderation_log')
          .insert({
            moderator_id: user.user.id,
            action_type: 'remove_reply',
            target_user_id: reply.user_id,
            target_content_id: replyId,
            content_type: 'reply',
            reason: 'Removed by moderator',
            notes: 'User requested deletion or content violated guidelines'
          });
      }
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      alert('Failed to delete reply. Please try again.');
    }
  };

  // Delete topic function
  const deleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This will also delete all replies. This action cannot be undone.')) {
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Check if user is the author or a moderator
      const topic = topics.find(t => t.id === topicId);
      if (!topic) throw new Error('Topic not found');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', user.user.id)
        .single();

      const isModerator = profile?.user_type === 'admin' || profile?.user_type === 'moderator';
      const isAuthor = topic.user_id === user.user.id;

      if (!isAuthor && !isModerator) {
        alert('You do not have permission to delete this topic.');
        return;
      }

      // Soft delete: mark as removed
      const { error } = await supabase
        .from('discussion_topics')
        .update({
          is_removed: true,
          removed_at: new Date().toISOString(),
          removed_by: user.user.id,
          title: '[Deleted]',
          content: '[This topic has been deleted]'
        })
        .eq('id', topicId);

      if (error) throw error;

      // Reload topics
      await loadTopics();

      // If we're viewing this topic, go back to list
      if (selectedTopic?.id === topicId) {
        setCurrentView('list');
        setSelectedTopic(null);
      }

      // Log moderation action if moderator
      if (isModerator && !isAuthor) {
        await supabase
          .from('moderation_log')
          .insert({
            moderator_id: user.user.id,
            action_type: 'remove_post',
            target_user_id: topic.user_id,
            target_content_id: topicId,
            content_type: 'topic',
            reason: 'Removed by moderator',
            notes: 'User requested deletion or content violated guidelines'
          });
      }
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic. Please try again.');
    }
  };

  // Reply component - must be defined before return statements that use it
  const ReplyComponent = ({ reply, depth = 0 }: { reply: DiscussionReply; depth?: number }) => {
    if (!reply || !reply.id || reply.is_removed) return null;

    const isAuthor = currentUser && reply.user_id === currentUser.id;
    const canDelete = isAuthor; // Users can delete their own replies
    const canDispute = isAuthor && (reply.auto_mod_status === 'flagged' || reply.auto_mod_status === 'blocked');
    
    return (
      <div id={`reply-${reply.id}`} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4 transition-colors duration-500`}>
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden">
          {/* Header row - wraps on mobile */}
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
            {/* User info and date */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-gray-900">
                {getUserDisplayName(reply.user_profiles, reply.is_anonymous || false)}
              </span>
              <span className="text-sm text-gray-500">
                {reply.created_at ? new Date(reply.created_at).toLocaleDateString() : 'Unknown date'}
              </span>
              {reply.helpful_count > 0 && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {reply.helpful_count} helpful
                </span>
              )}
            </div>
            {/* Action buttons - shrink and wrap */}
            {(canDelete || canDispute) && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {canDelete && (
                  <button
                    onClick={() => deleteReply(reply.id)}
                    className="text-xs text-red-600 hover:text-red-700 active:text-red-800 px-2 py-1 rounded hover:bg-red-50 whitespace-nowrap"
                    title="Delete this reply"
                  >
                    🗑️ Delete
                  </button>
                )}
                {canDispute && (
                  <button
                    onClick={() => setDisputingPost({ id: reply.id, type: 'reply' })}
                    className="text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 whitespace-nowrap"
                    title="Dispute moderation decision"
                  >
                    📝 Dispute
                  </button>
                )}
              </div>
            )}
          </div>
          
          {reply.content && (
            <div 
              className="text-gray-700 mb-3 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: reply.content }}
            />
          )}
        
          <div className="flex space-x-2 text-sm mt-2">
            <button 
              className="text-indigo-600 hover:text-indigo-700 active:text-indigo-800 transition-colors px-3 py-2 min-h-[44px] min-w-[44px] rounded-md hover:bg-indigo-50 active:bg-indigo-100 flex items-center justify-center"
              onClick={() => {
                console.log('👍 Helpful button clicked for reply:', reply.id);
                // TODO: Implement helpful vote
                alert('Helpful vote feature coming soon!');
              }}
            >
              👍 Helpful
            </button>
            <button 
              onClick={() => {
                console.log('💬 Reply button clicked for reply:', reply.id);
                setReplyingTo(reply.id);
              }}
              className="text-gray-600 hover:text-gray-700 active:text-gray-800 transition-colors px-3 py-2 min-h-[44px] min-w-[44px] rounded-md hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center"
            >
              💬 Reply
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create topic view
  if (currentView === 'create') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10" style={{lineHeight: '1.5'}}>
        <div className="mb-8">
          <button
            onClick={() => setCurrentView('list')}
            className="text-indigo-600 hover:text-indigo-700 transition-colors text-[15px]"
          >
            ← Back to Discussions
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-[28px] font-bold text-gray-900 mb-8">Start a New Discussion</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                Discussion Title *
              </label>
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What would you like to discuss?"
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={newTopicCategory}
                onChange={(e) => setNewTopicCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ⚠️ Trigger Warning Checkbox */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="hasTriggerWarning"
                  checked={selectedTriggers.length > 0}
                  onChange={(e) => {
                    if (!e.target.checked) {
                      setSelectedTriggers([]);
                    }
                  }}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="hasTriggerWarning" className="text-sm font-medium text-yellow-900">
                    This post contains sensitive content
                  </label>
                  <p className="text-xs text-yellow-700 mt-1">
                    Adding a trigger warning helps others prepare for potentially triggering content
                  </p>
                  
                  {selectedTriggers.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-yellow-900">Select topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Depression', 'Suicide/Suicidal Thoughts', 'Self-Harm', 'Eating Disorders', 'Substance Use', 'Trauma/PTSD', 'Sexual Assault', 'Death/Grief', 'Panic Attacks'].map(topic => (
                          <button
                            key={topic}
                            onClick={() => {
                              if (selectedTriggers.includes(topic)) {
                                setSelectedTriggers(selectedTriggers.filter(t => t !== topic));
                              } else {
                                setSelectedTriggers([...selectedTriggers, topic]);
                              }
                            }}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                              selectedTriggers.includes(topic)
                                ? 'bg-yellow-600 text-white border-yellow-600'
                                : 'bg-white text-yellow-700 border-yellow-300 hover:border-yellow-400'
                            }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="bg-white rounded-md border border-gray-300">
                <ReactQuill
                  theme="snow"
                  value={newTopicDescription}
                  onChange={setNewTopicDescription}
                  placeholder="Provide more context about your discussion topic... Type @ to mention a user"
                  modules={quillModules}
                  formats={quillFormats}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-gray-500 px-3 py-1 bg-gray-50 border-t border-gray-200">
                  💡 Tip: Type <span className="font-mono bg-gray-200 px-1 rounded">@username</span> to mention someone
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {newTopicTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                    <button
                      onClick={() => removeTopicTag(tag)}
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
                  onKeyPress={(e) => e.key === 'Enter' && addTopicTag()}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a tag (e.g., anxiety, work, relationships)"
                />
                <button
                  onClick={addTopicTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="anonymous"
                checked={newTopicAnonymous}
                onChange={(e) => setNewTopicAnonymous(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700">
                Post anonymously
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCurrentView('list')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-[16px] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={createTopic}
                disabled={!newTopicTitle.trim()}
                className={`px-6 py-2 rounded-md text-[16px] font-semibold ${
                  newTopicTitle.trim()
                    ? 'text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                style={newTopicTitle.trim() ? {
                  backgroundColor: '#4470AD'
                } : undefined}
                onMouseEnter={(e) => newTopicTitle.trim() && (e.currentTarget.style.backgroundColor = '#3A5F9A')}
                onMouseLeave={(e) => newTopicTitle.trim() && (e.currentTarget.style.backgroundColor = '#4470AD')}
              >
                Create Discussion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Topic view
  if (currentView === 'topic') {
    // If no topic selected, redirect to list
    if (!selectedTopic) {
      // This shouldn't happen, but handle gracefully
      return (
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => setCurrentView('list')}
            className="text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            ← Back to Discussions
          </button>
          <div className="mt-8 text-center">
            <p className="text-gray-600">No topic selected. Redirecting to discussions...</p>
          </div>
        </div>
      );
    }

    // Render topic view
    return (
      <div className="max-w-4xl mx-auto px-6 py-10" style={{lineHeight: '1.5'}}>
        <div className="mb-8">
          <button
            onClick={() => setCurrentView('list')}
            className="text-indigo-600 hover:text-indigo-700 transition-colors text-[15px]"
          >
            ← Back to Discussions
          </button>
        </div>

        {/* Topic Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-[14px] ${
              categories.find(cat => cat.value === selectedTopic.category)?.color || 'bg-gray-100 text-gray-800'
            }`}>
              {categories.find(cat => cat.value === selectedTopic.category)?.label}
            </span>
            {selectedTopic.tags?.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-[28px] font-bold text-gray-900 mb-4">{selectedTopic.title || 'Untitled Topic'}</h1>
          
          {(selectedTopic.content || selectedTopic.description) && (
            <div 
              className="text-[15px] text-gray-700 mb-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedTopic.content || selectedTopic.description || '' }}
            />
          )}
          
          <div className="flex items-center justify-between text-[14px] text-gray-500">
            <span>
              Started by {getUserDisplayName(selectedTopic.user_profiles, selectedTopic.is_anonymous || false)} on{' '}
              {selectedTopic.created_at ? new Date(selectedTopic.created_at).toLocaleDateString() : 'Unknown date'}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex space-x-4">
                <span>{selectedTopic.view_count || 0} views</span>
                <span>{selectedTopic.reply_count || 0} replies</span>
              </div>
              {currentUser && selectedTopic.user_id === currentUser.id && (
                <button
                  onClick={() => deleteTopic(selectedTopic.id)}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline"
                  title="Delete this topic"
                >
                  🗑️ Delete Topic
                </button>
              )}
            </div>
          </div>
        </div>

        {/* New Reply Form */}
        <div 
          ref={replyFormRef}
          className={`bg-white rounded-lg shadow-sm border p-6 mb-10 ${replyingTo ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200'}`}
        >
          <h3 className="text-[20px] font-bold text-gray-900 mb-2">
            {replyingTo ? 'Reply to Comment' : 'Add Your Reply'}
          </h3>
          
          {/* Show login prompt if not authenticated */}
          {!currentUser ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800 font-medium mb-2">🔐 Please log in to reply</p>
              <p className="text-blue-600 text-sm">You need to be signed in to participate in discussions.</p>
            </div>
          ) : (
            <>
              {replyingTo && (
                <p className="text-sm text-indigo-600 mb-4 flex items-center">
                  <span className="mr-2">💬</span>
                  Replying to <strong className="mx-1">{getReplyingToUsername()}</strong>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="ml-2 text-gray-500 hover:text-gray-700 underline text-xs"
                  >
                    (cancel)
                  </button>
                </p>
              )}
              
              <div className="space-y-4">
                <div className="bg-white rounded-md border border-gray-300">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={replyContent}
                    onChange={setReplyContent}
                    placeholder="Share your thoughts, experiences, or advice... Type @ to mention a user"
                    modules={quillModules}
                    formats={quillFormats}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-gray-500 px-3 py-1 bg-gray-50 border-t border-gray-200">
                    💡 Tip: Type <span className="font-mono bg-gray-200 px-1 rounded">@username</span> to mention someone
                  </p>
                </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="replyAnonymous"
                  checked={replyAnonymous}
                  onChange={(e) => setReplyAnonymous(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="replyAnonymous" className="text-sm text-gray-700">
                  Reply anonymously
                </label>
              </div>
              
              <div className="flex space-x-3">
                {replyingTo && (
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel Reply
                  </button>
                )}
                <button
                  onClick={createReply}
                  disabled={!replyContent.trim() || isLoading}
                  className={`px-6 py-2 rounded-md text-[16px] font-semibold ${
                    replyContent.trim() && !isLoading
                      ? 'text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  style={replyContent.trim() && !isLoading ? {
                    backgroundColor: '#4470AD'
                  } : undefined}
                  onMouseEnter={(e) => replyContent.trim() && !isLoading && (e.currentTarget.style.backgroundColor = '#3A5F9A')}
                  onMouseLeave={(e) => replyContent.trim() && !isLoading && (e.currentTarget.style.backgroundColor = '#4470AD')}
                >
                  {isLoading ? 'Posting...' : replyingTo ? 'Reply' : 'Post Reply'}
                </button>
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {/* Replies */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-[20px] font-bold text-gray-900 mb-6">
            Replies ({selectedTopic.reply_count || replies.length || 0})
          </h3>
          
          {replies.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-4 font-bold text-gray-400">💭</div>
              <h4 className="text-[18px] font-semibold text-gray-900 mb-2">No replies yet</h4>
              <p className="text-[15px] text-gray-600">Be the first to share your thoughts on this topic!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {replies && replies.length > 0 ? replies.map(reply => (
                reply && reply.id ? (
                  <ReplyComponent key={reply.id} reply={reply} />
                ) : null
              )) : null}
            </div>
          )}
        </div>

        {/* Notification Settings Modal */}
        {showNotificationSettings && currentUser && (
          <NotificationSettings
            userId={currentUser.id}
            onClose={() => setShowNotificationSettings(false)}
          />
        )}
      </div>
    );
  }

  // Main discussion list view
  return (
    <div className="max-w-6xl mx-auto px-6 py-10" style={{lineHeight: '1.5'}}>
      <div className="pt-6 mb-8">
        <h1 className="text-[28px] font-bold text-gray-900 mb-3">Community Discussions</h1>
        <p className="text-[15px] text-gray-600 mb-8">
          Connect with others, share experiences, and support each other on your mental health journey.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <button
          onClick={() => setCurrentView('create')}
          className="text-white transition-colors text-[16px] font-semibold w-fit"
          style={{
            padding: '16px 32px',
            borderRadius: '12px',
            backgroundColor: '#4470AD',
            marginLeft: '0'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A5F9A'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4470AD'}
        >
          Start New Discussion
        </button>
        
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center space-x-2"
            title="Notification Settings"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Settings</span>
          </button>
          
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search discussions..."
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discussion Topics */}
      <div className="space-y-6 mt-10">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <h3 className="text-[20px] font-bold text-gray-900 mb-2">
              {topics.length === 0 ? 'No discussions yet' : 'No discussions match your search'}
            </h3>
            <p className="text-[15px] text-gray-600 mb-4">
              {topics.length === 0 
                ? 'Be the first to start a meaningful discussion in our community.'
                : 'Try adjusting your search or category filter.'
              }
            </p>
            {topics.length === 0 && (
              <button
                onClick={() => setCurrentView('create')}
                className="text-white px-6 py-2 rounded-md transition-colors text-[16px] font-semibold"
                style={{
                  backgroundColor: '#4470AD'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A5F9A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4470AD'}
              >
                Start First Discussion
              </button>
            )}
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => openTopic(topic)}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer mx-6"
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderRadius: '16px'
              }}
            >
              <div className="mb-3">
                <span 
                  className="inline-block px-3 py-1.5 rounded-lg text-sm mb-3"
                  style={{
                    backgroundColor: 'rgba(74, 95, 127, 0.1)',
                    color: '#4A5F7F'
                  }}
                >
                  {categories.find(cat => cat.value === topic.category)?.label}
                </span>
                {topic.tags?.map(tag => (
                  <span key={tag} className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
              
              <h3 className="text-[22px] font-bold text-gray-900 mb-4">{topic.title}</h3>
              
              {topic.content && (
                <div 
                  className="text-gray-600 mb-4 line-clamp-2 text-sm"
                  dangerouslySetInnerHTML={{ __html: topic.content }}
                />
              )}
              
              <div className="flex flex-col gap-2 text-sm" style={{color: '#64748B'}}>
                <div>
                  By {getUserDisplayName(topic.user_profiles, topic.is_anonymous)} • {new Date(topic.created_at).toLocaleDateString()}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-6">
                    <span>Views: {topic.view_count}</span>
                    <span>•</span>
                    <span>Replies: {topic.reply_count}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportingPostId(topic.id);
                      // Default reason based on content
                      const analysis = analyzeContent(topic.content || topic.description || '');
                      if (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') {
                        setReportReason('crisis');
                      } else if (analysis.needsTriggerWarning) {
                        setReportReason('trigger_warning');
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline"
                  >
                    🚩 Report
                  </button>
                  {currentUser && topic.user_id === currentUser.id && (topic.auto_mod_status === 'flagged' || topic.auto_mod_status === 'blocked') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDisputingPost({ id: topic.id, type: 'topic' });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                      title="Dispute moderation decision"
                    >
                      📝 Dispute
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Community Guidelines */}
      <div className="mt-16 rounded-lg p-6" style={{ backgroundColor: '#CCDBEE' }}>
        <h3 className="text-[20px] font-bold text-gray-900 mb-5">Community Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-[18px] font-semibold text-gray-900 mt-4 mb-3">Be Respectful</h4>
            <ul className="space-y-3">
              <li className="text-[15px]" style={{lineHeight: '1.6'}}>• Use kind, supportive language</li>
              <li className="text-[15px]" style={{lineHeight: '1.6'}}>• Respect different perspectives and experiences</li>
              <li className="text-[15px]" style={{lineHeight: '1.6'}}>• Avoid judgmental or dismissive comments</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[18px] font-semibold text-gray-900 mt-4 mb-3">Stay Safe</h4>
            <ul className="space-y-3">
              <li className="text-[15px]" style={{lineHeight: '1.6'}}>• Respect privacy - don't share others' personal information</li>
              <li className="text-[15px]" style={{lineHeight: '1.6'}}>• Use content warnings for sensitive topics</li>
              <li className="text-[15px]" style={{lineHeight: '1.6'}}>• Report inappropriate content to keep our space safe</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Settings Modal */}
      {showNotificationSettings && currentUser && (
        <NotificationSettings
          userId={currentUser.id}
          onClose={() => setShowNotificationSettings(false)}
        />
      )}

      {/* Moderator quick access button */}
      {isModerator && (
        <button
          onClick={() => { setShowDisputesAdmin(true); loadOpenDisputes(); }}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-indigo-700"
          title="Open Disputes Queue"
        >
          Moderation: Disputes
        </button>
      )}

      {/* 🚩 Report Content Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Report Content</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please help us understand why this content should be reviewed. Our moderation team will investigate.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reporting *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason...</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="hate_speech">Hate speech or discrimination</option>
                <option value="spam">Spam or promotional content</option>
                <option value="suicide_methods">Suicide methods or encouragement</option>
                <option value="self_harm">Self-harm instructions</option>
                <option value="medical_advice">Inappropriate medical advice</option>
                <option value="personal_info">Sharing personal information</option>
                <option value="graphic_content">Graphic content without warning</option>
                <option value="other">Other (explain below)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional details (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Provide any additional context..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setReportingPostId(null);
                  setReportReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => reportPost(reportingPostId, 'topic')}
                disabled={!reportReason}
                className={`px-4 py-2 rounded-md ${
                  reportReason
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ Disputes Admin Modal */}
      {showDisputesAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Open Disputes</h3>
              <button
                onClick={() => setShowDisputesAdmin(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✖
              </button>
            </div>
            {disputesLoading ? (
              <div className="text-gray-600">Loading disputes...</div>
            ) : disputes.length === 0 ? (
              <div className="text-gray-600">No open disputes.</div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
                {disputes.map((d) => (
                  <div key={d.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {new Date(d.created_at).toLocaleString()} • {d.content_type.toUpperCase()}
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">OPEN</span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Reason:</strong> {d.reason_text}
                    </div>
                    {d.contentPreview ? (
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-800 mb-3">
                        {d.content_type === 'topic' ? (
                          <>
                            <div className="font-semibold">{d.contentPreview.title || '(Untitled)'}</div>
                            <div className="line-clamp-3">{d.contentPreview.content || ''}</div>
                          </>
                        ) : (
                          <div className="line-clamp-3">{d.contentPreview.content || ''}</div>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          Status: {d.contentPreview.auto_mod_status || 'unknown'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-3">Original content unavailable.</div>
                    )}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resolution notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Add brief notes for audit trail..."
                        value={resolutionNotes[d.id] || ''}
                        onChange={(e) => setResolutionNotes(prev => ({ ...prev, [d.id]: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => resolveDispute(d.id, 'accepted')}
                        className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                        title="Accept dispute (reconsider moderation)"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => resolveDispute(d.id, 'rejected')}
                        className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                        title="Reject dispute (keep moderation as-is)"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => resolveDispute(d.id, 'withdrawn')}
                        className="px-3 py-1.5 rounded bg-gray-300 text-gray-800 text-sm hover:bg-gray-400"
                        title="Mark dispute as withdrawn"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📝 Dispute Moderation Modal */}
      {disputingPost && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Dispute Moderation Decision</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tell us why you believe this decision was incorrect. A moderator will review your dispute.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your message to moderators *
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={5}
                placeholder="Provide context or clarification..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDisputingPost(null);
                  setDisputeReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!disputeReason.trim()) return;
                  try {
                    const result = await createContentDispute(
                      currentUser.id,
                      disputingPost.id,
                      disputingPost.type,
                      disputeReason.trim()
                    );
                    if (result?.success) {
                      alert('Your dispute has been submitted for review.');
                      setDisputingPost(null);
                      setDisputeReason('');
                    } else {
                      alert(result?.error || 'Failed to submit dispute. Please try again.');
                    }
                  } catch (err) {
                    alert('Failed to submit dispute. Please try again.');
                  }
                }}
                disabled={!disputeReason.trim()}
                className={`px-4 py-2 rounded-md ${
                  disputeReason.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}