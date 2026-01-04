-- Function to safely delete a notification
-- Bypasses RLS to ensure admins can delete notifications assigned to them
CREATE OR REPLACE FUNCTION public.delete_notification(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to bypass RLS
AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE id = p_id;
END;
$$;
