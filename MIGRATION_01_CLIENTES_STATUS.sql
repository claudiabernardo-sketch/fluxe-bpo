-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 01: Status operacional dos clientes
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Adicionar status_operacional ──────────────────────────────────────────
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS status_operacional TEXT
    NOT NULL DEFAULT 'em_configuracao'
    CHECK (status_operacional IN ('em_configuracao', 'operacional', 'pausado', 'encerrado'));

-- ── 2. Adicionar data de início da operação ───────────────────────────────────
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS operacao_iniciada_em DATE;

-- ── 3. Índices para performance (cron e dashboards filtram por esses campos) ──
CREATE INDEX IF NOT EXISTS clientes_status_operacional_idx
  ON clientes (status_operacional, empresa_id);

CREATE INDEX IF NOT EXISTS clientes_operacao_iniciada_idx
  ON clientes (operacao_iniciada_em)
  WHERE operacao_iniciada_em IS NOT NULL;

-- ── 4. Verificar resultado ────────────────────────────────────────────────────
SELECT
  id,
  razao_social,
  status_operacional,
  operacao_iniciada_em
FROM clientes
WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
ORDER BY razao_social;
