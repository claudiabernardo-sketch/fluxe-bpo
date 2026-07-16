// ══════════════════════════════════════════════════════════════════════════════
// Fluxe BPO — Edge Function: radar-calcular
// Calcula o Radar do Cliente (score + 13 áreas) pra todos os clientes ativos
// de todas as empresas, grava snapshot em radar_scores e detecta piora de
// semáforo pra gerar radar_alertas. Espelha a lógica de src/utils/radar.js —
// qualquer mudança de regra de negócio precisa ser replicada nos dois lugares.
// Chamada pelo pg_cron todo dia às 09:00 UTC (06:00 BRT).
// Aceita chamada manual via POST (botão "Recalcular agora" em Config).
// ══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trigger',
}

const CUSTO_HORA_PADRAO = 65
const HORAS_MES_PADRAO = 160
const CATEGORIAS_RECEB = ['Contas a Receber', 'Cobrança / Inadimplência']
const CATEGORIAS_PAGTOS = ['Contas a Pagar', 'Pagamentos']
const CATEGORIAS_FLUXO_CAIXA = ['Fluxo de Caixa']
const AREAS_SEM_DADO = ['caixa', 'impostos', 'tecnol', 'dono']
const SCORE_POR_STATUS: Record<string, number> = { saudavel: 100, atencao: 50, critico: 0 }
const RANK_SEMAFORO: Record<string, number> = { verde: 0, amarelo: 1, vermelho: 2 }

type Area = { status: string; valor: unknown }
type Cliente = {
  id: string
  status: string
  valor_mrr: number | null
  responsavel_id: string | null
  inicio_contrato: string | null
}
type Tarefa = { cliente_id: string | null; categoria: string | null; status: string; prazo: string | null; data_execucao: string | null; deleted_at: string | null }
type Apontamento = { cliente_id: string | null; usuario_id: string | null; segundos: number | null }
type Usuario = { id: string; custo_hora: number | null; horas_mes: number | null }

function computeMargem(cliente: Cliente, apontamentos: Apontamento[], custoHoraMedio: number) {
  const horas = apontamentos.filter(a => a.cliente_id === cliente.id).reduce((s, a) => s + (a.segundos || 0), 0) / 3600
  const custo = horas * custoHoraMedio
  const receita = cliente.valor_mrr || 0
  const margem = receita - custo
  const margemPct = receita > 0 ? (margem / receita) * 100 : (margem < 0 ? -100 : 0)
  return { horas, custo, receita, margem, margemPct }
}

function isAtrasada(t: Tarefa, hoje: string) {
  if (t.status === 'concluida') return false
  const dataRef = t.data_execucao || t.prazo
  return !!dataRef && dataRef < hoje
}

function statusPorContagem(n: number) {
  if (n === 0) return 'saudavel'
  if (n <= 2) return 'atencao'
  return 'critico'
}

function computeAreas(
  cliente: Cliente,
  tarefasDoCliente: Tarefa[],
  margemInfo: ReturnType<typeof computeMargem>,
  usuarios: Usuario[],
  apontamentosEquipe: Apontamento[],
) {
  const hoje = new Date().toISOString().slice(0, 10)
  const abertas = tarefasDoCliente.filter(t => !t.deleted_at)
  const atrasadas = abertas.filter(t => isAtrasada(t, hoje))
  const contar = (cats: string[]) => atrasadas.filter(t => t.categoria && cats.includes(t.categoria)).length

  const nReceb = contar(CATEGORIAS_RECEB)
  const nPagtos = contar(CATEGORIAS_PAGTOS)
  const nFluxo = contar(CATEGORIAS_FLUXO_CAIXA)
  const nProcessos = atrasadas.length

  const { margemPct, margem, receita, custo } = margemInfo
  const custoPct = receita > 0 ? (custo / receita) * 100 : 0
  const statusMargem = margemPct > 40 ? 'saudavel' : margemPct > 0 ? 'atencao' : 'critico'
  const statusProcessos = statusPorContagem(nProcessos)

  const areas: Record<string, Area> = {
    margem: { status: statusMargem, valor: `${margemPct.toFixed(0)}%` },
    lucro: { status: margem > 0 ? 'saudavel' : margem > -(receita * 0.1) ? 'atencao' : 'critico', valor: margem },
    custos: { status: custoPct < 60 ? 'saudavel' : custoPct <= 100 ? 'atencao' : 'critico', valor: `${custoPct.toFixed(0)}%` },
    receb: { status: statusPorContagem(nReceb), valor: nReceb },
    pagtos: { status: statusPorContagem(nPagtos), valor: nPagtos },
    fluxo_caixa: { status: statusPorContagem(nFluxo), valor: nFluxo },
    processos: { status: statusProcessos, valor: nProcessos },
  }

  if (!cliente.responsavel_id) {
    areas.equipe = { status: 'critico', valor: 'sem responsável' }
  } else {
    const resp = usuarios.find(u => u.id === cliente.responsavel_id)
    const horasRespMes = resp?.horas_mes || HORAS_MES_PADRAO
    const horasRespUsadas = apontamentosEquipe
      .filter(a => a.usuario_id === cliente.responsavel_id)
      .reduce((s, a) => s + (a.segundos || 0), 0) / 3600
    const ocupacaoResp = horasRespMes > 0 ? (horasRespUsadas / horasRespMes) * 100 : 0
    areas.equipe = {
      status: ocupacaoResp >= 100 ? 'critico' : ocupacaoResp >= 85 ? 'atencao' : 'saudavel',
      valor: `${Math.round(ocupacaoResp)}% ocupação do resp.`,
    }
  }

  const seisMesesMs = 1000 * 60 * 60 * 24 * 30 * 6
  const tempoContratoMs = cliente.inicio_contrato ? Date.now() - new Date(cliente.inicio_contrato).getTime() : null
  let statusComercial: string
  if (statusMargem === 'critico' && statusProcessos === 'critico') statusComercial = 'critico'
  else if (tempoContratoMs !== null && tempoContratoMs < seisMesesMs) statusComercial = 'atencao'
  else statusComercial = 'saudavel'
  areas.comercial = { status: statusComercial, valor: null }

  AREAS_SEM_DADO.forEach(id => { areas[id] = { status: 'sem_dado', valor: null } })

  return areas
}

