-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Limpar tarefas geradas automaticamente (Infinance)
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── ANTES DE RODAR: visualize o que será apagado ─────────────────────────────
SELECT
  t.titulo,
  t.data_execucao,
  t.status,
  c.razao_social AS cliente
FROM tarefas t
LEFT JOIN clientes c ON c.id = t.cliente_id
WHERE t.empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
  AND t.modelo_id IS NOT NULL          -- geradas automaticamente
  AND t.status = 'aberta'              -- ainda não foram trabalhadas
  AND t.deleted_at IS NULL
ORDER BY t.data_execucao, c.razao_social, t.titulo;

-- ══════════════════════════════════════════════════════════════════════════════
-- ⚠️  SÓ RODE O DELETE DEPOIS DE REVISAR O SELECT ACIMA
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Apagar tarefas abertas geradas por modelo (soft delete) ──────────────────
-- Só apaga as que ainda estão abertas — preserva as que já foram trabalhadas
/*
UPDATE tarefas
SET deleted_at = now()
WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
  AND modelo_id IS NOT NULL
  AND status = 'aberta'
  AND deleted_at IS NULL;
*/

-- ── Desativar modelos que não fazem sentido para a operação ──────────────────
-- Rode o SELECT abaixo para ver todos os modelos ativos da Infinance,
-- depois desative os que não se aplicam.
--
-- Ver todos os modelos:
-- SELECT id, titulo, categoria, recorrencia, c.razao_social AS cliente
-- FROM tarefa_modelos tm
-- LEFT JOIN clientes c ON c.id = tm.cliente_id
-- WHERE tm.empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
--   AND tm.ativo = true
--   AND tm.deleted_at IS NULL
-- ORDER BY c.razao_social, tm.categoria, tm.titulo;
--
-- Desativar modelo específico por ID:
-- UPDATE tarefa_modelos SET ativo = false WHERE id = 'UUID_DO_MODELO';
--
-- Desativar modelos por título (exemplo):
-- UPDATE tarefa_modelos SET ativo = false
-- WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
--   AND titulo ILIKE '%DRE%';
