-- ============================================================
-- CT Germano Schaun — Aulas no portal do aluno + solicitações
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
-- ============================================================

-- Catálogo de aulas: qualquer aluno logado pode ver as aulas disponíveis.
drop policy if exists "read_all_auth" on classes;
create policy "read_all_auth" on classes for select using (auth.role() = 'authenticated');

-- Matrículas: o aluno vê apenas as PRÓPRIAS matrículas.
drop policy if exists "aluno_select_own" on class_students;
create policy "aluno_select_own" on class_students for select
  using (student_id in (select public.my_student_ids()));

-- Solicitações de aula (interesse do aluno em fazer mais aulas).
create table if not exists class_requests (
  id text primary key,
  student_id text not null references students(id) on delete cascade,
  class_id text not null references classes(id) on delete cascade,
  status text not null default 'pendente',
  created_at timestamptz not null default now()
);
alter table class_requests enable row level security;

drop policy if exists "staff_all" on class_requests;
drop policy if exists "aluno_insert_own" on class_requests;
drop policy if exists "aluno_select_own" on class_requests;
create policy "staff_all" on class_requests for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_insert_own" on class_requests for insert
  with check (student_id in (select public.my_student_ids()));
create policy "aluno_select_own" on class_requests for select
  using (student_id in (select public.my_student_ids()));
