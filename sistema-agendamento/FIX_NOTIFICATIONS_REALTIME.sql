-- 1. Limpeza de Triggers Antigos (Cleanup)
-- Removemos qualquer trigger antigo que possa estar duplicando notificações
DROP TRIGGER IF EXISTS on_new_booking ON public.bookings;
DROP TRIGGER IF EXISTS create_booking_notification ON public.bookings; -- Trigger criado anteriormente
DROP TRIGGER IF EXISTS on_new_booking_notification ON public.bookings;

-- Removemos a função antiga para recriá-la limpa
DROP FUNCTION IF EXISTS handle_new_booking_notification();

-- 2. Recriação da Função de Notificação (Única e Centralizada)
CREATE OR REPLACE FUNCTION handle_new_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    message, 
    recipient_role, 
    link, 
    created_at, 
    read, 
    unit
  )
  VALUES (
    'Novo agendamento: ' || NEW.local || ' - ' || to_char(NEW.booking_date, 'DD/MM'),
    'admin',
    '/admin/bookings',
    NOW(),
    false,
    NEW.unit
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriação do Trigger
CREATE TRIGGER on_new_booking_notification
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION handle_new_booking_notification();

-- 4. Habilitar Realtime para Tabelas Críticas
-- Isso garante que o front-end receba as atualizações sem F5
DO $$
BEGIN
  -- Tenta adicionar as tabelas à publicação realtime
  -- O comando pode falhar se já estiverem lá, mas geralmente é seguro rodar
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Ignora se já existir
  WHEN others THEN NULL; -- Ignora outros erros para não travar o script
END $$;

-- 5. Correção de Permissões (RLS) para Notificações
-- Garante que o Admin possa marcar como lida (UPDATE)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.notifications;

-- Cria políticas permissivas para admins
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_role = 'admin')
WITH CHECK (recipient_role = 'admin');

CREATE POLICY "Admins can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_role = 'admin');

-- Garante Insert também (pelo Trigger é automático, mas para testes manuais ajuda)
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (recipient_role = 'admin');
