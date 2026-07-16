-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 10: Ajuste manual por área do Radar
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Quem opera o cliente pode sobrepor o cálculo automático de qualquer área
-- (inclusive as "sem dado") quando sabe da situação real. Um ajuste por
-- cliente+área — editar de novo substitui o anterior. Expira em 30 dias por
-- padrão, pra não deixar informação velha aparecendo como atual pra sempre.

CREATE TABLE IF NOT EXISTS radar_ajustes_manuais (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id    UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  area          TEXT        NOT NULL,
  status        TEXT        NOT NULL CHECK (status IN ('saudavel','atencao','critico')),
  observacao    TEXT,
  criado_por    UUID        REFERENCES usuarios(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em     TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE (cliente_id, area)
);

CREATE INDEX IF NOT EXISTS radar_ajustes_cliente_idx ON radar_ajustes_manuais (cliente_id);
CREATE INDEX IF NOT EXISTS radar_ajustes_empresa_idx ON radar_ajustes_manuais (empresa_id);

ALTER TABLE radar_ajustes_manuais ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário da empresa pode ver, criar, editar e remover ajustes dos
-- próprios clientes — mesmo padrão de permissão já usado em tarefas/clientes.
CREATE POLICY radar_ajustes_select ON radar_ajustes_manuais FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY radar_ajustes_insert ON radar_ajustes_manuais FOR INSERT
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY radar_ajustes_update ON radar_ajustes_manuais FOR UPDATE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY radar_ajustes_delete ON radar_ajustes_manuais FOR DELETE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'radar_ajustes_manuais';
