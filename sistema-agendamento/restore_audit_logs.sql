-- CRIAÇÃO DA TABELA DE AUDITORIA (AUDIT LOGS)
-- Garante que a tabela exista com a estrutura correta para o Dashboard

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    booking_id UUID,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES public.users(id),
    details JSONB
);

-- Ativar RLS (Row Level Security) para segurança
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (POLICIES)

-- 1. Permitir LEITURA (SELECT) para todos os usuários autenticados
-- Isso garante que o admin consiga ver os logs no Dashboard.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.audit_logs;
CREATE POLICY "Enable read access for authenticated users" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Permitir INSERÇÃO (INSERT) para todos os usuários autenticados
-- Isso permite que qualquer professor/admin grave o log ao criar agendamento.
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.audit_logs;
CREATE POLICY "Enable insert for authenticated users" ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Comentário da Tabela
COMMENT ON TABLE public.audit_logs IS 'Tabela de registro de atividades do sistema para auditoria e segurança.';
