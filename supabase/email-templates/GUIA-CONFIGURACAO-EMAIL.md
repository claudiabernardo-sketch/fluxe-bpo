# Guia de Configuração de Email — Fluxe BPO

## Por que configurar SMTP próprio?

O Supabase gratuito usa seu próprio servidor de email com limitações:
- Máximo 4 emails/hora no plano gratuito
- Remetente `noreply@mail.supabase.io` (não profissional)
- Emails podem ir para spam

Com SMTP próprio via **Resend** (gratuito até 3.000 emails/mês):
- Remetente `noreply@fluxebpo.com.br`
- Sem limite prático de emails
- Alta entregabilidade (não vai para spam)

---

## Passo 1 — Criar conta no Resend

1. Acesse [resend.com](https://resend.com) → **Get Started** (gratuito)
2. Crie uma conta com seu email
3. No painel, clique em **API Keys** → **Create API Key**
   - Nome: `fluxe-bpo-supabase`
   - Permissão: **Full Access**
   - Copie a chave: `re_xxxxxxxxxxxx`

---

## Passo 2 — Verificar domínio no Resend

1. No Resend: **Domains** → **Add Domain**
2. Digite: `fluxebpo.com.br`
3. O Resend vai mostrar registros DNS para adicionar
4. Acesse o painel do seu registrador de domínio (onde comprou o `.com.br`)
5. Adicione os registros TXT e CNAME mostrados
6. Aguarde até 24h para verificar (normalmente menos de 1h)

> 💡 Se ainda não tem domínio configurado, pode usar o domínio compartilhado do Resend
> temporariamente (from: `onboarding@resend.dev`)

---

## Passo 3 — Configurar SMTP no Supabase

1. Acesse [supabase.com](https://supabase.com) → seu projeto `zwvmprcuxhvhbuvdcybs`
2. **Project Settings** → **Authentication** → aba **SMTP Settings**
3. Ative **Enable Custom SMTP**
4. Preencha:

| Campo | Valor |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `re_xxxxxxxxxxxx` (sua API key do Resend) |
| Sender name | `Fluxe BPO` |
| Sender email | `noreply@fluxebpo.com.br` |

5. Clique em **Save**

---

## Passo 4 — Configurar templates de email no Supabase

1. **Project Settings** → **Authentication** → aba **Email Templates**

### Template: Confirm signup

- **Subject**: `Confirme seu email — Fluxe BPO`
- **Body**: cole o conteúdo do arquivo `confirmacao.html`

### Template: Reset Password

- **Subject**: `Redefinir sua senha — Fluxe BPO`
- **Body**: cole o conteúdo do arquivo `reset-senha.html`

### Template: Magic Link

- **Subject**: `Seu link de acesso — Fluxe BPO`
- **Body**: cole o conteúdo do arquivo `magic-link.html`

---

## Passo 5 — Configurar Redirect URLs no Supabase

1. **Project Settings** → **Authentication** → aba **URL Configuration**
2. **Site URL**: `https://fluxebpo.com.br`
3. **Redirect URLs** (adicione todos):
   ```
   https://fluxebpo.com.br
   https://fluxebpo.com.br/**
   https://fluxebpo.com.br/reset-password
   ```
4. Salve

---

## Passo 6 — Configurar secret RESEND_API_KEY na Edge Function

A Edge Function `invite-user` também usa o Resend diretamente.

No terminal, rode:

```bash
cd C:\Users\Cliente\Documents\Projetos\fluxe-bpo

# Configurar chave do Resend
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx --project-ref zwvmprcuxhvhbuvdcybs

# Configurar remetente (se domínio verificado)
npx supabase secrets set RESEND_FROM="Fluxe BPO <noreply@fluxebpo.com.br>" --project-ref zwvmprcuxhvhbuvdcybs

# Confirmar URL do site
npx supabase secrets set SITE_URL=https://fluxebpo.com.br --project-ref zwvmprcuxhvhbuvdcybs

# Fazer deploy da função atualizada
npx supabase functions deploy invite-user --project-ref zwvmprcuxhvhbuvdcybs
```

---

## Passo 7 — Testar

1. Acesse `https://fluxebpo.com.br`
2. Clique em **Criar conta** → preencha os dados
3. Verifique se o email de confirmação chegou com o layout do Fluxe BPO
4. Teste também o **Esqueci minha senha**
5. Na área de Config → Equipe → convide um analista e verifique o email de convite

---

## Resumo dos emails e quando são enviados

| Email | Quando | Template usado |
|-------|--------|---------------|
| Confirmação de cadastro | Admin cria conta nova | Supabase template (`confirmacao.html`) |
| Reset de senha | Usuário clica "Esqueci a senha" | Supabase template (`reset-senha.html`) |
| Magic Link | Usuário solicita link de acesso | Supabase template (`magic-link.html`) |
| Convite de analista | Admin convida membro da equipe | Edge Function `invite-user` via Resend |

---

## Limites do Resend (plano gratuito)

- 3.000 emails/mês
- 100 emails/dia
- Mais que suficiente para começar

Quando crescer, o plano Pro do Resend é $20/mês para 50.000 emails.
