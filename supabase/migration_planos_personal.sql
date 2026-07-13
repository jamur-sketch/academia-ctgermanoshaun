-- ============================================================
-- CT Germano Schaun — Planos Personal Fight
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
-- ============================================================

insert into plans (id, name, price, classes_per_month, highlight) values
  ('plan-pf1', 'Personal Fight 1x', 200, 4, false),
  ('plan-pf2', 'Personal Fight 2x', 250, 8, false),
  ('plan-pf3', 'Personal Fight 3x', 300, 12, false)
on conflict (id) do update
  set name = excluded.name,
      price = excluded.price,
      classes_per_month = excluded.classes_per_month;
