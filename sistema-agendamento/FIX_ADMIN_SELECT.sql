-- CORREÇÃO: Permitir que Super Admins vejam a lista de Administradores
-- Atualmente bloqueado pelo RLS padrão.

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se houver
DROP POLICY IF EXISTS "Admins View Admins" ON public.admins;
DROP POLICY IF EXISTS "Public Select Admins" ON public.admins;

-- Criar política de Leitura Segura via Token
CREATE POLICY "Admins View Admins" ON public.admins
FOR SELECT
TO anon, authenticated
USING (
    public.is_admin_session_valid()
);

-- Garantir permissão
GRANT SELECT ON public.admins TO anon, authenticated;
