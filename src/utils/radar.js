// ── radar.js ────────────────────────────────────────────────────────
// Cálculos puros do "Radar do Cliente" — sem chamada a banco. Recebe
// arrays já buscados pelos hooks existentes (useClients, useTasks,
// useApontamentos, useUsuarios) e devolve números/rótulos prontos pra
// tela. Mantido separado de qualquer coisa que dependa de Supabase.

export const CUSTO_HORA_PADRAO = 65 // R$65/h — mesma referência usada em RentPage

// Categorias de tarefa (ver TasksPage.jsx CATEGORIAS) que alimentam cada
// área do radar que dá pra calcular hoje. As demais áreas da planilha
// original (Caixa, Impostos, Tecnol., Dono) dependem de integração externa
// (banco, Receita) que o Fluxe ainda não tem — ficam marcadas "sem_dado" em
// vez de fingir um valor. Equipe e Comercial usam dado que o Fluxe já tem
// (responsável do cliente + ocupação do time, tempo de contrato).
const CATEGORIAS_RECEB = ['Contas a Receber', 'Cobrança / Inadimplência']
const CATEGORIAS_PAGTOS = ['Contas a Pagar', 'Pagamentos']
const CATEGORIAS_FLUXO_CAIXA = ['Fluxo de Caixa']
const HORAS_MES_PADRAO = 160

export const AREAS_SEM_DADO = ['caixa', 'impostos', 'tecnol', 'dono']

const AREA_LABEL = {
  margem: 'Margem', lucro: 'Lucro', custos: 'Custos',
  receb: 'Receb.', pagtos: 'Pagtos', fluxo_caixa: 'Fluxo Caixa', processos: 'Process.',
  caixa: 'Caixa', impostos: 'Impostos', equipe: 'Equipe',
  comercial: 'Comercial', tecnol: 'Tecnol.', dono: 'Dono',
}
export { AREA_LABEL }

// ── Margem por cliente ────────────────────────────────────────────────
// Uma única versão do cálculo que RentPage.jsx e InsightsDash.jsx faziam
// cada um do seu jeito (com custo/hora padrão diferente — corrigido aqui
// pra R$65 nos dois lugares).
export function computeMargemPorCliente(clientes, apontamentos, custoHoraMedio = CUSTO_HORA_PADRAO) {
  return clientes.map(cl => {
    const horas = apontamentos
      .filter(a => a.cliente_id === cl.id)
      .reduce((s, a) => s + (a.segundos || 0), 0) / 3600
    const custo = horas * custoHoraMedio
    const receita = cl.valor_mrr || 0
    const margem = receita - custo
    // Sem receita mas com custo real = prejuízo total, não "0%" (que parecia neutro).
    const margemPct = receita > 0 ? (margem / receita) * 100 : (margem < 0 ? -100 : 0)
    return { clienteId: cl.id, horas, custo, receita, margem, margemPct }
  })
}

function isAtrasada(tarefa, hoje) {
  if (tarefa.status === 'concluida') return false
  const dataRef = tarefa.data_execucao || tarefa.prazo
  return !!dataRef && dataRef < hoje
}

function statusPorContagem(n) {
  if (n === 0) return 'saudavel'
  if (n <= 2) return 'atencao'
  return 'critico'
}

// ── Ajuste manual: sobrepõe o cálculo automático (ou o "sem_dado") quando
// quem opera o cliente sabe da situação real e registrou isso na tela.
// ajustesManuais = { [area]: { status, observacao, criado_por_nome, criado_em, expira_em } }
// Ajuste vencido (expira_em no passado) é ignorado — evita informação velha
// aparecer como atual pra sempre.
export function aplicarAjustesManuais(areas, ajustesManuais) {
  if (!ajustesManuais) return areas
  const agora = Date.now()
  const resultado = { ...areas }
  Object.entries(ajustesManuais).forEach(([area, ajuste]) => {
    if (!ajuste) return
    if (ajuste.expira_em && new Date(ajuste.expira_em).getTime() < agora) return
    resultado[area] = {
      status: ajuste.status,
      valor: resultado[area]?.valor ?? null,
      manual: true,
      observacao: ajuste.observacao || null,
      criado_por_nome: ajuste.criado_por_nome || null,
      criado_em: ajuste.criado_em || null,
      expira_em: ajuste.expira_em || null,
    }
  })
  return resultado
}

