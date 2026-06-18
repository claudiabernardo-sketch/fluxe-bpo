import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function ok(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function text(body: string, status = 200) {
  return new Response(body, { status, headers: corsHeaders })
}

// ─── Baixa mídia da Meta e faz upload para o Supabase Storage ──────────────

async function downloadAndStoreMedia(
  mediaId: string,
  mimeType: string,
  empresaId: string,
  token: string
): Promise<string | null> {
  try {
    // 1. Busca URL da mídia na Meta
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!metaRes.ok) return null
    const { url } = await metaRes.json()

    // 2. Baixa o arquivo
    const fileRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!fileRes.ok) return null
    const blob = await fileRes.blob()
    const arrayBuffer = await blob.arrayBuffer()

    // 3. Salva no Supabase Storage
    const ext = mimeType.split('/')[1]?.split(';')[0] || 'bin'
    const path = `whatsapp/${empresaId}/${Date.now()}.${ext}`

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await supabase.storage
      .from('anexos')
      .upload(path, new Uint8Array(arrayBuffer), { contentType: mimeType, upsert: false })

    if (error) return null

    const { data: { publicUrl } } = supabase.storage.from('anexos').getPublicUrl(path)
    return publicUrl
  } catch {
    return null
  }
}

// ─── Leitura de documento com IA (Claude) ─────────────────────────────────

async function analisarDocumento(
  mediaUrl: string,
  mimeType: string
): Promise<{ resumo: string; tipo_doc: string; valor: number | null; vencimento: string | null }> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) return { resumo: '', tipo_doc: 'outro', valor: null, vencimento: null }

  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  if (!isImage && !isPdf) {
    return { resumo: 'Arquivo recebido (não é imagem ou PDF)', tipo_doc: 'outro', valor: null, vencimento: null }
  }

  try {
    // Baixa o arquivo para enviar ao Claude como base64
    const fileRes = await fetch(mediaUrl)
    const buffer = await fileRes.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const mediaTypeForClaude = isImage ? mimeType : 'application/pdf'

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': anthropicKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaTypeForClaude, data: base64 },
            },
            {
              type: 'text',
              text: `Analise este documento financeiro recebido via WhatsApp e responda APENAS em JSON válido, sem markdown:
{
  "tipo_doc": "boleto | nf | contrato | recibo | extrato | outro",
  "resumo": "descrição curta do documento em 1 frase",
  "valor": 1234.56 (número ou null se não houver),
  "vencimento": "AAAA-MM-DD" (ou null se não houver)
}`,
            },
          ],
        }],
      }),
    })

    if (!res.ok) return { resumo: 'Documento recebido', tipo_doc: 'outro', valor: null, vencimento: null }

    const { content } = await res.json()
    const rawText = content[0]?.text || '{}'
    // Remove possível markdown ```json ... ```
    const clean = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      resumo: parsed.resumo || 'Documento recebido',
      tipo_doc: parsed.tipo_doc || 'outro',
      valor: parsed.valor ?? null,
      vencimento: parsed.vencimento ?? null,
    }
  } catch {
    return { resumo: 'Documento recebido', tipo_doc: 'outro', valor: null, vencimento: null }
  }
}

