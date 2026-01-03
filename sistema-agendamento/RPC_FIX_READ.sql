-- SOLUÇÃO VIA RPC (Remote Procedure Call)
-- Permite que o Backend execute o UPDATE com privilégios elevados, ignorando bloqueios de RLS.

-- 1. Função para marcar UMA notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_read(p_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para marcar TODAS as notificações de uma unidade como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_unit text)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE recipient_role = 'admin'
  AND read = false
  AND (
    p_unit IS NULL OR unit = p_unit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Adicionar permissão de execução para usuários logados
GRANT EXECUTE ON FUNCTION mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(text) TO authenticated;
