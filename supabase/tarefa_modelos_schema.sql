-- ══════════════════════════════════════════════════════════════
-- TAREFAS RECORRENTES — Modelos e campos adicionais
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Tabela de modelos de tarefas recorrentes
CREATE TABLE IF NOT EXISTS tarefa_modelos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  categoria       TEXT,
  prioridade      TEXT NOT NULL DEFAULT 'media',
  recorrencia     TEXT NOT NULL DEFAULT 'dias_uteis',
  -- 'diaria' | 'dias_uteis' | 'semanal' | 'mensal' | 'dias_especificos'
  dias_semana     INTEGER[],   -- [1=seg,2=ter,3=qua,4=qui,5=sex,6=sab,0=dom]
  dia_mes         INTEGER,     -- para recorrencia='mensal' (1-28)
  dias_mes        INTEGER[],   -- para recorrencia='dias_especificos'
  checklist_items JSONB NOT NULL DEFAULT '[]',
  ativo           BOOLEAN NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Adiciona campos na tabela tarefas existente
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS modelo_id     UUID REFERENCES tarefa_modelos(id) ON DELETE SET NULL;
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS data_execucao DATE;

-- Índices
CREATE INDEX IF NOT EXISTS idx_tarefa_modelos_empresa   ON tarefa_modelos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefa_modelos_cliente   ON tarefa_modelos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_modelo           ON tarefas(modelo_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_execucao    ON tarefas(data_execucao);

-- 3. RLS
ALTER TABLE tarefa_modelos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_tarefa_modelos" ON tarefa_modelos;
CREATE POLICY "empresa_tarefa_modelos" ON tarefa_modelos
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
  );
