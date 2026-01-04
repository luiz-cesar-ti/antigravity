-- SOLUÇÃO: NOTIFICAÇÃO DE NOVOS USUÁRIOS PARA ADMINS
-- Execute este script no SQL Editor do seu Supabase (projeto: qwzowpunfziersklxrpv)

-- 1. Criar a função que gera as notificações
CREATE OR REPLACE FUNCTION public.handle_new_user_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unit_item text;
BEGIN
  -- O professor pode selecionar múltiplas unidades (array 'units')
  -- Vamos gerar uma notificação para cada administrador de unidade correspondente
  IF NEW.units IS NOT NULL AND array_length(NEW.units, 1) > 0 THEN
    FOREACH unit_item IN ARRAY NEW.units
    LOOP
      INSERT INTO public.notifications (
        message, 
        link, 
        created_at, 
        recipient_role, 
        unit, 
        read
      )
      VALUES (
        'Novo professor cadastrado: ' || NEW.full_name || ' (' || NEW.totvs_number || ')',
        '/admin/users', -- Link para o painel de usuários
        NOW(),
        'admin',
        unit_item,
        false
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Criar o gatilho (trigger) na tabela public.users
-- Ele será disparado automaticamente após cada novo cadastro de professor
DROP TRIGGER IF EXISTS on_new_user_notification ON public.users;
CREATE TRIGGER on_new_user_notification
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_notification();

-- 3. Garantir Realtime (Opcional, mas recomendado para o "sininho" atualizar na hora)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Garante que a tabela de notificações está sendo monitorada
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
