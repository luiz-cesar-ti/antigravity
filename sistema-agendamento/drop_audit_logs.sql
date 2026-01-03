-- DESTRUIR SISTEMA DE LOGS (IRREVERSÍVEL)
-- Este script remove completamente a tabela de auditoria e tudo relacionado a ela.

-- 1. Remove a tabela de logs
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 2. Remove a função e gatilho se existirem (caso tenha criado triggers)
DROP FUNCTION IF EXISTS public.handle_new_audit_log() CASCADE;

-- 3. Limpa políticas (embora o DROP TABLE já deva fazer isso, garantimos aqui)
-- DROP POLICY IF EXISTS ... (não necessário pois a tabela se foi)

RAISE NOTICE 'Sistema de Auditoria excluído com sucesso.';
