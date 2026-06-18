-- ============================================================
-- FIX: RLS para tarefa_checklists, tarefa_historico e Storage
-- Execute no Supabase → SQL Editor
-- ============================================================

-- ── 1. TAREFA_CHECKLISTS — adiciona WITH CHECK explícito ────
DROP POLICY IF EXISTS "checklists: via tarefa da empresa" ON tarefa_checklists;

CREATE POLICY "checklists: via tarefa da empresa" ON tarefa_checklists
  FOR ALL
  USING (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  )
  WITH CHECK (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  );

-- ── 2. TAREFA_HISTORICO — adiciona WITH CHECK explícito ─────
DROP POLICY IF EXISTS "historico: via tarefa da empresa" ON tarefa_historico;

CREATE POLICY "historico: via tarefa da empresa" ON tarefa_historico
  FOR ALL
  USING (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  )
  WITH CHECK (
    tarefa_id IN (SELECT id FROM tarefas WHERE empresa_id = auth_empresa_id())
  );

-- ── 3. STORAGE — políticas para o bucket "tarefas" ──────────
-- Upload: qualquer usuário autenticado pode fazer upload
DROP POLICY IF EXISTS "tarefas bucket: upload autenticado" ON storage.objects;
CREATE POLICY "tarefas bucket: upload autenticado" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tarefas' AND auth.role() = 'authenticated'
  );

-- Leitura: público (bucket é public)
DROP POLICY IF EXISTS "tarefas bucket: leitura publica" ON storage.objects;
CREATE POLICY "tarefas bucket: leitura publica" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tarefas');

-- Update/delete: apenas quem fez upload (mesmo usuário)
DROP POLICY IF EXISTS "tarefas bucket: delete proprio" ON storage.objects;
CREATE POLICY "tarefas bucket: delete proprio" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'tarefas' AND auth.uid() = owner);

-- ============================================================
-- Verificação
-- ============================================================
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('tarefa_checklists','tarefa_historico')
-- OR (tablename = 'objects' AND schemaname = 'storage');
