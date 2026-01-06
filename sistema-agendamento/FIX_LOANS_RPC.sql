-- FUNÇÕES SEGURAS PARA GERENCIAMENTO DE EMPRÉSTIMOS (RPC)
-- CORREÇÃO: Alterado p_admin_token para TEXT para compatibilidade com o banco.

-- 1. CRIAR EMPRÉSTIMO
CREATE OR REPLACE FUNCTION public.create_equipment_loan(
    p_admin_token text,
    p_user_full_name text,
    p_user_role text,
    p_location text,
    p_start_at timestamptz,
    p_end_at timestamptz,
    p_equipment_id uuid,
    p_quantity int,
    p_asset_number text,
    p_unit text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_admin_id uuid;
    v_loan_id uuid;
    v_current_qty int;
BEGIN
    -- Validação da Sessão (Casting explicito se necessario, mas comparando text=text é mais seguro)
    SELECT admin_id INTO v_admin_id
    FROM public.admin_sessions
    WHERE token = p_admin_token::text AND expires_at > NOW();

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Sessão de administrador inválida ou expirada.';
    END IF;

    -- Verificação de Estoque
    SELECT total_quantity INTO v_current_qty
    FROM public.equipment
    WHERE id = p_equipment_id;

    IF v_current_qty IS NULL THEN
        RAISE EXCEPTION 'Equipamento não encontrado.';
    END IF;

    IF v_current_qty < p_quantity THEN
        RAISE EXCEPTION 'Quantidade insuficiente no inventário.';
    END IF;

    -- Inserir Empréstimo
    INSERT INTO public.equipment_loans (
        user_full_name, user_role, location, start_at, end_at,
        equipment_id, quantity, asset_number, unit, status
    ) VALUES (
        p_user_full_name, p_user_role, p_location, p_start_at, p_end_at,
        p_equipment_id, p_quantity, p_asset_number, p_unit, 'active'
    ) RETURNING id INTO v_loan_id;

    -- Atualizar Inventário
    UPDATE public.equipment
    SET total_quantity = total_quantity - p_quantity
    WHERE id = p_equipment_id;

    -- Retornar dados inseridos
    RETURN (SELECT to_jsonb(el) FROM public.equipment_loans el WHERE id = v_loan_id);
END;
$$;

-- 2. DEVOLVER EMPRÉSTIMO
CREATE OR REPLACE FUNCTION public.return_equipment_loan(
    p_admin_token text,
    p_loan_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_admin_id uuid;
    v_loan record;
BEGIN
    SELECT admin_id INTO v_admin_id FROM public.admin_sessions WHERE token = p_admin_token::text AND expires_at > NOW();
    IF v_admin_id IS NULL THEN RAISE EXCEPTION 'Sessão de administrador inválida ou expirada.'; END IF;

    SELECT * INTO v_loan FROM public.equipment_loans WHERE id = p_loan_id;
    IF v_loan IS NULL THEN RAISE EXCEPTION 'Empréstimo não encontrado.'; END IF;
    IF v_loan.status = 'returned' THEN RAISE EXCEPTION 'Empréstimo já devolvido.'; END IF;

    -- Marcar como devolvido
    UPDATE public.equipment_loans 
    SET status = 'returned', updated_at = NOW() 
    WHERE id = p_loan_id;

    -- Restaurar Inventário
    UPDATE public.equipment 
    SET total_quantity = total_quantity + v_loan.quantity 
    WHERE id = v_loan.equipment_id;
END;
$$;

-- 3. EXCLUIR EMPRÉSTIMO
CREATE OR REPLACE FUNCTION public.delete_equipment_loan(
    p_admin_token text,
    p_loan_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_admin_id uuid;
    v_loan record;
BEGIN
    SELECT admin_id INTO v_admin_id FROM public.admin_sessions WHERE token = p_admin_token::text AND expires_at > NOW();
    IF v_admin_id IS NULL THEN RAISE EXCEPTION 'Sessão de administrador inválida ou expirada.'; END IF;

    SELECT * INTO v_loan FROM public.equipment_loans WHERE id = p_loan_id;
    IF v_loan IS NULL THEN RAISE EXCEPTION 'Empréstimo não encontrado.'; END IF;

    -- Se estiver ativo, restaurar inventário
    IF v_loan.status = 'active' THEN
        UPDATE public.equipment 
        SET total_quantity = total_quantity + v_loan.quantity 
        WHERE id = v_loan.equipment_id;
    END IF;

    -- Deletar
    DELETE FROM public.equipment_loans WHERE id = p_loan_id;
END;
$$;

-- 4. Permissões de Execução
-- Removendo assinaturas antigas se existirem para evitar conflito (sobrecarga)
DROP FUNCTION IF EXISTS public.create_equipment_loan(uuid, text, text, text, timestamptz, timestamptz, uuid, int, text, text);
DROP FUNCTION IF EXISTS public.return_equipment_loan(uuid, uuid);
DROP FUNCTION IF EXISTS public.delete_equipment_loan(uuid, uuid);

GRANT EXECUTE ON FUNCTION public.create_equipment_loan(text, text, text, text, timestamptz, timestamptz, uuid, int, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.return_equipment_loan(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_equipment_loan(text, uuid) TO anon, authenticated, service_role;
