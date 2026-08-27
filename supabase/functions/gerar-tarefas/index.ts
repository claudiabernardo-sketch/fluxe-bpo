// ══════════════════════════════════════════════════════════════════════════════
// Fluxe BPO — Edge Function: gerar-tarefas v2
// Geração server-side de tarefas recorrentes com auditoria granular
// Chamada pelo pg_cron todo dia às 03:00 UTC (00:00 BRT)
// Aceita chamadas manuais via POST para gestão operacional
// ══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trigger',
}

// ── Bancos: normaliza nomes antigos/divergentes antes de expandir por banco
// (ex.: "Banco Inter" salvo antes da lista de caixinhas ser unificada com
// "Inter") — sem isso, o mesmo banco conta duas vezes e gera tarefa duplicada.
const BANCOS_LIST = [
  'Banco do Brasil','Bradesco','Itaú','Santander','Caixa',
  'Nubank','Inter','Sicoob','Sicredi','BTG','C6 Bank','XP','Safra',
  'BV','Banrisul','Original','Neon','PicPay','Mercado Pago','CPJ Conta Azul',
  'PagBank','Stone','Cora','Asaas','Outros',
]
const BANCOS_ALIASES: Record<string, string> = {
  'caixa econômica federal': 'Caixa',
  'banco original': 'Original',
  'btg pactual': 'BTG',
  'outro': 'Outros',
}
function normalizarBanco(nome: string): string {
  if (BANCOS_LIST.includes(nome)) return nome
  const semPrefixo = nome.replace(/^Banco\s+/i, '').trim()
  if (BANCOS_LIST.includes(semPrefixo)) return semPrefixo
  return BANCOS_ALIASES[nome.trim().toLowerCase()] || nome
}
function normalizarBancos(lista: string[]): string[] {
  return [...new Set((lista || []).map(normalizarBanco))]
}

// ── Timezone: Brasil (BRT = UTC-3) ──────────────────────────────────────────
function getHojeBRT(): string {
  const now = new Date()
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return brt.toISOString().slice(0, 10) // "YYYY-MM-DD"
}

