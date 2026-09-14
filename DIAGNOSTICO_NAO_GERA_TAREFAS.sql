-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Diagnóstico: "não está gerando as tarefas"
-- Rode no SQL Editor: https://supabase.com/dashboard/project/zwvmprcuxhvhbuvdcybs/sql/new
--
-- COMO USAR: troque o nome da empresa na linha abaixo e rode BLOCO POR BLOCO,
-- na ordem. Os blocos 0 e 1 dizem se o problema é de TODO MUNDO (cron parado)
-- ou só DESSA empresa. Os blocos 2 a 6 seguem exatamente o mesmo funil de
-- filtros que a Edge Function `gerar-tarefas` aplica — o primeiro bloco que
-- voltar VAZIO é onde as tarefas morrem.
--
--   \set empresa_busca '%Be Solution%'   ← não funciona no editor do Supabase,
--   então o nome está escrito direto em cada bloco. Use Ctrl+F e substitua
--   'Be Solution' se for diagnosticar outra empresa.
-- ══════════════════════════════════════════════════════════════════════════════


-- ── BLOCO 0 ───────────────────────────────────────────────────────────────────
-- O gerador rodou nas últimas noites? Se a última linha for de dias atrás,
-- o problema é o CRON parado (afeta TODAS as empresas), não o cadastro da Paula.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  executado_em,
  data_gerada,
  origem,
  empresas_processadas,
  clientes_processados,
  tarefas_geradas,
  erros
FROM task_generation_logs
ORDER BY executado_em DESC
LIMIT 20;


-- ── BLOCO 0.1 ─────────────────────────────────────────────────────────────────
-- O job do pg_cron existe e está ativo?
-- ─────────────────────────────────────────────────────────────────────────────
SELECT jobid, jobname, schedule, active, command
FROM cron.job
WHERE jobname ILIKE '%tarefa%';


-- ── BLOCO 0.2 ─────────────────────────────────────────────────────────────────
-- O job disparou e o que ele respondeu? (status 'failed' aqui = cron quebrado)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  jrd.runid,
  j.jobname,
  jrd.status,
  jrd.start_time,
  jrd.end_time,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname ILIKE '%tarefa%'
ORDER BY jrd.start_time DESC
LIMIT 20;


-- ── BLOCO 0.3 ─────────────────────────────────────────────────────────────────
-- O pg_cron chama a função via pg_net (HTTP). O cron pode marcar "succeeded"
-- só porque ENFILEIROU a chamada — o erro real (401 de chave inválida,
-- 504 de timeout) aparece aqui. Status 401 = a service_role key gravada no
-- comando do cron não vale mais. 5xx/NULL = a função morreu ou estourou tempo.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id,
  status_code,
  created,
  LEFT(content, 500) AS resposta,
  error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 20;


-- ══════════════════════════════════════════════════════════════════════════════
-- DAQUI PRA BAIXO: funil da empresa. Cada bloco reproduz um filtro da função.
-- ══════════════════════════════════════════════════════════════════════════════


-- ── BLOCO 1 — FILTRO 1 DA FUNÇÃO: empresa com plano != 'bloqueado' ────────────
-- A função ignora empresa bloqueada E empresa com plano NULL (em SQL,
-- NULL <> 'bloqueado' não é verdadeiro, então a empresa some do resultado).
-- Se 'gera_tarefas' vier false, ACHOU O PROBLEMA — é cobrança, não operação.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  e.id,
  e.nome,
  e.plano,
  (e.plano IS NOT NULL AND e.plano::text <> 'bloqueado') AS gera_tarefas,
  CASE
    WHEN e.plano IS NULL              THEN '❌ plano NULL — a query .neq(plano,bloqueado) descarta a empresa'
    WHEN e.plano::text = 'bloqueado'  THEN '❌ empresa BLOQUEADA (assinatura cancelada/estornada no Asaas)'
    WHEN e.plano::text = 'trial_expirado' THEN '⚠️ pagamento vencido — ainda gera, mas está a um passo do bloqueio'
    ELSE '✅ plano ok'
  END AS veredito
FROM empresas e
WHERE e.nome ILIKE '%Be Solution%';


-- ── BLOCO 2 — FILTRO 2: clientes operacionais com data de início ──────────────
-- A função só olha clientes com status_operacional = 'operacional'
-- E operacao_iniciada_em preenchida. Qualquer outra coisa = zero tarefa,
-- sem erro nenhum na tela.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  c.razao_social,
  c.fantasia,
  c.status_operacional,
  c.operacao_iniciada_em,
  CASE
    WHEN c.status_operacional IS DISTINCT FROM 'operacional'
      THEN '❌ status "' || COALESCE(c.status_operacional,'NULL') || '" — só "operacional" gera'
    WHEN c.operacao_iniciada_em IS NULL
      THEN '❌ operacao_iniciada_em vazia — cliente nunca teve a rotina ativada'
    WHEN c.operacao_iniciada_em > CURRENT_DATE
      THEN '❌ início da operação no futuro (' || c.operacao_iniciada_em || ')'
    ELSE '✅ cliente elegível'
  END AS veredito
