-- ============================================================
-- CT Germano Schaun — Múltiplos planos por aluno
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
-- ============================================================

-- Nova coluna: lista de planos do aluno.
alter table students add column if not exists plan_ids text[] default '{}';

-- Migra o plano único existente para a lista (sem sobrescrever quem já tem).
update students
set plan_ids = array[plan_id]
where plan_id is not null
  and (plan_ids is null or plan_ids = '{}');