// ─── Handler principal ─────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // ── Verificação de webhook (GET) ─────────────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    const verifyToken = Deno.env.get('WA_VERIFY_TOKEN') || 'fluxe_bpo_verify'

    if (mode === 'subscribe' && token === verifyToken) {
      return text(challenge || '', 200)
    }
    return text('Forbidden', 403)
  }

  // ── Mensagens recebidas (POST) ───────────────────────────────────────────
  if (req.method !== 'POST') return text('Method Not Allowed', 405)

  try {
    const body = await req.json()

    // A Meta envia em body.entry[0].changes[0].value
    const entry   = body?.entry?.[0]
    const change  = entry?.changes?.[0]
    const value   = change?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      return ok({ received: true }) // Notificação de status, ignorar
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Busca empresa pelo Phone Number ID do webhook
    const phoneNumberId = value?.metadata?.phone_number_id
    const waToken = Deno.env.get('WA_ACCESS_TOKEN') || ''

    // Descobre empresa_id pela configuração (buscamos pelo phone_number_id salvo)
    const { data: configRow } = await supabase
      .from('empresas')
      .select('id')
      .eq('wa_phone_number_id', phoneNumberId)
      .single()

    const empresaId = configRow?.id
    if (!empresaId) {
      console.error('Empresa não encontrada para phone_number_id:', phoneNumberId)
      return ok({ received: true }) // Retorna 200 para a Meta não reenviar
    }

    for (const msg of messages) {
      const wamid   = msg.id
      const phone   = msg.from
      const ts      = msg.timestamp
      const tipo    = msg.type  // text | image | document | audio | video

      // 1. Upsert contato
      const { data: contato } = await supabase
        .from('whatsapp_contatos')
        .upsert({
          empresa_id: empresaId,
          phone,
          nome: value?.contacts?.[0]?.profile?.name || phone,
          ultimo_msg_em: new Date(Number(ts) * 1000).toISOString(),
        }, { onConflict: 'empresa_id,phone' })
        .select('id')
        .single()

      if (!contato) continue

      // 2. Extrai conteúdo da mensagem
      let corpo: string | null = null
      let midiaId: string | null = null
      let midiaMime: string | null = null
      let midiaNome: string | null = null

      if (tipo === 'text') {
        corpo = msg.text?.body || null
      } else if (tipo === 'image') {
        midiaId = msg.image?.id || null
        midiaMime = msg.image?.mime_type || 'image/jpeg'
        corpo = msg.image?.caption || null
      } else if (tipo === 'document') {
        midiaId = msg.document?.id || null
        midiaMime = msg.document?.mime_type || 'application/pdf'
        midiaNome = msg.document?.filename || null
        corpo = msg.document?.caption || null
      } else if (tipo === 'audio') {
        midiaId = msg.audio?.id || null
        midiaMime = msg.audio?.mime_type || 'audio/ogg'
      } else if (tipo === 'video') {
        midiaId = msg.video?.id || null
        midiaMime = msg.video?.mime_type || 'video/mp4'
        corpo = msg.video?.caption || null
      }

      // 3. Baixa mídia se houver
      let midiaUrl: string | null = null
      if (midiaId && midiaMime) {
        midiaUrl = await downloadAndStoreMedia(midiaId, midiaMime, empresaId, waToken)
      }

      // 4. Análise de IA para documentos/imagens
      let aiResumo: string | null = null
      let aiTipoDoc: string | null = null
      let aiValor: number | null = null
      let aiVencimento: string | null = null

      if (midiaUrl && (tipo === 'document' || tipo === 'image')) {
        const ai = await analisarDocumento(midiaUrl, midiaMime!)
        aiResumo = ai.resumo
        aiTipoDoc = ai.tipo_doc
        aiValor = ai.valor
        aiVencimento = ai.vencimento
      }

      // 5. Insere mensagem (ignora duplicatas pelo wamid)
      await supabase.from('whatsapp_mensagens').upsert({
        empresa_id:   empresaId,
        contato_id:   contato.id,
        wamid,
        direcao:      'recebida',
        tipo,
        corpo,
        midia_url:    midiaUrl,
        midia_mime:   midiaMime,
        midia_nome:   midiaNome,
        midia_id:     midiaId,
        ai_resumo:    aiResumo,
        ai_tipo_doc:  aiTipoDoc,
        ai_valor:     aiValor,
        ai_vencimento: aiVencimento,
        enviado_em:   new Date(Number(ts) * 1000).toISOString(),
      }, { onConflict: 'wamid' })
    }

    return ok({ received: true })
  } catch (e) {
    console.error('Webhook error:', e)
    return ok({ received: true }) // Sempre 200 para a Meta
  }
})
