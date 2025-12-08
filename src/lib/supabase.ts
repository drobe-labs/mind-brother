import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// ✅ Create ONLY ONE instance - export as const
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          type: 'image' | 'video';
          media_url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'image' | 'video';
          media_url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'image' | 'video';
          media_url?: string;
          caption?: string | null;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          followed_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          followed_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          followed_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      collaborations: {
        Row: {
          id: string;
          requester_id: string;
          target_user_id: string;
          post_id: string | null;
          status: 'pending' | 'accepted' | 'declined';
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          target_user_id: string;
          post_id?: string | null;
          status?: 'pending' | 'accepted' | 'declined';
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          target_user_id?: string;
          post_id?: string | null;
          status?: 'pending' | 'accepted' | 'declined';
          message?: string | null;
          created_at?: string;
        };
      };
      knowledge_base: {
        Row: {
          id: string;
          content: string;
          category: string;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          category: string;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          category?: string;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chatbot_conversations: {
        Row: {
          id: string;
          user_id: string;
          messages: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          messages?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          messages?: any[];
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          user_type: 'individual' | 'professional';
          first_name: string | null;
          last_name: string | null;
          date_of_birth: string | null;
          gender: string | null;
          pronouns: string | null;
          phone_number: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          emergency_consent: boolean;
          practice_name: string | null;
          license_type: string | null;
          license_number: string | null;
          license_state: string | null;
          specialties: string[] | null;
          years_experience: number | null;
          bio: string | null;
          website_url: string | null;
          office_address: string | null;
          office_phone: string | null;
          insurance_accepted: string[] | null;
          session_types: string[] | null;
          availability_hours: any | null;
          username: string | null;
          notifications_enabled: boolean;
          morning_notifications: boolean;
          checkin_notifications: boolean;
          discussion_notifications: boolean;
          mention_notifications: boolean;
          notification_time_morning: string;
          notification_time_checkin: string;
          profile_image_url: string | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_type: 'individual' | 'professional';
          first_name?: string | null;
          last_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          pronouns?: string | null;
          phone_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          emergency_consent?: boolean;
          practice_name?: string | null;
          license_type?: string | null;
          license_number?: string | null;
          license_state?: string | null;
          specialties?: string[] | null;
          years_experience?: number | null;
          bio?: string | null;
          website_url?: string | null;
          office_address?: string | null;
          office_phone?: string | null;
          insurance_accepted?: string[] | null;
          session_types?: string[] | null;
          availability_hours?: any | null;
          username?: string | null;
          notifications_enabled?: boolean;
          morning_notifications?: boolean;
          checkin_notifications?: boolean;
          discussion_notifications?: boolean;
          mention_notifications?: boolean;
          notification_time_morning?: string;
          notification_time_checkin?: string;
          profile_image_url?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_type?: 'individual' | 'professional';
          first_name?: string | null;
          last_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          pronouns?: string | null;
          phone_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          emergency_consent?: boolean;
          practice_name?: string | null;
          license_type?: string | null;
          license_number?: string | null;
          license_state?: string | null;
          specialties?: string[] | null;
          years_experience?: number | null;
          bio?: string | null;
          website_url?: string | null;
          office_address?: string | null;
          office_phone?: string | null;
          insurance_accepted?: string[] | null;
          session_types?: string[] | null;
          availability_hours?: any | null;
          username?: string | null;
          notifications_enabled?: boolean;
          morning_notifications?: boolean;
          checkin_notifications?: boolean;
          discussion_notifications?: boolean;
          mention_notifications?: boolean;
          notification_time_morning?: string;
          notification_time_checkin?: string;
          profile_image_url?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_logs: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          sent_at: string;
          status: string;
          response: string | null;
          response_timestamp: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: string;
          sent_at?: string;
          status?: string;
          response?: string | null;
          response_timestamp?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_type?: string;
          sent_at?: string;
          status?: string;
          response?: string | null;
          response_timestamp?: string | null;
        };
      };
      mood_checkins: {
        Row: {
          id: string;
          user_id: string;
          mood_rating: number | null;
          mood_emoji: string | null;
          response_type: string;
          note: string | null;
          triggered_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mood_rating?: number | null;
          mood_emoji?: string | null;
          response_type: string;
          note?: string | null;
          triggered_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mood_rating?: number | null;
          mood_emoji?: string | null;
          response_type?: string;
          note?: string | null;
          triggered_by?: string;
          created_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          content: string;
          mood_rating: number | null;
          mood_emoji: string | null;
          tags: string[] | null;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          content: string;
          mood_rating?: number | null;
          mood_emoji?: string | null;
          tags?: string[] | null;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string;
          mood_rating?: number | null;
          mood_emoji?: string | null;
          tags?: string[] | null;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      discussion_topics: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          tags: string[] | null;
          is_anonymous: boolean;
          is_locked: boolean;
          is_pinned: boolean;
          view_count: number;
          reply_count: number;
          last_activity_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          tags?: string[] | null;
          is_anonymous?: boolean;
          is_locked?: boolean;
          is_pinned?: boolean;
          view_count?: number;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          tags?: string[] | null;
          is_anonymous?: boolean;
          is_locked?: boolean;
          is_pinned?: boolean;
          view_count?: number;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      discussion_replies: {
        Row: {
          id: string;
          topic_id: string;
          user_id: string;
          parent_reply_id: string | null;
          content: string;
          is_anonymous: boolean;
          is_helpful: boolean;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          user_id: string;
          parent_reply_id?: string | null;
          content: string;
          is_anonymous?: boolean;
          is_helpful?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          user_id?: string;
          parent_reply_id?: string | null;
          content?: string;
          is_anonymous?: boolean;
          is_helpful?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      discussion_reactions: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string | null;
          reply_id: string | null;
          reaction_type: 'like' | 'helpful' | 'support' | 'heart';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id?: string | null;
          reply_id?: string | null;
          reaction_type: 'like' | 'helpful' | 'support' | 'heart';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic_id?: string | null;
          reply_id?: string | null;
          reaction_type?: 'like' | 'helpful' | 'support' | 'heart';
          created_at?: string;
        };
      };
      journal_prompts: {
        Row: {
          id: string;
          title: string;
          prompt: string;
          category: string;
          difficulty_level: 'beginner' | 'intermediate' | 'advanced';
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          prompt: string;
          category: string;
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          prompt?: string;
          category?: string;
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
};