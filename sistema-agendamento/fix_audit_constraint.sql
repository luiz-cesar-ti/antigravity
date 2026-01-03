-- REMOVER RESTRIÇÃO DE CHAVE ESTRANGEIRA DA TABELA DE LOGS
-- Isso é necessário porque o ID do Admin vem da tabela 'admins' e não da tabela 'users'.

DO $$
BEGIN
    -- Tenta remover a constraint se ela existir (o nome padrão geralmente é este, mas garantimos a remoção)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'audit_logs_performed_by_fkey') THEN
        ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_performed_by_fkey;
    END IF;
END $$;

-- Opcional: Se você criou a tabela sem nomear a constraint, o Postgres gera um nome aleatório.
-- O comando abaixo é mais agressivo e garante que a coluna não tenha referência, alterando o tipo apenas para UUID simples.
-- ATENÇÃO: Execute apenas se o comando acima não funcionar.

ALTER TABLE public.audit_logs ALTER COLUMN performed_by DROP NOT NULL;
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_performed_by_fkey;

-- Se a constraint tiver outro nome (ex: gerado automaticamente), você pode descobri-lo e removê-lo, 
-- mas geralmente a recriação da coluna resolve ou o drop genérico funciona.
-- Como solução garantida, vamos recriar a coluna sem a referência.

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS temp_performed_by UUID;
UPDATE public.audit_logs SET temp_performed_by = performed_by;
ALTER TABLE public.audit_logs DROP COLUMN performed_by;
ALTER TABLE public.audit_logs RENAME COLUMN temp_performed_by TO performed_by;

-- Recriar politicas de segurança (garantia)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
