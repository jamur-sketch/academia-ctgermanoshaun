-- ============================================================
-- CT Germano Schaun — Data de inativação (para a taxa de evasão)
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- Alunos inativos que já vieram da planilha ficam SEM esta data,
-- então não entram no cálculo de evasão. Só as saídas registradas
-- a partir de agora (com data) contam como evasão.
-- ============================================================

alter table students add column if not exists inactive_since date;
