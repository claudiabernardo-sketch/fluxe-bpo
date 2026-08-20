// ══════════════════════════════════════════════════════════════════════════════
// Fluxe — Edge Function: kiwify-webhook
// Recebe o webhook de venda aprovada da Kiwify e libera acesso automático ao
// Fluxe pra quem comprou a Mentoria em Grupo — cria a empresa, o usuário no
// Auth já com senha, vincula em usuarios e manda o email de boas-vindas.
//
// Segurança: a Kiwify não assina o payload de um jeito simples de validar
// aqui, então a proteção é um token secreto na própria URL do webhook
// (?token=...), configurado no painel da Kiwify. Sem o token certo, a
// requisição é rejeitada.
//
// Escopo: só libera acesso se KIWIFY_PRODUCT_ID_MENTORIA_GRUPO estiver
// configurado E bater com o produto da venda. Enquanto essa variável não
// existir (produto ainda não criado na Kiwify), a função não libera nada —
// evita liberar acesso indevido antes de tudo estar configurado.
//
// Obs: o formato exato do payload da Kiwify pode variar um pouco por tipo de
// evento/plano de conta. Escrito de forma defensiva (varias variantes de
// nome de campo), mas vale conferir os logs no primeiro teste real de venda
// e ajustar se algum campo vier diferente do esperado.
// ══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function ok(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Senha temporária legível (evita caracteres ambíguos tipo 0/O, 1/l/I).
function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  let senha = ''
  for (const b of bytes) senha += chars[b % chars.length]
  return `Fluxe${senha}!`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // ── Validação do token secreto na URL ──────────────────────────────
    const url = new URL(req.url)
    const tokenRecebido = url.searchParams.get('token')
    const tokenEsperado = Deno.env.get('KIWIFY_WEBHOOK_TOKEN')
    if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
      return ok({ error: 'Token inválido' }, 401)
    }

    const body = await req.json()

    // ── Só processa venda aprovada ──────────────────────────────────────
    // Kiwify manda variações dependendo do evento: order_status "paid" ou
    // webhook_event_type "order_approved" são os mais comuns pra compra
    // aprovada.
    const status = (body.order_status || body.status || '').toLowerCase()
    const eventType = (body.webhook_event_type || body.event || '').toLowerCase()
    const aprovado = status === 'paid' || status === 'approved' || eventType.includes('approved')
    if (!aprovado) {
      return ok({ success: true, ignorado: `status "${status || eventType}" não é venda aprovada` })
    }

    // ── Confere se é o produto certo (Mentoria em Grupo) ────────────────
    const produtoEsperado = Deno.env.get('KIWIFY_PRODUCT_ID_MENTORIA_GRUPO')
    const produtoId = body?.Product?.product_id || body?.product?.id || body?.product_id
    if (!produtoEsperado) {
      return ok({ success: true, ignorado: 'KIWIFY_PRODUCT_ID_MENTORIA_GRUPO ainda não configurado — nenhum acesso liberado' })
    }
    if (produtoId !== produtoEsperado) {
      return ok({ success: true, ignorado: `produto ${produtoId} não é a Mentoria em Grupo` })
    }

    // ── Extrai dados do comprador ────────────────────────────────────────
    const nome = body?.Customer?.full_name || body?.customer?.full_name || body?.Customer?.name || 'Aluno(a) Mentoria em Grupo'
    const email = body?.Customer?.email || body?.customer?.email
    if (!email) return ok({ error: 'Não achei o email do comprador no payload da Kiwify' })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Idempotência: se já existe usuário com esse email, reaproveita a
    // empresa em vez de duplicar (Kiwify pode reenviar o mesmo webhook) ──
    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('id, empresa_id')
      .eq('email', email)
      .maybeSingle()

    // Mentoria em Grupo dá 1 ano de acesso ao Fluxe, contado da compra.
    const mentoradoExpiraEm = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    let empresaId: string
    if (usuarioExistente?.empresa_id) {
      empresaId = usuarioExistente.empresa_id
      await supabase.from('empresas')
        .update({ mentorado_bpo_lucrativo: true, mentorado_expira_em: mentoradoExpiraEm, mentoria_origem: 'grupo' })
        .eq('id', empresaId)
    } else {
      const { data: empresaRow, error: empresaErr } = await supabase
        .from('empresas')
        .insert({ nome, email, plano: 'pro', mentorado_bpo_lucrativo: true, mentorado_expira_em: mentoradoExpiraEm, mentoria_origem: 'grupo' })
        .select('id')
        .single()
      if (empresaErr) return ok({ error: empresaErr.message })
      empresaId = empresaRow.id
    }

    const senhaTemporaria = gerarSenhaTemporaria()

    let userId: string
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: { nome, empresa_id: empresaId, origem: 'kiwify' },
    })
    if (createError) {
      if (createError.message?.includes('already been registered')) {
        if (!usuarioExistente?.id) return ok({ error: createError.message })
        userId = usuarioExistente.id
        const { error: pwError } = await supabase.auth.admin.updateUserById(userId, { password: senhaTemporaria })
        if (pwError) return ok({ error: pwError.message })
      } else {
        return ok({ error: createError.message })
      }
    } else {
      userId = created.user.id
    }

    const { error: profileError } = await supabase
      .from('usuarios')
      .upsert({ id: userId, empresa_id: empresaId, nome, email, perfil: 'admin', ativo: true })
    if (profileError) return ok({ error: profileError.message })

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM') || 'Fluxe <noreply@fluxebpo.com.br>'
    let emailSent = false
    if (resendKey) {
      const html = buildWelcomeEmail({ nome, email, senha: senhaTemporaria })
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: resendFrom, to: [email], subject: 'Bem-vindo(a) ao Fluxe — Mentoria em Grupo', html }),
        })
        emailSent = resendRes.ok
        if (!resendRes.ok) console.error('Resend error:', await resendRes.text())
      } catch (e) {
        console.error('Resend exception:', e)
      }
    }

    return ok({ success: true, empresa_id: empresaId, userId, email, emailSent })

  } catch (e) {
    console.error('kiwify-webhook error:', e)
    return ok({ error: (e as Error).message || 'Erro interno' })
  }
})

