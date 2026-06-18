# Setup Asaas — Fluxe BPO

## 1. Configurar secrets no Supabase

No terminal do projeto:

```bash
# API Key do Asaas (sandbox)
npx supabase secrets set ASAAS_API_KEY=c6ee5396-cbb5-4051-811f-3ddbe1422fbd ASAAS_SANDBOX=true

# Para produção (trocar depois):
# npx supabase secrets set ASAAS_API_KEY=<KEY_PRODUCAO> ASAAS_SANDBOX=false
```

## 2. Rodar migração SQL

Abrir Supabase → SQL Editor → colar e rodar:
`supabase/asaas_migration.sql`

## 3. Deploy das Edge Functions

```bash
npx supabase functions deploy asaas-create-subscription
npx supabase functions deploy asaas-webhook
```

## 4. Configurar webhook no Asaas

No painel do Asaas (sandbox.asaas.com):
→ Integrações → Webhooks → Adicionar webhook

- URL: `https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/asaas-webhook`
- Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, SUBSCRIPTION_INACTIVATED

## 5. Configurar pg_cron (se ainda não configurado)

No Supabase → Extensions → habilitar `pg_cron` e `pg_net`

No SQL Editor, configure os app settings:
```sql
ALTER DATABASE postgres SET app.supabase_url = 'https://zwvmprcuxhvhbuvdcybs.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = '<SEU_SERVICE_ROLE_KEY>';
```

Então rode o SQL de criação do job em `asaas_migration.sql`.

## Fluxo completo

```
Signup → trial (14 dias)
         ↓ trial_expira_em < NOW()
pg_cron (8h diário) → asaas-create-subscription
         ↓ cria customer + subscription no Asaas
         ↓ plano = 'trial_expirado', salva asaas_payment_url
App mostra tela de pagamento com link
         ↓ cliente paga (boleto/pix/cartão)
Asaas → webhook → asaas-webhook
         ↓ PAYMENT_CONFIRMED → plano = 'essencial'
App libera acesso
         ↓ (se não pagar)
Asaas → webhook PAYMENT_OVERDUE → plano permanece 'trial_expirado'
         ↓ (cancelamento)
Asaas → SUBSCRIPTION_INACTIVATED → plano = 'bloqueado'
```
