-- ══════════════════════════════════════════════════════════════════════════════
-- Diagnóstico: por que "Gerar tarefas" não criou nada para a CFPRO?
-- Rode isso no SQL Editor do Supabase: https://supabase.com/dashboard/project/zwvmprcuxhvhbuvdcybs/sql/new
-- Troque '%CFPRO%' pelo nome (ou parte do nome) real do cliente, se precisar.
-- ══════════════════════════════════════════════════════════════════════════════

SELECT
  tgl.executado_em,
  c.razao_social,
  c.fantasia,
  c.status_operacional,
  c.operacao_iniciada_em,
  tgd.data_alvo,
  tgd.resultado,
  tgd.motivo,
  tm.titulo AS modelo
FROM task_generation_details tgd
JOIN task_generation_logs tgl ON tgl.id = tgd.log_id
LEFT JOIN clientes c ON c.id = tgd.cliente_id
LEFT JOIN tarefa_modelos tm ON tm.id = tgd.modelo_id
WHERE c.razao_social ILIKE '%CFPRO%' OR c.fantasia ILIKE '%CFPRO%'
ORDER BY tgl.executado_em DESC
LIMIT 50;

-- Se a consulta acima não retornar NADA, o cliente nem chegou a ser considerado
-- pela geração — provavelmente porque o status_operacional dele não está
-- "operacional" ou a data de início de operação está vazia. Rode isto pra conferir:

SELECT id, razao_social, fantasia, status_operacional, operacao_iniciada_em
FROM clientes
WHERE razao_social ILIKE '%CFPRO%' OR fantasia ILIKE '%CFPRO%';
