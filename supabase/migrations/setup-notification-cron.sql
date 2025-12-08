-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to check for notifications every hour
-- This will call the Supabase Edge Function at the top of every hour
SELECT cron.schedule(
  'send-scheduled-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://opmlzshkxzdixfwgkrrl.supabase.co/functions/v1/send-scheduled-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Note: You'll need to set the service_role_key in your Supabase project settings
-- Or use a different authentication method for the cron job

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('send-scheduled-notifications');



