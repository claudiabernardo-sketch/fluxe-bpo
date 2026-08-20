// ══════════════════════════════════════════════════════════════════════════════
// Fluxe BPO — Edge Function: projetar-tarefas
// Preview de quantas tarefas VÃO existir num período futuro, sem gerar nada
// de verdade. Usada pelo "Planejamento Operacional" (Próximos 7/30 dias,
// Até o fechamento), que antes contava tarefas já geradas — e como o gerador
// só cria a tarefa do dia, esses números sempre davam zero.
//
// Chama gerar-tarefas internamente com dry_run:true, sempre escopado pra
// empresa do usuário autenticado (nunca aceita empresa de fora do token) e
// nunca grava nada — é só leitura.
// ══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: usuarioRow } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
    if (!usuarioRow?.empresa_id) {
      return new Response(JSON.stringify({ error: 'Usuário sem empresa vinculada' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body: any = {}
    try { body = await req.json() } catch (_) { /* sem corpo */ }
    const dataInicio = body?.data_inicio
    const dataFim = body?.data_fim
    if (!dataInicio || !dataFim) {
      return new Response(JSON.stringify({ error: 'data_inicio e data_fim são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gerar-tarefas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        dry_run: true,
        empresa_id: usuarioRow.empresa_id,
        data_inicio: dataInicio,
        data_fim: dataFim,
        ...(body?.cliente_id ? { cliente_id: body.cliente_id } : {}),
      }),
    })
    const data = await res.json()
    if (!data.ok) {
      return new Response(JSON.stringify({ error: data.error || 'Falha ao projetar tarefas' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, total: data.tarefas_geradas }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
