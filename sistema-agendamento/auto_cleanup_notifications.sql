-- 1. Create the cleanup function
-- This function will delete notifications created more than 7 days ago.
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verify if pg_cron extension exists (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the job to run daily at 03:00 AM (server time/UTC)
-- The job calls the function defined above.
SELECT cron.schedule(
  'cleanup-notifications-daily', -- Job name
  '0 3 * * *',                   -- Schedule (Every day at 03:00 AM)
  'SELECT delete_old_notifications()'
);

-- Note: If you want to change the schedule later, you can unschedule with:
-- SELECT cron.unschedule('cleanup-notifications-daily');
