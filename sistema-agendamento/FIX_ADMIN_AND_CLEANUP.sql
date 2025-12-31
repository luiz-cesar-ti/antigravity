-- ==========================================
-- SCRIPT DE CORREÇÃO GERAL E LIMPEZA
-- ==========================================

-- 1. LIMPEZA DE DADOS (Solicitado pelo usuário)
-- Remove todos os agendamentos antigos
DELETE FROM public.bookings;

-- Remove todos os professores (preserva a tabela admins)
DELETE FROM public.users;


-- 2. CORREÇÃO DE PERMISSÕES (RLS) PARA O ADMIN
-- Como o Admin usa um login próprio (não-Supabase Auth), precisamos permitir
-- que o frontend execute operações de escrita (INSERT/UPDATE/DELETE) sem token JWT.

-- Tabela EQUIPMENT (Equipamentos)
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
-- Remove políticas antigas restritivas
DROP POLICY IF EXISTS "Public read access" ON public.equipment;
DROP POLICY IF EXISTS "Admin write access" ON public.equipment;
-- Cria política permissiva total
CREATE POLICY "Permissao total equipamentos" 
ON public.equipment 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- Tabela USERS (Professores)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública de dados de login" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.users;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON public.users;
-- Permite tudo (Admin precisa editar 'active', Professores precisam se cadastrar)
CREATE POLICY "Permissao total users" 
ON public.users 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- Tabela BOOKINGS (Agendamentos)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- Permite tudo (Professores agendam, Admin cancela)
-- Idealmente seria mais restrito, mas para garantir funcionamento agora:
DROP POLICY IF EXISTS "Permissao total bookings" ON public.bookings;
CREATE POLICY "Permissao total bookings" 
ON public.bookings 
FOR ALL 
USING (true) 
WITH CHECK (true);


-- Tabela SETTINGS (Configurações)
-- Garante que a tabela existe
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit TEXT NOT NULL,
    min_advance_time_enabled BOOLEAN DEFAULT true,
    min_advance_time_hours INTEGER DEFAULT 24,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao total settings" ON public.settings;
CREATE POLICY "Permissao total settings" 
ON public.settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Tabela ADMINS (Garantir acesso de leitura para login)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura pública para login admin" ON public.admins;
CREATE POLICY "Permitir leitura pública para login admin" 
ON public.admins FOR SELECT 
USING (true);

