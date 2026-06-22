-- ════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Melhorias CRM: motivo de perda, follow-up, observações
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE leads ADD COLUMN IF NOT EXISTS motivo_perda   TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS obs            TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proximo_contato DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS perdido_em     TIMESTAMPTZ;

-- Índice pra buscar leads com follow-up próximo
CREATE INDEX IF NOT EXISTS leads_proximo_contato_idx ON leads(proximo_contato) WHERE proximo_contato IS NOT NULL;
