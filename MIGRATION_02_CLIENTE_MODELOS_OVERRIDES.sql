-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 02: Overrides por cliente em cliente_modelos
-- Execute no Supabase SQL Editor APÓS a Migration 01
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Colunas de override operacional ───────────────────────────────────────
-- Cada coluna corresponde a um campo do tarefa_modelos original.
-- Se NULL, a geração usa o valor do modelo original.

ALTER TABLE cliente_modelos
  ADD COLUMN IF NOT EXISTS responsavel_id   UUID         REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS recorrencia      TEXT
    CHECK (recorrencia IS NULL OR recorrencia IN (
      'diaria','dias_uteis','semanal','quinzenal','mensal',
      'bimestral','trimestral','semestral','anual','dias_especificos'
    )),
  ADD COLUMN IF NOT EXISTS dia_mes          INTEGER      CHECK (dia_mes IS NULL OR (dia_mes >= 1 AND dia_mes <= 31)),
  ADD COLUMN IF NOT EXISTS dias_semana      INTEGER[],
  ADD COLUMN IF NOT EXISTS hora             TEXT,
  ADD COLUMN IF NOT EXISTS pausado          BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pausado_em       TIMESTAMPTZ;

-- ── 2. Índice para o cron (filtra modelos ativos e não pausados) ──────────────
CREATE INDEX IF NOT EXISTS cliente_modelos_ativo_pausado_idx
  ON cliente_modelos (empresa_id, ativo, pausado)
  WHERE ativo = true AND pausado = false;

-- ── 3. Migrar modelos com cliente_id direto → cliente_modelos ─────────────────
-- Insere apenas os que ainda não estão na junction table (evita duplicatas)
INSERT INTO cliente_modelos (cliente_id, modelo_id, empresa_id, ativo)
SELECT
  tm.cliente_id,
  tm.id          AS modelo_id,
  tm.empresa_id,
  tm.ativo
FROM tarefa_modelos tm
WHERE tm.cliente_id IS NOT NULL
  AND tm.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM cliente_modelos cm
    WHERE cm.modelo_id  = tm.id
      AND cm.cliente_id = tm.cliente_id
  );

-- ── 4. Verificar migração ─────────────────────────────────────────────────────
-- Modelos que ainda têm cliente_id e YÁ estão na junction table:
SELECT
  tm.titulo,
  tm.cliente_id,
  c.razao_social,
  EXISTS (
    SELECT 1 FROM cliente_modelos cm
    WHERE cm.modelo_id = tm.id AND cm.cliente_id = tm.cliente_id
  ) AS migrado
FROM tarefa_modelos tm
LEFT JOIN clientes c ON c.id = tm.cliente_id
WHERE tm.empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
  AND tm.cliente_id IS NOT NULL
  AND tm.deleted_at IS NULL
ORDER BY tm.titulo;

-- ── 5. Ver todos os vínculos após migração ────────────────────────────────────
SELECT
  cm.id,
  c.razao_social   AS cliente,
  tm.titulo        AS modelo,
  cm.ativo,
  cm.pausado,
  cm.recorrencia,
  cm.responsavel_id
FROM cliente_modelos cm
JOIN clientes       c  ON c.id  = cm.cliente_id
JOIN tarefa_modelos tm ON tm.id = cm.modelo_id
WHERE cm.empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
ORDER BY c.razao_social, tm.titulo;
