-- Schema inicial do sistema de gestão CT Germano Schaun
-- Substitui os dados mock/localStorage por tabelas reais no Postgres (Supabase)

create extension if not exists "pgcrypto";

create table plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0,
  classes_per_month integer not null default 0,
  highlight boolean not null default false,
  created_at timestamptz not null default now()
);

create table instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  modalities text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  birth_date date,
  gender text not null check (gender in ('masculino', 'feminino', 'outro')),
  plan_id uuid references plans(id) on delete set null,
  join_date date not null default current_date,
  last_activity_date date,
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('turma', 'personal', 'gratis')),
  modality text not null,
  instructor_id uuid references instructors(id) on delete set null,
  schedule text,
  capacity integer not null default 0,
  created_at timestamptz not null default now()
);

create table class_students (
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  primary key (class_id, student_id)
);

create table financial_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('receita', 'despesa')),
  category text not null,
  payment_method text not null,
  amount numeric(10,2) not null,
  date date not null default current_date,
  description text,
  created_at timestamptz not null default now()
);

create table graduations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  modality text not null,
  belt text not null,
  date date not null default current_date,
  instructor_id uuid references instructors(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- RLS: por enquanto, qualquer usuário autenticado (equipe da academia) tem
-- acesso total. Sem multi-tenant nesta fase — é uma única academia.
alter table plans enable row level security;
alter table instructors enable row level security;
alter table students enable row level security;
alter table classes enable row level security;
alter table class_students enable row level security;
alter table financial_entries enable row level security;
alter table graduations enable row level security;

create policy "authenticated full access" on plans for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on instructors for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on students for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on classes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on class_students for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on financial_entries for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on graduations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
