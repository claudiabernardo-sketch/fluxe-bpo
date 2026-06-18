-- ============================================================
-- FIX v4: Storage — adiciona UPDATE e usa auth.role()
-- Execute no Supabase → SQL Editor
-- ============================================================

-- Limpa TODAS as políticas de storage para o bucket tarefas
DROP POLICY IF EXISTS "tarefas: upload"                    ON storage.objects;
DROP POLICY IF EXISTS "tarefas: leitura"                   ON storage.objects;
DROP POLICY IF EXISTS "tarefas: delete"                    ON storage.objects;
DROP POLICY IF EXISTS "tarefas: update"                    ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: upload autenticado" ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: leitura publica"    ON storage.objects;
DROP POLICY IF EXISTS "tarefas bucket: delete proprio"     ON storage.objects;

-- INSERT (upload)
CREATE POLICY "tarefas: upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tarefas' AND auth.role() = 'authenticated'
  );

-- UPDATE (upsert / sobrescrever)
CREATE POLICY "tarefas: update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tarefas' AND auth.role() = 'authenticated'
  );

-- SELECT (leitura, público)
CREATE POLICY "tarefas: leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'tarefas');

-- DELETE
CREATE POLICY "tarefas: delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tarefas' AND auth.role() = 'authenticated'
  );

-- Verificação
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
  AND policyname LIKE 'tarefas%';
