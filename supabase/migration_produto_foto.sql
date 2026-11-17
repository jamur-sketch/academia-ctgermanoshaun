-- ============================================================
-- CT Germano Schaun — Foto do produto (além do vídeo)
-- Rode no Supabase: SQL Editor > New query > Run. Idempotente.
--
-- A foto é guardada como data URL (imagem já reduzida pelo app) na própria
-- linha do produto, então não precisa de Storage/bucket.
-- ============================================================

alter table products add column if not exists image text;

notify pgrst, 'reload schema';
