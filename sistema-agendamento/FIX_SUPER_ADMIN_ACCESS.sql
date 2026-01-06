-- CORREÇÃO ROBUSTA DE ACESSO SUPER ADMIN

-- 1. Redefinir a função de validação de sessão para garantir acesso privilegiado (SECURITY DEFINER) e Search Path seguro
CREATE OR REPLACE FUNCTION public.is_admin_session_valid()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_token text;
    v_count int;
BEGIN
    -- Obter o header seguro
    v_token := current_setting('request.headers', true)::json->>'x-admin-token';
    
    -- Se não houver token, retorna falso
    IF v_token IS NULL THEN
        RETURN false;
    END IF;

    -- Verificar se o token existe e é válido na tabela de sessões
    -- Como a função é SECURITY DEFINER, ela pode ler a tabela admin_sessions mesmo se o usuário não puder
    SELECT count(*) INTO v_count
    FROM public.admin_sessions
    WHERE token = v_token AND expires_at > NOW();

    RETURN v_count > 0;
END;
$$;

-- 2. Garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.is_admin_session_valid() TO anon, authenticated, service_role;

-- 3. Habilitar RLS na tabela admins (garantia)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 4. Recriar a política de leitura para admins
DROP POLICY IF EXISTS "Admins View Admins" ON public.admins;
DROP POLICY IF EXISTS "Public Select Admins" ON public.admins;

CREATE POLICY "Admins View Admins" ON public.admins
FOR SELECT
TO anon, authenticated
USING (
    public.is_admin_session_valid()
);

-- 5. Garantir Grants de SELECT
GRANT SELECT ON public.admins TO anon, authenticated;
GRANT SELECT ON public.admin_sessions TO service_role; -- App server side only usually, but function covers it via Security Definer

-- 6. Política extra para admin_sessions (para evitar bloqueio total se algo falhar)
-- Permitir que o admin valide sua própria sessão não é comum via REST direto, mas vamos garantir que o RLS da tabela de sessões não quebre nada
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
-- (Nenhuma política de SELECT pública/anon é necessária pois a validação é via função segura acima)
