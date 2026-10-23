-- ============================================================
-- CT Germano Schaun — Integridade dos pedidos feitos pelo aluno
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- A política RLS deixa o aluno INSERIR um pedido próprio, mas não controla
-- QUAIS valores ele coloca. Sem isto, um aluno poderia (fora da tela,
-- chamando a API direto) criar um pedido já com status "confirmado",
-- deposit_paid = true, remaining_paid = true ou um "Nº do pedido" inventado —
-- ou seja, fingir um pedido pago/confirmado. Só a EQUIPE pode definir esses
-- campos. Este trigger força os campos de confirmação/pagamento a valores
-- seguros quando quem grava NÃO é da equipe (vale para insert e update).
-- ============================================================

create or replace function public.orders_guard_aluno_write()
returns trigger
language plpgsql
as $$
begin
  if not public.is_staff() then
    new.status         := 'aguardando';
    new.deposit_paid   := false;
    new.remaining_paid := false;
    new.order_number   := '';
    new.remaining_due  := null;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_aluno_write on orders;
create trigger orders_guard_aluno_write
  before insert or update on orders
  for each row
  execute function public.orders_guard_aluno_write();
