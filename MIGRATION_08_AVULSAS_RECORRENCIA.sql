-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 08: Recorrência mensal em Tarefas Avulsas
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Colunas opcionais — tarefas avulsas existentes continuam funcionando
-- normalmente, só ficam com esses campos vazios (não fazem parte de nenhuma
-- recorrência).
ALTER TABLE tarefas_avulsas
  ADD COLUMN IF NOT EXISTS recorrencia_grupo_id UUID,
  ADD COLUMN IF NOT EXISTS lote_atual           INT,
  ADD COLUMN IF NOT EXISTS lote_total           INT;

-- Verificar resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tarefas_avulsas'
  AND column_name IN ('recorrencia_grupo_id', 'lote_atual', 'lote_total');
