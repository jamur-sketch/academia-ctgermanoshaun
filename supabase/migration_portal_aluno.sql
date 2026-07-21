-- ============================================================
-- CT Germano Schaun — Portal do Aluno (login/cadastro + dados próprios)
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- IMPORTANTE: depois de rodar, a EQUIPE precisa SAIR e ENTRAR de novo
-- (o papel "equipe" entra no login). Sem isso a equipe fica sem acesso.
-- ============================================================

-- ---------- Campos novos do aluno (cadastro do portal) ----------
alter table students add column if not exists cpf text;
alter table students add column if not exists address text;
alter table students add column if not exists address_number text;
alter table students add column if not exists neighborhood text;
alter table students add column if not exists instagram text;
alter table students add column if not exists facebook text;
alter table students add column if not exists target_weight numeric(6,2);
alter table students add column if not exists consent_data boolean not null default false;
alter table students add column if not exists consent_date timestamptz;
alter table students add column if not exists auth_user_id uuid;

create index if not exists students_auth_user_id_idx on students (auth_user_id);

-- ---------- Evolução de peso ----------
create table if not exists weight_entries (
  id text primary key,
  student_id text not null references students(id) on delete cascade,
  date date not null,
  weight numeric(6,2) not null,
  created_at timestamptz not null default now()
);
alter table weight_entries enable row level security;

-- ---------- Papel (equipe x aluno) ----------
-- Todos os usuários que já existem hoje são da EQUIPE.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"equipe"}'::jsonb
where coalesce(raw_app_meta_data->>'role', '') = '';

create or replace function public.is_staff() returns boolean
language sql stable as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'equipe';
$$;

create or replace function public.my_student_ids() returns setof text
language sql stable as $$
  select id from public.students where auth_user_id = auth.uid();
$$;

-- ---------- RLS: troca o acesso "todo autenticado" por acesso por papel ----------
-- Staff continua com acesso total; aluno só ao que é dele.

-- students
drop policy if exists "equipe_full_access" on students;
drop policy if exists "staff_all" on students;
drop policy if exists "aluno_select_own" on students;
drop policy if exists "aluno_update_own" on students;
create policy "staff_all" on students for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_select_own" on students for select using (auth_user_id = auth.uid());
create policy "aluno_update_own" on students for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- monthly_payments (aluno só lê os próprios)
drop policy if exists "equipe_full_access" on monthly_payments;
drop policy if exists "staff_all" on monthly_payments;
drop policy if exists "aluno_select_own" on monthly_payments;
create policy "staff_all" on monthly_payments for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_select_own" on monthly_payments for select using (student_id in (select public.my_student_ids()));

-- payment_configs (aluno lê o próprio, pra ver o valor)
drop policy if exists "equipe_full_access" on payment_configs;
drop policy if exists "staff_all" on payment_configs;
drop policy if exists "aluno_select_own" on payment_configs;
create policy "staff_all" on payment_configs for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_select_own" on payment_configs for select using (student_id in (select public.my_student_ids()));

-- graduations (aluno vê as próprias — desenvolvimento)
drop policy if exists "equipe_full_access" on graduations;
drop policy if exists "staff_all" on graduations;
drop policy if exists "aluno_select_own" on graduations;
create policy "staff_all" on graduations for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_select_own" on graduations for select using (student_id in (select public.my_student_ids()));

-- weight_entries (aluno gerencia os próprios; staff vê tudo)
drop policy if exists "staff_all" on weight_entries;
drop policy if exists "aluno_own" on weight_entries;
create policy "staff_all" on weight_entries for all using (public.is_staff()) with check (public.is_staff());
create policy "aluno_own" on weight_entries for all
  using (student_id in (select public.my_student_ids()))
  with check (student_id in (select public.my_student_ids()));

-- plans (catálogo: qualquer logado pode ler; só staff altera)
drop policy if exists "equipe_full_access" on plans;
drop policy if exists "staff_all" on plans;
drop policy if exists "read_all_auth" on plans;
create policy "staff_all" on plans for all using (public.is_staff()) with check (public.is_staff());
create policy "read_all_auth" on plans for select using (auth.role() = 'authenticated');

-- Tabelas restantes: apenas staff.
drop policy if exists "equipe_full_access" on instructors;
drop policy if exists "staff_all" on instructors;
create policy "staff_all" on instructors for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "equipe_full_access" on classes;
drop policy if exists "staff_all" on classes;
create policy "staff_all" on classes for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "equipe_full_access" on class_students;
drop policy if exists "staff_all" on class_students;
create policy "staff_all" on class_students for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "equipe_full_access" on financial_entries;
drop policy if exists "staff_all" on financial_entries;
create policy "staff_all" on financial_entries for all using (public.is_staff()) with check (public.is_staff());

-- attendance (se existir)
do $$ begin
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'attendance') then
    execute 'drop policy if exists "equipe_full_access" on attendance';
    execute 'drop policy if exists "staff_all" on attendance';
    execute 'create policy "staff_all" on attendance for all using (public.is_staff()) with check (public.is_staff())';
  end if;
end $$;
