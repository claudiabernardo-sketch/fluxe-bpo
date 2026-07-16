import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { useClients, useTasks, useApontamentos } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { Loader } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useQuery } from '@tanstack/react-query'

// ── Constantes ────────────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const STATUS_COLOR = {
  aberta: '#3B82F6', andamento: '#F59E0B', aguardando: '#8B5CF6',
  concluida: '#22C55E', impedimento: '#EF4444', revisao: '#F97316',
}

const CHART_COLORS = ['#6366F1','#22C55E','#F59E0B','#EF4444','#0EA5E9','#A855F7','#F97316']

const PRINT_STYLE = `
@media print {
  .sb, .topbar, .no-print { display: none !important; }
}
`

// ── Helpers ───────────────────────────────────────────────────────────────────
function kpiStyle(color) {
  const map = {
    blue:   { bg:'#EFF6FF', border:'#BFDBFE', label:'#1D4ED8', val:'#1E40AF' },
    green:  { bg:'#F0FDF4', border:'#BBF7D0', label:'#15803D', val:'#166534' },
    red:    { bg:'#FEF2F2', border:'#FECDD3', label:'#991B1B', val:'#7F1D1D' },
    yellow: { bg:'#FFFBEB', border:'#FDE68A', label:'#B45309', val:'#78350F' },
    purple: { bg:'#F5F3FF', border:'#DDD6FE', label:'#6D28D9', val:'#4C1D95' },
    cyan:   { bg:'#ECFEFF', border:'#A5F3FC', label:'#0E7490', val:'#164E63' },
  }
  return map[color] || map.blue
}

