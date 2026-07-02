-- Atualiza tarefas existentes sem responsavel_id herdando de clientes.responsavel_id
-- Seguro: só afeta tarefas onde responsavel_id IS NULL e o cliente tem responsavel_id preenchido

UPDATE tarefas t
SET responsavel_id = c.responsavel_id
FROM clientes c
WHERE t.cliente_id = c.id
  AND t.responsavel_id IS NULL
  AND c.responsavel_id IS NOT NULL
  AND t.deleted_at IS NULL;

-- Resultado esperado: X linhas afetadas (tarefas do Infinance e outros clientes com responsável)
