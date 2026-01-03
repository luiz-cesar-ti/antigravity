-- SOLUÇÃO DEFINITIVA PARA DUPLICIDADE E REALTIME
-- Este script remove TODOS os triggers da tabela bookings e recria apenas o correto.

DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- 1. REMOÇÃO TOTAL DE TRIGGERS (NUCLEAR OPTION)
    -- Percorre todos os triggers associados à tabela 'bookings' e os remove um por um.
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'bookings' AND trigger_schema = 'public') LOOP 
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.bookings'; 
    END LOOP; 
END $$;

-- 2. RECRIAÇÃO DA FUNÇÃO (Limpa e Formatada)
CREATE OR REPLACE FUNCTION handle_new_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  formatted_date text;
BEGIN
  -- Formata a data para DD/MM
  formatted_date := to_char(NEW.booking_date, 'DD/MM');
  
  INSERT INTO public.notifications (
    message, 
    recipient_role, 
    link, 
    created_at, 
    read, 
    unit
  )
  VALUES (
    -- Formato simples: "Novo agendamento: Sala 1 - 03/01"
    'Novo agendamento: ' || NEW.local || ' - ' || formatted_date,
    'admin',
    '/admin/bookings',
    NOW(),
    false,
    NEW.unit
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECRIAÇÃO DO TRIGGER ÚNICO
CREATE TRIGGER on_new_booking_notification_v2
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION handle_new_booking_notification();

-- 4. CONFIGURAÇÃO DE REALTIME (Forçada)
-- Recria/Atualiza a publicação para garantir que bookings e notifications sejam ouvidos
DO $$
BEGIN
  -- Tenta criar se não existir (ignora erro se já existe)
  BEGIN
    CREATE PUBLICATION supabase_realtime;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  -- Adiciona tabelas (ignora erro se já estiverem lá)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 5. REFRESHE DE PERMISSÕES
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Garante que admins vejam tudo de realtime
DROP POLICY IF EXISTS "Admins can view bookings" ON public.bookings;
CREATE POLICY "Admins can view bookings" ON public.bookings FOR SELECT TO authenticated USING (true); -- Permissivo para admin ver tudo (ou refine conforme a regra de unit)
