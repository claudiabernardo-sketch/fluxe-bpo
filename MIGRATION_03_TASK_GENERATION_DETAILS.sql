-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 03: Auditoria granular da geração de tarefas
-- Execute no Supabase SQL Editor APÓS as Migrations 01 e 02
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabela de detalhe por decisão de geração ───────────────────────────────
CREATE TABLE IF NOT EXISTS task_generation_details (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id       UUID        NOT NULL REFERENCES task_generation_logs(id) ON DELETE CASCADE,
  empresa_id   UUID        NOT NULL,
  cliente_id   UUID        REFERENCES clientes(id),
  modelo_id    UUID        REFERENCES tarefa_modelos(id),
  data_alvo    DATE        NOT NULL,
  resultado    TEXT        NOT NULL
    CHECK (resultado IN (
      'gerada',
      'duplicidade_evitada',
      'cliente_em_configuracao',
      'cliente_pausado',
      'cliente_encerrado',
      'cliente_nao_iniciado',
      'modelo_pausado',
      'feriado',
      'data_incompativel',
      'erro'
    )),
  motivo       TEXT,          -- detalhe livre (ex: nome do feriado, regra de recorrência)
  tarefa_id    UUID        REFERENCES tarefas(id),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Índices ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS tgd_log_id_idx      ON task_generation_details (log_id);
CREATE INDEX IF NOT EXISTS tgd_cliente_idx     ON task_generation_details (cliente_id, data_alvo DESC);
CREATE INDEX IF NOT EXISTS tgd_modelo_idx      ON task_generation_details (modelo_id, data_alvo DESC);
CREATE INDEX IF NOT EXISTS tgd_resultado_idx   ON task_generation_details (resultado, empresa_id);
CREATE INDEX IF NOT EXISTS tgd_empresa_data_idx ON task_generation_details (empresa_id, data_alvo DESC);

-- ── 3. RLS: apenas service_role acessa ────────────────────────────────────────
ALTER TABLE task_generation_details ENABLE ROW LEVEL SECURITY;

-- ── 4. Verificar criação ──────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'task_generation_details'
ORDER BY ordinal_position;
