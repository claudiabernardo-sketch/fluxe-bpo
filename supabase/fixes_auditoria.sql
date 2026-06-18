-- ============================================================
-- FLUXE BPO — Fixes de Auditoria Técnica
-- Execute no Supabase → SQL Editor
-- TODOS os scripts são idempotentes (podem rodar mais de uma vez)
-- Execute na ordem: FIX 1 → 2 → 3 → 4 → 5 → 6 → 7
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- FIX 1 — audit_log: trigger para popular empresa_id e usuario_id
-- Problema: logAudit() no frontend não enviava empresa_id →
--           INSERT falhava silenciosamente na RLS policy.
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION audit_log_set_empresa()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Garante empresa_id mesmo que o frontend não envie
  IF NEW.empresa_id IS NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM usuarios WHERE id = auth.uid();
  END IF;
  -- Garante usuario_id
  IF NEW.usuario_id IS NULL THEN
    NEW.usuario_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_empresa ON audit_log;
CREATE TRIGGER trg_audit_log_empresa
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_set_empresa();

-- Verificação:
-- SELECT * FROM audit_log ORDER BY criado_em DESC LIMIT 5;


-- ════════════════════════════════════════════════════════════
-- FIX 2 — tarefa_modelos: habilitar RLS e criar policies
-- Problema: tabela existia sem nenhuma policy → qualquer
--           usuário autenticado podia ler modelos de outras empresas.
-- ════════════════════════════════════════════════════════════

ALTER TABLE tarefa_modelos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modelos: ver própria empresa"        ON tarefa_modelos;
DROP POLICY IF EXISTS "modelos: inserir na própria empresa" ON tarefa_modelos;
DROP POLICY IF EXISTS "modelos: editar própria empresa"     ON tarefa_modelos;
DROP POLICY IF EXISTS "modelos: excluir própria empresa"    ON tarefa_modelos;

CREATE POLICY "modelos: ver própria empresa" ON tarefa_modelos
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "modelos: inserir na própria empresa" ON tarefa_modelos
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "modelos: editar própria empresa" ON tarefa_modelos
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "modelos: excluir própria empresa" ON tarefa_modelos
  FOR DELETE USING (empresa_id = auth_empresa_id());


-- ════════════════════════════════════════════════════════════
-- FIX 3 — Storage bucket "tarefas": SELECT restrito por empresa
-- Problema: policy de leitura era pública para qualquer autenticado.
-- Solução: filtrar pelo prefixo empresa_id no path do arquivo.
-- IMPORTANTE: ao fazer upload, sempre usar o path:
--   {empresa_id}/{tarefa_id}/nome-do-arquivo.ext
-- ════════════════════════════════════════════════════════════

-- Remove policy pública anterior
DROP POLICY IF EXISTS "tarefas: leitura"          ON storage.objects;
DROP POLICY IF EXISTS "tarefas: leitura restrita" ON storage.objects;

-- Nova policy: leitura apenas para a própria empresa
CREATE POLICY "tarefas: leitura restrita" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tarefas'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth_empresa_id()::text
  );

-- Garantir que upload também usa o prefixo correto
DROP POLICY IF EXISTS "tarefas: upload" ON storage.objects;
CREATE POLICY "tarefas: upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tarefas'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth_empresa_id()::text
  );

DROP POLICY IF EXISTS "tarefas: update" ON storage.objects;
CREATE POLICY "tarefas: update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tarefas'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth_empresa_id()::text
  );

DROP POLICY IF EXISTS "tarefas: delete" ON storage.objects;
CREATE POLICY "tarefas: delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tarefas'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth_empresa_id()::text
  );


-- ════════════════════════════════════════════════════════════
-- FIX 4 — Índices compostos para performance
-- Problema: queries com .eq("empresa_id").order("campo") fazem
--           sequential scan sem índice composto. Lento com volume.
-- ════════════════════════════════════════════════════════════

