-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 11: Métricas mensais reais do Radar
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Numeros de verdade por cliente+mes (quanto tinha a receber/pagar, quanto
-- efetivamente recebeu/pagou, saldo em caixa). O Radar passa a calcular
-- Recebiveis, Pagtos, Fluxo de Caixa e Caixa a partir desses valores quando
-- existirem — sem eles, continua caindo no proxy de tarefa em dia (como já
-- funciona hoje), sem quebrar nada pra quem não preencher.

CREATE TABLE IF NOT EXISTS radar_metricas_mensais (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id       UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  mes_referencia   DATE        NOT NULL,  -- sempre dia 1 do mês, ex: 2026-07-01
  valor_a_receber  NUMERIC(12,2),
  valor_recebido   NUMERIC(12,2),
  valor_a_pagar    NUMERIC(12,2),
  valor_pago       NUMERIC(12,2),
  saldo_caixa      NUMERIC(12,2),
  atualizado_por   UUID        REFERENCES usuarios(id),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, mes_referencia)
);

CREATE INDEX IF NOT EXISTS radar_metricas_cliente_idx ON radar_metricas_mensais (cliente_id, mes_referencia DESC);
CREATE INDEX IF NOT EXISTS radar_metricas_empresa_idx ON radar_metricas_mensais (empresa_id);

ALTER TABLE radar_metricas_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY radar_metricas_select ON radar_metricas_mensais FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY radar_metricas_insert ON radar_metricas_mensais FOR INSERT
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY radar_metricas_update ON radar_metricas_mensais FOR UPDATE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'radar_metricas_mensais';
