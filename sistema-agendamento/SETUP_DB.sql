-- 1. Habilitar a extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Garantir que a tabela 'users' tenha a coluna 'active' e 'units'
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 3. Atualizar Políticas de Segurança (RLS) para a tabela 'users'
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de dados de login" ON public.users;
CREATE POLICY "Permitir leitura pública de dados de login" 
ON public.users FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.users;
CREATE POLICY "Usuários podem atualizar seus próprios dados" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON public.users;
CREATE POLICY "Usuários podem inserir seus próprios dados" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Corrigir tabela de Admins (Adicionar colunas se faltarem)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas caso a tabela já existisse sem elas
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS unit TEXT;

-- 5. Inserir um Administrador Padrão
INSERT INTO public.admins (username, password_hash, full_name, unit)
VALUES ('admin', '123', 'Administrador Sistema', 'Matriz')
ON CONFLICT (username) DO UPDATE 
SET 
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    unit = EXCLUDED.unit;

-- 6. Garantir permissões para a tabela de Admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública para login admin" ON public.admins;
CREATE POLICY "Permitir leitura pública para login admin" 
ON public.admins FOR SELECT 
USING (true);