FROM clientes c
JOIN empresas e ON e.id = c.empresa_id
WHERE e.nome ILIKE '%Be Solution%'
ORDER BY 5 DESC, c.razao_social;


-- ── BLOCO 3 — FILTRO 3: vínculos cliente ↔ modelo ─────────────────────────────
-- A função exige cliente_modelos.ativo = true E pausado = false E
-- tarefa_modelos.ativo = true E tarefa_modelos.deleted_at IS NULL.
-- Atenção: ativo/pausado com valor NULL também derrubam o vínculo.
-- Se este bloco vier VAZIO, o cliente não tem nenhuma rotina vinculada.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  c.razao_social                          AS cliente,
  tm.titulo                               AS modelo,
  cm.ativo                                AS vinculo_ativo,
  cm.pausado                              AS vinculo_pausado,
  tm.ativo                                AS modelo_ativo,
  tm.deleted_at                           AS modelo_excluido_em,
  COALESCE(cm.recorrencia, tm.recorrencia) AS recorrencia_efetiva,
  COALESCE(cm.dia_mes, tm.dia_mes)         AS dia_mes_efetivo,
  COALESCE(cm.dias_semana, tm.dias_semana) AS dias_semana_efetivo,
  tm.dias_mes                              AS dias_mes_do_modelo,
  CASE
    WHEN cm.ativo IS NOT TRUE      THEN '❌ vínculo inativo/NULL'
    WHEN cm.pausado IS NOT FALSE   THEN '❌ vínculo pausado/NULL'
    WHEN tm.ativo IS NOT TRUE      THEN '❌ modelo inativo/NULL'
    WHEN tm.deleted_at IS NOT NULL THEN '❌ modelo excluído'
    ELSE '✅ vínculo elegível'
  END AS veredito
FROM cliente_modelos cm
JOIN clientes       c  ON c.id  = cm.cliente_id
JOIN tarefa_modelos tm ON tm.id = cm.modelo_id
JOIN empresas       e  ON e.id  = cm.empresa_id
WHERE e.nome ILIKE '%Be Solution%'
ORDER BY 13 DESC, c.razao_social, tm.titulo;


-- ── BLOCO 4 — FILTRO 4: a recorrência bate com os próximos dias? ──────────────
-- Reproduz em SQL a mesma regra da função (deveGerarNaData) e mostra, pra cada
-- vínculo elegível, QUANTOS dos próximos 45 dias deveriam gerar tarefa.
-- Linha com dias_que_geram = 0 é rotina que nunca vai nascer — normalmente
-- "semanal sem dia marcado", "dia_mes 29/30/31" ou anual/trimestral fora do
-- mês fixo que o código assume.
-- ─────────────────────────────────────────────────────────────────────────────
WITH vinc AS (
  SELECT
    c.razao_social AS cliente,
    tm.titulo      AS modelo,
    COALESCE(cm.recorrencia, tm.recorrencia)  AS rec,
    COALESCE(cm.dia_mes,     tm.dia_mes, 1)   AS dia_mes,
    COALESCE(cm.dias_semana, tm.dias_semana)  AS dias_semana,
    tm.dias_mes,
    cm.empresa_id
  FROM cliente_modelos cm
  JOIN clientes       c  ON c.id  = cm.cliente_id
  JOIN tarefa_modelos tm ON tm.id = cm.modelo_id
  JOIN empresas       e  ON e.id  = cm.empresa_id
  WHERE e.nome ILIKE '%Be Solution%'
    AND cm.ativo IS TRUE
    AND cm.pausado IS FALSE
    AND tm.ativo  IS TRUE
    AND tm.deleted_at IS NULL
    AND c.status_operacional = 'operacional'
    AND c.operacao_iniciada_em IS NOT NULL
),
dias AS (
  SELECT generate_series(CURRENT_DATE, CURRENT_DATE + 45, '1 day')::date AS d
)
SELECT
  v.cliente,
  v.modelo,
  v.rec              AS recorrencia,
  v.dia_mes,
  v.dias_semana,
  COUNT(*) FILTER (WHERE
    CASE v.rec
      WHEN 'diaria'      THEN true
      WHEN 'dias_uteis'  THEN EXTRACT(DOW FROM d.d) NOT IN (0,6)
                              AND NOT EXISTS (SELECT 1 FROM feriados f
                                              WHERE f.empresa_id = v.empresa_id AND f.data = d.d)
      WHEN 'semanal'     THEN EXTRACT(DOW FROM d.d)::int = ANY(COALESCE(v.dias_semana, ARRAY[]::int[]))
      WHEN 'quinzenal'   THEN EXTRACT(DAY FROM d.d)::int IN (v.dia_mes, LEAST(v.dia_mes + 15, 28))
      WHEN 'mensal'      THEN EXTRACT(DAY FROM d.d)::int = v.dia_mes
      WHEN 'dias_especificos' THEN EXTRACT(DAY FROM d.d)::int = ANY(COALESCE(v.dias_mes, ARRAY[]::int[]))
      WHEN 'bimestral'   THEN EXTRACT(DAY FROM d.d)::int = v.dia_mes AND (EXTRACT(MONTH FROM d.d)::int - 1) % 2 = 0
      WHEN 'trimestral'  THEN EXTRACT(DAY FROM d.d)::int = v.dia_mes AND (EXTRACT(MONTH FROM d.d)::int - 1) IN (0,3,6,9)
      WHEN 'semestral'   THEN EXTRACT(DAY FROM d.d)::int = v.dia_mes AND (EXTRACT(MONTH FROM d.d)::int - 1) IN (0,6)
      WHEN 'anual'       THEN EXTRACT(DAY FROM d.d)::int = v.dia_mes AND (EXTRACT(MONTH FROM d.d)::int - 1) = 0
      ELSE false
    END
  ) AS dias_que_geram_em_45d,
  CASE
    WHEN v.rec = 'semanal' AND COALESCE(array_length(v.dias_semana,1),0) = 0
      THEN '❌ semanal sem nenhum dia da semana marcado — nunca gera'
    WHEN v.rec = 'dias_especificos' AND COALESCE(array_length(v.dias_mes,1),0) = 0
      THEN '❌ dias específicos sem nenhum dia marcado — nunca gera'
    WHEN v.rec IN ('mensal','quinzenal','bimestral','trimestral','semestral','anual') AND v.dia_mes > 28
      THEN '⚠️ dia ' || v.dia_mes || ' não existe em todo mês — pula fevereiro e os meses de 30 dias'
    WHEN v.rec IN ('anual','semestral','trimestral','bimestral')
      THEN '⚠️ o código fixa os MESES (anual=jan, semestral=jan/jul, trimestral=jan/abr/jul/out, bimestral=ímpares). Não há campo de mês no modelo.'
    ELSE '—'
  END AS observacao
