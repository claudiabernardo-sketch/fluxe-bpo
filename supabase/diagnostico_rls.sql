-- Cole e rode no Supabase SQL Editor para ver as políticas atuais

SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('tarefa_checklists', 'tarefa_historico')
ORDER BY tablename, cmd;
