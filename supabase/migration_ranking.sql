-- ============================================================
-- CT Germano Schaun — Ranking real: presença (chamada) e indicações
-- Rode este script no Supabase: SQL Editor > New query > Run.
-- Pode rodar novamente sem problema (idempotente).
-- ============================================================

-- Presença / chamada: uma linha por aluno por dia treinado.
create table if not exists attendance (
  id text primary key,
  student_id text not null references students(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

alter table attendance enable row level security;

drop policy if exists "equipe_full_access" on attendance;
create policy "equipe_full_access" on attendance
  for all to authenticated using (true) with check (true);

-- Indicação: qual aluno indicou este aluno.
alter table students add column if not exists referred_by text;
