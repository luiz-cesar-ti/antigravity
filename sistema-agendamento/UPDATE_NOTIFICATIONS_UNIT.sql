-- 1. Add 'unit' column to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS unit TEXT;

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_name_val text;
  equip_name_val text;
BEGIN
  -- Get User Name
  SELECT full_name INTO user_name_val FROM public.users WHERE id = NEW.user_id;
  IF user_name_val IS NULL THEN
     user_name_val := 'Professor';
  END IF;

  -- Get Equipment Name
  SELECT name INTO equip_name_val FROM public.equipment WHERE id = NEW.equipment_id;
  IF equip_name_val IS NULL THEN
     equip_name_val := 'Equipamento';
  END IF;

  -- Insert Notification with Unit
  INSERT INTO public.notifications (message, link, created_at, recipient_role, unit)
  VALUES (
    'Novo agendamento: ' || equip_name_val || ' - ' || user_name_val,
    '/admin/bookings',
    NOW(),
    'admin',
    NEW.unit -- This ensures the unit is saved
  );
  
  RETURN NEW;
END;
$function$;

-- 3. Drop old triggers (Clean up)
DROP TRIGGER IF EXISTS on_new_booking ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_insert ON public.bookings;
DROP FUNCTION IF EXISTS handle_new_booking(); -- Try to cleanup old function if it exists

-- 4. Create new Trigger
CREATE TRIGGER on_new_booking_notification
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_booking_notification();
