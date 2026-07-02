-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 05: Módulo Comercial — Propostas persistentes
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS propostas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          SERIAL      NOT NULL,                          -- ID de suporte (ex: 00000001)
  empresa_id      UUID        NOT NULL REFERENCES empresas(id),
  lead_id         UUID        REFERENCES leads(id),
  cliente_id      UUID        REFERENCES clientes(id),

  -- Status do ciclo comercial
  status          TEXT        NOT NULL DEFAULT 'rascunho'
                  CHECK (status IN (
                    'rascunho','enviada','em_negociacao',
                    'aprovada','rejeitada','expirada','cancelada'
                  )),

  -- Valor
  valor_mensal    NUMERIC(12,2),
  validade        DATE,

  -- Dados do cliente (snapshot no momento da proposta)
  dados_cliente   JSONB       NOT NULL DEFAULT '{}',
  -- Contém: nome, fantasia, cnpj, contato, email, whatsapp, endereco,
  --         representante, cpf_representante, segmento

  -- Dados de cálculo (snapshot completo do formulário de precificação)
  dados_calculo   JSONB       NOT NULL DEFAULT '{}',
  -- Contém: d (form inputs), calc (resultado), valorProposta, escopo (serviços)

  -- Dados do contrato (preenchidos na etapa 6)
  contrato_dados  JSONB       NOT NULL DEFAULT '{}',
  -- Contém: contratoForm (indiceReajuste, diaVencimento, formaPagamento, vigencia, dataInicio)

  -- Observações e condições
  observacoes     TEXT,
  condicoes       TEXT,

  -- Auditoria
  criado_por      UUID        REFERENCES auth.users(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS propostas_empresa_idx   ON propostas (empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS propostas_lead_idx      ON propostas (lead_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS propostas_cliente_idx   ON propostas (cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS propostas_status_idx    ON propostas (empresa_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS propostas_numero_idx    ON propostas (empresa_id, numero);

-- ── Trigger: atualizar atualizado_em automaticamente ─────────────────────────
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS propostas_atualizado_em ON propostas;
CREATE TRIGGER propostas_atualizado_em
  BEFORE UPDATE ON propostas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propostas: empresa vê as próprias"
  ON propostas FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "propostas: empresa insere nas próprias"
  ON propostas FOR INSERT
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "propostas: empresa atualiza as próprias"
  ON propostas FOR UPDATE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- ── Verificar resultado ───────────────────────────────────────────────────────
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'propostas'
ORDER BY ordinal_position;
