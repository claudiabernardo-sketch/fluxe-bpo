// ══════════════════════════════════════════════════════════════════════════════
// Fluxe — Edge Function: diagnostico-cliente
// Formulário público de diagnóstico financeiro que o CLIENTE NOVO preenche
// sozinho, sem login (link enviado por WhatsApp/e-mail pela equipe BPO).
//
// Sem essa função, o único jeito de escrever em cliente_onboarding é
// autenticado (RLS por empresa_id) — correto pro resto do onboarding, mas
// aqui o cliente não tem conta no Fluxe. Por isso usa service role, mas com
// escopo bem estreito de propósito: só lê/escreve as colunas do
// diagnóstico financeiro (regime_tributario, faturamento_medio, etc.) e o
// nome de exibição do cliente — nunca objetivos, responsabilidades, canal
// de comunicação ou qualquer outro dado interno da relação BPO↔cliente.
//
// cliente_id como "token": é um uuid v4, não sequencial e não adivinhável —
// mesmo padrão usado por link de proposta/checkout em outros produtos.
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

// Colunas do diagnóstico — única superfície que essa função lê/escreve na
// tabela cliente_onboarding, deliberadamente sem os campos internos.
const CAMPOS_DIAGNOSTICO = [
  'regime_tributario', 'porte', 'faturamento_medio', 'funcionarios_clt', 'socios',
  'tem_dividas', 'dividas_valor', 'conta_vermelho', 'separa_pj_pf',
  'retirada_prolabore', 'reserva_emergencia', 'bancos_utilizados',
  'qtd_contas_bancarias', 'aceita_open_finance', 'diagnostico_preenchido_em',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { action, cliente_id, ...payload } = await req.json()
    if (!cliente_id) return ok({ error: 'cliente_id é obrigatório' })

    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, razao_social, fantasia')
      .eq('id', cliente_id)
      .is('deleted_at', null)
      .maybeSingle()
    if (!cliente) return ok({ error: 'Cliente não encontrado' }, 404)

    // ── Ação: busca o estado atual do diagnóstico (pra pré-carregar o form) ──
    if (action === 'get') {
      const { data: onb } = await supabase
        .from('cliente_onboarding')
        .select(CAMPOS_DIAGNOSTICO.join(','))
        .eq('cliente_id', cliente_id)
        .maybeSingle()
      return ok({
        success: true,
        cliente: { nome: cliente.fantasia || cliente.razao_social },
        diagnostico: onb || {},
      })
    }

    // ── Ação: salva o diagnóstico preenchido pelo cliente ────────────────────
    if (action === 'salvar') {
      const linha: Record<string, unknown> = { cliente_id, diagnostico_preenchido_em: new Date().toISOString() }
      for (const campo of CAMPOS_DIAGNOSTICO) {
        if (campo === 'diagnostico_preenchido_em') continue
        if (payload[campo] !== undefined) linha[campo] = payload[campo]
      }
      const { error } = await supabase
        .from('cliente_onboarding')
        .upsert(linha, { onConflict: 'cliente_id' })
      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    return ok({ error: 'Ação inválida. Use: get | salvar' })
  } catch (e) {
    return ok({ error: e.message || 'Erro interno' })
  }
})
