// ══════════════════════════════════════════════════════════════════════════════
// Fluxe BPO — Edge Function: admin-painel
// Painel interno da Empreenda BPO pra controlar quem usa o Fluxe: lista
// todas as empresas (atravessando o isolamento normal por empresa_id, que
// toda outra tela do sistema respeita), bloqueia/desbloqueia acesso e
// estende trial.
//
// Só funciona pra quem tem usuarios.fluxe_staff = true — validado aqui,
// não só na tela. Sem essa checagem, isso seria uma falha grave de
// isolamento multi-tenant.
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

const ASAAS_BASE = Deno.env.get('ASAAS_SANDBOX') === 'true'
  ? 'https://sandbox.asaas.com/api/v3'
  : 'https://api.asaas.com/v3'

async function asaasGet(path: string) {
  const key = Deno.env.get('ASAAS_API_KEY')
  if (!key) return null
  try {
    const res = await fetch(`${ASAAS_BASE}${path}`, { headers: { 'access_token': key } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Consulta faturas vencidas do cliente na Asaas — some faturas em aberto =
// inadimplente de verdade, com valor e há quantos dias. Sem faturas vencidas
// (mesmo com fatura pendente futura) = em dia.
async function statusPagamento(customerId: string) {
  const overdue = await asaasGet(`/payments?customer=${customerId}&status=OVERDUE&limit=100`)
  const vencidas = overdue?.data ?? []
  if (vencidas.length > 0) {
    const maisAntiga = vencidas.reduce((min: any, p: any) => (p.dueDate < min.dueDate ? p : min), vencidas[0])
    const diasAtraso = Math.floor((Date.now() - new Date(maisAntiga.dueDate).getTime()) / 86400000)
    const valorDevido = vencidas.reduce((s: number, p: any) => s + (p.value || 0), 0)
    return { em_dia: false, dias_atraso: diasAtraso, valor_devido: valorDevido, faturas_vencidas: vencidas.length }
  }
  return { em_dia: true, dias_atraso: 0, valor_devido: 0, faturas_vencidas: 0 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // ── Autenticação + checagem de staff ──────────────────────────────────
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !user) return ok({ error: 'Não autenticado' }, 401)

    const { data: usuarioRow } = await supabase
      .from('usuarios')
      .select('fluxe_staff')
      .eq('id', user.id)
      .single()

    if (!usuarioRow?.fluxe_staff) return ok({ error: 'Acesso restrito' }, 403)

    const { action, ...payload } = await req.json()

    // ── Ação: listar todas as empresas com contagens ──────────────────────
    if (action === 'list_empresas') {
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select('id, nome, email, cnpj, plano, trial_expira_em, criado_em, asaas_customer_id')
        .order('criado_em', { ascending: false })
      if (error) return ok({ error: error.message })

      const { data: usuariosRows } = await supabase.from('usuarios').select('empresa_id').eq('ativo', true)
      const { data: clientesRows } = await supabase.from('clientes').select('empresa_id').is('deleted_at', null)

      const usuariosPorEmpresa: Record<string, number> = {}
      for (const u of usuariosRows ?? []) usuariosPorEmpresa[u.empresa_id] = (usuariosPorEmpresa[u.empresa_id] || 0) + 1
      const clientesPorEmpresa: Record<string, number> = {}
      for (const c of clientesRows ?? []) clientesPorEmpresa[c.empresa_id] = (clientesPorEmpresa[c.empresa_id] || 0) + 1

      // Consulta a Asaas em paralelo só pra quem já tem cliente criado lá —
      // é o que da a resposta real de "em dia x deve", além do que o plano
      // (que só é atualizado quando o webhook do Asaas dispara) já mostra.
      const pagamentos = await Promise.all(
        (empresas ?? []).map(e => e.asaas_customer_id ? statusPagamento(e.asaas_customer_id) : Promise.resolve(null))
      )

      const resultado = (empresas ?? []).map((e, i) => ({
        ...e,
        usuarios_count: usuariosPorEmpresa[e.id] || 0,
        clientes_count: clientesPorEmpresa[e.id] || 0,
        pagamento: pagamentos[i],
      }))

      return ok({ success: true, empresas: resultado })
    }

    // ── Ação: bloquear empresa ─────────────────────────────────────────────
    if (action === 'bloquear') {
      const { empresa_id } = payload
      if (!empresa_id) return ok({ error: 'empresa_id é obrigatório' })
      const { error } = await supabase.from('empresas').update({ plano: 'bloqueado' }).eq('id', empresa_id)
      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    // ── Ação: desbloquear empresa (volta pro plano informado) ──────────────
    if (action === 'desbloquear') {
      const { empresa_id, plano } = payload
      if (!empresa_id) return ok({ error: 'empresa_id é obrigatório' })
      const { error } = await supabase.from('empresas').update({ plano: plano || 'trial' }).eq('id', empresa_id)
      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    // ── Ação: estender trial em N dias ─────────────────────────────────────
    if (action === 'estender_trial') {
      const { empresa_id, dias } = payload
      if (!empresa_id || !dias) return ok({ error: 'empresa_id e dias são obrigatórios' })

      const { data: emp } = await supabase.from('empresas').select('trial_expira_em, plano').eq('id', empresa_id).single()
      const base = emp?.trial_expira_em && new Date(emp.trial_expira_em) > new Date()
        ? new Date(emp.trial_expira_em)
        : new Date()
      base.setDate(base.getDate() + Number(dias))

      const updates: Record<string, unknown> = { trial_expira_em: base.toISOString() }
      if (emp?.plano === 'trial_expirado' || emp?.plano === 'bloqueado') updates.plano = 'trial'

      const { error } = await supabase.from('empresas').update(updates).eq('id', empresa_id)
      if (error) return ok({ error: error.message })
      return ok({ success: true, novo_trial_expira_em: base.toISOString() })
    }

    return ok({ error: 'Ação inválida. Use: list_empresas | bloquear | desbloquear | estender_trial' })

  } catch (e) {
    return ok({ error: e.message || 'Erro interno' })
  }
})
