-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 22: Combinados visíveis pro mentorado
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════════
-- Abre uma trinca bem específica no isolamento de mentoria_combinados: o
-- mentorado passa a ver e atualizar SÓ os combinados da própria empresa
-- (texto do compromisso + prazo, que a mentora definiu, e um campo de status
-- que ele mesmo escreve). A nota da sessão (mentoria_sessoes.nota/combinados)
-- continua 100% privada — essa tabela não ganha nenhuma política nova.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE mentoria_combinados ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE mentoria_combinados ADD COLUMN IF NOT EXISTS status_mentorado text;

-- Preenche empresa_id nos combinados já existentes, puxando da sessão
UPDATE mentoria_combinados c
SET empresa_id = s.empresa_id
FROM mentoria_sessoes s
WHERE c.sessao_id = s.id AND c.empresa_id IS NULL;

CREATE INDEX IF NOT EXISTS mentoria_combinados_empresa_idx ON mentoria_combinados(empresa_id);

DROP POLICY IF EXISTS mentoria_combinados_mentee_select ON mentoria_combinados;
DROP POLICY IF EXISTS mentoria_combinados_mentee_update ON mentoria_combinados;

CREATE POLICY mentoria_combinados_mentee_select ON mentoria_combinados FOR SELECT
  USING (empresa_id IS NOT NULL AND empresa_id = auth_empresa_id());

CREATE POLICY mentoria_combinados_mentee_update ON mentoria_combinados FOR UPDATE
  USING (empresa_id IS NOT NULL AND empresa_id = auth_empresa_id())
  WITH CHECK (empresa_id IS NOT NULL AND empresa_id = auth_empresa_id());

-- Sem política de INSERT/DELETE pro mentorado — ele só atualiza (concluído +
-- status) um combinado que a mentora já criou, nunca cria ou apaga um.