FROM vinc v CROSS JOIN dias d
GROUP BY v.cliente, v.modelo, v.rec, v.dia_mes, v.dias_semana, v.dias_mes
ORDER BY 6 ASC, v.cliente, v.modelo;


-- ── BLOCO 5 — AUDITORIA: o que a função DECIDIU pra essa empresa ──────────────
-- Se o Bloco 0 mostrou execuções recentes, aqui aparece o motivo cliente a
-- cliente. Vazio = a empresa nem chegou a ser considerada (volte ao Bloco 1).
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  tgd.data_alvo,
  c.razao_social AS cliente,
  tm.titulo      AS modelo,
  tgd.resultado,
  tgd.motivo,
  COUNT(*) AS ocorrencias
FROM task_generation_details tgd
JOIN empresas e ON e.id = tgd.empresa_id
LEFT JOIN clientes       c  ON c.id  = tgd.cliente_id
LEFT JOIN tarefa_modelos tm ON tm.id = tgd.modelo_id
WHERE e.nome ILIKE '%Be Solution%'
  AND tgd.data_alvo >= CURRENT_DATE - 15
GROUP BY 1,2,3,4,5
ORDER BY tgd.data_alvo DESC, 4;


-- ── BLOCO 6 — RESULTADO FINAL: tarefas que existem de fato ───────────────────
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  t.data_execucao,
  COUNT(*)                                            AS tarefas,
  COUNT(*) FILTER (WHERE t.status = 'aberta')         AS abertas,
  COUNT(*) FILTER (WHERE t.deleted_at IS NOT NULL)    AS excluidas,
  COUNT(DISTINCT t.cliente_id)                        AS clientes
FROM tarefas t
JOIN empresas e ON e.id = t.empresa_id
WHERE e.nome ILIKE '%Be Solution%'
  AND t.data_execucao BETWEEN CURRENT_DATE - 15 AND CURRENT_DATE + 30
GROUP BY t.data_execucao
ORDER BY t.data_execucao DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCO 7 — TESTE AO VIVO (dry run). Não grava nada, só responde o que a função
-- faria hoje pra essa empresa. Troque <EMPRESA_ID> pelo id do Bloco 1 e
-- <SERVICE_ROLE_KEY> pela chave atual (Settings → API → service_role).
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT net.http_post(
--   url     := 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/gerar-tarefas',
--   headers := jsonb_build_object(
--     'Content-Type',  'application/json',
--     'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--     'x-trigger',     'manual'
--   ),
--   body    := jsonb_build_object(
--     'dry_run',     true,
--     'empresa_id',  '<EMPRESA_ID>',
--     'data_inicio', CURRENT_DATE::text,
--     'data_fim',    (CURRENT_DATE + 30)::text
--   )
-- );
--
-- Espere ~5 segundos e leia a resposta:
-- SELECT status_code, LEFT(content, 4000) FROM net._http_response ORDER BY created DESC LIMIT 1;
