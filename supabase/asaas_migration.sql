-- ─────────────────────────────────────────────────────────────────
-- Migração: integração Asaas (pagamentos / assinaturas)
-- Rodar no Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- 1. Colunas Asaas na tabela empresas
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS asaas_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_payment_url     TEXT,
  ADD COLUMN IF NOT EXISTS asaas_last_payment_at TIMESTAMPTZ;

-- 2. Garantir que plano aceite os valores necessários
--    (trial | essencial | pro | trial_expirado | bloqueado)
--    Se você tiver constraint de check, atualize aqui:
-- ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_plano_check;
-- ALTER TABLE empresas ADD CONSTRAINT empresas_plano_check
--   CHECK (plano IN ('trial','essencial','pro','trial_expirado','bloqueado'));

-- 3. Habilitar pg_net (necessário para pg_cron chamar Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. Job pg_cron: verifica trials expirados todos os dias às 8h (horário UTC)
--    ⚠️ Substitua <SEU_SERVICE_ROLE_KEY> pelo valor real antes de rodar
--    (Supabase → Project Settings → API → service_role)
SELECT cron.schedule(
  'asaas-check-expired-trials',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/asaas-create-subscription',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SEU_SERVICE_ROLE_KEY>'
    ),
    body    := '{"trigger":"cron"}'::jsonb
  )
  FROM (SELECT 1) _
  WHERE EXISTS (
    SELECT 1 FROM empresas
    WHERE plano = 'trial'
      AND trial_expira_em < NOW()
      AND asaas_customer_id IS NULL
  );
  $$
);

-- 5. Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'asaas-check-expired-trials';
