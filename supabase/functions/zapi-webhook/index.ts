// ══════════════════════════════════════════════════════════════════════════════
// Fluxe BPO — Edge Function: zapi-webhook
// Recebe mensagens do caminho NÃO-OFICIAL (Z-API). Normaliza pro mesmo
// formato das tabelas whatsapp_contatos/whatsapp_mensagens que a
// whatsapp-webhook (oficial) já usa — a tela de Mensagens não precisa saber
// qual dos dois caminhos entregou a mensagem.
//
// Configuração do lado da Z-API: no painel de cada instância, em
// "Webhooks", cole a URL desta function em "Ao receber". A Z-API não usa
// verificação de challenge como a Meta — é só colar e salvar.
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  try {
    const body = await req.json()

    // Mensagem enviada pela própria instância (eco) ou notificação de
    // status — não é mensagem de cliente, ignora.
    if (body.fromMe || body.isGroup) return ok({ received: true })

    const instanceId = body.instanceId
    const phone = body.phone
    if (!instanceId || !phone) return ok({ received: true })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Descobre a empresa pela instância que mandou o webhook
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('zapi_instance_id', instanceId)
      .single()

    const empresaId = empresa?.id
    if (!empresaId) {
      console.error('Empresa não encontrada para zapi_instance_id:', instanceId)
      return ok({ received: true })
    }

    // Extrai conteúdo conforme o tipo (mesma lógica de tipos da whatsapp-webhook)
    let tipo = 'text'
    let corpo: string | null = null
    let midiaUrl: string | null = null
    let midiaMime: string | null = null
    let midiaNome: string | null = null

    if (body.text) {
      tipo = 'text'
      corpo = body.text.message || null
    } else if (body.image) {
      tipo = 'image'
      midiaUrl = body.image.imageUrl || null
      midiaMime = body.image.mimeType || 'image/jpeg'
      corpo = body.image.caption || null
    } else if (body.document) {
      tipo = 'document'
      midiaUrl = body.document.documentUrl || null
      midiaMime = body.document.mimeType || 'application/pdf'
      midiaNome = body.document.fileName || null
    } else if (body.audio) {
      tipo = 'audio'
      midiaUrl = body.audio.audioUrl || null
      midiaMime = body.audio.mimeType || 'audio/ogg'
    } else if (body.video) {
      tipo = 'video'
      midiaUrl = body.video.videoUrl || null
      midiaMime = body.video.mimeType || 'video/mp4'
      corpo = body.video.caption || null
    } else {
      return ok({ received: true }) // tipo não suportado ainda (figurinha, localização, etc.)
    }

    // 1. Upsert contato
    const { data: contato } = await supabase
      .from('whatsapp_contatos')
      .upsert({
        empresa_id: empresaId,
        phone,
        nome: body.senderName || body.chatName || phone,
        ultimo_msg_em: body.momment ? new Date(Number(body.momment)).toISOString() : new Date().toISOString(),
      }, { onConflict: 'empresa_id,phone' })
      .select('id')
      .single()

    if (!contato) return ok({ received: true })

    // 2. Insere mensagem (ignora duplicata pelo messageId, mesmo papel do wamid)
    await supabase.from('whatsapp_mensagens').upsert({
      empresa_id: empresaId,
      contato_id: contato.id,
      wamid: body.messageId || body.id || null,
      direcao: 'recebida',
      tipo,
      corpo,
      midia_url: midiaUrl,
      midia_mime: midiaMime,
      midia_nome: midiaNome,
      enviado_em: body.momment ? new Date(Number(body.momment)).toISOString() : new Date().toISOString(),
    }, { onConflict: 'wamid' })

    return ok({ received: true })
  } catch (e) {
    console.error('zapi-webhook error:', e)
    return ok({ received: true })
  }
})
