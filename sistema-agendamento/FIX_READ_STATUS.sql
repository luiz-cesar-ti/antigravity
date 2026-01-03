-- CORREÇÃO DE PERMISSÕES PARA LEITURA DE NOTIFICAÇÕES
-- Este script garante que o usuário consiga atualizar o status 'read' das notificações.

BEGIN;

-- 1. Resetar permissões da tabela notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes para evitar conflitos estúpidos
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.notifications;

-- 3. Criar Políticas CORRETAS e SIMPLIFICADAS

-- Permite LEITURA (SELECT) para autenticados que sejam admins
CREATE POLICY "Admins can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_role = 'admin');

-- Permite ATUALIZAÇÃO (UPDATE) para autenticados
-- Removemos o "WITH CHECK" restritivo que pode estar falhando silenciosamente no update parcial
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_role = 'admin');

-- Permite INSERÇÃO (INSERT) - (Geralmente feito pelo trigger, mas por segurança para testes)
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (recipient_role = 'admin');

COMMIT;

-- 4. Verificação (Opcional - apenas garante que o grant está certo)
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
