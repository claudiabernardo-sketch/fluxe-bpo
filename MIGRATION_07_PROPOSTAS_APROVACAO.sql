-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 07: Timestamps do ciclo comercial das propostas
-- Execute no Supabase SQL Editor ANTES de fazer o deploy desta versão
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE propostas ADD COLUMN IF NOT EXISTS enviada_em  TIMESTAMPTZ;
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS aprovada_em TIMESTAMPTZ;

COMMENT ON COLUMN propostas.enviada_em  IS 'Quando a proposta foi marcada como enviada';
COMMENT ON COLUMN propostas.aprovada_em IS 'Quando o cliente aprovou — congela o snapshot para geração do contrato';
