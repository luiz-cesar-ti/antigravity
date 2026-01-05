-- FIX CRÍTICO DE LOGIN
-- O comando anterior restringiu demais o "caminho de busca" (search_path),
-- impedindo que a função encontre a criptografia (pgcrypto) se ela estiver na schema 'extensions'.

-- Este comando corrige isso adicionando 'extensions' ao caminho permitido.
ALTER FUNCTION public.admin_login(text, text) SET search_path = public, extensions;

-- Por garantia, aplicamos o mesmo para as outras que podem usar extensions no futuro
ALTER FUNCTION public.is_admin_session_valid() SET search_path = public, extensions;
