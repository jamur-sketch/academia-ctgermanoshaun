-- ============================================================
-- CT Germano Schaun — Corrige leitura do catálogo pelos ALUNOS
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- Sintoma: no portal do aluno o(s) plano(s) apareciam como "—",
-- mesmo estando cadastrados no admin. Causa: a política de leitura
-- usava `auth.role() = 'authenticated'`, que nem sempre resolve para
-- contas de aluno. Trocamos por `to authenticated using (true)`, que
-- garante que qualquer usuário logado leia o catálogo (planos,
-- produtos e configurações compartilhadas), sem depender de auth.role().
-- ============================================================

-- plans: equipe gerencia; qualquer logado lê
drop policy if exists "read_all_auth" on plans;
create policy "read_all_auth" on plans for select to authenticated using (true);

-- products: idem (catálogo da loja)
drop policy if exists "read_all_auth" on products;
create policy "read_all_auth" on products for select to authenticated using (true);

-- app_settings: idem (ex.: código PIX dos pedidos)
drop policy if exists "read_all_auth" on app_settings;
create policy "read_all_auth" on app_settings for select to authenticated using (true);

-- Recarrega o cache de schema do PostgREST
notify pgrst, 'reload schema';
