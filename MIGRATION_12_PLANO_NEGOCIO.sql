-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 12: Plano de Negócios em 6 Etapas
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════════
-- Uma linha por empresa (upsert) com as 6 etapas do framework "Plano de
-- Negócios que dá lucro": Cliente Ideal, Dor/Problema, Entregáveis,
-- Processo/Rotina, Custo de Existir e Meta de Faturamento. Cada etapa tem um
-- campo de texto livre + uma flag "tenho dificuldade aqui" + observação —
-- pensado pra mentoria (o aluno preenche, a mentora vê onde ele trava).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS plano_negocio (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                      uuid NOT NULL UNIQUE REFERENCES empresas(id) ON DELETE CASCADE,

  cliente_ideal                   text,
  cliente_ideal_dificuldade       boolean NOT NULL DEFAULT false,
  cliente_ideal_obs               text,

  dor                             text,
  dor_dificuldade                 boolean NOT NULL DEFAULT false,
  dor_obs                         text,

  entregaveis                     text,
  entregaveis_dificuldade         boolean NOT NULL DEFAULT false,
  entregaveis_obs                 text,

  processo                        text,
  processo_dificuldade            boolean NOT NULL DEFAULT false,
  processo_obs                    text,

  custo_existir                   text,
  custo_existir_dificuldade       boolean NOT NULL DEFAULT false,
  custo_existir_obs               text,

  meta_faturamento                text,
  meta_faturamento_dificuldade    boolean NOT NULL DEFAULT false,
  meta_faturamento_obs            text,

  criado_em                       timestamptz NOT NULL DEFAULT now(),
  atualizado_em                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plano_negocio_empresa_idx ON plano_negocio(empresa_id);

ALTER TABLE plano_negocio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plano_negocio: ver própria empresa" ON plano_negocio;
DROP POLICY IF EXISTS "plano_negocio: inserir na própria empresa" ON plano_negocio;
DROP POLICY IF EXISTS "plano_negocio: editar própria empresa" ON plano_negocio;

CREATE POLICY "plano_negocio: ver própria empresa" ON plano_negocio
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "plano_negocio: inserir na própria empresa" ON plano_negocio
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "plano_negocio: editar própria empresa" ON plano_negocio
  FOR UPDATE USING (empresa_id = auth_empresa_id());
