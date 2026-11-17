-- ============================================================
-- CT Germano Schaun — Turma informada pelo aluno no cadastro do portal
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- Quando o aluno se cadastra pelo portal, ele informa em qual turma treina.
-- A equipe usa essa informação na hora de revisar/vincular o cadastro e
-- matricular o aluno na turma certa.
-- ============================================================

alter table students add column if not exists signup_class text;

notify pgrst, 'reload schema';
