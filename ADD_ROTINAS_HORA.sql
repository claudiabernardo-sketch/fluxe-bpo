-- ══════════════════════════════════════════════════════════════
-- ADD colunas hora + dias_semana na tabela rotinas
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Horário específico da rotina (ex: '08:00', '14:30') — opcional
ALTER TABLE rotinas ADD COLUMN IF NOT EXISTS hora TEXT;

-- Múltiplos dias da semana (ex: [0,2,4] = Seg, Qua, Sex) — opcional
ALTER TABLE rotinas ADD COLUMN IF NOT EXISTS dias_semana INTEGER[];