-- Tarefas — filtros mais frequentes
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_prazo
  ON tarefas(empresa_id, prazo) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_status
  ON tarefas(empresa_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_cliente
  ON tarefas(empresa_id, cliente_id) WHERE deleted_at IS NULL;

-- Apontamentos — carregado por período
CREATE INDEX IF NOT EXISTS idx_apontamentos_empresa_inicio
  ON apontamentos(empresa_id, inicio DESC);

-- Pendências — filtrado por prazo
CREATE INDEX IF NOT EXISTS idx_pendencias_empresa_prazo
  ON pendencias(empresa_id, prazo_cobranca);

-- Clientes — ordenado por razao_social
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_razao
  ON clientes(empresa_id, razao_social) WHERE deleted_at IS NULL;

-- Rotinas — filtro por cliente
CREATE INDEX IF NOT EXISTS idx_rotinas_empresa_cliente
  ON rotinas(empresa_id, cliente_id);

-- Aprovações — filtro por status
CREATE INDEX IF NOT EXISTS idx_aprovacoes_empresa_status
  ON aprovacoes(empresa_id, status);

-- Leads — filtro por etapa
CREATE INDEX IF NOT EXISTS idx_leads_empresa_etapa
  ON leads(empresa_id, etapa);

-- CRÍTICO: índice para auth_empresa_id() — chamado em TODA policy RLS
-- Sem isso, cada chamada faz seq scan na tabela usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_id_empresa
  ON usuarios(id, empresa_id);

-- Verificação: mostrar todos os índices criados
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;


-- ════════════════════════════════════════════════════════════
-- FIX 5 — Soft delete: evitar perda acidental de dados
-- Problema: DELETE físico + ON DELETE CASCADE apagava dados
--           em cadeia sem possibilidade de recuperação.
-- ════════════════════════════════════════════════════════════

-- Adicionar coluna deleted_at nas tabelas críticas
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tarefas  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE leads    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Atualizar policies para excluir registros com soft delete
DROP POLICY IF EXISTS "clientes: ver própria empresa" ON clientes;
CREATE POLICY "clientes: ver própria empresa" ON clientes
  FOR SELECT USING (
    empresa_id = auth_empresa_id()
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "tarefas: ver própria empresa" ON tarefas;
CREATE POLICY "tarefas: ver própria empresa" ON tarefas
  FOR SELECT USING (
    empresa_id = auth_empresa_id()
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "leads: ver própria empresa" ON leads;
CREATE POLICY "leads: ver própria empresa" ON leads
  FOR SELECT USING (
    empresa_id = auth_empresa_id()
    AND deleted_at IS NULL
  );

-- View para recuperação de registros deletados (admin)
CREATE OR REPLACE VIEW clientes_deletados AS
  SELECT * FROM clientes WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW tarefas_deletadas AS
  SELECT * FROM tarefas WHERE deleted_at IS NOT NULL;

-- Função para restaurar cliente deletado
CREATE OR REPLACE FUNCTION restaurar_cliente(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM clientes
    WHERE id = p_id AND empresa_id = auth_empresa_id()
  ) THEN
    RAISE EXCEPTION 'Não autorizado ou cliente não encontrado';
  END IF;
  UPDATE clientes SET deleted_at = NULL WHERE id = p_id;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- FIX 6 — Rotinas: padronizar RLS com auth_empresa_id()
-- Problema: policy usava subquery inline em vez da função
--           helper, criando inconsistência e dificultando auditoria.
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "rotinas_empresa" ON rotinas;

DROP POLICY IF EXISTS "rotinas: ver própria empresa"        ON rotinas;
DROP POLICY IF EXISTS "rotinas: inserir na própria empresa" ON rotinas;
DROP POLICY IF EXISTS "rotinas: editar própria empresa"     ON rotinas;
DROP POLICY IF EXISTS "rotinas: excluir própria empresa"    ON rotinas;

CREATE POLICY "rotinas: ver própria empresa" ON rotinas
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "rotinas: inserir na própria empresa" ON rotinas
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "rotinas: editar própria empresa" ON rotinas
  FOR UPDATE USING (empresa_id = auth_empresa_id());

CREATE POLICY "rotinas: excluir própria empresa" ON rotinas
  FOR DELETE USING (empresa_id = auth_empresa_id());


-- ════════════════════════════════════════════════════════════
-- FIX 7 — mensagens_whatsapp: garantir RLS ativa
-- Problema: tabela criada via migration sem confirmar policies.
-- ════════════════════════════════════════════════════════════

ALTER TABLE mensagens_whatsapp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp: ver própria empresa"        ON mensagens_whatsapp;
DROP POLICY IF EXISTS "whatsapp: inserir na própria empresa" ON mensagens_whatsapp;
DROP POLICY IF EXISTS "whatsapp: editar própria empresa"     ON mensagens_whatsapp;

CREATE POLICY "whatsapp: ver própria empresa" ON mensagens_whatsapp
  FOR SELECT USING (empresa_id = auth_empresa_id());

CREATE POLICY "whatsapp: inserir na própria empresa" ON mensagens_whatsapp
  FOR INSERT WITH CHECK (empresa_id = auth_empresa_id());

CREATE POLICY "whatsapp: editar própria empresa" ON mensagens_whatsapp
  FOR UPDATE USING (empresa_id = auth_empresa_id());


-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ════════════════════════════════════════════════════════════

-- 1. Listar tabelas SEM RLS ativa (deve retornar vazio após os fixes)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
  )
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- 2. Confirmar todos os índices
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 3. Confirmar trigger do audit_log
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_audit_log_empresa';

-- ============================================================
-- FIM — após executar, faça:
-- 1. npx vercel --prod  (deploy com as correções de código)
-- 2. Configure VITE_SENTRY_DSN no Vercel (sentry.io → projeto → DSN)
-- 3. Cadastre o site no UptimeRobot (uptimerobot.com — gratuito)
-- 4. Considere upgrade para Supabase Pro (PITR — RPO de 5 min)
-- ============================================================
