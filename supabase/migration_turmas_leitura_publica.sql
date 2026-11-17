-- ============================================================
-- CT Germano Schaun — Leitura pública da lista de turmas
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- A tela de cadastro do aluno (/aluno) é pública (antes do login). Para o
-- aluno ESCOLHER a turma numa lista, o formulário precisa ler os nomes das
-- turmas sem estar logado. Só expomos nome/horário das turmas (nada sensível;
-- alunos ficam em outra tabela). Escrita continua restrita à equipe.
-- ============================================================

drop policy if exists "public_read" on classes;
create policy "public_read" on classes for select to anon using (true);

notify pgrst, 'reload schema';
