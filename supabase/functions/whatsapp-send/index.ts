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

// ─── Envia mensagem de texto via Meta API ──────────────────────────────────

async function enviarMensagem(
  phone: string,
  corpo: string,
  phoneNumberId: string,
  token: string
): Promise<{ success: boolean; wamid?: string; error?: string }> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: corpo },
      }),
    }
  )

  const data = await res.json()

  if (!res.ok || data.error) {
    return { success: false, error: data.error?.message || 'Erro ao enviar' }
  }

  return { success: true, wamid: data.messages?.[0]?.id }
}

// ─── Handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, ...payload } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Ação: Embedded Signup — troca o código que a Meta devolve depois do
    // cliente conectar o WhatsApp dele (login do Facebook, dentro do Fluxe)
    // por um token de acesso, descobre o phone_number_id do número que ele
    // acabou de configurar, e já inscreve esse WABA no nosso webhook pra
    // começar a receber mensagem sem passo manual nenhum. ──────────────────
    if (action === 'exchange_code') {
      const { code, empresa_id } = payload
      const appId = Deno.env.get('META_APP_ID') || ''
      const appSecret = Deno.env.get('META_APP_SECRET') || ''

      if (!appId || !appSecret) return ok({ error: 'META_APP_ID / META_APP_SECRET não configurados no Supabase' })
      if (!code || !empresa_id) return ok({ error: 'code e empresa_id são obrigatórios' })

      // 1. Troca o código por um token de acesso (curta duração)
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
      )
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok || tokenData.error) {
        return ok({ error: tokenData.error?.message || 'Erro ao trocar o código por token' })
      }
      const shortToken = tokenData.access_token

      // 2. Estende pra um token de longa duração (~60 dias, renovável)
      const longRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
      )
      const longData = await longRes.json()
      const accessToken = longData.access_token || shortToken

      // 3. Descobre quais WhatsApp Business Accounts esse login trouxe
      const wabaRes = await fetch(
        `https://graph.facebook.com/v19.0/me/businesses?fields=owned_whatsapp_business_accounts{id,phone_numbers{id,display_phone_number,verified_name}}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const wabaData = await wabaRes.json()
      const waba = wabaData.data?.[0]?.owned_whatsapp_business_accounts?.data?.[0]
      const numero = waba?.phone_numbers?.data?.[0]

      if (!waba || !numero) {
        return ok({ error: 'Não encontrei nenhum número de WhatsApp configurado nessa conta. Confirme que o número foi criado durante o login.' })
      }

      // 4. Inscreve o app nos webhooks desse WABA (senão não chegam mensagens)
      await fetch(`https://graph.facebook.com/v19.0/${waba.id}/subscribed_apps`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      // 5. Salva no Fluxe, já pronto pra usar
      const { error: errSave } = await supabase.from('empresas').update({
        wa_phone_number_id: numero.id,
        wa_access_token: accessToken,
        wa_waba_id: waba.id,
      }).eq('id', empresa_id)
      if (errSave) return ok({ error: errSave.message })

      return ok({ success: true, numero: numero.display_phone_number, nome: numero.verified_name })
    }

    // ── Ação: testar conexão (valida phoneNumberId + token direto na Meta,
    // sem enviar nenhuma mensagem) ──────────────────────────────────────────
    if (action === 'test') {
      const { empresa_id } = payload

      const { data: empresa } = await supabase
        .from('empresas')
        .select('wa_phone_number_id, wa_access_token')
        .eq('id', empresa_id)
        .single()

      const phoneNumberId = empresa?.wa_phone_number_id || ''
      const token = empresa?.wa_access_token || ''

      if (!phoneNumberId || !token) return ok({ error: 'Preencha o Phone Number ID e o Access Token antes de testar' })

      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()

      if (!res.ok || data.error) {
        return ok({ error: data.error?.message || `Erro ${res.status} ao validar credenciais` })
      }

      return ok({ success: true, numero: data.display_phone_number, nome: data.verified_name })
    }

    // ── Ação: enviar mensagem imediata ─────────────────────────────────────
    if (action === 'send') {
      const { contato_id, empresa_id, corpo, usuario_id } = payload

      // Busca phone do contato
      const { data: contato, error: ce } = await supabase
        .from('whatsapp_contatos')
        .select('phone')
        .eq('id', contato_id)
        .single()

      if (ce || !contato) return ok({ error: 'Contato não encontrado' })

      // Busca configurações da empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('wa_phone_number_id, wa_access_token')
        .eq('id', empresa_id)
        .single()

      const phoneNumberId = empresa?.wa_phone_number_id || Deno.env.get('WA_PHONE_NUMBER_ID') || ''
      const token = empresa?.wa_access_token || Deno.env.get('WA_ACCESS_TOKEN') || ''

      if (!phoneNumberId || !token) return ok({ error: 'WhatsApp não configurado para esta empresa' })

      const result = await enviarMensagem(contato.phone, corpo, phoneNumberId, token)

      if (!result.success) return ok({ error: result.error })

      // Salva a mensagem enviada
      await supabase.from('whatsapp_mensagens').insert({
        empresa_id,
        contato_id,
        wamid: result.wamid,
        direcao: 'enviada',
        tipo: 'text',
        corpo,
        lida: true,
        usuario_id: usuario_id || null,
      })

      // Atualiza último contato
      await supabase.from('whatsapp_contatos')
        .update({ ultimo_msg_em: new Date().toISOString() })
        .eq('id', contato_id)

      return ok({ success: true, wamid: result.wamid })
    }

    // ── Ação: agendar mensagem ─────────────────────────────────────────────
    if (action === 'schedule') {
      const { contato_id, empresa_id, corpo, enviar_em, criado_por } = payload

      if (!contato_id || !empresa_id || !corpo || !enviar_em) {
        return ok({ error: 'contato_id, empresa_id, corpo e enviar_em são obrigatórios' })
      }

      const { error } = await supabase.from('whatsapp_agendados').insert({
        contato_id,
        empresa_id,
        corpo,
        enviar_em,
        criado_por: criado_por || null,
      })

      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    // ── Ação: processar fila de agendados (chamado por cron) ───────────────
    if (action === 'process_queue') {
      const now = new Date().toISOString()

      const { data: pendentes } = await supabase
        .from('whatsapp_agendados')
        .select('*, whatsapp_contatos(phone), empresas(wa_phone_number_id, wa_access_token)')
        .eq('enviado', false)
        .lte('enviar_em', now)
        .limit(50)

      if (!pendentes || pendentes.length === 0) {
        return ok({ success: true, enviados: 0 })
      }

      let enviados = 0

      for (const ag of pendentes) {
        const phone = ag.whatsapp_contatos?.phone
        const phoneNumberId = ag.empresas?.wa_phone_number_id || Deno.env.get('WA_PHONE_NUMBER_ID') || ''
        const token = ag.empresas?.wa_access_token || Deno.env.get('WA_ACCESS_TOKEN') || ''

        if (!phone || !phoneNumberId || !token) {
          await supabase.from('whatsapp_agendados')
            .update({ enviado: true, erro: 'Configuração incompleta' })
            .eq('id', ag.id)
          continue
        }

        const result = await enviarMensagem(phone, ag.corpo, phoneNumberId, token)

        await supabase.from('whatsapp_agendados')
          .update({ enviado: true, erro: result.error || null })
          .eq('id', ag.id)

        if (result.success) {
          await supabase.from('whatsapp_mensagens').insert({
            empresa_id: ag.empresa_id,
            contato_id: ag.contato_id,
            wamid: result.wamid,
            direcao: 'enviada',
            tipo: 'text',
            corpo: ag.corpo,
            lida: true,
            usuario_id: ag.criado_por || null,
          })
          enviados++
        }
      }

      return ok({ success: true, enviados })
    }

    return ok({ error: 'Ação inválida. Use: exchange_code | test | send | schedule | process_queue' })

  } catch (e) {
    return ok({ error: e.message || 'Erro interno' })
  }
})
