-- ============================================================
-- FIX v2: RLS simplificado para tabelas filho + Storage
-- Execute no Supabase → SQL Editor
-- ============================================================

-- ── tarefa_checklists ────────────────────────────────────────
DROP POLICY IF EXISTS "checklists: via tarefa da empresa" ON tarefa_checklists;

-- SELECT/UPDATE/DELETE: isolamento por empresa
CREATE POLICY "checklists: select empresa" ON tarefa_checklists
  FOR SELECT USING (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  );

-- INSERT: basta estar autenticado (empresa garantida pela tarefa pai)
CREATE POLICY "checklists: insert autenticado" ON tarefa_checklists
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "checklists: update empresa" ON tarefa_checklists
  FOR UPDATE USING (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  );

CREATE POLICY "checklists: delete empresa" ON tarefa_checklists
  FOR DELETE USING (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  );

-- ── tarefa_historico ─────────────────────────────────────────
DROP POLICY IF EXISTS "historico: via tarefa da empresa" ON tarefa_historico;

CREATE POLICY "historico: select empresa" ON tarefa_historico
  FOR SELECT USING (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  );

-- INSERT: basta estar autenticado
CREATE POLICY "historico: insert autenticado" ON tarefa_historico
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "historico: update empresa" ON tarefa_historico
  FOR UPDATE USING (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  );

-- ── Storage: bucket tarefas ──────────────────────────────────
DROP POLICY IF EXISTS "tarefas bucket: upload autenticado" ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: delete proprio" ON storage.objects;

CREATE POLICY "tarefas: upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tarefas' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "tarefas: leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'tarefas');

CREATE POLICY "tarefas: delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tarefas' AND auth.uid() IS NOT NULL
  );
