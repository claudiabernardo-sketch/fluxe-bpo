-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 28: Anexo de arquivo nas interações do lead (CRM)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE lead_interacoes
  ADD COLUMN IF NOT EXISTS arquivo_path TEXT;

COMMENT ON COLUMN lead_interacoes.arquivo_path IS
  'Caminho do arquivo anexado (bucket tarefas), ex: diagnóstico ou proposta enviada por fora. NULL = sem anexo.';