function computeScore(areas: Record<string, Area>) {
  const calculaveis = Object.entries(areas).filter(([, a]) => a.status !== 'sem_dado')
  const n = calculaveis.length
  const score = n > 0 ? Math.round(calculaveis.reduce((s, [, a]) => s + SCORE_POR_STATUS[a.status], 0) / n) : null
  const semaforo = score == null ? 'sem_dado' : score >= 70 ? 'verde' : score >= 40 ? 'amarelo' : 'vermelho'
  return { score, semaforo, areasCalculadas: n }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const trigger = req.headers.get('x-trigger') || 'manual'
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const erros: string[] = []
  let empresasProcessadas = 0
  let clientesProcessados = 0
  let alertasGerados = 0

  try {
    const { data: empresas, error: eErr } = await supabase.from('empresas').select('id').neq('plano', 'bloqueado')
    if (eErr) throw eErr

    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    for (const empresa of empresas ?? []) {
      try {
        const [{ data: clientes }, { data: tarefas }, { data: apontamentos }, { data: usuarios }] = await Promise.all([
          supabase.from('clientes').select('id,status,valor_mrr,responsavel_id,inicio_contrato').eq('empresa_id', empresa.id).eq('status', 'ativo'),
          supabase.from('tarefas').select('cliente_id,categoria,status,prazo,data_execucao,deleted_at').eq('empresa_id', empresa.id),
          supabase.from('apontamentos').select('cliente_id,usuario_id,segundos').eq('empresa_id', empresa.id).gte('inicio', inicioMes.toISOString()),
          supabase.from('usuarios').select('id,custo_hora,horas_mes').eq('empresa_id', empresa.id),
        ])

        if (!clientes || clientes.length === 0) continue
        empresasProcessadas++

        const custoHoraMedio = (usuarios && usuarios.length > 0)
          ? usuarios.reduce((a, u) => a + (u.custo_hora || CUSTO_HORA_PADRAO), 0) / usuarios.length
          : CUSTO_HORA_PADRAO

        for (const cliente of clientes as Cliente[]) {
          try {
            const tarefasCliente = (tarefas as Tarefa[] || []).filter(t => t.cliente_id === cliente.id && !t.deleted_at)
            const margemInfo = computeMargem(cliente, (apontamentos as Apontamento[]) || [], custoHoraMedio)
            const areas = computeAreas(cliente, tarefasCliente, margemInfo, (usuarios as Usuario[]) || [], (apontamentos as Apontamento[]) || [])
            const { score, semaforo, areasCalculadas } = computeScore(areas)

            const { data: ultimo } = await supabase
              .from('radar_scores')
              .select('semaforo')
              .eq('cliente_id', cliente.id)
              .order('calculado_em', { ascending: false })
              .limit(1)
              .maybeSingle()

            await supabase.from('radar_scores').insert({
              empresa_id: empresa.id,
              cliente_id: cliente.id,
              score,
              semaforo,
              areas,
              areas_calculadas: areasCalculadas,
            })

            const rankAnterior = ultimo?.semaforo ? RANK_SEMAFORO[ultimo.semaforo] : undefined
            const rankNovo = RANK_SEMAFORO[semaforo]
            if (ultimo && rankAnterior !== undefined && rankNovo !== undefined && rankNovo > rankAnterior) {
              await supabase.from('radar_alertas').insert({
                empresa_id: empresa.id,
                cliente_id: cliente.id,
                semaforo_anterior: ultimo.semaforo,
                semaforo_novo: semaforo,
              })
              alertasGerados++
            }

            clientesProcessados++
          } catch (e) {
            erros.push(`cliente ${cliente.id}: ${String(e)}`)
          }
        }
      } catch (e) {
        erros.push(`empresa ${empresa.id}: ${String(e)}`)
      }
    }

    await supabase.from('radar_calc_logs').insert({
      empresas_processadas: empresasProcessadas,
      clientes_processados: clientesProcessados,
      alertas_gerados: alertasGerados,
      erros: erros.length ? erros : null,
      origem: trigger,
    })

    return new Response(JSON.stringify({ empresas_processadas: empresasProcessadas, clientes_processados: clientesProcessados, alertas_gerados: alertasGerados, erros }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    await supabase.from('radar_calc_logs').insert({
      empresas_processadas: empresasProcessadas,
      clientes_processados: clientesProcessados,
      alertas_gerados: alertasGerados,
      erros: [String(e)],
      origem: trigger,
    })
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
