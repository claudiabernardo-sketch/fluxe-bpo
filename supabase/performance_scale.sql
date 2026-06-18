-- ============================================================
-- FLUXE BPO — Otimizações para escala (100+ empresas)
-- Execute no Supabase → SQL Editor
-- Contexto: políticas de subquery em tarefa_checklists,
-- tarefa_historico, acessos e aprovacao_historico usam
-- IN (SELECT ...) que força seq scan por empresa em cada linha.
-- Com empresa_id diretamente na coluna + índice, o Postgres
-- faz index scan direto — ordens de magnitude mais rápido.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- PARTE 1 — tarefa_checklists: adicionar empresa_id
-- ════════════════════════════════════════════════════════════

-- Adicionar coluna
ALTER TABLE tarefa_checklists
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Preencher via JOIN (backfill para registros existentes)
UPDATE tarefa_checklists tc
SET empresa_id = t.empresa_id
FROM tarefas t
WHERE tc.tarefa_id = t.id
  AND tc.empresa_id IS NULL;

-- Índice para RLS
CREATE INDEX IF NOT EXISTS idx_checklists_empresa
  ON tarefa_checklists(empresa_id);

-- Trocar policy de subquery para coluna direta
DROP POLICY IF EXISTS "checklists: via tarefa da empresa" ON tarefa_checklists;

CREATE POLICY "checklists: ver própria empresa" ON tarefa_checklists
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "checklists: inserir na própria empresa" ON tarefa_checklists
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "checklists: editar própria empresa" ON tarefa_checklists
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "checklists: excluir própria empresa" ON tarefa_checklists
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- Trigger para auto-preencher empresa_id nos novos registros
CREATE OR REPLACE FUNCTION set_empresa_id_from_tarefa()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM tarefas WHERE id = NEW.tarefa_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_checklist_empresa ON tarefa_checklists;
CREATE TRIGGER trg_checklist_empresa
  BEFORE INSERT ON tarefa_checklists
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id_from_tarefa();


-- ════════════════════════════════════════════════════════════
-- PARTE 2 — tarefa_historico: adicionar empresa_id
-- ════════════════════════════════════════════════════════════

ALTER TABLE tarefa_historico
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

UPDATE tarefa_historico th
SET empresa_id = t.empresa_id
FROM tarefas t
WHERE th.tarefa_id = t.id
  AND th.empresa_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_historico_empresa
  ON tarefa_historico(empresa_id);

DROP POLICY IF EXISTS "historico: via tarefa da empresa" ON tarefa_historico;

CREATE POLICY "historico: ver própria empresa" ON tarefa_historico
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "historico: inserir na própria empresa" ON tarefa_historico
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "historico: editar própria empresa" ON tarefa_historico
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "historico: excluir própria empresa" ON tarefa_historico
  FOR DELETE USING (empresa_id = auth_empresa_id());

DROP TRIGGER IF EXISTS trg_historico_empresa ON tarefa_historico;
CREATE TRIGGER trg_historico_empresa
  BEFORE INSERT ON tarefa_historico
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id_from_tarefa();


-- ════════════════════════════════════════════════════════════
-- PARTE 3 — aprovacao_historico: adicionar empresa_id
-- ════════════════════════════════════════════════════════════

ALTER TABLE aprovacao_historico
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

UPDATE aprovacao_historico ah
SET empresa_id = a.empresa_id
FROM aprovacoes a
WHERE ah.aprovacao_id = a.id
  AND ah.empresa_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_aprov_hist_empresa
  ON aprovacao_historico(empresa_id);

DROP POLICY IF EXISTS "aprov_hist: via aprovacao da empresa" ON aprovacao_historico;

CREATE POLICY "aprov_hist: ver própria empresa" ON aprovacao_historico
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "aprov_hist: inserir na própria empresa" ON aprovacao_historico
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

-- Trigger para auto-preencher empresa_id
CREATE OR REPLACE FUNCTION set_empresa_id_from_aprovacao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM aprovacoes WHERE id = NEW.aprovacao_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aprov_hist_empresa ON aprovacao_historico;
CREATE TRIGGER trg_aprov_hist_empresa
  BEFORE INSERT ON aprovacao_historico
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id_from_aprovacao();


-- ════════════════════════════════════════════════════════════
-- PARTE 4 — acessos: adicionar empresa_id diretamente
-- (atualmente usa subquery via clientes)
-- ════════════════════════════════════════════════════════════

ALTER TABLE acessos
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

UPDATE acessos a
SET empresa_id = c.empresa_id
FROM clientes c
WHERE a.cliente_id = c.id
  AND a.empresa_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_acessos_empresa
  ON acessos(empresa_id);

DROP POLICY IF EXISTS "acessos: ver via cliente da empresa"     ON acessos;
DROP POLICY IF EXISTS "acessos: inserir via cliente da empresa" ON acessos;
DROP POLICY IF EXISTS "acessos: editar via cliente da empresa"  ON acessos;
DROP POLICY IF EXISTS "acessos: excluir via cliente da empresa" ON acessos;

CREATE POLICY "acessos: ver própria empresa" ON acessos
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "acessos: inserir na própria empresa" ON acessos
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "acessos: editar própria empresa" ON acessos
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "acessos: excluir própria empresa" ON acessos
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- Trigger para auto-preencher empresa_id
CREATE OR REPLACE FUNCTION set_empresa_id_from_cliente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM clientes WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_acessos_empresa ON acessos;
CREATE TRIGGER trg_acessos_empresa
  BEFORE INSERT ON acessos
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id_from_cliente();


-- ════════════════════════════════════════════════════════════
-- PARTE 5 — soft delete para rotinas e tarefa_modelos
-- (garantia no banco, além da lógica no frontend)
-- ════════════════════════════════════════════════════════════

-- tarefa_modelos: garantir coluna ativo existe
ALTER TABLE tarefa_modelos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE tarefa_modelos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

-- rotinas: ativo já existe (criado no migration), só garantir
-- (este ALTER é no-op se já existir)
ALTER TABLE rotinas ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Índices para filtros de ativo
CREATE INDEX IF NOT EXISTS idx_tarefa_modelos_ativo
  ON tarefa_modelos(empresa_id, ativo);

CREATE INDEX IF NOT EXISTS idx_rotinas_ativo
  ON rotinas(empresa_id, ativo);


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- Cole e rode separadamente após o script acima terminar
-- ════════════════════════════════════════════════════════════

-- Conferir políticas ativas por tabela
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tarefa_checklists','tarefa_historico',
    'aprovacao_historico','acessos'
  )
ORDER BY tablename, policyname;

-- Conferir índices criados
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE 'idx_checklist%'
    OR indexname LIKE 'idx_historico%'
    OR indexname LIKE 'idx_aprov_hist%'
    OR indexname LIKE 'idx_acessos%'
    OR indexname LIKE 'idx_tarefa_modelos%'
    OR indexname LIKE 'idx_rotinas%')
ORDER BY tablename, indexname;

-- ============================================================
-- APÓS EXECUTAR:
-- Fazer deploy: npx vercel --prod
-- ============================================================
