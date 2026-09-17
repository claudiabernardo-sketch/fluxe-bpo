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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, novo_email } = await req.json()
    const emailLimpo = (novo_email || '').trim().toLowerCase()

    if (!user_id || !emailLimpo) return ok({ error: 'user_id e novo_email são obrigatórios' })
    if (!EMAIL_RE.test(emailLimpo)) return ok({ error: 'E-mail inválido' })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Quem está chamando precisa ser admin/gestor da MESMA empresa do usuário
    // que está sendo editado — email é dado sensível de identidade/login.
    const callerToken = (req.headers.get('authorization') || '').replace('Bearer ', '')
    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(callerToken)
    if (callerErr || !callerData?.user) return ok({ error: 'Não autenticado' })

    const { data: callerProfile } = await supabaseAdmin
      .from('usuarios')
      .select('empresa_id, perfil')
      .eq('id', callerData.user.id)
      .maybeSingle()

    if (!callerProfile || !['admin', 'gestor'].includes(callerProfile.perfil)) {
      return ok({ error: 'Sem permissão para editar o e-mail de outro usuário' })
    }

    const { data: targetProfile } = await supabaseAdmin
      .from('usuarios')
      .select('id, empresa_id, email')
      .eq('id', user_id)
      .maybeSingle()

    if (!targetProfile) return ok({ error: 'Usuário não encontrado' })
    if (targetProfile.empresa_id !== callerProfile.empresa_id) {
      return ok({ error: 'Usuário não pertence à sua empresa' })
    }
    if (targetProfile.email === emailLimpo) return ok({ success: true })

    // E-mail já usado por outra conta no Fluxe?
    const { data: emailEmUso } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', emailLimpo)
      .neq('id', user_id)
      .maybeSingle()
    if (emailEmUso) return ok({ error: 'Esse e-mail já está em uso por outra conta no Fluxe' })

    // Atualiza o e-mail de login no Auth (confirmado direto, sem exigir
    // clique de confirmação — quem está trocando é o admin/gestor da equipe,
    // não a própria pessoa dona do e-mail).
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      email: emailLimpo,
      email_confirm: true,
    })
    if (authError) return ok({ error: authError.message })

    const { error: profileError } = await supabaseAdmin
      .from('usuarios')
      .update({ email: emailLimpo })
      .eq('id', user_id)
    if (profileError) return ok({ error: profileError.message })

    return ok({ success: true })
  } catch (e) {
    return ok({ error: e?.message || 'Erro inesperado' })
  }
})