// ── Métrica mensal real: sobrepõe o proxy de tarefa em dia com números de
// verdade (quanto recebeu, quanto pagou, saldo em caixa). Exportada pra ser
// aplicada tanto dentro de computeAreaStatusPorCliente (cálculo na hora)
// quanto por cima do snapshot do servidor (RadarPainel), pra uma edição
// aparecer na tela sem esperar o próximo ciclo do cron.
export function aplicarMetricaMes(areas, metricaMes, receita = 0) {
  if (!metricaMes) return areas
  const resultado = { ...areas }
  const { valor_a_receber, valor_recebido, valor_a_pagar, valor_pago, saldo_caixa } = metricaMes
  if ((valor_a_receber || 0) > 0 && valor_recebido != null) {
    const pct = (valor_recebido / valor_a_receber) * 100
    resultado.receb = { status: pct >= 95 ? 'saudavel' : pct >= 80 ? 'atencao' : 'critico', valor: `${pct.toFixed(0)}% recebido` }
  }
  if ((valor_a_pagar || 0) > 0 && valor_pago != null) {
    const pct = (valor_pago / valor_a_pagar) * 100
    resultado.pagtos = { status: pct >= 95 ? 'saudavel' : pct >= 80 ? 'atencao' : 'critico', valor: `${pct.toFixed(0)}% pago` }
  }
  if (valor_recebido != null && valor_pago != null) {
    const liquido = valor_recebido - valor_pago
    resultado.fluxo_caixa = { status: liquido >= 0 ? 'saudavel' : liquido > -(receita * 0.1) ? 'atencao' : 'critico', valor: liquido }
  }
  if (saldo_caixa != null) {
    resultado.caixa = { status: saldo_caixa >= receita ? 'saudavel' : saldo_caixa > 0 ? 'atencao' : 'critico', valor: saldo_caixa }
  }
  return resultado
}

// ── Status das 9 áreas calculáveis + composto ─────────────────────────
// usuarios/apontamentosEquipe são opcionais (dados da empresa toda, não só
// deste cliente) — sem eles, Equipe cai pra "sem_dado" em vez de mentir.
// metricaMes é opcional — números reais do mês (valor_a_receber,
// valor_recebido, valor_a_pagar, valor_pago, saldo_caixa). Quando presente,
// Recebíveis/Pagtos/Fluxo de Caixa/Caixa passam a refletir dinheiro de
// verdade em vez do proxy de tarefa em dia. ajustesManuais é opcional —
// quando presente, sobrepõe qualquer área (inclusive as calculadas por
// metricaMes), pra quando quem opera sabe de algo que os números não
// capturam.
// Retorna { margem:{status,...}, ... }
export function computeAreaStatusPorCliente(cliente, tarefasDoCliente, margemInfo, usuarios = null, apontamentosEquipe = null, ajustesManuais = null, metricaMes = null) {
  const hoje = new Date().toISOString().slice(0, 10)
  const abertas = tarefasDoCliente.filter(t => !t.deleted_at)
  const atrasadas = abertas.filter(t => isAtrasada(t, hoje))

  const contarAtrasadasPor = (categorias) =>
    atrasadas.filter(t => categorias.includes(t.categoria)).length

  const nReceb = contarAtrasadasPor(CATEGORIAS_RECEB)
  const nPagtos = contarAtrasadasPor(CATEGORIAS_PAGTOS)
  const nFluxo = contarAtrasadasPor(CATEGORIAS_FLUXO_CAIXA)
  const nProcessos = atrasadas.length

  const margemPct = margemInfo?.margemPct ?? 0
  const margem = margemInfo?.margem ?? 0
  const receita = margemInfo?.receita ?? 0
  const custoPct = receita > 0 ? (margemInfo.custo / receita) * 100 : 0

  const statusMargem = margemPct > 40 ? 'saudavel' : margemPct > 0 ? 'atencao' : 'critico'
  const statusProcessos = statusPorContagem(nProcessos)

  let areas = {
    margem: { status: statusMargem, valor: `${margemPct.toFixed(0)}%` },
    lucro: { status: margem > 0 ? 'saudavel' : margem > -(receita * 0.1) ? 'atencao' : 'critico', valor: margem },
    custos: { status: custoPct < 60 ? 'saudavel' : custoPct <= 100 ? 'atencao' : 'critico', valor: `${custoPct.toFixed(0)}%` },
    receb: { status: statusPorContagem(nReceb), valor: nReceb },
    pagtos: { status: statusPorContagem(nPagtos), valor: nPagtos },
    fluxo_caixa: { status: statusPorContagem(nFluxo), valor: nFluxo },
    processos: { status: statusProcessos, valor: nProcessos },
  }

  areas = aplicarMetricaMes(areas, metricaMes, receita)

  // ── Equipe: cliente tem dono definido e esse dono não está sobrecarregado ──
  if (usuarios && apontamentosEquipe) {
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
  } else {
    areas.equipe = { status: 'sem_dado', valor: null }
  }

  // ── Comercial: relação em risco de churn, em formação, ou estável ──────────
  const seisMesesMs = 1000 * 60 * 60 * 24 * 30 * 6
  const tempoContratoMs = cliente.inicio_contrato ? Date.now() - new Date(cliente.inicio_contrato).getTime() : null
  let statusComercial
  if (statusMargem === 'critico' && statusProcessos === 'critico') statusComercial = 'critico'
  else if (tempoContratoMs !== null && tempoContratoMs < seisMesesMs) statusComercial = 'atencao'
  else statusComercial = 'saudavel'
  areas.comercial = { status: statusComercial, valor: null }

  AREAS_SEM_DADO.forEach(id => { if (!areas[id]) areas[id] = { status: 'sem_dado', valor: null } })

  return aplicarAjustesManuais(areas, ajustesManuais)
}

