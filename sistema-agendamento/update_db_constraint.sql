-- Remover a restrição de unicidade da coluna verification_token
-- Isso é necessário para permitir que múltiplos equipamentos (linhas) compartilhem o mesmo token de agendamento.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_verification_token_key;

-- Caso a constraint tenha sido criada como índice único implícito, remova o índice:
DROP INDEX IF EXISTS bookings_verification_token_key;
