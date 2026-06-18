-- ============================================================
-- PASSO 1 — Cole este SQL no editor e clique em Run
-- ============================================================

-- Adiciona campo de descrição nos modelos de tarefas
ALTER TABLE tarefa_modelos ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Confirma que funcionou
SELECT 'Passo 1 concluído! Coluna descricao adicionada.' AS resultado;