const SCORE_POR_STATUS = { saudavel: 100, atencao: 50, critico: 0 }

// ── Score + Semáforo compostos ─────────────────────────────────────────
// Média só das áreas calculáveis (automáticas + ajustadas manualmente) —
// nunca inclui "sem_dado".
export function computeRadarScore(areas) {
  const calculaveis = Object.entries(areas).filter(([, a]) => a.status !== 'sem_dado')
  const n = calculaveis.length
  const score = n > 0
    ? Math.round(calculaveis.reduce((s, [, a]) => s + SCORE_POR_STATUS[a.status], 0) / n)
    : null
  const semaforo = score == null ? 'sem_dado' : score >= 70 ? 'verde' : score >= 40 ? 'amarelo' : 'vermelho'
  return { score, semaforo, areasCalculadas: n, areasTotal: Object.keys(areas).length }
}

// ── Alerta em texto simples ─────────────────────────────────────────────
// Baseado em status (não no formato de "valor", que muda conforme a área
// vem do proxy de tarefa ou de metricaMes — número de tarefas num caso,
// percentual/R$ no outro).
export function gerarAlertaComposto(areas) {
  const problemas = []
  if (areas.margem.status === 'critico') problemas.push('margem negativa')
  else if (areas.margem.status === 'atencao') problemas.push('margem baixa')
  if (areas.pagtos.status === 'critico') problemas.push('pagamentos atrasados')
  else if (areas.pagtos.status === 'atencao') problemas.push('pagamentos parcialmente em dia')
  if (areas.receb.status === 'critico') problemas.push('recebíveis atrasados')
  else if (areas.receb.status === 'atencao') problemas.push('recebíveis parcialmente em dia')
  if (areas.fluxo_caixa.status === 'critico') problemas.push('fluxo de caixa negativo')
  if (problemas.length === 0) return null
  return `Atenção: ${problemas.join(', ')}.`
}

// ── Sugestão comercial (upsell) ────────────────────────────────────────
export function gerarOportunidadeComercial(areas, cliente) {
  const estavel = areas.margem.status === 'saudavel' && areas.processos.status === 'saudavel'
  if (!estavel) return null
  const inicio = cliente?.inicio_contrato ? new Date(cliente.inicio_contrato) : null
  const seiseMeses = 1000 * 60 * 60 * 24 * 30 * 6
  if (inicio && Date.now() - inicio.getTime() < seiseMeses) return null
  return 'Cliente rentável e estável — bom candidato pra oferecer um upsell ou serviço adicional.'
}
