-- CORREÇÃO DE SENHA DO SUPER ADMIN
-- O problema é que a senha foi salva como texto puro ('Steve@obj2026') na criação do usuário.
-- O sistema de login espera uma senha criptografada (hash).

-- Este script corrige isso usando a função crypt do pgcrypto para gerar o hash correto.

UPDATE public.admins
SET password_hash = crypt('Steve@obj2026', gen_salt('bf'))
WHERE username = 'atendimentotecnico.saovicente@objetivoportal.com.br';