function KPI({ label, value, sub, color = 'blue', icon }) {
  const c = kpiStyle(color)
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: c.label, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        {label} <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: c.val, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: c.label, opacity: .75 }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, icon, children, height = 240 }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{title}</span>
      </div>
      <div style={{ padding: '16px', height }}>{children}</div>
    </div>
  )
}

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1E293B', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#CBD5E1' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff' }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const { empresa } = useAuthStore()
  const { data: clients = [], isLoading: clLoad } = useClients()
  const { data: tasks = [],   isLoading: tLoad  } = useTasks()
  const { data: aponts = [] } = useApontamentos()

  // Buscar membros da equipe
  const { data: membros = [] } = useQuery({
    queryKey: ['membros_relatorio', empresa?.id],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios')
        .select('id, nome, perfil')
        .eq('empresa_id', empresa?.id)
      return data || []
    },
    enabled: !!empresa?.id,
  })

  // ── Seletor de período ───────────────────────────────────────────────────────
  const hoje = new Date()
  const [ano,  setAno]  = useState(hoje.getFullYear())
  const [mes,  setMes]  = useState(hoje.getMonth()) // 0-indexed

  function prevMes() {
    if (mes === 0) { setMes(11); setAno(a => a - 1) }
    else setMes(m => m - 1)
  }
  function nextMes() {
    const now = new Date()
    if (ano > now.getFullYear() || (ano === now.getFullYear() && mes >= now.getMonth())) return
    if (mes === 11) { setMes(0); setAno(a => a + 1) }
    else setMes(m => m + 1)
  }

  const periodoStart = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  const periodoEnd = `${ano}-${String(mes + 1).padStart(2, '0')}-${ultimoDia}`
  const todayStr = hoje.toISOString().slice(0, 10)
  const isMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth()

  // ── Dados filtrados pelo período ─────────────────────────────────────────────
  const tarefasPeriodo = useMemo(() =>
    tasks.filter(t => {
      const d = t.data_execucao || t.prazo
      return d >= periodoStart && d <= periodoEnd
    }), [tasks, periodoStart, periodoEnd])

  const conclPeriodo  = useMemo(() => tarefasPeriodo.filter(t => t.status === 'concluida'), [tarefasPeriodo])
  const abertas       = useMemo(() => tarefasPeriodo.filter(t => !['concluida','cancelada'].includes(t.status)), [tarefasPeriodo])
  const taxa          = tarefasPeriodo.length > 0 ? Math.round(conclPeriodo.length / tarefasPeriodo.length * 100) : 0

  // Pendentes = data passada e não concluída (backlog geral, não filtrado por mês)
  const pendentes = useMemo(() =>
    tasks.filter(t => {
      const d = t.data_execucao || t.prazo
      return d && d < todayStr && !['concluida', 'cancelada'].includes(t.status)
    }), [tasks, todayStr])

  // Horas no período
  const horasPeriodo = useMemo(() =>
    aponts.filter(ap => ap.inicio?.slice(0, 10) >= periodoStart && ap.inicio?.slice(0, 10) <= periodoEnd)
           .reduce((a, ap) => a + (ap.segundos || 0), 0) / 3600
  , [aponts, periodoStart, periodoEnd])

  // MRR e clientes ativos (sempre atual)
  const ativos = useMemo(() => clients.filter(c => c.status === 'ativo'), [clients])
  const mrr    = useMemo(() => ativos.reduce((a, c) => a + (c.valor_mrr || 0), 0), [ativos])

  // ── Dados para gráficos ──────────────────────────────────────────────────────

  // 1. Concluídas por dia no período
  const conclPorDia = useMemo(() => {
    const map = {}
    conclPeriodo.forEach(t => {
      const d = t.data_execucao || t.prazo
      if (d) map[d] = (map[d] || 0) + 1
    })
    // preenche todos os dias do mês
    const dias = []
    for (let d = 1; d <= ultimoDia; d++) {
      const key = `${ano}-${String(mes + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      if (isMesAtual && key > todayStr) break
      dias.push({ dia: d, concluidas: map[key] || 0 })
    }
    return dias
  }, [conclPeriodo, ano, mes, ultimoDia, todayStr, isMesAtual])

  // 2. Por operador (concluídas vs abertas)
  const porOperador = useMemo(() => {
    const map = {}
    tarefasPeriodo.forEach(t => {
      if (!t.responsavel_id) return
      const membro = membros.find(m => m.id === t.responsavel_id)
      const nome = membro?.nome?.split(' ')[0] || 'Sem nome'
      if (!map[t.responsavel_id]) map[t.responsavel_id] = { nome, concluidas: 0, abertas: 0 }
      if (t.status === 'concluida') map[t.responsavel_id].concluidas++
      else if (!['cancelada'].includes(t.status)) map[t.responsavel_id].abertas++
    })
    return Object.values(map).sort((a, b) => (b.concluidas + b.abertas) - (a.concluidas + a.abertas)).slice(0, 8)
  }, [tarefasPeriodo, membros])

  // 3. Por cliente (top 6)
  const porCliente = useMemo(() => {
    const map = {}
    tarefasPeriodo.forEach(t => {
      if (!t.cliente_id) return
      const cl = clients.find(c => c.id === t.cliente_id)
      const nome = cl?.fantasia || cl?.razao_social || '?'
      if (!map[t.cliente_id]) map[t.cliente_id] = { nome, concluidas: 0, abertas: 0, pendentes: 0 }
      if (t.status === 'concluida') map[t.cliente_id].concluidas++
      else if (!['cancelada'].includes(t.status)) map[t.cliente_id].abertas++
    })
    // adicionar pendentes gerais por cliente
    pendentes.forEach(t => {
      if (t.cliente_id && map[t.cliente_id]) map[t.cliente_id].pendentes++
    })
    return Object.values(map).sort((a, b) => (b.concluidas + b.abertas) - (a.concluidas + a.abertas)).slice(0, 6)
  }, [tarefasPeriodo, pendentes, clients])

  // 4. Distribuição por status (pie)
  const porStatus = useMemo(() => {
    const map = {}
    abertas.forEach(t => { map[t.status] = (map[t.status] || 0) + 1 })
    const labels = { aberta:'Aberta', andamento:'Em andamento', aguardando:'Ag. cliente', revisao:'Revisão', impedimento:'Impedimento' }
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] || k, value: v, color: STATUS_COLOR[k] || '#94A3B8' }))
  }, [abertas])

  // ── Export Excel ─────────────────────────────────────────────────────────────
  // Usa xlsx-js-style (mesma lib das outras exportações do sistema) em vez do
  // xlsx puro — sem isso a planilha saía sem largura de coluna nem cabeçalho
  // destacado, ficando com texto cortado/desconfigurado ao abrir.
  function exportarExcel() {
    import('xlsx-js-style').then(({ default: XLSXStyle }) => {
      const BRAND = '4F46E5', BRAND_DARK = '3730A3', WHITE = 'FFFFFF', GRAY = '475569', LIGHT = 'EEF2FF'

      function sheetFromRows(rows, headers) {
        const X = XLSXStyle.utils.encode_cell
        const ws = {}
        headers.forEach((h, ci) => {
          ws[X({ r:0, c:ci })] = { v:h, t:'s', s:{
            fill:{ fgColor:{ rgb:BRAND } }, font:{ bold:true, color:{ rgb:WHITE }, sz:10 },
            alignment:{ horizontal:'center', vertical:'center' },
          }}
        })
        rows.forEach((row, ri) => {
          headers.forEach((h, ci) => {
            const value = row[h] ?? ''
            ws[X({ r:1+ri, c:ci })] = { v:value, t: typeof value === 'number' ? 'n' : 's', s:{
              fill:{ fgColor:{ rgb: ri % 2 === 0 ? LIGHT : WHITE } }, font:{ color:{ rgb:GRAY }, sz:10 },
            }}
          })
        })
        const colWidths = headers.map(h => {
          const maxLen = rows.reduce((max, row) => Math.max(max, String(row[h] ?? '').length), h.length)
          return { wch: Math.min(Math.max(maxLen + 2, 10), 45) }
        })
        ws['!ref'] = XLSXStyle.utils.encode_range({ s:{r:0,c:0}, e:{r:rows.length, c:headers.length-1} })
        ws['!cols'] = colWidths
        return ws
      }

      const wb = XLSXStyle.utils.book_new()

      // Aba Resumo
      const resumoHeaders = ['Métrica', 'Valor']
      const resumoRows = [
        { Métrica:'Período', Valor:`${MESES[mes]} ${ano}` },
        { Métrica:'MRR Total', Valor:mrr },
        { Métrica:'Clientes ativos', Valor:ativos.length },
        { Métrica:'Tarefas no período', Valor:tarefasPeriodo.length },
        { Métrica:'Concluídas', Valor:conclPeriodo.length },
        { Métrica:'Taxa de conclusão', Valor:`${taxa}%` },
        { Métrica:'Pendentes (backlog)', Valor:pendentes.length },
        { Métrica:'Horas registradas', Valor:`${horasPeriodo.toFixed(1)}h` },
      ]
      XLSXStyle.utils.book_append_sheet(wb, sheetFromRows(resumoRows, resumoHeaders), 'Resumo')

      // Aba Tarefas do período
      const tarefasHeaders = ['Título','Cliente','Status','Prioridade','Categoria','Data execução','Prazo','Responsável']
      const tarefasRows = tarefasPeriodo.map(t => ({
        'Título': t.titulo,
        'Cliente': clients.find(c => c.id === t.cliente_id)?.razao_social || '',
        'Status': t.status,
        'Prioridade': t.prioridade,
        'Categoria': t.categoria || '',
        'Data execução': t.data_execucao || '',
        'Prazo': t.prazo || '',
        'Responsável': membros.find(m => m.id === t.responsavel_id)?.nome || '',
      }))
      XLSXStyle.utils.book_append_sheet(wb, sheetFromRows(tarefasRows, tarefasHeaders), 'Tarefas')

      // Aba Pendentes
      const pendHeaders = ['Título','Cliente','Data','Motivo','Status']
      const pendRows = pendentes.map(t => ({
        'Título': t.titulo,
        'Cliente': clients.find(c => c.id === t.cliente_id)?.razao_social || '',
        'Data': t.data_execucao || t.prazo || '',
        'Motivo': t.motivo_pendencia || '',
        'Status': t.status,
      }))
      XLSXStyle.utils.book_append_sheet(wb, sheetFromRows(pendRows, pendHeaders), 'Pendentes')

      // Aba Por operador
      const operHeaders = ['Operador','Concluídas','Em aberto','Total']
      const operRows = porOperador.map(o => ({
        'Operador': o.nome, 'Concluídas': o.concluidas, 'Em aberto': o.abertas, 'Total': o.concluidas + o.abertas,
      }))
      XLSXStyle.utils.book_append_sheet(wb, sheetFromRows(operRows, operHeaders), 'Por operador')

      // Aba Horas
      const byU = {}
      aponts.filter(ap => ap.inicio?.slice(0,10) >= periodoStart && ap.inicio?.slice(0,10) <= periodoEnd)
            .forEach(ap => {
              const nome = membros.find(m => m.id === ap.usuario_id)?.nome || 'Desconhecido'
              byU[nome] = (byU[nome] || 0) + (ap.segundos || 0)
            })
      const horasHeaders = ['Usuário','Horas']
      const horasRows = Object.entries(byU).sort((a,b)=>b[1]-a[1]).map(([nome, seg]) => ({
        'Usuário': nome, 'Horas': Number((seg/3600).toFixed(1)),
      }))
      XLSXStyle.utils.book_append_sheet(wb, sheetFromRows(horasRows, horasHeaders), 'Horas')

      XLSXStyle.writeFile(wb, `relatorio_${String(mes+1).padStart(2,'0')}_${ano}.xlsx`)
    })
  }

  if (clLoad || tLoad) return <Loader />

  const isProximoMes = !(ano > hoje.getFullYear() || (ano === hoje.getFullYear() && mes >= hoje.getMonth()))

  return (
    <div>
      <style>{PRINT_STYLE}</style>

      {/* ── Barra superior ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }} className="no-print">

        {/* Seletor de mês */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={prevMes}
            style={{ width:32, height:32, borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155' }}>
            ‹
          </button>
          <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', minWidth:160, textAlign:'center' }}>
            {MESES[mes]} {ano}
          </div>
          <button onClick={nextMes}
            style={{ width:32, height:32, borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:isProximoMes?'pointer':'not-allowed', opacity:isProximoMes?1:.4, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155' }}>
            ›
          </button>
          {!isMesAtual && (
            <button onClick={() => { setAno(hoje.getFullYear()); setMes(hoje.getMonth()) }}
              style={{ padding:'4px 12px', borderRadius:8, border:'1px solid #6366F1', background:'#EEF2FF', fontSize:11, fontWeight:700, color:'#6366F1', cursor:'pointer' }}>
              Hoje
            </button>
          )}
        </div>

        {/* Ações */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportarExcel}
            style={{ padding:'7px 16px', borderRadius:8, border:'1px solid #CBD5E1', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#334155' }}>
            ⬇ Exportar Excel
          </button>
          <button onClick={() => window.print()}
            style={{ padding:'7px 16px', borderRadius:8, border:'1px solid #6366F1', background:'#6366F1', cursor:'pointer', fontSize:12, fontWeight:600, color:'#fff' }}>
            🖨 Imprimir
          </button>
        </div>
      </div>

      <div id="relatorio-print">

        {/* ── KPIs ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
          <KPI label="MRR atual"           value={`R$ ${(mrr/1000).toFixed(1)}k`}  color="blue"   icon="💰" sub={`${ativos.length} clientes ativos`} />
          <KPI label="Tarefas no período"  value={tarefasPeriodo.length}             color="purple" icon="📋" sub={`${MESES[mes]} ${ano}`} />
          <KPI label="Concluídas"          value={conclPeriodo.length}               color="green"  icon="✅" sub={`${taxa}% de conclusão`} />
          <KPI label="Em aberto"           value={abertas.length}                    color={abertas.length > 0 ? 'yellow' : 'green'} icon="⏳" />
          <KPI label="Pendentes (backlog)" value={pendentes.length}                  color={pendentes.length > 0 ? 'red' : 'green'} icon="⚠️" sub="de dias anteriores" />
          <KPI label="Horas registradas"   value={`${horasPeriodo.toFixed(1)}h`}    color="cyan"   icon="⏱" sub={`em ${MESES[mes]}`} />
        </div>

        {/* ── Gráfico: concluídas por dia ── */}
        <ChartCard title={`Tarefas concluídas por dia — ${MESES[mes]}`} icon="📈" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conclPorDia} margin={{ top:4, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="dia" tick={{ fontSize:11, fill:'#94A3B8' }} />
              <YAxis tick={{ fontSize:11, fill:'#94A3B8' }} allowDecimals={false} />
              <Tooltip content={<TooltipCustom />} />
              <Bar dataKey="concluidas" name="Concluídas" fill="#22C55E" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Grid: por operador + por status ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>

          {/* Por operador */}
          <ChartCard title="Por operador" icon="👤" height={porOperador.length > 0 ? Math.max(180, porOperador.length * 44) : 180}>
            {porOperador.length === 0
              ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94A3B8', fontSize:13 }}>Sem tarefas atribuídas no período</div>
              : <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porOperador} layout="vertical" margin={{ top:0, right:24, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:11, fill:'#94A3B8' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize:11, fill:'#334155' }} width={80} />
                    <Tooltip content={<TooltipCustom />} />
                    <Legend wrapperStyle={{ fontSize:11 }} />
                    <Bar dataKey="concluidas" name="Concluídas" fill="#22C55E" stackId="a" radius={[0,0,0,0]} />
                    <Bar dataKey="abertas"    name="Em aberto"  fill="#F59E0B" stackId="a" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </ChartCard>

          {/* Status das abertas (pie) */}
          <ChartCard title="Status das tarefas em aberto" icon="🔵" height={porStatus.length > 0 ? 220 : 180}>
            {porStatus.length === 0
              ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94A3B8', fontSize:13 }}>Nenhuma tarefa em aberto no período</div>
              : <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={porStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {porStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<TooltipCustom />} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </ChartCard>
        </div>

        {/* ── Por cliente ── */}
        {porCliente.length > 0 && (
          <ChartCard title="Tarefas por cliente" icon="🏢" height={Math.max(200, porCliente.length * 44)} style={{ marginTop:14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porCliente} layout="vertical" margin={{ top:0, right:24, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11, fill:'#94A3B8' }} allowDecimals={false} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize:11, fill:'#334155' }} width={110} />
                <Tooltip content={<TooltipCustom />} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="concluidas" name="Concluídas" fill="#6366F1" stackId="a" />
                <Bar dataKey="abertas"    name="Em aberto"  fill="#E0E7FF" stackId="a" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Tabela pendentes ── */}
        {pendentes.length > 0 && (
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #E2E8F0', overflow:'hidden', marginTop:14 }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #FEE2E2', background:'#FFF8F8', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>⚠️</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#991B1B' }}>Pendentes de dias anteriores ({pendentes.length})</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#FEF2F2' }}>
                    {['Título','Cliente','Data','Status','Responsável','Motivo'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color:'#991B1B', borderBottom:'1px solid #FECDD3', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendentes.slice(0, 50).map(t => {
                    const cl = clients.find(c => c.id === t.cliente_id)
                    const resp = membros.find(m => m.id === t.responsavel_id)
                    const d = t.data_execucao || t.prazo
                    const diasAtras = d ? Math.floor((new Date(hoje) - new Date(d + 'T12:00:00')) / 86400000) : null
                    return (
                      <tr key={t.id} style={{ borderBottom:'1px solid #FEF2F2' }}>
                        <td style={{ padding:'8px 12px', color:'#0F172A', fontWeight:500 }}>{t.titulo}</td>
                        <td style={{ padding:'8px 12px', color:'#475569' }}>{cl?.fantasia || cl?.razao_social || '—'}</td>
                        <td style={{ padding:'8px 12px', color:'#991B1B', fontWeight:600, whiteSpace:'nowrap' }}>
                          {d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                          {diasAtras !== null && <span style={{ fontSize:10, color:'#EF4444', marginLeft:4 }}>({diasAtras}d)</span>}
                        </td>
                        <td style={{ padding:'8px 12px', color:'#475569' }}>{t.status}</td>
                        <td style={{ padding:'8px 12px', color:'#475569' }}>{resp?.nome?.split(' ')[0] || '—'}</td>
                        <td style={{ padding:'8px 12px', color:'#EF4444', fontStyle: t.motivo_pendencia ? 'normal' : 'italic' }}>
                          {t.motivo_pendencia || <span style={{ color:'#CBD5E1' }}>sem motivo</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {pendentes.length > 50 && (
                <div style={{ padding:'8px 12px', fontSize:11, color:'#94A3B8', textAlign:'center' }}>
                  Mostrando 50 de {pendentes.length}. Exporte o Excel para ver todos.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
