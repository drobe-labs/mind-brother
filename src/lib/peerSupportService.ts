// Peer Support Matching Service for Mind Brother
// Connects users with similar cultural backgrounds for community support
// Privacy-first: requires explicit consent and anonymity options

import { supabase } from './supabase';
import { 
  getUserCulturalProfile, 
  type CulturalProfile,
  type CulturalBackground,
  type CommunityIdentity,
  type PrimaryConcern 
} from './culturalPersonalizationService';

// ============================================================================
// TYPES
// ============================================================================

export interface PeerSupportPreferences {
  optedIn: boolean;
  displayName?: string; // Anonymous name or nickname
  showCulturalBackground: boolean;
  showCommunities: boolean;
  showConcerns: boolean;
  showAgeRange: boolean;
  availableFor: PeerSupportType[];
  preferredContactMethod: 'in_app_only' | 'anonymous_chat';
  maxConnectionsPerWeek: number;
  languagePreference?: string;
}

export type PeerSupportType = 
  | 'listening' // Just here to listen
  | 'shared_experience' // Been through similar things
  | 'accountability' // Help staying on track
  | 'check_ins' // Regular check-ins
  | 'crisis_support' // Support during hard times (with professional backup)
  | 'mentor'; // More experienced, willing to guide

export interface PeerMatch {
  matchId: string;
  userId: string;
  displayName: string;
  matchScore: number;
  sharedTraits: string[];
  availableFor: PeerSupportType[];
  languageMatch: boolean;
  lastActive?: string;
  connectionStatus?: 'none' | 'pending' | 'connected' | 'blocked';
}

export interface PeerConnection {
  id: string;
  initiatorId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  acceptedAt?: string;
  lastInteraction?: string;
  messageCount: number;
}

