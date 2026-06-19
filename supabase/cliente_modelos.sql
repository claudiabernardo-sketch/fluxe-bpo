-- ════════════════════════════════════════════════════════════════════
-- Fluxe BPO — cliente_modelos (vínculo de modelo de tarefa a um cliente)
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════════
-- Esta tabela é usada pela aba "Tarefas" dentro do cadastro do cliente
-- (vincular/desvincular modelos de tarefa). Não havia nenhum arquivo de
-- schema versionado pra ela no repositório — se ela já existe no seu
-- banco mas sem a constraint UNIQUE abaixo, o "upsert" do botão
-- "Vincular modelo" falha silenciosamente (não dá erro visível, só não
-- salva). Este script é seguro de rodar mesmo que a tabela já exista:
-- tudo usa IF NOT EXISTS / verificação prévia.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cliente_modelos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id  uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  modelo_id   uuid NOT NULL REFERENCES tarefa_modelos(id) ON DELETE CASCADE,
  ativo       boolean NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- Constraint que o upsert (onConflict: 'cliente_id,modelo_id') do app precisa.
-- Sem ela, o upsert do frontend falha sempre que tenta vincular.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cliente_modelos_cliente_modelo_uniq'
  ) THEN
    ALTER TABLE cliente_modelos
      ADD CONSTRAINT cliente_modelos_cliente_modelo_uniq UNIQUE (cliente_id, modelo_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS cliente_modelos_empresa_idx  ON cliente_modelos(empresa_id);
CREATE INDEX IF NOT EXISTS cliente_modelos_cliente_idx  ON cliente_modelos(cliente_id);

ALTER TABLE cliente_modelos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_modelos_empresa" ON cliente_modelos;
CREATE POLICY "cliente_modelos_empresa" ON cliente_modelos
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
