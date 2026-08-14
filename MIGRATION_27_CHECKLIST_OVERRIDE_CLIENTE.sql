-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 27: Checklist específico por cliente em cliente_modelos
-- Mesma convenção das colunas de override já existentes (recorrencia, dia_mes,
-- hora): se NULL, a geração de tarefas usa o checklist_items do modelo padrão.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE cliente_modelos
  ADD COLUMN IF NOT EXISTS checklist_items_override TEXT[];

COMMENT ON COLUMN cliente_modelos.checklist_items_override IS
  'Checklist específico deste vínculo cliente+modelo. NULL = usa tarefa_modelos.checklist_items (padrão). Não afeta outros clientes nem o modelo original.';