export interface PeerMessage {
  id: string;
  connectionId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PEER_SUPPORT_TYPES: { value: PeerSupportType; label: string; description: string; icon: string }[] = [
  { 
    value: 'listening', 
    label: 'Listening Ear', 
    description: 'Sometimes you just need someone to hear you out',
    icon: '👂'
  },
  { 
    value: 'shared_experience', 
    label: 'Shared Experience', 
    description: 'Connect with someone who\'s been through similar situations',
    icon: '🤝'
  },
  { 
    value: 'accountability', 
    label: 'Accountability Partner', 
    description: 'Help each other stay on track with goals',
    icon: '✊'
  },
  { 
    value: 'check_ins', 
    label: 'Check-in Buddy', 
    description: 'Regular check-ins to see how you\'re doing',
    icon: '📱'
  },
  { 
    value: 'crisis_support', 
    label: 'Crisis Support', 
    description: 'Someone to reach out to during hard times',
    icon: '💪'
  },
  { 
    value: 'mentor', 
    label: 'Mentor/Guide', 
    description: 'Learn from someone with more experience',
    icon: '🧭'
  },
];

// Match score weights
const MATCH_WEIGHTS = {
  culturalBackground: 30,
  communities: 25,
  concerns: 20,
  supportType: 15,
  language: 10,
  ageRange: 5,
};

// ============================================================================
// PEER SUPPORT PREFERENCES
// ============================================================================

/**
 * Get user's peer support preferences
 */
export async function getPeerSupportPreferences(
  userId: string
): Promise<PeerSupportPreferences | null> {
  const { data, error } = await supabase
    .from('peer_support_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    optedIn: data.opted_in,
    displayName: data.display_name,
    showCulturalBackground: data.show_cultural_background,
    showCommunities: data.show_communities,
    showConcerns: data.show_concerns,
    showAgeRange: data.show_age_range,
    availableFor: data.available_for || [],
    preferredContactMethod: data.preferred_contact_method || 'in_app_only',
    maxConnectionsPerWeek: data.max_connections_per_week || 3,
    languagePreference: data.language_preference,
  };
}

/**
 * Update user's peer support preferences
 */
export async function updatePeerSupportPreferences(
  userId: string,
  preferences: Partial<PeerSupportPreferences>
): Promise<boolean> {
  const { error } = await supabase
    .from('peer_support_preferences')
    .upsert({
      user_id: userId,
      opted_in: preferences.optedIn,
      display_name: preferences.displayName,
      show_cultural_background: preferences.showCulturalBackground,
      show_communities: preferences.showCommunities,
      show_concerns: preferences.showConcerns,
      show_age_range: preferences.showAgeRange,
      available_for: preferences.availableFor,
      preferred_contact_method: preferences.preferredContactMethod,
      max_connections_per_week: preferences.maxConnectionsPerWeek,
      language_preference: preferences.languagePreference,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error updating peer support preferences:', error);
    return false;
  }

  return true;
}

/**
 * Opt into peer support
 */
export async function optIntoPeerSupport(
  userId: string,
  displayName: string,
  availableFor: PeerSupportType[],
  privacySettings: {
    showCulturalBackground?: boolean;
    showCommunities?: boolean;
    showConcerns?: boolean;
    showAgeRange?: boolean;
  } = {}
): Promise<boolean> {
  return updatePeerSupportPreferences(userId, {
    optedIn: true,
    displayName,
    availableFor,
    showCulturalBackground: privacySettings.showCulturalBackground ?? true,
    showCommunities: privacySettings.showCommunities ?? true,
    showConcerns: privacySettings.showConcerns ?? false,
    showAgeRange: privacySettings.showAgeRange ?? true,
    preferredContactMethod: 'in_app_only',
    maxConnectionsPerWeek: 3,
  });
}

/**
 * Opt out of peer support
 */
export async function optOutOfPeerSupport(userId: string): Promise<boolean> {
  return updatePeerSupportPreferences(userId, {
    optedIn: false,
  });
}

// ============================================================================
// PEER MATCHING
// ============================================================================

/**
 * Find peer support matches for a user
 * Matches based on cultural background, communities, concerns, and support types
 */
export async function suggestPeerSupport(
  userId: string,
  limit: number = 5
): Promise<PeerMatch[]> {
  // Get user's profile and preferences
  const [userProfile, userPreferences] = await Promise.all([
    getUserCulturalProfile(userId),
    getPeerSupportPreferences(userId),
  ]);

  if (!userProfile || !userPreferences?.optedIn) {
    console.log('User not opted into peer support or no profile');
    return [];
  }

  // Find potential matches who are opted in
  const { data: potentialMatches, error } = await supabase
    .from('user_cultural_profiles')
    .select(`
      user_id,
      cultural_background,
      communities,
      primary_concerns,
      age_range,
      language_preference
    `)
    .neq('user_id', userId)
    .limit(50); // Get more than needed for scoring

  if (error || !potentialMatches) {
    console.error('Error finding potential matches:', error);
    return [];
  }

  // Get peer support preferences for all potential matches
  const matchUserIds = potentialMatches.map(m => m.user_id);
  const { data: matchPreferences } = await supabase
    .from('peer_support_preferences')
    .select('*')
    .in('user_id', matchUserIds)
    .eq('opted_in', true);

  if (!matchPreferences || matchPreferences.length === 0) {
    return [];
  }

  // Create a map of preferences by user_id
  const prefsMap = new Map(matchPreferences.map(p => [p.user_id, p]));

  // Get blocked connections
  const { data: blockedConnections } = await supabase
    .from('peer_connections')
    .select('initiator_id, recipient_id')
    .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'blocked');

  const blockedUserIds = new Set(
    blockedConnections?.flatMap(c => [c.initiator_id, c.recipient_id]) || []
  );
  blockedUserIds.delete(userId);

  // Get existing connections
  const { data: existingConnections } = await supabase
    .from('peer_connections')
    .select('initiator_id, recipient_id, status')
    .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
    .in('status', ['pending', 'accepted']);

  const connectionStatusMap = new Map<string, string>();
  existingConnections?.forEach(c => {
    const otherUserId = c.initiator_id === userId ? c.recipient_id : c.initiator_id;
    connectionStatusMap.set(otherUserId, c.status);
  });

  // Score and filter matches
  const scoredMatches: PeerMatch[] = [];

  for (const match of potentialMatches) {
    const matchPrefs = prefsMap.get(match.user_id);
    
    // Skip if not opted in or blocked
    if (!matchPrefs || blockedUserIds.has(match.user_id)) {
      continue;
    }

    // Calculate match score
    const { score, sharedTraits } = calculateMatchScore(
      userProfile,
      userPreferences,
      match,
      matchPrefs
    );

    if (score > 0) {
      scoredMatches.push({
        matchId: `match_${userId}_${match.user_id}`,
        userId: match.user_id,
        displayName: matchPrefs.display_name || 'Anonymous Brother',
        matchScore: score,
        sharedTraits,
        availableFor: matchPrefs.available_for || [],
        languageMatch: match.language_preference?.primary === userProfile.language_preference?.primary,
        connectionStatus: connectionStatusMap.get(match.user_id) as any || 'none',
      });
    }
  }

  // Sort by score and return top matches
  return scoredMatches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * Calculate match score between two users
 */
function calculateMatchScore(
  userProfile: CulturalProfile,
  userPrefs: PeerSupportPreferences,
  matchProfile: any,
  matchPrefs: any
): { score: number; sharedTraits: string[] } {
  let score = 0;
  const sharedTraits: string[] = [];

  // Cultural background match
  if (userProfile.cultural_background && 
      userProfile.cultural_background === matchProfile.cultural_background &&
      matchPrefs.show_cultural_background) {
    score += MATCH_WEIGHTS.culturalBackground;
    sharedTraits.push(formatCulturalBackground(userProfile.cultural_background));
  }

  // Community overlap
  const userCommunities = userProfile.communities || [];
  const matchCommunities = matchProfile.communities || [];
  const sharedCommunities = userCommunities.filter(
    (c: string) => matchCommunities.includes(c)
  );
  
  if (sharedCommunities.length > 0 && matchPrefs.show_communities) {
    score += (sharedCommunities.length / Math.max(userCommunities.length, 1)) * MATCH_WEIGHTS.communities;
    sharedCommunities.forEach((c: string) => sharedTraits.push(formatCommunity(c)));
  }

  // Concern overlap (if both showing)
  if (matchPrefs.show_concerns && userPrefs.showConcerns) {
    const userConcerns = userProfile.primary_concerns || [];
    const matchConcerns = matchProfile.primary_concerns || [];
    const sharedConcerns = userConcerns.filter(
      (c: string) => matchConcerns.includes(c)
    );
    
    if (sharedConcerns.length > 0) {
      score += (sharedConcerns.length / Math.max(userConcerns.length, 1)) * MATCH_WEIGHTS.concerns;
      // Don't add concerns to shared traits for privacy
    }
  }

  // Support type overlap
  const userSupportTypes = userPrefs.availableFor || [];
  const matchSupportTypes = matchPrefs.available_for || [];
  const sharedSupportTypes = userSupportTypes.filter(
    (t: string) => matchSupportTypes.includes(t)
  );
  
  if (sharedSupportTypes.length > 0) {
    score += (sharedSupportTypes.length / Math.max(userSupportTypes.length, 1)) * MATCH_WEIGHTS.supportType;
  }

  // Language match
  const userLang = userProfile.language_preference?.primary;
  const matchLang = matchProfile.language_preference?.primary;
  if (userLang && userLang === matchLang && userLang !== 'english') {
    score += MATCH_WEIGHTS.language;
    sharedTraits.push(`Speaks ${formatLanguage(userLang)}`);
  }

  // Age range proximity
  if (matchPrefs.show_age_range && userProfile.age_range && matchProfile.age_range) {
    if (userProfile.age_range === matchProfile.age_range) {
      score += MATCH_WEIGHTS.ageRange;
      sharedTraits.push(`Similar age (${matchProfile.age_range})`);
    }
  }

  return { score: Math.round(score), sharedTraits };
}

// ============================================================================
// PEER CONNECTIONS
// ============================================================================

/**
 * Send a connection request to another user
 */
export async function sendConnectionRequest(
  initiatorId: string,
  recipientId: string,
  message?: string
): Promise<{ success: boolean; connectionId?: string; error?: string }> {
  // Check if connection already exists
  const { data: existing } = await supabase
    .from('peer_connections')
    .select('id, status')
    .or(`and(initiator_id.eq.${initiatorId},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${initiatorId})`)
    .single();

  if (existing) {
    if (existing.status === 'blocked') {
      return { success: false, error: 'Unable to connect with this user' };
    }
    if (existing.status === 'pending') {
      return { success: false, error: 'Connection request already pending' };
    }
    if (existing.status === 'accepted') {
      return { success: false, error: 'Already connected' };
    }
  }

  // Check rate limits (max connections per week)
  const { data: prefs } = await supabase
    .from('peer_support_preferences')
    .select('max_connections_per_week')
    .eq('user_id', initiatorId)
    .single();

  const maxPerWeek = prefs?.max_connections_per_week || 3;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { count: recentRequests } = await supabase
    .from('peer_connections')
    .select('*', { count: 'exact', head: true })
    .eq('initiator_id', initiatorId)
    .gte('created_at', oneWeekAgo.toISOString());

  if ((recentRequests || 0) >= maxPerWeek) {
    return { 
      success: false, 
      error: `You can only send ${maxPerWeek} connection requests per week` 
    };
  }

  // Create connection request
  const { data, error } = await supabase
    .from('peer_connections')
    .insert({
      initiator_id: initiatorId,
      recipient_id: recipientId,
      status: 'pending',
      initial_message: message,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating connection request:', error);
    return { success: false, error: 'Failed to send connection request' };
  }

  // TODO: Send notification to recipient

  return { success: true, connectionId: data.id };
}

/**
 * Accept a connection request
 */
export async function acceptConnectionRequest(
  connectionId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('peer_connections')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .eq('recipient_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error accepting connection:', error);
    return false;
  }

  return true;
}

/**
 * Decline a connection request
 */
export async function declineConnectionRequest(
  connectionId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('peer_connections')
    .update({ status: 'declined' })
    .eq('id', connectionId)
    .eq('recipient_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error declining connection:', error);
    return false;
  }

  return true;
}

/**
 * Block a user (prevents future matching and communication)
 */
export async function blockUser(
  userId: string,
  blockedUserId: string
): Promise<boolean> {
  // Update existing connection or create blocked entry
  const { data: existing } = await supabase
    .from('peer_connections')
    .select('id')
    .or(`and(initiator_id.eq.${userId},recipient_id.eq.${blockedUserId}),and(initiator_id.eq.${blockedUserId},recipient_id.eq.${userId})`)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('peer_connections')
      .update({ status: 'blocked', blocked_by: userId })
      .eq('id', existing.id);

    return !error;
  } else {
    const { error } = await supabase
      .from('peer_connections')
      .insert({
        initiator_id: userId,
        recipient_id: blockedUserId,
        status: 'blocked',
        blocked_by: userId,
      });

    return !error;
  }
}

