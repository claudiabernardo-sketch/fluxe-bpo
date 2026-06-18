-- ============================================================
-- FLUXE BPO — Row Level Security (RLS) Policies
-- Execute este arquivo no SQL Editor do Supabase
-- Dashboard → SQL Editor → colar e executar
-- ============================================================
-- Versão idempotente: usa DROP POLICY IF EXISTS antes de criar,
-- para poder rodar novamente sem erros de "policy already exists"
-- ============================================================

-- ── HELPER: função para obter empresa_id do usuário logado ──
CREATE OR REPLACE FUNCTION auth_empresa_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT empresa_id FROM usuarios WHERE id = auth.uid()
$$;

-- ============================================================
-- EMPRESAS
-- ============================================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa: ver própria" ON empresas;
DROP POLICY IF EXISTS "empresa: editar própria" ON empresas;

CREATE POLICY "empresa: ver própria" ON empresas
  FOR SELECT USING (id = auth_empresa_id());

CREATE POLICY "empresa: editar própria" ON empresas
  FOR UPDATE USING (id = auth_empresa_id());

-- ============================================================
-- USUÁRIOS
-- ============================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios: ver própria empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios: inserir na própria empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios: editar própria empresa" ON usuarios;
DROP POLICY IF EXISTS "usuarios: excluir própria empresa" ON usuarios;

CREATE POLICY "usuarios: ver própria empresa" ON usuarios
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "usuarios: inserir na própria empresa" ON usuarios
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "usuarios: editar própria empresa" ON usuarios
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "usuarios: excluir própria empresa" ON usuarios
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- CLIENTES
-- ============================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes: ver própria empresa" ON clientes;
DROP POLICY IF EXISTS "clientes: inserir na própria empresa" ON clientes;
DROP POLICY IF EXISTS "clientes: editar própria empresa" ON clientes;
DROP POLICY IF EXISTS "clientes: excluir própria empresa" ON clientes;

CREATE POLICY "clientes: ver própria empresa" ON clientes
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "clientes: inserir na própria empresa" ON clientes
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "clientes: editar própria empresa" ON clientes
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "clientes: excluir própria empresa" ON clientes
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- TAREFAS
-- ============================================================
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarefas: ver própria empresa" ON tarefas;
DROP POLICY IF EXISTS "tarefas: inserir na própria empresa" ON tarefas;
DROP POLICY IF EXISTS "tarefas: editar própria empresa" ON tarefas;
DROP POLICY IF EXISTS "tarefas: excluir própria empresa" ON tarefas;

CREATE POLICY "tarefas: ver própria empresa" ON tarefas
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "tarefas: inserir na própria empresa" ON tarefas
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "tarefas: editar própria empresa" ON tarefas
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "tarefas: excluir própria empresa" ON tarefas
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- TAREFAS_AVULSAS
-- ============================================================
ALTER TABLE tarefas_avulsas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avulsas: ver própria empresa" ON tarefas_avulsas;
DROP POLICY IF EXISTS "avulsas: inserir na própria empresa" ON tarefas_avulsas;
DROP POLICY IF EXISTS "avulsas: editar própria empresa" ON tarefas_avulsas;
DROP POLICY IF EXISTS "avulsas: excluir própria empresa" ON tarefas_avulsas;

CREATE POLICY "avulsas: ver própria empresa" ON tarefas_avulsas
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "avulsas: inserir na própria empresa" ON tarefas_avulsas
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "avulsas: editar própria empresa" ON tarefas_avulsas
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "avulsas: excluir própria empresa" ON tarefas_avulsas
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- TAREFA_CHECKLISTS — via tarefa
-- ============================================================
ALTER TABLE tarefa_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklists: via tarefa da empresa" ON tarefa_checklists;

CREATE POLICY "checklists: via tarefa da empresa" ON tarefa_checklists
  FOR ALL USING (
    tarefa_id IN (
      SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id()
    )
  );

-- ============================================================
-- TAREFA_HISTORICO — via tarefa
-- ============================================================
ALTER TABLE tarefa_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico: via tarefa da empresa" ON tarefa_historico;

CREATE POLICY "historico: via tarefa da empresa" ON tarefa_historico
  FOR ALL USING (
    tarefa_id IN (
      SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id()
    )
  );

