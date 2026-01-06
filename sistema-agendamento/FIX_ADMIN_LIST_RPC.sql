-- RPC SEGURA PARA LISTAR ADMINISTRADORES
-- Substitui o acesso direto via SELECT (RLS) que estava causando problemas.

CREATE OR REPLACE FUNCTION public.get_all_admins(
    p_admin_token text
)
RETURNS SETOF public.admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_admin_id uuid;
BEGIN
    -- 1. Validação explicita do token (mesma lógica dos empréstimos)
    SELECT admin_id INTO v_admin_id
    FROM public.admin_sessions
    WHERE token = p_admin_token AND expires_at > NOW();

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Sessão inválida ou expirada.';
    END IF;

    -- 2. Retornar a lista
    RETURN QUERY 
    SELECT * 
    FROM public.admins 
    ORDER BY username ASC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.get_all_admins(text) TO anon, authenticated, service_role;