/**
 * Get user's connections
 */
export async function getUserConnections(
  userId: string,
  status?: 'pending' | 'accepted'
): Promise<PeerConnection[]> {
  let query = supabase
    .from('peer_connections')
    .select('*')
    .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
    .neq('status', 'blocked');

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(c => ({
    id: c.id,
    initiatorId: c.initiator_id,
    recipientId: c.recipient_id,
    status: c.status,
    createdAt: c.created_at,
    acceptedAt: c.accepted_at,
    lastInteraction: c.last_interaction,
    messageCount: c.message_count || 0,
  }));
}

/**
 * Get pending connection requests for a user
 */
export async function getPendingRequests(userId: string): Promise<{
  received: PeerConnection[];
  sent: PeerConnection[];
}> {
  const connections = await getUserConnections(userId, 'pending');

  return {
    received: connections.filter(c => c.recipientId === userId),
    sent: connections.filter(c => c.initiatorId === userId),
  };
}

// ============================================================================
// PEER MESSAGING
// ============================================================================

/**
 * Send a message to a connected peer
 */
export async function sendPeerMessage(
  connectionId: string,
  senderId: string,
  content: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Verify connection exists and is accepted
  const { data: connection } = await supabase
    .from('peer_connections')
    .select('id, status, initiator_id, recipient_id')
    .eq('id', connectionId)
    .eq('status', 'accepted')
    .single();

  if (!connection) {
    return { success: false, error: 'Connection not found or not accepted' };
  }

  // Verify sender is part of the connection
  if (connection.initiator_id !== senderId && connection.recipient_id !== senderId) {
    return { success: false, error: 'Not authorized to send messages in this connection' };
  }

  // Basic content moderation
  if (containsUnsafeContent(content)) {
    return { success: false, error: 'Message contains inappropriate content' };
  }

  // Create message
  const { data, error } = await supabase
    .from('peer_messages')
    .insert({
      connection_id: connectionId,
      sender_id: senderId,
      content,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error sending peer message:', error);
    return { success: false, error: 'Failed to send message' };
  }

  // Update connection last interaction
  await supabase
    .from('peer_connections')
    .update({ 
      last_interaction: new Date().toISOString(),
      message_count: (connection as any).message_count + 1 || 1,
    })
    .eq('id', connectionId);

  return { success: true, messageId: data.id };
}

/**
 * Get messages for a connection
 */
export async function getConnectionMessages(
  connectionId: string,
  userId: string,
  limit: number = 50
): Promise<PeerMessage[]> {
  // Verify user is part of the connection
  const { data: connection } = await supabase
    .from('peer_connections')
    .select('initiator_id, recipient_id')
    .eq('id', connectionId)
    .single();

  if (!connection || 
      (connection.initiator_id !== userId && connection.recipient_id !== userId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('peer_messages')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(m => ({
    id: m.id,
    connectionId: m.connection_id,
    senderId: m.sender_id,
    content: m.content,
    createdAt: m.created_at,
    readAt: m.read_at,
  })).reverse();
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  connectionId: string,
  userId: string
): Promise<void> {
  await supabase
    .from('peer_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('connection_id', connectionId)
    .neq('sender_id', userId)
    .is('read_at', null);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCulturalBackground(background: CulturalBackground): string {
  const labels: Record<string, string> = {
    black_african_american: 'Black/African American',
    african: 'African',
    caribbean: 'Caribbean',
    latino_hispanic: 'Latino/Hispanic',
    asian: 'Asian/Pacific Islander',
    middle_eastern: 'Middle Eastern',
    indigenous: 'Indigenous/Native American',
    white: 'White/Caucasian',
    multiracial: 'Multiracial',
    other: 'Other',
  };
  return labels[background || ''] || background || '';
}

function formatCommunity(community: CommunityIdentity | string): string {
  const labels: Record<string, string> = {
    lgbtq: 'LGBTQ+',
    veteran: 'Veteran',
    immigrant: 'Immigrant',
    fathers: 'Father',
    faith_based: 'Faith-Based',
    formerly_incarcerated: 'Reentry',
    first_generation: 'First-Gen',
    rural: 'Rural',
    urban: 'Urban',
  };
  return labels[community] || community;
}

function formatLanguage(lang: string): string {
  const labels: Record<string, string> = {
    english: 'English',
    spanish: 'Spanish',
    portuguese: 'Portuguese',
    french: 'French',
    creole: 'Haitian Creole',
  };
  return labels[lang] || lang;
}

/**
 * Basic content moderation for peer messages
 */
function containsUnsafeContent(content: string): boolean {
  const unsafePatterns = [
    /\b(phone\s*number|address|email|ssn|social\s*security)\b/i,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    // Add more patterns as needed
  ];

  return unsafePatterns.some(pattern => pattern.test(content));
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get peer support statistics
 */
export async function getPeerSupportStats(): Promise<{
  totalOptedIn: number;
  totalConnections: number;
  totalMessages: number;
  avgConnectionsPerUser: number;
  topCommunities: { community: string; count: number }[];
}> {
  const { count: totalOptedIn } = await supabase
    .from('peer_support_preferences')
    .select('*', { count: 'exact', head: true })
    .eq('opted_in', true);

  const { count: totalConnections } = await supabase
    .from('peer_connections')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted');

  const { count: totalMessages } = await supabase
    .from('peer_messages')
    .select('*', { count: 'exact', head: true });

  return {
    totalOptedIn: totalOptedIn || 0,
    totalConnections: totalConnections || 0,
    totalMessages: totalMessages || 0,
    avgConnectionsPerUser: totalOptedIn ? (totalConnections || 0) / totalOptedIn : 0,
    topCommunities: [], // Would need aggregation query
  };
}

// Export service object
export const peerSupportService = {
  getPeerSupportPreferences,
  updatePeerSupportPreferences,
  optIntoPeerSupport,
  optOutOfPeerSupport,
  suggestPeerSupport,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  blockUser,
  getUserConnections,
  getPendingRequests,
  sendPeerMessage,
  getConnectionMessages,
  markMessagesAsRead,
  getPeerSupportStats,
  PEER_SUPPORT_TYPES,
};
