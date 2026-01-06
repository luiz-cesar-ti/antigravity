-- RPC SEGURA PARA RESETAR SENHA DE ADMIN
-- Permite que apenas Super Admins (com token válido) alterem senhas.

CREATE OR REPLACE FUNCTION public.reset_admin_password(
    p_admin_token text,
    p_target_admin_id uuid,
    p_new_password_hash text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_admin_id uuid;
    v_role text;
BEGIN
    -- 1. Validar quem está pedindo (Super Admin)
    SELECT a.id, a.role INTO v_admin_id, v_role
    FROM public.admin_sessions s
    JOIN public.admins a ON s.admin_id = a.id
    WHERE s.token = p_admin_token AND s.expires_at > NOW();

    IF v_admin_id IS NULL OR v_role IS DISTINCT FROM 'super_admin' THEN
        RAISE EXCEPTION 'Apenas Super Administradores podem resetar senhas.';
    END IF;

    -- 2. Atualizar a senha (hash)
    UPDATE public.admins
    SET password_hash = p_new_password_hash, updated_at = NOW()
    WHERE id = p_target_admin_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Administrador alvo não encontrado.';
    END IF;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.reset_admin_password(text, uuid, text) TO anon, authenticated, service_role;
