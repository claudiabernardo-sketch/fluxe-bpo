# Configuração WhatsApp Meta API — Fluxe BPO

## Passo 1 — Meta for Developers

1. Acesse https://developers.facebook.com → **Criar app**
2. Tipo: **Business** → próximo
3. Adicione o produto **WhatsApp** ao app
4. Anote os 3 dados:
   - **Phone Number ID** (ex: 123456789012345)
   - **WhatsApp Business Account ID** (WABA ID)
   - **Token de Acesso Temporário** (vira permanente depois)

## Passo 2 — Rodar o SQL no Supabase

No Supabase → SQL Editor, cole e rode:
```
supabase/whatsapp_schema.sql
```

Depois adicione as colunas de config nas empresas:
```sql
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS wa_access_token    TEXT,
  ADD COLUMN IF NOT EXISTS wa_waba_id         TEXT;
```

## Passo 3 — Deploy das Edge Functions

```bash
cd C:\Users\Cliente\Documents\Projetos\fluxe-bpo

npx supabase functions deploy whatsapp-webhook --project-ref zwvmprcuxhvhbuvdcybs
npx supabase functions deploy whatsapp-send    --project-ref zwvmprcuxhvhbuvdcybs
```

## Passo 4 — Secrets nas Edge Functions

No Supabase Dashboard → Edge Functions → Manage Secrets, adicione:

| Variável | Valor |
|----------|-------|
| `WA_PHONE_NUMBER_ID` | Phone Number ID da Meta |
| `WA_ACCESS_TOKEN` | Token de acesso da Meta |
| `WA_VERIFY_TOKEN` | `fluxe_bpo_verify` (pode manter esse) |
| `ANTHROPIC_API_KEY` | Sua chave da Anthropic (para IA ler documentos) |

## Passo 5 — Configurar Webhook na Meta

1. No Meta for Developers → WhatsApp → Configuração → Webhook
2. **URL do Callback:**
   ```
   https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/whatsapp-webhook
   ```
3. **Token de Verificação:** `fluxe_bpo_verify`
4. Assine os eventos: **messages**

## Passo 6 — Salvar credenciais na empresa

No Supabase SQL Editor:
```sql
UPDATE empresas
SET
  wa_phone_number_id = 'SEU_PHONE_NUMBER_ID',
  wa_access_token    = 'SEU_ACCESS_TOKEN',
  wa_waba_id         = 'SEU_WABA_ID'
WHERE id = 'ID_DA_SUA_EMPRESA';
```

## Passo 7 — Deploy do frontend

```bash
npx vercel --prod
```

## Pronto!

- Abra o Fluxe BPO → ícone WhatsApp na barra lateral
- Quando um cliente enviar mensagem, ela aparece em tempo real
- Clique em **"Criar tarefa"** em qualquer mensagem
- Documentos (boletos, NFs) são lidos pela IA automaticamente
- Use **"Agendar"** no topo da conversa para programar mensagens
