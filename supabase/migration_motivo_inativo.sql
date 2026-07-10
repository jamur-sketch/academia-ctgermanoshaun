-- ============================================================
-- CT Germano Schaun — Motivo de inativação do aluno
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
-- ============================================================

alter table students add column if not exists inactive_reason text;
