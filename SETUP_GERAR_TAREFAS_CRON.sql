-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Setup: Geração automática de tarefas (server-side)
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabela de logs de execução ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_generation_logs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  executado_em          TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_gerada           DATE        NOT NULL,
  empresas_processadas  INTEGER     NOT NULL DEFAULT 0,
  clientes_processados  INTEGER     NOT NULL DEFAULT 0,
  tarefas_geradas       INTEGER     NOT NULL DEFAULT 0,
  erros                 TEXT[],
  origem                TEXT        DEFAULT 'cron'  -- 'cron' | 'manual' | 'error'
);

-- Índice para consulta por data
CREATE INDEX IF NOT EXISTS task_gen_logs_data_idx ON task_generation_logs(data_gerada DESC);

-- RLS: apenas service_role acessa (a Edge Function usa service_role)
ALTER TABLE task_generation_logs ENABLE ROW LEVEL SECURITY;

-- ── 2. Habilitar extensões necessárias ───────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── 3. pg_cron: executa todo dia às 03:00 UTC = 00:00 BRT ───────────────────
--
-- ⚠️  Antes de rodar: substitua eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dm1wcmN1eGh2aGJ1dmRjeWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA1NjE1MSwiZXhwIjoyMDk1NjMyMTUxfQ.HIF8yfsLgiGdAfXOEmr_AR6TgOqKuWZeVzlV4NQ6wjY pelo valor real:
--     Supabase → Project Settings → API → service_role (secret)
--
SELECT cron.schedule(
  'fluxe-gerar-tarefas-diarias',       -- nome do job (único)
  '0 3 * * *',                          -- cron: 03:00 UTC = 00:00 BRT
  $$
  SELECT net.http_post(
    url     := 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/gerar-tarefas',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SEU_SERVICE_ROLE_KEY>',
      'x-trigger',     'cron'
    ),
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);

-- ── 4. Verificar se o job foi registrado ─────────────────────────────────────
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'fluxe-gerar-tarefas-diarias';

-- ── 5. Como forçar execução manual para teste ────────────────────────────────
-- (substitua <SEU_SERVICE_ROLE_KEY> abaixo)
--
-- SELECT net.http_post(
--   url     := 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/gerar-tarefas',
--   headers := jsonb_build_object(
--     'Content-Type',  'application/json',
--     'Authorization', 'Bearer <SEU_SERVICE_ROLE_KEY>',
--     'x-trigger',     'manual'
--   ),
--   body    := '{"trigger":"manual"}'::jsonb
-- );
--
-- Para gerar para uma data específica (ex: amanhã):
-- body    := '{"trigger":"manual","data":"2026-07-01"}'::jsonb

-- ── 6. Consultar logs após execução ──────────────────────────────────────────
-- SELECT * FROM task_generation_logs ORDER BY executado_em DESC LIMIT 10;
