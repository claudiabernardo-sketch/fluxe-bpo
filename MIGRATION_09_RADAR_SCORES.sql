-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 09: Motor do Radar server-side + histórico de score
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Snapshot diário do score de cada cliente ──────────────────────────────
CREATE TABLE IF NOT EXISTS radar_scores (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id        UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  score             INT,
  semaforo          TEXT        NOT NULL CHECK (semaforo IN ('verde','amarelo','vermelho','sem_dado')),
  areas             JSONB       NOT NULL,   -- snapshot das 13 áreas {status, valor}
  areas_calculadas  INT         NOT NULL,
  calculado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS radar_scores_cliente_idx ON radar_scores (cliente_id, calculado_em DESC);
CREATE INDEX IF NOT EXISTS radar_scores_empresa_idx ON radar_scores (empresa_id, calculado_em DESC);

ALTER TABLE radar_scores ENABLE ROW LEVEL SECURITY;

-- Cada empresa só lê o próprio histórico. Sem policy de INSERT/UPDATE pra
-- usuário comum — só a Edge Function (service_role) grava aqui.
CREATE POLICY radar_scores_select ON radar_scores FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- ── 2. Alertas: gerados quando o semáforo piora de um cálculo pro outro ──────
CREATE TABLE IF NOT EXISTS radar_alertas (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id        UUID        NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  semaforo_anterior TEXT,
  semaforo_novo     TEXT        NOT NULL,
  visto             BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS radar_alertas_pendentes_idx ON radar_alertas (empresa_id, visto);

ALTER TABLE radar_alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY radar_alertas_select ON radar_alertas FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Update permitido só pra marcar "visto" (usuário da própria empresa)
CREATE POLICY radar_alertas_update ON radar_alertas FOR UPDATE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- ── 2b. View: último score de cada cliente (o que as telas efetivamente leem) ─
CREATE OR REPLACE VIEW radar_scores_ultimo AS
SELECT DISTINCT ON (cliente_id) *
FROM radar_scores
ORDER BY cliente_id, calculado_em DESC;

-- Postgres 15+: a view respeita a RLS de radar_scores em vez de rodar como
-- dono da view (que ignoraria a policy e vazaria dado entre empresas).
ALTER VIEW radar_scores_ultimo SET (security_invoker = true);

-- ── 3. Log de execução — mesmo padrão de task_generation_logs ───────────────
CREATE TABLE IF NOT EXISTS radar_calc_logs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  executado_em          TIMESTAMPTZ NOT NULL DEFAULT now(),
  empresas_processadas  INTEGER     NOT NULL DEFAULT 0,
  clientes_processados  INTEGER     NOT NULL DEFAULT 0,
  alertas_gerados       INTEGER     NOT NULL DEFAULT 0,
  erros                 TEXT[],
  origem                TEXT        DEFAULT 'cron'  -- 'cron' | 'manual'
);

CREATE INDEX IF NOT EXISTS radar_calc_logs_data_idx ON radar_calc_logs (executado_em DESC);

ALTER TABLE radar_calc_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY radar_calc_logs_select ON radar_calc_logs FOR SELECT
  USING (true); -- log agregado, sem dado sensível por empresa — leitura liberada pra qualquer usuário autenticado

-- ── 4. Habilitar extensões necessárias (pule se já habilitadas) ─────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── 5. pg_cron: roda todo dia às 06:00 BRT (09:00 UTC) ───────────────────────
--
-- ⚠️  Antes de rodar: troque <SEU_SERVICE_ROLE_KEY> pelo valor real
--     (Supabase → Project Settings → API → service_role secret).
--     Se você já rodou SETUP_GERAR_TAREFAS_CRON.sql antes, é a mesma chave.
--
SELECT cron.schedule(
  'fluxe-radar-calcular-diario',
  '0 9 * * *',                          -- 09:00 UTC = 06:00 BRT
  $$
  SELECT net.http_post(
    url     := 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/radar-calcular',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SEU_SERVICE_ROLE_KEY>',
      'x-trigger',     'cron'
    ),
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);

-- ── 6. Verificar se o job foi registrado ─────────────────────────────────────
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'fluxe-radar-calcular-diario';

-- ── 7. Forçar execução manual pra testar (opcional — o botão "Recalcular
--        agora" em Config faz a mesma coisa direto pelo app) ─────────────────
-- SELECT net.http_post(
--   url     := 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/radar-calcular',
--   headers := jsonb_build_object(
--     'Content-Type',  'application/json',
--     'Authorization', 'Bearer <SEU_SERVICE_ROLE_KEY>',
--     'x-trigger',     'manual'
--   ),
--   body    := '{"trigger":"manual"}'::jsonb
-- );

-- ── 8. Conferir depois de rodar ───────────────────────────────────────────────
-- SELECT * FROM radar_calc_logs ORDER BY executado_em DESC LIMIT 5;
-- SELECT * FROM radar_scores ORDER BY calculado_em DESC LIMIT 20;
