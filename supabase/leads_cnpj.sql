-- ============================================================
-- FLUXE BPO — Colunas extras na tabela leads
-- Execute no Supabase → SQL Editor
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS cnpj    VARCHAR(18);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fantasia VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_leads_cnpj ON leads(cnpj) WHERE cnpj IS NOT NULL;
