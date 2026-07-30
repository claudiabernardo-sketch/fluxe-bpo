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

async function asaasCall(path: string, method: string, body?: object) {
  const key = Deno.env.get('ASAAS_API_KEY')
  if (!key) return { error: 'ASAAS_API_KEY não configurada' }
  try {
    const res = await fetch(`${ASAAS_BASE}${path}`, {
      method,
      headers: { 'access_token': key, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const json = await res.json()
    if (!res.ok) return { error: json?.errors?.[0]?.description || `HTTP ${res.status}` }
    return json
  } catch (e) {
    return { error: String(e) }
  }
}

// Busca o valor real da assinatura ativa desse cliente na Asaas — o que
// está sendo cobrado de verdade, que pode divergir do plano cadastrado no
// Fluxe se a assinatura foi criada antes de uma mudança de preço.
async function valorAssinatura(subscriptionId: string) {
  const sub = await asaasGet(`/subscriptions/${subscriptionId}`)
  if (!sub || sub.deleted) return null
  return { valor: sub.value ?? null, ciclo: sub.cycle ?? null, status: sub.status ?? null }
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
        .select('id, nome, email, cnpj, plano, trial_expira_em, criado_em, asaas_customer_id, asaas_subscription_id')
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
      const assinaturas = await Promise.all(
        (empresas ?? []).map(e => e.asaas_subscription_id ? valorAssinatura(e.asaas_subscription_id) : Promise.resolve(null))
      )

      const resultado = (empresas ?? []).map((e, i) => ({
        ...e,
        usuarios_count: usuariosPorEmpresa[e.id] || 0,
        clientes_count: clientesPorEmpresa[e.id] || 0,
        pagamento: pagamentos[i],
        assinatura: assinaturas[i],
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

    // ── Ação: atualizar valor da assinatura na Asaas ───────────────────────
    if (action === 'atualizar_valor_assinatura') {
      const { empresa_id, novo_valor } = payload
      if (!empresa_id || !novo_valor) return ok({ error: 'empresa_id e novo_valor são obrigatórios' })

      const { data: emp } = await supabase.from('empresas').select('asaas_subscription_id').eq('id', empresa_id).single()
      if (!emp?.asaas_subscription_id) return ok({ error: 'Esta empresa não tem assinatura Asaas vinculada' })

      const result = await asaasCall(`/subscriptions/${emp.asaas_subscription_id}`, 'PUT', {
        value: Number(novo_valor),
        updatePendingPayments: false, // só afeta faturas futuras, não a que já está em aberto
      })
      if (result?.error) return ok({ error: result.error })
      return ok({ success: true, novo_valor: result.value })
    }

    // ── Ação: marcar/desmarcar empresa como mentorada do BPO Lucrativo ─────
    if (action === 'toggle_mentorado') {
      const { empresa_id, valor } = payload
      if (!empresa_id) return ok({ error: 'empresa_id é obrigatório' })
      const { error } = await supabase.from('empresas').update({ mentorado_bpo_lucrativo: !!valor }).eq('id', empresa_id)
      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    // ── Ação: criar uma nova empresa mentorada (onboarding manual) ─────────
    // Substitui o cadastro público que existia antes na landing page: cria a
    // empresa, o usuário no Auth, vincula em usuarios e manda o email de
    // boas-vindas com o link de primeiro acesso.
    if (action === 'criar_mentorado') {
      const { nome_empresa, nome_usuario, email } = payload
      if (!nome_empresa || !nome_usuario || !email) {
        return ok({ error: 'nome_empresa, nome_usuario e email são obrigatórios' })
      }

      const { data: empresaRow, error: empresaErr } = await supabase
        .from('empresas')
        .insert({ nome: nome_empresa, email, plano: 'pro', mentorado_bpo_lucrativo: true })
        .select('id')
        .single()
      if (empresaErr) return ok({ error: empresaErr.message })
      const empresaId = empresaRow.id

      let userId: string
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: { nome: nome_usuario, empresa_id: empresaId },
      })
      if (createError) {
        if (createError.message?.includes('already been registered')) {
          userId = '__lookup_via_generateLink__'
        } else {
          return ok({ error: createError.message })
        }
      } else {
        userId = created.user.id
      }

      const siteUrl = Deno.env.get('SITE_URL') || 'https://fluxebpo.com.br'
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${siteUrl}/reset-password` },
      })
      if (linkError) return ok({ error: linkError.message })
      if (userId === '__lookup_via_generateLink__') userId = linkData.user.id
      const magicLink: string = linkData.properties.action_link

      const { error: profileError } = await supabase
        .from('usuarios')
        .upsert({ id: userId, empresa_id: empresaId, nome: nome_usuario, email, perfil: 'admin', ativo: true })
      if (profileError) return ok({ error: profileError.message })

      const resendKey = Deno.env.get('RESEND_API_KEY')
      const resendFrom = Deno.env.get('RESEND_FROM') || 'Fluxe <noreply@fluxebpo.com.br>'
      let emailSent = false
      if (resendKey) {
        const html = buildWelcomeEmail({ nome: nome_usuario, magicLink })
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: resendFrom, to: [email], subject: 'Bem-vindo(a) ao Fluxe', html }),
          })
          emailSent = resendRes.ok
          if (!resendRes.ok) console.error('Resend error:', await resendRes.text())
        } catch (e) {
          console.error('Resend exception:', e)
        }
      }

      return ok({ success: true, empresa_id: empresaId, userId, magicLink, emailSent })
    }

    // ── Ação: painel do mentor — Radar + Plano de Negócio de cada mentorado ─
    if (action === 'list_mentorados') {
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select('id, nome, email, criado_em')
        .eq('mentorado_bpo_lucrativo', true)
        .order('nome')
      if (error) return ok({ error: error.message })

      const ids = (empresas ?? []).map(e => e.id)
      if (ids.length === 0) return ok({ success: true, mentorados: [] })

      const { data: planos } = await supabase
        .from('plano_negocio')
        .select('*')
        .in('empresa_id', ids)

      const { data: radares } = await supabase
        .from('radar_scores_ultimo')
        .select('empresa_id, score, semaforo')
        .in('empresa_id', ids)

      const { data: propostasRows } = await supabase
        .from('propostas')
        .select('empresa_id, status')
        .in('empresa_id', ids)
        .eq('status', 'aprovada')

      const { data: sessoesRows } = await supabase
        .from('mentoria_sessoes')
        .select('empresa_id, data')
        .in('empresa_id', ids)
        .order('data', { ascending: false })

      const planoPorEmpresa: Record<string, any> = {}
      for (const p of planos ?? []) planoPorEmpresa[p.empresa_id] = p

      const propostaAprovadaPorEmpresa: Record<string, boolean> = {}
      for (const p of propostasRows ?? []) propostaAprovadaPorEmpresa[p.empresa_id] = true

      // sessoesRows já vem ordenado por data desc — a primeira ocorrência de
      // cada empresa_id é a sessão mais recente dela.
      const sessaoPorEmpresa: Record<string, { count: number; ultima: string }> = {}
      for (const s of sessoesRows ?? []) {
        const cur = sessaoPorEmpresa[s.empresa_id] || { count: 0, ultima: s.data }
        cur.count += 1
        sessaoPorEmpresa[s.empresa_id] = cur
      }

      const ORDEM_SEMAFORO: Record<string, number> = { vermelho: 3, amarelo: 2, verde: 1, sem_dado: 0 }
      const radarPorEmpresa: Record<string, { scores: number[]; pior: string; totalClientes: number }> = {}
      for (const r of radares ?? []) {
        const cur = radarPorEmpresa[r.empresa_id] || { scores: [], pior: 'sem_dado', totalClientes: 0 }
        cur.totalClientes += 1
        if (r.score != null) cur.scores.push(r.score)
        if ((ORDEM_SEMAFORO[r.semaforo] ?? 0) > (ORDEM_SEMAFORO[cur.pior] ?? 0)) cur.pior = r.semaforo
        radarPorEmpresa[r.empresa_id] = cur
      }

      const resultado = (empresas ?? []).map(e => {
        const rad = radarPorEmpresa[e.id]
        const sess = sessaoPorEmpresa[e.id]
        return {
          ...e,
          plano_negocio: planoPorEmpresa[e.id] || null,
          proposta_aprovada: !!propostaAprovadaPorEmpresa[e.id],
          sessoes: sess ? { count: sess.count, ultima_data: sess.ultima } : { count: 0, ultima_data: null },
          radar: rad
            ? { pior_semaforo: rad.pior, score_medio: rad.scores.length ? Math.round(rad.scores.reduce((a, b) => a + b, 0) / rad.scores.length) : null, total_clientes: rad.totalClientes }
            : null,
        }
      })

      return ok({ success: true, mentorados: resultado })
    }

    // ── Ação: listar sessões de mentoria de um mentorado ───────────────────
    if (action === 'listar_sessoes_mentoria') {
      const { empresa_id } = payload
      if (!empresa_id) return ok({ error: 'empresa_id é obrigatório' })
      const { data, error } = await supabase
        .from('mentoria_sessoes')
        .select('*, mentoria_combinados(*)')
        .eq('empresa_id', empresa_id)
        .order('data', { ascending: false })
      if (error) return ok({ error: error.message })
      return ok({ success: true, sessoes: data ?? [] })
    }

    // ── Ação: registrar sessão de mentoria (mentorado ou avulsa) ────────────
    // "itens" é uma lista opcional de combinados rastreáveis [{texto, prazo}]
    // — além do texto livre em "combinados", que continua existindo pra
    // contexto geral da conversa.
    if (action === 'criar_sessao_mentoria') {
      const { empresa_id, nome_avulso, data: dataSessao, nota, combinados, itens } = payload
      if (!empresa_id && !nome_avulso?.trim()) return ok({ error: 'Informe empresa_id ou nome_avulso' })
      if (!nota?.trim()) return ok({ error: 'nota é obrigatória' })
      const { data, error } = await supabase
        .from('mentoria_sessoes')
        .insert({
          empresa_id: empresa_id || null,
          nome_avulso: empresa_id ? null : nome_avulso.trim(),
          data: dataSessao || new Date().toLocaleDateString('en-CA'),
          nota: nota.trim(),
          combinados: combinados?.trim() || null,
          criado_por: user.id,
        })
        .select()
        .single()
      if (error) return ok({ error: error.message })

      if (Array.isArray(itens) && itens.length > 0) {
        const linhas = itens.filter((it: any) => it?.texto?.trim()).map((it: any) => ({
          sessao_id: data.id,
          empresa_id: empresa_id || null,
          texto: it.texto.trim(),
          prazo: it.prazo || null,
        }))
        if (linhas.length > 0) {
          const { error: errItens } = await supabase.from('mentoria_combinados').insert(linhas)
          if (errItens) return ok({ error: errItens.message })
        }
      }

      return ok({ success: true, sessao: data })
    }

    // ── Ação: excluir sessão de mentoria ────────────────────────────────────
    if (action === 'excluir_sessao_mentoria') {
      const { id } = payload
      if (!id) return ok({ error: 'id é obrigatório' })
      const { error } = await supabase.from('mentoria_sessoes').delete().eq('id', id)
      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    // ── Ação: listar sessões avulsas (sem empresa cadastrada) ───────────────
    if (action === 'listar_sessoes_avulsas') {
      const { data, error } = await supabase
        .from('mentoria_sessoes')
        .select('*, mentoria_combinados(*)')
        .is('empresa_id', null)
        .order('data', { ascending: false })
      if (error) return ok({ error: error.message })
      return ok({ success: true, sessoes: data ?? [] })
    }

    // ── Ação: listar combinados em aberto de todo mundo (mentorados + avulsos) ─
    if (action === 'listar_combinados_abertos') {
      const { data, error } = await supabase
        .from('mentoria_combinados')
        .select('*, mentoria_sessoes(empresa_id, nome_avulso, empresas(nome))')
        .eq('concluido', false)
        .order('prazo', { ascending: true, nullsFirst: false })
      if (error) return ok({ error: error.message })
      return ok({ success: true, combinados: data ?? [] })
    }

    // ── Ação: marcar combinado como concluído ───────────────────────────────
    if (action === 'concluir_combinado') {
      const { id } = payload
      if (!id) return ok({ error: 'id é obrigatório' })
      const { error } = await supabase
        .from('mentoria_combinados')
        .update({ concluido: true, concluido_em: new Date().toISOString() })
        .eq('id', id)
      if (error) return ok({ error: error.message })
      return ok({ success: true })
    }

    // ── Ação: excluir SÓ os dados de mentoria de uma empresa ────────────────
    // Apaga Plano de Negócio, sessões (cascata: combinados) e materiais
    // (+ arquivos no storage) — não toca em clientes/tarefas/usuarios, que
    // continuam intactos caso a empresa também seja cliente pagante do Fluxe.
    // Exige digitar o nome exato da empresa como confirmação, dado que é
    // irreversível.
    if (action === 'excluir_dados_mentoria') {
      const { empresa_id, confirmacao_nome } = payload
      if (!empresa_id) return ok({ error: 'empresa_id é obrigatório' })

      const { data: emp, error: empErr } = await supabase.from('empresas').select('id, nome').eq('id', empresa_id).single()
      if (empErr || !emp) return ok({ error: 'Empresa não encontrada' })
      if (!confirmacao_nome || confirmacao_nome.trim() !== emp.nome) {
        return ok({ error: 'Nome de confirmação não bate com o nome da empresa' })
      }

      // Apaga os arquivos de materiais no storage antes de apagar as linhas
      const { data: arquivos } = await supabase.storage.from('tarefas').list(`${empresa_id}/mentoria-materiais`, { limit: 1000 })
      if (arquivos && arquivos.length > 0) {
        const paths = arquivos.map((f: any) => `${empresa_id}/mentoria-materiais/${f.name}`)
        await supabase.storage.from('tarefas').remove(paths)
      }

      const { error: errLinks } = await supabase.from('mentoria_links').delete().eq('empresa_id', empresa_id)
      if (errLinks) return ok({ error: errLinks.message })

      const { error: errPlano } = await supabase.from('plano_negocio').delete().eq('empresa_id', empresa_id)
      if (errPlano) return ok({ error: errPlano.message })

      const { error: errSessoes } = await supabase.from('mentoria_sessoes').delete().eq('empresa_id', empresa_id)
      if (errSessoes) return ok({ error: errSessoes.message })

      const { error: errFlag } = await supabase.from('empresas').update({ mentorado_bpo_lucrativo: false }).eq('id', empresa_id)
      if (errFlag) return ok({ error: errFlag.message })

      return ok({ success: true })
    }

    return ok({ error: 'Ação inválida. Use: list_empresas | bloquear | desbloquear | estender_trial | atualizar_valor_assinatura | toggle_mentorado | criar_mentorado | list_mentorados | listar_sessoes_mentoria | criar_sessao_mentoria | excluir_sessao_mentoria | listar_sessoes_avulsas | listar_combinados_abertos | concluir_combinado | excluir_dados_mentoria' })

  } catch (e) {
    return ok({ error: e.message || 'Erro interno' })
  }
})

// ── Template do email de boas-vindas ao Fluxe (novo mentorado) ─────────────
// Table-based, sem gradiente, pra compatibilidade máxima com clientes de email.
function buildWelcomeEmail({ nome, magicLink }: { nome: string; magicLink: string }) {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bem-vindo(a) ao Fluxe</title>
</head>
<body style="margin:0;padding:0;background-color:#05070E;font-family:Arial,Helvetica,sans-serif">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#05070E;padding:32px 16px">
<tr><td align="center">

  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#0D1424;border-radius:14px;overflow:hidden;max-width:560px;border:1px solid #1E293B">

    <tr>
      <td style="background-color:#6366F1;padding:32px 40px;text-align:center">
        <p style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px">Fluxe</p>
        <p style="margin:6px 0 0;font-size:11px;color:#E0E7FF;letter-spacing:1px;text-transform:uppercase">Mentoria Fluxe</p>
      </td>
    </tr>

    <tr>
      <td style="padding:36px 40px 28px">

        <h1 style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#F8FAFC">Bem-vindo(a) ao Fluxe, ${nome}! 🎉</h1>

        <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.65">
          A partir de agora, o Fluxe é o seu caderno de exercícios dentro da mentoria: é aqui que você desenha a operação,
          precifica certo e monta o plano de negócio do seu BPO Financeiro, aplicando o Método Fluxe na prática.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.65">
          Clique no botão abaixo pra criar sua senha e entrar no Laboratório Fluxe.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto">
          <tr>
            <td style="background-color:#6366F1;border-radius:8px;text-align:center">
              <a href="${magicLink}"
                 style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:bold;
                        color:#ffffff;text-decoration:none;border-radius:8px;
                        mso-padding-alt:14px 40px;font-family:Arial,Helvetica,sans-serif">
                &#x2192;&nbsp;Criar minha senha e entrar
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px;font-size:12px;color:#64748B;line-height:1.6">
          Se o botão não funcionar, copie e cole este link no navegador:<br>
          <a href="${magicLink}" style="color:#A5B4FC;word-break:break-all">${magicLink}</a>
        </p>

        <p style="margin:0;font-size:12px;color:#64748B;line-height:1.6">
          Este link é válido por <strong>24 horas</strong>.
        </p>

      </td>
    </tr>

    <tr>
      <td style="padding:18px 40px;border-top:1px solid #1E293B;text-align:center;background-color:#0B1220">
        <p style="margin:0;font-size:11px;color:#475569">
          &copy; ${year} Fluxe &middot; fluxebpo.com.br<br>
          Enviado automaticamente &mdash; não responda este email.
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>`
}
