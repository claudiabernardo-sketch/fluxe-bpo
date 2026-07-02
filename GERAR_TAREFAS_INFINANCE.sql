-- ══════════════════════════════════════════════════════════════
-- GERAR TAREFAS INFINANCE — Junho e Julho 2026
-- Executa no Supabase SQL Editor
-- Gera instâncias reais em "tarefas" a partir de "tarefa_modelos"
-- ══════════════════════════════════════════════════════════════

INSERT INTO tarefas (empresa_id, modelo_id, cliente_id, titulo, categoria, prioridade, status, data_execucao)
SELECT
  m.empresa_id,
  m.id            AS modelo_id,
  m.cliente_id,
  m.titulo,
  m.categoria,
  m.prioridade,
  'aberta'        AS status,
  d.data_exec::date
FROM tarefa_modelos m
CROSS JOIN (
  SELECT generate_series(
    '2026-06-01'::date,
    '2026-07-31'::date,
    '1 day'::interval
  )::date AS data_exec
) d
WHERE m.empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
  AND m.ativo = true
  AND (
    -- Dias úteis (segunda a sexta)
    (m.recorrencia = 'dias_uteis'  AND EXTRACT(DOW FROM d.data_exec) BETWEEN 1 AND 5)
    OR
    -- Diária (todos os dias)
    (m.recorrencia = 'diaria')
    OR
    -- Mensal (dia específico do mês)
    (m.recorrencia = 'mensal' AND EXTRACT(DAY FROM d.data_exec) = COALESCE(m.dia_mes, 1))
    OR
    -- Quinzenal (dia X e dia X+15)
    (m.recorrencia = 'quinzenal' AND (
      EXTRACT(DAY FROM d.data_exec) = COALESCE(m.dia_mes, 1)
      OR EXTRACT(DAY FROM d.data_exec) = LEAST(COALESCE(m.dia_mes, 1) + 15, 28)
    ))
  )
  -- Evitar duplicatas
  AND NOT EXISTS (
    SELECT 1 FROM tarefas t
    WHERE t.modelo_id   = m.id
      AND t.data_execucao = d.data_exec::date
      AND t.empresa_id  = m.empresa_id
      AND t.deleted_at IS NULL
  );
