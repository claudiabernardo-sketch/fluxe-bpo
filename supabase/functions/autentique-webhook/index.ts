import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    // Autentique envia: { event: 'sign', document: { id, name, signatures: [...] } }
    const { event, document } = body

    if (!document?.id) return new Response('ok', { status: 200 })

    const todasAssinadas = document.signatures?.every((s: any) => s.signed_at !== null)

    if (event === 'sign' && todasAssinadas) {
      // Atualizar proposta como assinada
      const { data: proposta } = await supabase
        .from('propostas')
        .select('id, lead_id')
        .eq('autentique_id', document.id)
        .single()

      if (proposta) {
        await supabase.from('propostas').update({
          assinatura_status: 'assinado',
          contrato_assinado_url: document.file_url || null,
        }).eq('id', proposta.id)

        // Se tiver lead vinculado, atualizar contrato_url no cliente
        if (proposta.lead_id) {
          const { data: lead } = await supabase
            .from('leads')
            .select('cliente_id')
            .eq('id', proposta.lead_id)
            .single()

          if (lead?.cliente_id && document.file_url) {
            await supabase.from('clientes').update({
              contrato_url: document.file_url,
            }).eq('id', lead.cliente_id)
          }
        }
      }
    } else if (event === 'sign') {
      // Assinatura parcial
      await supabase.from('propostas').update({
        assinatura_status: 'parcialmente_assinado',
      }).eq('autentique_id', document.id)
    } else if (event === 'reject') {
      await supabase.from('propostas').update({
        assinatura_status: 'recusado',
      }).eq('autentique_id', document.id)
    }

    return new Response('ok', { status: 200 })
  } catch (e: any) {
    console.error('autentique-webhook error:', e.message)
    return new Response('error', { status: 500 })
  }
})
