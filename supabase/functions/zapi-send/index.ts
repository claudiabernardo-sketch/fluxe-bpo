// ══════════════════════════════════════════════════════════════════════════════
// Fluxe BPO — Edge Function: zapi-send
// Envio de WhatsApp pelo caminho NÃO-OFICIAL (Z-API, conexão via QR Code).
// Mesma forma de uso da whatsapp-send (oficial), pra MensagensPage.jsx poder
// trocar de provedor sem mudar a tela — só troca qual function chama, com
// base em empresas.wa_provider.
//
// Aviso pra quem for mexer aqui: a Meta pode bloquear/banir o número
// conectado por esse caminho a qualquer momento, sem aviso — é o motivo de
// isso ser uma OPÇÃO explícita da empresa cliente, não o padrão do Fluxe.
// ══════════════════════════════════════════════════════════════════════════════

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

function zapiBase(instanceId: string, instanceToken: string) {
  return `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}`
}

async function enviarMensagemZapi(
  phone: string,
  message: string,
  instanceId: string,
  instanceToken: string,
  clientToken: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const res = await fetch(`${zapiBase(instanceId, instanceToken)}/send-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(clientToken ? { 'Client-Token': clientToken } : {}),
    },
    body: JSON.stringify({ phone, message }),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    return { success: false, error: data.error || `Erro ${res.status} ao enviar` }
  }
  return { success: true, messageId: data.messageId || data.zaapId || data.id }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, ...payload } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── Ação: testar conexão (a instância precisa já estar conectada via
    // QR Code no painel da Z-API antes disso funcionar) ────────────────────
    if (action === 'test') {
      const { empresa_id } = payload
      const { data: empresa } = await supabase
        .from('empresas')
        .select('zapi_instance_id, zapi_instance_token, zapi_client_token')
        .eq('id', empresa_id)
        .single()

      const { zapi_instance_id: instanceId, zapi_instance_token: instanceToken, zapi_client_token: clientToken } = empresa || {}
      if (!instanceId || !instanceToken) return ok({ error: 'Preencha o Instance ID e o Instance Token antes de testar' })

      const res = await fetch(`${zapiBase(instanceId, instanceToken)}/status`, {
        headers: clientToken ? { 'Client-Token': clientToken } : {},
      })
      const data = await res.json()
      if (!res.ok) return ok({ error: data.error || `Erro ${res.status} ao consultar status` })
      if (!data.connected) return ok({ error: 'Instância criada, mas o WhatsApp ainda não foi conectado — escaneie o QR Code no painel da Z-API primeiro.' })

      return ok({ success: true, conectado: true })
    }

    // ── Ação: enviar mensagem imediata ─────────────────────────────────────
    if (action === 'send') {
      const { contato_id, empresa_id, corpo, usuario_id } = payload

      const { data: contato, error: ce } = await supabase
        .from('whatsapp_contatos')
        .select('phone')
        .eq('id', contato_id)
        .single()
      if (ce || !contato) return ok({ error: 'Contato não encontrado' })

      const { data: empresa } = await supabase
        .from('empresas')
        .select('zapi_instance_id, zapi_instance_token, zapi_client_token')
        .eq('id', empresa_id)
        .single()

      const { zapi_instance_id: instanceId, zapi_instance_token: instanceToken, zapi_client_token: clientToken } = empresa || {}
      if (!instanceId || !instanceToken) return ok({ error: 'WhatsApp (Z-API) não configurado para esta empresa' })

      const result = await enviarMensagemZapi(contato.phone, corpo, instanceId, instanceToken, clientToken || '')
      if (!result.success) return ok({ error: result.error })

      await supabase.from('whatsapp_mensagens').insert({
        empresa_id,
        contato_id,
        wamid: result.messageId,
        direcao: 'enviada',
        tipo: 'text',
        corpo,
        lida: true,
        usuario_id: usuario_id || null,
      })

      await supabase.from('whatsapp_contatos')
        .update({ ultimo_msg_em: new Date().toISOString() })
        .eq('id', contato_id)

      return ok({ success: true, messageId: result.messageId })
    }

    // ── Ação: agendar mensagem ─────────────────────────────────────────────
    if (action === 'schedule') {
      const { contato_id, empresa_id, corpo, enviar_em, criado_por } = payload
      if (!contato_id || !empresa_id || !corpo || !enviar_em) {
        return ok({ error: 'contato_id, empresa_id, corpo e enviar_em são obrigatórios' })
      }
      const { error } = await supabase.from('whatsapp_agendados').insert({
        contato_id, empresa_id, corpo, enviar_em, criado_por: criado_por || null,
      })
      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    // ── Ação: processar fila de agendados (chamado por cron) ───────────────
    if (action === 'process_queue') {
      const now = new Date().toISOString()
      const { data: pendentes } = await supabase
        .from('whatsapp_agendados')
        .select('*, whatsapp_contatos(phone), empresas(zapi_instance_id, zapi_instance_token, zapi_client_token, wa_provider)')
        .eq('enviado', false)
        .lte('enviar_em', now)
        .limit(50)

      if (!pendentes || pendentes.length === 0) return ok({ success: true, enviados: 0 })

      let enviados = 0
      for (const ag of pendentes) {
        // Só processa aqui quem está configurado pra Z-API — o resto fica
        // pra fila da whatsapp-send (oficial) não duplicar envio.
        if (ag.empresas?.wa_provider !== 'zapi') continue

        const phone = ag.whatsapp_contatos?.phone
        const instanceId = ag.empresas?.zapi_instance_id
        const instanceToken = ag.empresas?.zapi_instance_token
        const clientToken = ag.empresas?.zapi_client_token

        if (!phone || !instanceId || !instanceToken) {
          await supabase.from('whatsapp_agendados').update({ enviado: true, erro: 'Configuração incompleta' }).eq('id', ag.id)
          continue
        }

        const result = await enviarMensagemZapi(phone, ag.corpo, instanceId, instanceToken, clientToken || '')
        await supabase.from('whatsapp_agendados').update({ enviado: true, erro: result.error || null }).eq('id', ag.id)

        if (result.success) {
          await supabase.from('whatsapp_mensagens').insert({
            empresa_id: ag.empresa_id,
            contato_id: ag.contato_id,
            wamid: result.messageId,
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

    return ok({ error: 'Ação inválida. Use: test | send | schedule | process_queue' })

  } catch (e) {
    return ok({ error: e.message || 'Erro interno' })
  }
})
