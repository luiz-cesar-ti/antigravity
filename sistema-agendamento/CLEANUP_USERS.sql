-- Deletar todos os agendamentos primeiro (para evitar erro de chave estrangeira)
DELETE FROM bookings;

-- Deletar todos os usuários da tabela 'users' (Professores)
-- O admin fica na tabela 'admins', então ele não será afetado.
DELETE FROM users;

-- Se houver usuários no Auth do Supabase que precisam ser removidos,
-- isso geralmente precisa ser feito pelo painel ou via API de administração,
-- pois SQL direto no auth.users é restrito.
-- Mas limpar a tabela public.users já reseta o sistema visualmente.