-- ============================================================
-- LEADS (CRM)
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads: ver própria empresa" ON leads;
DROP POLICY IF EXISTS "leads: inserir na própria empresa" ON leads;
DROP POLICY IF EXISTS "leads: editar própria empresa" ON leads;
DROP POLICY IF EXISTS "leads: excluir própria empresa" ON leads;

CREATE POLICY "leads: ver própria empresa" ON leads
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "leads: inserir na própria empresa" ON leads
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "leads: editar própria empresa" ON leads
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "leads: excluir própria empresa" ON leads
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- PENDÊNCIAS
-- ============================================================
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pendencias: ver própria empresa" ON pendencias;
DROP POLICY IF EXISTS "pendencias: inserir na própria empresa" ON pendencias;
DROP POLICY IF EXISTS "pendencias: editar própria empresa" ON pendencias;
DROP POLICY IF EXISTS "pendencias: excluir própria empresa" ON pendencias;

CREATE POLICY "pendencias: ver própria empresa" ON pendencias
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "pendencias: inserir na própria empresa" ON pendencias
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "pendencias: editar própria empresa" ON pendencias
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "pendencias: excluir própria empresa" ON pendencias
  FOR DELETE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- APONTAMENTOS (timer)
-- ============================================================
ALTER TABLE apontamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apontamentos: ver própria empresa" ON apontamentos;
DROP POLICY IF EXISTS "apontamentos: inserir na própria empresa" ON apontamentos;
DROP POLICY IF EXISTS "apontamentos: editar própria empresa" ON apontamentos;

CREATE POLICY "apontamentos: ver própria empresa" ON apontamentos
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "apontamentos: inserir na própria empresa" ON apontamentos
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "apontamentos: editar própria empresa" ON apontamentos
  FOR UPDATE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- APROVAÇÕES
-- ============================================================
ALTER TABLE aprovacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aprovacoes: ver própria empresa" ON aprovacoes;
DROP POLICY IF EXISTS "aprovacoes: inserir na própria empresa" ON aprovacoes;
DROP POLICY IF EXISTS "aprovacoes: editar própria empresa" ON aprovacoes;

CREATE POLICY "aprovacoes: ver própria empresa" ON aprovacoes
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "aprovacoes: inserir na própria empresa" ON aprovacoes
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "aprovacoes: editar própria empresa" ON aprovacoes
  FOR UPDATE USING (empresa_id = auth_empresa_id());

-- ============================================================
-- APROVACAO_HISTORICO — via aprovacao
-- ============================================================
ALTER TABLE aprovacao_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aprov_hist: via aprovacao da empresa" ON aprovacao_historico;

CREATE POLICY "aprov_hist: via aprovacao da empresa" ON aprovacao_historico
  FOR ALL USING (
    aprovacao_id IN (
      SELECT id FROM aprovacoes WHERE empresa_id = auth_empresa_id()
    )
  );

-- ============================================================
-- ACESSOS (Cofre Digital) — via cliente
-- ============================================================
ALTER TABLE acessos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acessos: ver via cliente da empresa" ON acessos;
DROP POLICY IF EXISTS "acessos: inserir via cliente da empresa" ON acessos;
DROP POLICY IF EXISTS "acessos: editar via cliente da empresa" ON acessos;
DROP POLICY IF EXISTS "acessos: excluir via cliente da empresa" ON acessos;

CREATE POLICY "acessos: ver via cliente da empresa" ON acessos
  FOR SELECT USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE empresa_id = auth_empresa_id()
    )
  );

CREATE POLICY "acessos: inserir via cliente da empresa" ON acessos
  FOR INSERT WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes WHERE empresa_id = auth_empresa_id()
    )
  );

CREATE POLICY "acessos: editar via cliente da empresa" ON acessos
  FOR UPDATE USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE empresa_id = auth_empresa_id()
    )
  );

CREATE POLICY "acessos: excluir via cliente da empresa" ON acessos
  FOR DELETE USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE empresa_id = auth_empresa_id()
    )
  );

-- ============================================================
-- AUDIT LOG
-- ============================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit: ver própria empresa" ON audit_log;
DROP POLICY IF EXISTS "audit: inserir própria empresa" ON audit_log;

CREATE POLICY "audit: ver própria empresa" ON audit_log
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "audit: inserir própria empresa" ON audit_log
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

-- ============================================================
-- VERIFICAÇÃO — rode após aplicar para conferir
-- ============================================================
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
