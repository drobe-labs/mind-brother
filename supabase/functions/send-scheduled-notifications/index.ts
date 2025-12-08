import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationUser {
  user_id: string;
  device_tokens: Array<{
    device_token: string;
    platform: string;
  }>;
  notification_type: 'morning' | 'checkin' | 'evening';
  notification_time: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    console.log(`🔔 Checking for scheduled notifications at ${currentTime}`);

    // Get users who have notifications enabled and match current time
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        morning_notifications,
        checkin_notifications,
        evening_notifications,
        notification_time_morning,
        notification_time_checkin,
        notification_time_evening,
        notifications_enabled
      `)
      .eq('notifications_enabled', true);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users with notifications enabled');
      return new Response(
        JSON.stringify({ message: 'No users found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter users by notification type and time
    const usersToNotify: NotificationUser[] = [];

    for (const user of users) {
      // Check morning notifications
      if (user.morning_notifications && user.notification_time_morning === currentTime) {
        const tokens = await getUserDeviceTokens(supabase, user.user_id);
        if (tokens.length > 0) {
          usersToNotify.push({
            user_id: user.user_id,
            device_tokens: tokens,
            notification_type: 'morning',
            notification_time: user.notification_time_morning,
          });
        }
      }

      // Check check-in notifications
      if (user.checkin_notifications && user.notification_time_checkin === currentTime) {
        const tokens = await getUserDeviceTokens(supabase, user.user_id);
        if (tokens.length > 0) {
          usersToNotify.push({
            user_id: user.user_id,
            device_tokens: tokens,
            notification_type: 'checkin',
            notification_time: user.notification_time_checkin,
          });
        }
      }

      // Check evening notifications
      if (user.evening_notifications && user.notification_time_evening === currentTime) {
        const tokens = await getUserDeviceTokens(supabase, user.user_id);
        if (tokens.length > 0) {
          usersToNotify.push({
            user_id: user.user_id,
            device_tokens: tokens,
            notification_type: 'evening',
            notification_time: user.notification_time_evening,
          });
        }
      }
    }

    if (usersToNotify.length === 0) {
      console.log('No users to notify at this time');
      return new Response(
        JSON.stringify({ message: 'No notifications to send', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications via Expo Push API
    let sentCount = 0;
    const expoPushUrl = 'https://exp.host/--/api/v2/push/send';

    for (const user of usersToNotify) {
      const messages = user.device_tokens.map(token => {
        const notification = getNotificationContent(user.notification_type);
        return {
          to: token.device_token,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: {
            type: user.notification_type,
            userId: user.user_id,
          },
          priority: 'high',
          channelId: 'default',
        };
      });

      try {
        const response = await fetch(expoPushUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(messages),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Sent ${user.notification_type} notification to user ${user.user_id}`);
          sentCount += messages.length;

          // Log notification
          await supabase.from('notification_logs').insert({
            user_id: user.user_id,
            notification_type: user.notification_type,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
        } else {
          console.error(`❌ Failed to send notification: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ Error sending notification to user ${user.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed', 
        sent: sentCount,
        users: usersToNotify.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in send-scheduled-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Get active device tokens for a user
 */
async function getUserDeviceTokens(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('device_tokens')
    .select('device_token, platform')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error(`Error fetching device tokens for user ${userId}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Get notification content based on type
 */
function getNotificationContent(type: 'morning' | 'checkin' | 'evening'): { title: string; body: string } {
  const morningMessages = [
    { title: 'Good morning brother! 💪', body: 'Win the day! You\'ve got this.' },
    { title: 'Rise and shine! 🌅', body: 'Today is a new opportunity to grow.' },
    { title: 'Morning motivation 💯', body: 'Start your day strong, brother.' },
  ];

  const checkinMessages = [
    { title: 'Just checking in 🤝', body: 'How are you doing today, brother?' },
    { title: 'Quick check-in 💙', body: 'How\'s your day going?' },
  ];

  const eveningMessages = [
    { title: 'Evening encouragement 🌙', body: 'You made it through another day. That\'s strength, brother.' },
    { title: 'Rest well tonight ✨', body: 'Tomorrow is a new opportunity. Take care of yourself.' },
    { title: 'Evening motivation 💪', body: 'You\'re doing better than you think. Keep going.' },
  ];

  const messages = type === 'morning' ? morningMessages : type === 'checkin' ? checkinMessages : eveningMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}



