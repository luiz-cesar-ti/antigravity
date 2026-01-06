-- CORREÇÃO DE VISIBILIDADE (SELECT)
-- O admin consegue inserir (via RPC), mas não conseguia ver a lista porque a regra de visualização (SELECT) estava bloqueando.

-- Habilitar RLS (caso não esteja)
ALTER TABLE public.equipment_loans ENABLE ROW LEVEL SECURITY;

-- 1. Remover políticas antigas de SELECT para evitar conflitos
DROP POLICY IF EXISTS "Admins Select All" ON public.equipment_loans;
DROP POLICY IF EXISTS "Public Select" ON public.equipment_loans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.equipment_loans;

-- 2. Criar Política: PERMITIR visualizar se tiver Token de Admin Válido
CREATE POLICY "Admins Select All" ON public.equipment_loans
FOR SELECT
TO anon, authenticated
USING (
    -- Verifica se o header x-admin-token corresponde a uma sessão válida no banco
    public.is_admin_session_valid()
);

-- 3. Garantir permissão de nível de banco (Grant)
GRANT SELECT ON public.equipment_loans TO anon, authenticated;