// ── Gera lista de datas entre duas datas (inclusive) ─────────────────────────
function gerarRangeDatas(inicio: string, fim: string): string[] {
  const datas: string[] = []
  const d = new Date(inicio + 'T12:00:00')
  const f = new Date(fim + 'T12:00:00')
  while (d <= f) {
    datas.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return datas
}

// ── Lógica de recorrência ────────────────────────────────────────────────────
function deveGerarNaData(
  modelo: {
    recorrencia: string
    dia_mes?: number | null
    dias_semana?: number[] | null
    dias_mes?: number[] | null
  },
  dateStr: string,
  feriadosSet: Set<string>
): { deve: boolean; motivo?: string } {
  const d   = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()    // 0=Dom 1=Seg ... 6=Sab
  const dom = d.getDate()   // dia do mês (1-31)
  const mes = d.getMonth()  // mês (0-11)
  const diaAlvo = modelo.dia_mes ?? 1

  switch (modelo.recorrencia) {
    case 'diaria':
      return { deve: true }

    case 'dias_uteis':
      if (dow === 0 || dow === 6)
        return { deve: false, motivo: 'fim de semana' }
      if (feriadosSet.has(dateStr))
        return { deve: false, motivo: `feriado em ${dateStr}` }
      return { deve: true }

    case 'semanal':
      return (modelo.dias_semana ?? []).includes(dow)
        ? { deve: true }
        : { deve: false, motivo: `dia ${dow} não está nos dias configurados` }

    case 'quinzenal': {
      const ok = dom === diaAlvo || dom === Math.min(diaAlvo + 15, 28)
      return ok ? { deve: true } : { deve: false, motivo: `dia ${dom} não é quinzenal (${diaAlvo})` }
    }

    case 'mensal':
      return dom === diaAlvo
        ? { deve: true }
        : { deve: false, motivo: `dia ${dom} ≠ dia_mes ${diaAlvo}` }

    case 'dias_especificos':
      return (modelo.dias_mes ?? []).includes(dom)
        ? { deve: true }
        : { deve: false, motivo: `dia ${dom} não está nos dias especificados` }

    case 'bimestral': {
      const ok = dom === diaAlvo && mes % 2 === 0
      return ok ? { deve: true } : { deve: false, motivo: `bimestral: dom=${dom} mes=${mes}` }
    }

    case 'trimestral': {
      const ok = dom === diaAlvo && [0, 3, 6, 9].includes(mes)
      return ok ? { deve: true } : { deve: false, motivo: `trimestral: dom=${dom} mes=${mes}` }
    }

    case 'semestral': {
      const ok = dom === diaAlvo && [0, 6].includes(mes)
      return ok ? { deve: true } : { deve: false, motivo: `semestral: dom=${dom} mes=${mes}` }
    }

    case 'anual': {
      const ok = dom === diaAlvo && mes === 0
      return ok ? { deve: true } : { deve: false, motivo: `anual: dom=${dom} mes=${mes}` }
    }

    default:
      return { deve: false, motivo: `recorrência desconhecida: ${modelo.recorrencia}` }
  }
}

// ── Tipo para detalhe de auditoria ───────────────────────────────────────────
type ResultadoGeração =
  | 'gerada'
  | 'duplicidade_evitada'
  | 'cliente_em_configuracao'
  | 'cliente_pausado'
  | 'cliente_encerrado'
  | 'cliente_nao_iniciado'
  | 'modelo_pausado'
  | 'feriado'
  | 'data_incompativel'
  | 'erro'

interface DetalheGeração {
  empresa_id:  string
  cliente_id:  string | null
  modelo_id:   string | null
  data_alvo:   string
  resultado:   ResultadoGeração
  motivo:      string | null
  tarefa_id:   string | null
}

// ── Handler principal ────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const iniciou = new Date().toISOString()
  const hoje    = getHojeBRT()
  const origem  = req.headers.get('x-trigger') || 'manual'

  // ── Parâmetros do body ───────────────────────────────────────────────────
  let body: any = {}
  try { body = await req.json() } catch (_) { /* sem body */ }

  const dryRun          = body?.dry_run === true
  const filtroClienteId = body?.cliente_id ?? null   // gerar só para este cliente
  const filtroEmpresaId = body?.empresa_id ?? null   // gerar só para esta empresa
  const filtroModeloId  = body?.modelo_id  ?? null   // gerar só para este modelo

  // Datas a processar: range ou data única ou hoje
  let datasAlvo: string[]
  if (body?.data_inicio && body?.data_fim) {
    datasAlvo = gerarRangeDatas(body.data_inicio, body.data_fim)
    if (datasAlvo.length > 366) {
      return new Response(JSON.stringify({ ok: false, error: 'Range máximo de 366 dias' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } else {
    const data = body?.data && /^\d{4}-\d{2}-\d{2}$/.test(body.data) ? body.data : hoje
    datasAlvo = [data]
  }

  // ── Contadores globais ────────────────────────────────────────────────────
  let empresasProcessadas = 0
  let clientesProcessados = 0
  let tarefasGeradas      = 0
  const erros: string[]   = []
  const detalhes: DetalheGeração[] = []

  try {
    // ── 1. Empresas com plano ativo ────────────────────────────────────────
    let queryEmpresas = supabase.from('empresas').select('id, nome').neq('plano', 'bloqueado')
    if (filtroEmpresaId) queryEmpresas = queryEmpresas.eq('id', filtroEmpresaId)

    const { data: empresas, error: errEmp } = await queryEmpresas
    if (errEmp) throw new Error('Empresas: ' + errEmp.message)

    for (const empresa of (empresas ?? [])) {
      empresasProcessadas++
      const empId = empresa.id

      try {
        // ── 2. Feriados desta empresa ──────────────────────────────────────
        const { data: feriados } = await supabase
          .from('feriados')
          .select('data')
          .eq('empresa_id', empId)
        const feriadosSet = new Set((feriados ?? []).map((f: any) => String(f.data)))

        // ── 3. Clientes operacionais desta empresa ─────────────────────────
        let queryClientes = supabase
          .from('clientes')
          .select('id, razao_social, status_operacional, operacao_iniciada_em, bancos, responsavel_id')
          .eq('empresa_id', empId)
          .eq('status_operacional', 'operacional')
          .not('operacao_iniciada_em', 'is', null)

        if (filtroClienteId) queryClientes = queryClientes.eq('id', filtroClienteId)

        const { data: clientes, error: errCli } = await queryClientes
        if (errCli) { erros.push(`[${empId}] clientes: ${errCli.message}`); continue }
        if (!clientes?.length) continue

        const clientesMap: Record<string, any> = {}
        for (const c of clientes as any[]) clientesMap[c.id] = c

        // ── 4. Vínculos modelo→cliente com overrides e dados do modelo ─────
        let queryVinculos = supabase
          .from('cliente_modelos')
          .select(`
            id,
            cliente_id,
            modelo_id,
            ativo,
            pausado,
            recorrencia,
            dia_mes,
            dias_semana,
            hora,
            responsavel_id,
            checklist_items_override,
            tarefa_modelos!inner (
              id, titulo, categoria, prioridade,
              recorrencia, dia_mes, dias_semana, dias_mes,
              checklist_items,
              ativo, deleted_at
            )
          `)
          .eq('empresa_id', empId)
          .eq('ativo', true)
          .eq('pausado', false)
          .eq('tarefa_modelos.ativo', true)
          .is('tarefa_modelos.deleted_at', null)

        if (filtroClienteId) queryVinculos = queryVinculos.eq('cliente_id', filtroClienteId)
        // Filtro por modelo: usado quando se muda a recorrência de um vínculo e
        // só as tarefas daquela rotina precisam ser refeitas — sem ele a
        // regeração adiantaria o mês inteiro de todas as outras rotinas do
        // cliente, que ninguém pediu.
        if (filtroModeloId)  queryVinculos = queryVinculos.eq('modelo_id',  filtroModeloId)

        const { data: vinculos, error: errVinc } = await queryVinculos
        if (errVinc) { erros.push(`[${empId}] vinculos: ${errVinc.message}`); continue }
        if (!vinculos?.length) continue

        // Checklist de cada vínculo cliente+modelo — copiado pra
        // tarefa_checklists de cada tarefa gerada, mesmo comportamento da
        // criação manual em TasksPage.jsx (senão o checklist nunca chega em
        // quem executa a tarefa, já que a imensa maioria é gerada por aqui).
        // Prioriza checklist_items_override do vínculo (específico daquele
        // cliente); se não tiver, cai no checklist_items padrão do modelo —
        // por isso é indexado por cliente+modelo, não só por modelo, já que
        // dois clientes com o mesmo modelo podem ter checklists diferentes.
        const checklistPorClienteModelo: Record<string, string[]> = {}
        for (const v of (vinculos as any[])) {
          const items = (Array.isArray(v.checklist_items_override) && v.checklist_items_override.length)
            ? v.checklist_items_override
            : v.tarefa_modelos?.checklist_items
          if (Array.isArray(items) && items.length) checklistPorClienteModelo[`${v.cliente_id}::${v.modelo_id}`] = items
        }

        // ── 5. Processar cada data ─────────────────────────────────────────
        for (const dataAlvo of datasAlvo) {

          // Tarefas já existentes nesta data (idempotência)
          const modeloIds = [...new Set((vinculos as any[]).map((v: any) => v.modelo_id))]
          const { data: existentes } = await supabase
            .from('tarefas')
            .select('modelo_id, cliente_id, titulo')
            .eq('empresa_id', empId)
            .in('modelo_id', modeloIds)
            .eq('data_execucao', dataAlvo)
            .is('deleted_at', null)

          const existSet = new Set(
            (existentes ?? []).map((t: any) => `${t.modelo_id}::${t.cliente_id ?? 'null'}::${t.titulo}`)
          )

          const toInsert: any[] = []
          const clientesNaData  = new Set<string>()

          for (const vinculo of vinculos as any[]) {
            const modelo    = vinculo.tarefa_modelos
            const clienteId = vinculo.cliente_id
            const cliente   = clientesMap[clienteId]

            // Cliente não está na lista de operacionais (ex: filtro por empresa)
            if (!cliente) continue

            // Verificar data de início da operação
            if (cliente.operacao_iniciada_em > dataAlvo) {
              detalhes.push({
                empresa_id: empId, cliente_id: clienteId, modelo_id: vinculo.modelo_id,
                data_alvo: dataAlvo, resultado: 'cliente_nao_iniciado',
                motivo: `operacao_iniciada_em=${cliente.operacao_iniciada_em} > ${dataAlvo}`,
                tarefa_id: null,
              })
              continue
            }

            // Resolver override: usa campo do vinculo se preenchido, senão usa o modelo
            const modeloEfetivo = {
              recorrencia: vinculo.recorrencia ?? modelo.recorrencia,
              dia_mes:     vinculo.dia_mes     ?? modelo.dia_mes,
              dias_semana: vinculo.dias_semana ?? modelo.dias_semana,
              dias_mes:    modelo.dias_mes,
            }

            // Verificar recorrência
            const { deve, motivo: motivoData } = deveGerarNaData(modeloEfetivo, dataAlvo, feriadosSet)
            if (!deve) {
              // Sempre registra (não só em dry_run) — o frontend usa essa
              // contagem pra explicar por que "0 tarefas" não é bug, é a
              // recorrência do modelo não bater com a data pedida.
              const resultado: ResultadoGeração = motivoData?.startsWith('feriado') ? 'feriado' : 'data_incompativel'
              detalhes.push({
                empresa_id: empId, cliente_id: clienteId, modelo_id: vinculo.modelo_id,
                data_alvo: dataAlvo, resultado, motivo: motivoData ?? null, tarefa_id: null,
              })
              continue
            }

            // Expandir por banco se for conciliação bancária — usa a categoria
            // (campo fixo e confiável), não o título (texto livre, pode variar)
            const isConciliacao = modelo.categoria === 'Conciliação Bancária'
            const bancosCliente: string[] = (isConciliacao && Array.isArray(cliente.bancos) && cliente.bancos.length > 0)
              ? normalizarBancos(cliente.bancos)
              : []
            const titulosParaGerar = bancosCliente.length > 0
              ? bancosCliente.map((b: string) => `${modelo.titulo} — ${b}`)
              : [modelo.titulo]

            for (const tituloFinal of titulosParaGerar) {
              // Verificar idempotência por título específico
              const key = `${vinculo.modelo_id}::${clienteId ?? 'null'}::${tituloFinal}`
              if (existSet.has(key)) {
                detalhes.push({
                  empresa_id: empId, cliente_id: clienteId, modelo_id: vinculo.modelo_id,
                  data_alvo: dataAlvo, resultado: 'duplicidade_evitada', motivo: null, tarefa_id: null,
                })
                continue
              }
              existSet.add(key) // evitar duplicidade no mesmo lote

              // Agendar inserção
              toInsert.push({
                _key:          key,
                _vinculo_id:   vinculo.id,
                empresa_id:    empId,
                modelo_id:     vinculo.modelo_id,
                cliente_id:    clienteId,
                titulo:        tituloFinal,
                categoria:     modelo.categoria ?? null,
                prioridade:    modelo.prioridade,
                status:        'aberta',
                data_execucao: dataAlvo,
                ...((() => { const rid = vinculo.responsavel_id ?? clientesMap[clienteId]?.responsavel_id ?? null; return rid ? { responsavel_id: rid } : {} })()),
              })
              if (clienteId) clientesNaData.add(clienteId)
            }
          }

          // ── 6. Inserir (ou simular em dry_run) ────────────────────────────
          if (dryRun) {
            for (const t of toInsert) {
              detalhes.push({
                empresa_id: empId, cliente_id: t.cliente_id, modelo_id: t.modelo_id,
                data_alvo: dataAlvo, resultado: 'gerada',
                motivo: '[dry_run] tarefa seria gerada', tarefa_id: null,
              })
              tarefasGeradas++
            }
          } else {
            for (let i = 0; i < toInsert.length; i += 50) {
              const lote = toInsert.slice(i, i + 50)
              const inserts = lote.map(({ _key, _vinculo_id, ...t }) => t)
              const { data: inseridas, error: errIns } = await supabase
                .from('tarefas')
                .insert(inserts)
                .select('id, modelo_id, cliente_id')

              if (errIns) {
                erros.push(`[${empId}] insert lote ${i}: ${errIns.message}`)
                for (const t of lote) {
                  detalhes.push({
                    empresa_id: empId, cliente_id: t.cliente_id, modelo_id: t.modelo_id,
                    data_alvo: dataAlvo, resultado: 'erro', motivo: errIns.message, tarefa_id: null,
                  })
                }
              } else {
                tarefasGeradas += lote.length
                const checklistRows: any[] = []
                for (const ins of (inseridas ?? []) as any[]) {
                  detalhes.push({
                    empresa_id: empId, cliente_id: ins.cliente_id, modelo_id: ins.modelo_id,
                    data_alvo: dataAlvo, resultado: 'gerada', motivo: null, tarefa_id: ins.id,
                  })
                  const items = ins.modelo_id ? checklistPorClienteModelo[`${ins.cliente_id}::${ins.modelo_id}`] : null
                  if (items?.length) {
                    for (const texto of items) checklistRows.push({ tarefa_id: ins.id, empresa_id: empId, texto })
                  }
                }
                if (checklistRows.length) {
                  const { error: errCk } = await supabase.from('tarefa_checklists').insert(checklistRows)
                  if (errCk) erros.push(`[${empId}] checklist lote ${i}: ${errCk.message}`)
                }
              }
            }
          }

          clientesProcessados += clientesNaData.size
        }

      } catch (e: any) {
        erros.push(`[${empId}] ${e.message}`)
      }
    }

    // ── 7. Gravar log principal ────────────────────────────────────────────
    let logId: string | null = null
    if (!dryRun) {
      const { data: logRow } = await supabase
        .from('task_generation_logs')
        .insert({
          executado_em:         iniciou,
          data_gerada:          datasAlvo[0],
          empresas_processadas: empresasProcessadas,
          clientes_processados: clientesProcessados,
          tarefas_geradas:      tarefasGeradas,
          erros:                erros.length ? erros : null,
          origem,
        })
        .select('id')
        .single()

      logId = logRow?.id ?? null

      // ── 8. Gravar detalhes de auditoria (lotes de 100) ──────────────────
      if (logId && detalhes.length) {
        for (let i = 0; i < detalhes.length; i += 100) {
          const lote = detalhes.slice(i, i + 100).map(d => ({ ...d, log_id: logId }))
          const { error: errDet } = await supabase.from('task_generation_details').insert(lote)
          if (errDet) erros.push(`details lote ${i}: ${errDet.message}`)
        }
      }
    }

    // Resumo do que aconteceu com quem NÃO gerou tarefa — pra tela poder
    // explicar "0 tarefas" em vez de deixar parecer que travou/deu erro.
    const duplicadasEvitadas   = detalhes.filter(d => d.resultado === 'duplicidade_evitada').length
    const naoBateuRecorrencia  = detalhes.filter(d => d.resultado === 'data_incompativel' || d.resultado === 'feriado').length
    const clientesNaoProntos   = detalhes.filter(d => d.resultado === 'cliente_nao_iniciado').length

    const resultado = {
      ok:                   true,
      dry_run:              dryRun,
      datas_processadas:    datasAlvo,
      empresas_processadas: empresasProcessadas,
      clientes_processados: clientesProcessados,
      tarefas_geradas:      tarefasGeradas,
      duplicadas_evitadas:  duplicadasEvitadas,
      nao_bateu_recorrencia: naoBateuRecorrencia,
      clientes_nao_prontos: clientesNaoProntos,
      erros,
      log_id:               logId,
      // Em dry_run, inclui preview dos detalhes (máx 200)
      ...(dryRun ? { preview: detalhes.slice(0, 200) } : {}),
    }

    console.log('[gerar-tarefas]', JSON.stringify({
      ok: resultado.ok,
      dry_run: dryRun,
      datas: datasAlvo.length,
      tarefas_geradas: tarefasGeradas,
      erros: erros.length,
    }))

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (fatal: any) {
    const msg = fatal?.message ?? String(fatal)
    erros.push('FATAL: ' + msg)

    if (!dryRun) {
      await supabase.from('task_generation_logs').insert({
        executado_em:         iniciou,
        data_gerada:          datasAlvo[0],
        empresas_processadas: empresasProcessadas,
        clientes_processados: clientesProcessados,
        tarefas_geradas:      0,
        erros,
        origem:               'error',
      })
    }

    return new Response(JSON.stringify({ ok: false, error: msg, erros }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
