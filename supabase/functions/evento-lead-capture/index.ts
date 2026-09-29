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

// Recebe cadastros de páginas de evento públicas, fora do domínio do Fluxe
// (ex: página estática do "Foca no seu BPO 2027" hospedada no domínio da
// Claudia) — grava com service_role porque a página não tem sessão
// autenticada nem chave anon funcional pra escrever direto na tabela.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { evento, nome, contato, cidade } = await req.json()

    const nomeLimpo = (nome || '').trim()
    const contatoLimpo = (contato || '').trim()
    const eventoLimpo = (evento || '').trim()

    if (!nomeLimpo || nomeLimpo.length > 200) return ok({ error: 'Informe seu nome.' })
    if (!contatoLimpo || contatoLimpo.length > 200) return ok({ error: 'Informe um WhatsApp ou e-mail pra contato.' })
    if (!eventoLimpo) return ok({ error: 'Evento não identificado.' })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await supabaseAdmin.from('evento_leads').insert({
      evento: eventoLimpo,
      nome: nomeLimpo,
      contato: contatoLimpo,
      cidade: (cidade || '').trim() || null,
    })
    if (error) return ok({ error: 'Não consegui salvar seu cadastro, tenta de novo em instantes.' })

    return ok({ sucesso: true })
  } catch (e) {
    return ok({ error: e.message || 'Erro interno' })
  }
})
