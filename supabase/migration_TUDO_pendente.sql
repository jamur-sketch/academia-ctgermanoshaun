-- ============================================================
-- CT Germano Schaun — SQLs pendentes consolidados (rode tudo de uma vez)
-- SQL Editor > New query > Run. Idempotente (seguro rodar novamente).
-- ============================================================

-- 1) COLUNAS que o sistema usa -------------------------------
alter table students add column if not exists signup_class    text;   -- turma informada no cadastro
alter table students add column if not exists inactive_since  date;   -- data de saída (evasão)
alter table students add column if not exists portal_reviewed boolean not null default false;
alter table products add column if not exists image           text;   -- foto do produto

-- 2) LEITURA do catálogo pelos alunos (planos/produtos/config)
drop policy if exists "read_all_auth" on plans;
create policy "read_all_auth" on plans        for select to authenticated using (true);
drop policy if exists "read_all_auth" on products;
create policy "read_all_auth" on products     for select to authenticated using (true);
drop policy if exists "read_all_auth" on app_settings;
create policy "read_all_auth" on app_settings for select to authenticated using (true);

-- 3) LEITURA PÚBLICA das turmas (pra lista aparecer no cadastro /aluno)
drop policy if exists "public_read" on classes;
create policy "public_read" on classes for select to anon using (true);

-- 4) SEGURANÇA: aluno não altera campos sensíveis do próprio cadastro
create or replace function public.students_guard_aluno_update()
returns trigger language plpgsql as $$
begin
  if not public.is_staff() then
    new.id := old.id;
    new.name := old.name;
    new.email := old.email;
    new.cpf := old.cpf;
    new.birth_date := old.birth_date;
    new.gender := old.gender;
    new.plan_id := old.plan_id;
    new.plan_ids := old.plan_ids;
    new.join_date := old.join_date;
    new.last_activity_date := old.last_activity_date;
    new.status := old.status;
    new.inactive_reason := old.inactive_reason;
    new.inactive_since := old.inactive_since;
    new.referred_by := old.referred_by;
    new.auth_user_id := old.auth_user_id;
    new.consent_data := old.consent_data;
    new.consent_date := old.consent_date;
    new.portal_reviewed := old.portal_reviewed;
  end if;
  return new;
end;
$$;
drop trigger if exists students_guard_aluno_update on students;
create trigger students_guard_aluno_update
  before update on students
  for each row execute function public.students_guard_aluno_update();

-- 5) SEGURANÇA: aluno não cria pedido já "confirmado/pago"
create or replace function public.orders_guard_aluno_write()
returns trigger language plpgsql as $$
begin
  if not public.is_staff() then
    new.status := 'aguardando';
    new.deposit_paid := false;
    new.remaining_paid := false;
    new.order_number := '';
    new.remaining_due := null;
  end if;
  return new;
end;
$$;
drop trigger if exists orders_guard_aluno_write on orders;
create trigger orders_guard_aluno_write
  before insert or update on orders
  for each row execute function public.orders_guard_aluno_write();

-- 6) Recarrega o cache do banco
notify pgrst, 'reload schema';
