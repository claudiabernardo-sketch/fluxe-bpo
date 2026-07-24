-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 23: Upload de arquivo nos Materiais de mentoria
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════════
-- Hoje um material só pode ser um link externo (url obrigatória). Passa a
-- aceitar também um arquivo enviado direto (arquivo_path, guardado no bucket
-- "tarefas" já existente — mesmo bucket usado pelos anexos de tarefas, sem
-- precisar criar bucket nem política nova). Um material tem link OU arquivo.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE mentoria_links ALTER COLUMN url DROP NOT NULL;
ALTER TABLE mentoria_links ADD COLUMN IF NOT EXISTS arquivo_path text;

ALTER TABLE mentoria_links DROP CONSTRAINT IF EXISTS mentoria_links_url_ou_arquivo;
ALTER TABLE mentoria_links ADD CONSTRAINT mentoria_links_url_ou_arquivo
  CHECK (url IS NOT NULL OR arquivo_path IS NOT NULL);