// ── Template do email de boas-vindas (mesmo padrão do criar_mentorado) ─────
function buildWelcomeEmail({ nome, email, senha }: { nome: string; email: string; senha: string }) {
  const year = new Date().getFullYear()
  const loginUrl = 'https://fluxebpo.com.br/login'
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bem-vindo(a) ao Fluxe</title>
</head>
<body style="margin:0;padding:0;background-color:#05070E;font-family:Arial,Helvetica,sans-serif">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#05070E;padding:32px 16px">
<tr><td align="center">

  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#0D1424;border-radius:14px;overflow:hidden;max-width:560px;border:1px solid #1E293B">

    <tr>
      <td style="background-color:#6366F1;padding:32px 40px;text-align:center">
        <p style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px">Fluxe</p>
        <p style="margin:6px 0 0;font-size:11px;color:#E0E7FF;letter-spacing:1px;text-transform:uppercase">Mentoria em Grupo</p>
      </td>
    </tr>

    <tr>
      <td style="padding:36px 40px 28px">

        <h1 style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#F8FAFC">Bem-vindo(a) ao Fluxe, ${nome}! 🎉</h1>

        <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.65">
          Sua compra foi confirmada! A partir de agora, o Fluxe é o seu caderno de exercícios dentro da mentoria: é aqui que você desenha a operação,
          precifica certo e monta o plano de negócio do seu BPO Financeiro, aplicando o Método Fluxe na prática.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.65">
          Seus dados de acesso já estão prontos:
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B1220;border-radius:8px;margin-bottom:24px">
          <tr>
            <td style="padding:16px 20px;border-left:3px solid #6366F1">
              <p style="margin:0 0 4px;font-size:11px;color:#64748B;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">Seus dados de acesso</p>
              <p style="margin:0 0 4px;font-size:13px;color:#CBD5E1"><strong>E-mail:</strong> ${email}</p>
              <p style="margin:0;font-size:13px;color:#CBD5E1"><strong>Senha:</strong> ${senha}</p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
          <tr>
            <td style="background-color:#6366F1;border-radius:8px;text-align:center">
              <a href="${loginUrl}"
                 style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:bold;
                        color:#ffffff;text-decoration:none;border-radius:8px;
                        mso-padding-alt:14px 40px;font-family:Arial,Helvetica,sans-serif">
                &#x2192;&nbsp;Entrar no Fluxe
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:12px;color:#64748B;line-height:1.6">
          Recomendamos trocar sua senha assim que entrar, nas configurações da sua conta.
        </p>

      </td>
    </tr>

    <tr>
      <td style="padding:18px 40px;border-top:1px solid #1E293B;text-align:center;background-color:#0B1220">
        <p style="margin:0;font-size:11px;color:#475569">
          &copy; ${year} Fluxe &middot; fluxebpo.com.br<br>
          Enviado automaticamente &mdash; não responda este email.
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>`
}
