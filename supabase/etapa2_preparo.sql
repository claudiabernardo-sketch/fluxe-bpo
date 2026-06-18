-- ============================================================
-- ETAPA 2 — Preparação: descricao + etapas
-- Execute no Supabase → SQL Editor ANTES de rodar a biblioteca
-- ============================================================

-- 1. Adicionar coluna descricao em tarefa_modelos
ALTER TABLE tarefa_modelos ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 2. Verificação: listar colunas atuais de tarefa_modelos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tarefa_modelos'
ORDER BY ordinal_position;

-- 3. Limpar templates sem empresa_id (lixo de testes, se houver)
-- DELETE FROM tarefa_modelos WHERE empresa_id IS NULL;
-- ^ descomente só se necessário após verificar

-- 4. Confirmar etapas registradas nos templates existentes
SELECT etapa, COUNT(*) FROM tarefa_modelos GROUP BY etapa ORDER BY etapa;
