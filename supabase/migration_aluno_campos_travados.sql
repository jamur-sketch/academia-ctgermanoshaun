-- ============================================================
-- CT Germano Schaun — Trava de campos no cadastro do próprio aluno
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- A política RLS "aluno_update_own" deixa o aluno editar a PRÓPRIA linha,
-- mas não limita QUAIS colunas. Sem isto, um aluno poderia (fora da tela,
-- chamando a API direto) mudar o próprio status, plano, data de entrada,
-- etc. Este trigger força as colunas sensíveis a manterem o valor antigo
-- quando quem edita NÃO é da equipe. A equipe (is_staff) altera tudo.
--
-- O aluno continua podendo editar: telefone, endereço, número, bairro,
-- instagram, facebook e peso pretendido (o que a tela do portal permite).
-- ============================================================

create or replace function public.students_guard_aluno_update()
returns trigger
language plpgsql
as $$
begin
  if not public.is_staff() then
    -- Campos que o aluno NÃO pode alterar: mantém sempre o valor anterior.
    new.id                 := old.id;
    new.name               := old.name;
    new.email              := old.email;
    new.cpf                := old.cpf;
    new.birth_date         := old.birth_date;
    new.gender             := old.gender;
    new.plan_id            := old.plan_id;
    new.plan_ids           := old.plan_ids;
    new.join_date          := old.join_date;
    new.last_activity_date := old.last_activity_date;
    new.status             := old.status;
    new.inactive_reason    := old.inactive_reason;
    new.inactive_since     := old.inactive_since;
    new.referred_by        := old.referred_by;
    new.auth_user_id       := old.auth_user_id;
    new.consent_data       := old.consent_data;
    new.consent_date       := old.consent_date;
    new.portal_reviewed    := old.portal_reviewed;
  end if;
  return new;
end;
$$;

drop trigger if exists students_guard_aluno_update on students;
create trigger students_guard_aluno_update
  before update on students
  for each row
  execute function public.students_guard_aluno_update();
