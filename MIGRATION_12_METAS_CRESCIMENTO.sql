-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 12: Meta de crescimento
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Uma meta de crescimento por empresa (MRR ou nº de clientes, com data alvo
-- opcional). A tela Executivo passa a mostrar o progresso em relação a essa
-- meta e, com base no ritmo real de crescimento, se a empresa está no
-- caminho de atingi-la até a data escolhida.

CREATE TABLE IF NOT EXISTS metas_crescimento (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID          NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo           TEXT          NOT NULL CHECK (tipo IN ('mrr','clientes')),
  valor_alvo     NUMERIC(12,2) NOT NULL,
  data_alvo      DATE,
  criado_por     UUID          REFERENCES usuarios(id),
  criado_em      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  atualizado_em  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS metas_crescimento_empresa_idx ON metas_crescimento (empresa_id, criado_em DESC);

ALTER TABLE metas_crescimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY metas_crescimento_select ON metas_crescimento FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY metas_crescimento_insert ON metas_crescimento FOR INSERT
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY metas_crescimento_update ON metas_crescimento FOR UPDATE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'metas_crescimento';
