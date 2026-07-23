-- ============================================================
-- CT Germano Schaun — Marcar cadastros do portal como revisados
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
-- ============================================================

alter table students add column if not exists portal_reviewed boolean not null default false;

-- Registros que já têm login e NÃO são cadastros avulsos do portal
-- (ou seja, já foram vinculados a um aluno antigo) contam como revisados.
update students
set portal_reviewed = true
where auth_user_id is not null
  and id not like 'aluno-%';
