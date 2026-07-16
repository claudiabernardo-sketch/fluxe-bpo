// ── radar.js ────────────────────────────────────────────────────────
// Cálculos puros do "Radar do Cliente" — sem chamada a banco. Recebe
// arrays já buscados pelos hooks existentes (useClients, useTasks,
// useApontamentos, useUsuarios) e devolve números/rótulos prontos pra
// tela. Mantido separado de qualquer coisa que dependa de Supabase.

export const CUSTO_HORA_PADRAO = 65 // R$65/h — mesma referência usada em RentPage

// Categorias de tarefa (ver TasksPage.jsx CATEGORIAS) que alimentam cada
// área do radar que dá pra calcular hoje. As demais áreas da planilha
// original (Caixa, Impostos, Equipe, Comercial, Tecnol., Dono) não têm
// nenhum dado equivalente no Fluxe ainda — ficam marcadas "sem_dado" em
// vez de fingir um valor.
const CATEGORIAS_RECEB = ['Contas a Receber', 'Cobrança / Inadimplência']
const CATEGORIAS_PAGTOS = ['Contas a Pagar', 'Pagamentos']
const CATEGORIAS_FLUXO_CAIXA = ['Fluxo de Caixa']

export const AREAS_SEM_DADO = ['caixa', 'impostos', 'equipe', 'comercial', 'tecnol', 'dono']

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

// ── Status das 7 áreas calculáveis + composto ─────────────────────────
// Retorna { areas: { margem:{status,...}, ... }, camposSemDado: [...] }
export function computeAreaStatusPorCliente(cliente, tarefasDoCliente, margemInfo) {
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

  const areas = {
    margem: { status: margemPct > 40 ? 'saudavel' : margemPct > 0 ? 'atencao' : 'critico', valor: `${margemPct.toFixed(0)}%` },
    lucro: { status: margem > 0 ? 'saudavel' : margem > -(receita * 0.1) ? 'atencao' : 'critico', valor: margem },
    custos: { status: custoPct < 60 ? 'saudavel' : custoPct <= 100 ? 'atencao' : 'critico', valor: `${custoPct.toFixed(0)}%` },
    receb: { status: statusPorContagem(nReceb), valor: nReceb },
    pagtos: { status: statusPorContagem(nPagtos), valor: nPagtos },
    fluxo_caixa: { status: statusPorContagem(nFluxo), valor: nFluxo },
    processos: { status: statusPorContagem(nProcessos), valor: nProcessos },
  }
  AREAS_SEM_DADO.forEach(id => { areas[id] = { status: 'sem_dado', valor: null } })

  return areas
}

const SCORE_POR_STATUS = { saudavel: 100, atencao: 50, critico: 0 }

// ── Score + Semáforo compostos ─────────────────────────────────────────
// Média só das áreas calculáveis (7 de 13) — nunca inclui "sem_dado".
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
export function gerarAlertaComposto(areas) {
  const problemas = []
  if (areas.margem.status === 'critico') problemas.push('margem negativa')
  else if (areas.margem.status === 'atencao') problemas.push('margem baixa')
  if (areas.pagtos.valor > 0) problemas.push(`${areas.pagtos.valor} pagamento${areas.pagtos.valor > 1 ? 's' : ''} atrasado${areas.pagtos.valor > 1 ? 's' : ''}`)
  if (areas.receb.valor > 0) problemas.push(`${areas.receb.valor} cobrança${areas.receb.valor > 1 ? 's' : ''} atrasada${areas.receb.valor > 1 ? 's' : ''}`)
  if (areas.fluxo_caixa.valor > 0) problemas.push('tarefas de fluxo de caixa atrasadas')
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
