import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function ok(data: object) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const perfilLabel: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  supervisor: 'Supervisor',
  operador: 'Operador',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { nome, email, perfil, custo_hora, empresa_id } = await req.json()

    if (!nome || !email || !empresa_id) {
      return ok({ error: 'nome, email e empresa_id são obrigatórios' })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Limite de usuários do plano Essencial (3 usuários) ────────────────
    const { data: empresaRow } = await supabaseAdmin
      .from('empresas')
      .select('plano')
      .eq('id', empresa_id)
      .single()

    if (empresaRow?.plano === 'essencial') {
      const { data: existingUser } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      // Só bloqueia se for usuário NOVO (editar/reenviar convite de quem já existe não deve travar)
      if (!existingUser) {
        const { count } = await supabaseAdmin
          .from('usuarios')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', empresa_id)
          .eq('ativo', true)

        if ((count ?? 0) >= 3) {
          return ok({ error: 'O plano Essencial permite até 3 usuários. Faça upgrade para o plano Completo para adicionar mais membros à equipe.' })
        }
      }
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://fluxebpo.com.br'
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM') || 'Fluxe BPO <noreply@fluxebpo.com.br>'
    const cargoLabel = perfilLabel[perfil] || 'Operador'

    // ── 1. Busca ou cria o usuário (sem listUsers — é lento) ─────────────
    // Primeiro tenta achar na tabela usuarios (mais rápido)
    let userId: string
    const { data: existingProfile } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile?.id) {
      userId = existingProfile.id
    } else {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: { nome, empresa_id, perfil: perfil || 'operador' },
      })
      if (createError) {
        if (createError.message?.includes('already been registered')) {
          // Usuário já existe no Auth (convite anterior falhou antes de salvar em usuarios)
          // generateLink vai nos dar o ID na resposta — tratamos abaixo
          userId = '__lookup_via_generateLink__'
        } else {
          return ok({ error: createError.message })
        }
      } else {
        userId = created.user.id
      }
    }

    // ── 2. Se userId ainda não temos, generateLink vai resolver ──────────
    // (caso em que o usuário já existia no Auth mas não em usuarios)
    // Fazemos isso ANTES do upsert para ter o ID real

    // ── 3. Gera magic link para primeiro acesso ───────────────────────────
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/reset-password` },
    })

    if (linkError) return ok({ error: linkError.message })

    // generateLink sempre retorna o objeto user com o ID real
    if (userId === '__lookup_via_generateLink__') {
      userId = linkData.user.id
    }

    const magicLink: string = linkData.properties.action_link

    // ── Cria/atualiza perfil na tabela usuarios ────────────────────────
    const { error: profileError } = await supabaseAdmin
      .from('usuarios')
      .upsert({
        id: userId,
        nome,
        email,
        perfil: perfil || 'operador',
        custo_hora: custo_hora || 35,
        empresa_id,
        ativo: true,
      })

    if (profileError) return ok({ error: profileError.message })

    // ── 4. Envia email via Resend ─────────────────────────────────────────
    if (resendKey) {
      const html = buildInviteEmail({ nome, email, cargoLabel, magicLink })

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [email],
            subject: `Você foi convidado(a) para o Fluxe BPO`,
            html,
          }),
        })

        if (!resendRes.ok) {
          const err = await resendRes.text()
          console.error('Resend error:', err)
          return ok({ success: true, userId, magicLink, emailSent: false, emailError: err })
        }

        return ok({ success: true, userId, emailSent: true })

      } catch (e) {
        console.error('Resend exception:', e)
        return ok({ success: true, userId, magicLink, emailSent: false })
      }
    }

    // Sem Resend configurado — retorna link para compartilhamento manual
    return ok({ success: true, userId, magicLink, emailSent: false })

  } catch (e) {
    return ok({ error: (e as Error).message || 'Erro interno' })
  }
})

// ── Template do email de convite ──────────────────────────────────────────
// Usa table-based button (sem gradiente) para máxima compatibilidade com clientes de email
function buildInviteEmail({ nome, email, cargoLabel, magicLink }: {
  nome: string; email: string; cargoLabel: string; magicLink: string
}) {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Convite Fluxe BPO</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:Arial,Helvetica,sans-serif">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:32px 16px">
<tr><td align="center">

  <!-- Container -->
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:560px">

    <!-- Header roxo sólido (gradiente não funciona em Outlook) -->
    <tr>
      <td style="background-color:#6366F1;padding:28px 40px;text-align:center">
        <p style="margin:0;font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px">Fluxe BPO</p>
        <p style="margin:6px 0 0;font-size:11px;color:#C7D2FE;letter-spacing:1px;text-transform:uppercase">Gestão Operacional de BPO</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:36px 40px 28px">

        <h1 style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#0F172A">Você foi convidado(a)! 🎉</h1>

        <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6">
          Olá, <strong style="color:#0F172A">${nome}</strong>!
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6">
          Você foi adicionado(a) ao <strong style="color:#0F172A">Fluxe BPO</strong> como <strong style="color:#6366F1">${cargoLabel}</strong>.
          Clique no botão abaixo para criar sua senha e começar a usar.
        </p>

        <!-- Botão compatível com todos os clientes de email -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto">
          <tr>
            <td style="background-color:#6366F1;border-radius:8px;text-align:center">
              <a href="${magicLink}"
                 style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:bold;
                        color:#ffffff;text-decoration:none;border-radius:8px;
                        mso-padding-alt:14px 40px;font-family:Arial,Helvetica,sans-serif">
                &#x2192;&nbsp;Acessar o Fluxe BPO
              </a>
            </td>
          </tr>
        </table>

        <!-- Dados de acesso -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:8px;margin-bottom:24px">
          <tr>
            <td style="padding:16px 20px;border-left:3px solid #6366F1">
              <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">Seus dados de acesso</p>
              <p style="margin:0 0 4px;font-size:13px;color:#475569"><strong>Email:</strong> ${email}</p>
              <p style="margin:0;font-size:13px;color:#475569"><strong>Perfil:</strong> ${cargoLabel}</p>
            </td>
          </tr>
        </table>

        <!-- Link alternativo caso botão não carregue -->
        <p style="margin:0 0 16px;font-size:12px;color:#94A3B8;line-height:1.6">
          Se o botão não funcionar, copie e cole este link no navegador:<br>
          <a href="${magicLink}" style="color:#6366F1;word-break:break-all">${magicLink}</a>
        </p>

        <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6">
          Este link é válido por <strong>24 horas</strong>. Se não solicitou este acesso, ignore este email.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:18px 40px;border-top:1px solid #F1F5F9;text-align:center;background-color:#F8FAFC">
        <p style="margin:0;font-size:11px;color:#CBD5E1">
          &copy; ${year} Fluxe BPO &middot; fluxebpo.com.br<br>
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
