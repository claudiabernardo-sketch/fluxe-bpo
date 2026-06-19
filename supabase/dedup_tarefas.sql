-- ════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Remover tarefas duplicadas (sobra de quando os modelos
-- estavam triplicados, antes da limpeza em dedup_tarefa_modelos.sql)
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════════
-- Identifica tarefas com mesmo cliente + título + data de execução +
-- status ainda não concluído, e desativa (soft delete) as cópias extras,
-- mantendo a mais antiga. NÃO mexe em tarefas já concluídas, pra não
-- apagar histórico de trabalho real já feito.
-- ════════════════════════════════════════════════════════════════════

-- 1) Conferir quantas duplicatas existem antes de mexer
SELECT cliente_id, titulo, data_execucao, COUNT(*) AS qtd
FROM tarefas
WHERE deleted_at IS NULL AND status != 'concluida'
GROUP BY cliente_id, titulo, data_execucao
HAVING COUNT(*) > 1
ORDER BY qtd DESC;

-- 2) Soft-delete das duplicatas (mantém a mais antiga de cada grupo)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY empresa_id, cliente_id, titulo, data_execucao
      ORDER BY criado_em ASC NULLS LAST, id ASC
    ) AS rn
  FROM tarefas
  WHERE deleted_at IS NULL AND status != 'concluida'
)
UPDATE tarefas
SET deleted_at = now()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
