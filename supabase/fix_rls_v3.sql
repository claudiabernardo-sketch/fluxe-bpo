-- ============================================================
-- FIX v3: RLS mínimo — qualquer usuário autenticado opera
--         as tabelas filho (isolamento já garantido pela
--         tabela pai `tarefas` via empresa_id)
-- Execute no Supabase → SQL Editor
-- ============================================================

-- ── tarefa_checklists ────────────────────────────────────────
DROP POLICY IF EXISTS "checklists: select empresa"      ON tarefa_checklists;
DROP POLICY IF EXISTS "checklists: insert autenticado"  ON tarefa_checklists;
DROP POLICY IF EXISTS "checklists: update empresa"      ON tarefa_checklists;
DROP POLICY IF EXISTS "checklists: delete empresa"      ON tarefa_checklists;
DROP POLICY IF EXISTS "checklists: via tarefa da empresa" ON tarefa_checklists;
DROP POLICY IF EXISTS "checklists: autenticado"         ON tarefa_checklists;

CREATE POLICY "checklists: autenticado" ON tarefa_checklists
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── tarefa_historico ─────────────────────────────────────────
DROP POLICY IF EXISTS "historico: select empresa"       ON tarefa_historico;
DROP POLICY IF EXISTS "historico: insert autenticado"   ON tarefa_historico;
DROP POLICY IF EXISTS "historico: update empresa"       ON tarefa_historico;
DROP POLICY IF EXISTS "historico: via tarefa da empresa" ON tarefa_historico;
DROP POLICY IF EXISTS "historico: autenticado"          ON tarefa_historico;

CREATE POLICY "historico: autenticado" ON tarefa_historico
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Storage: limpa versões anteriores e recria ───────────────
DROP POLICY IF EXISTS "tarefas: upload"                    ON storage.objects;
DROP POLICY IF EXISTS "tarefas: leitura"                   ON storage.objects;
DROP POLICY IF EXISTS "tarefas: delete"                    ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: upload autenticado" ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: leitura publica"    ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: delete proprio"     ON storage.objects;

CREATE POLICY "tarefas: upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'tarefas' AND auth.uid() IS NOT NULL);

CREATE POLICY "tarefas: leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'tarefas');

CREATE POLICY "tarefas: delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'tarefas' AND auth.uid() IS NOT NULL);

-- ── Verificação ──────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('tarefa_checklists','tarefa_historico')
   OR (tablename = 'objects' AND schemaname = 'storage')
ORDER BY tablename, cmd;
