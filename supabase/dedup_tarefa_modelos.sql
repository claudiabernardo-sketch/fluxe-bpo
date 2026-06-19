-- ════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Remover modelos de tarefa duplicados
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════════
-- Causa: supabase/biblioteca_bpo.sql não tem ON CONFLICT — se foi rodado
-- mais de uma vez, cada template do seed virou 2+ registros idênticos
-- (mesmo título, categoria, recorrência, checklist).
--
-- Esta migration:
--   1) Desativa as cópias extras (ativo=false), mantendo a mais antiga
--      de cada grupo — NÃO apaga nada, então nenhuma tarefa já gerada
--      a partir desses modelos quebra (a referência continua válida).
--   2) Cria um índice único parcial pra impedir duplicata futura entre
--      modelos ativos (rodar o seed de novo não vai mais duplicar).
-- ════════════════════════════════════════════════════════════════════

-- 1) Ver quantas duplicatas existem antes de mexer (rode separado pra conferir)
-- SELECT empresa_id, titulo, categoria, COUNT(*) 
-- FROM tarefa_modelos WHERE ativo = true
-- GROUP BY empresa_id, titulo, categoria HAVING COUNT(*) > 1;

-- 2) Desativar duplicatas, mantendo a mais antiga (ou de menor id em empate)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY empresa_id, titulo, categoria
      ORDER BY criado_em ASC NULLS LAST, id ASC
    ) AS rn
  FROM tarefa_modelos
  WHERE ativo = true
)
UPDATE tarefa_modelos
SET ativo = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) Travar contra duplicata futura entre modelos ativos
DROP INDEX IF EXISTS tarefa_modelos_dedup_idx;
CREATE UNIQUE INDEX tarefa_modelos_dedup_idx
  ON tarefa_modelos (empresa_id, titulo, categoria)
  WHERE ativo = true;
