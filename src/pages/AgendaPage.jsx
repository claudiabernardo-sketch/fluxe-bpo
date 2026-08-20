// ─────────────────────────────────────────────────────────────────────────────
// AgendaPage.jsx — Central Operacional BPO Financeiro
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useRef } from 'react'
import { useTasks, useClients, useApontamentos, usePendencias, useRotinas, useProjecaoTarefas } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { Loader } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQueryClient, useQuery } from '@tanstack/react-query'

// ── Date helpers ──────────────────────────────────────────────────────────────
function fmtDate(d) { return d.toLocaleDateString('en-CA') } // en-CA = YYYY-MM-DD no fuso local
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function startOfWeek(d) {
  const r = new Date(d); const day = r.getDay()
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day)); return r
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }

// ── Constants ─────────────────────────────────────────────────────────────────
const DIAS_SEMANA  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const MESES        = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_SHORT  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const STATUS_COLOR = { aberta:'#3B82F6', andamento:'#F59E0B', aguardando:'#8B5CF6', concluida:'#22C55E', impedimento:'#EF4444', cancelada:'#94A3B8' }
const STATUS_BG    = { aberta:'#EFF6FF', andamento:'#FFFBEB', aguardando:'#F5F3FF', concluida:'#F0FDF4', impedimento:'#FEF2F2', cancelada:'#F8FAFC' }
const STATUS_LABEL = { aberta:'Aberta', andamento:'Em andamento', aguardando:'Ag. cliente', concluida:'Concluída', impedimento:'Impedimento', cancelada:'Cancelada' }

const KANBAN_COLS = [
  { status:'aberta',     label:'A Fazer',           color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE' },
  { status:'andamento',  label:'Em Andamento',       color:'#F59E0B', bg:'#FFFBEB', border:'#FDE68A' },
  { status:'aguardando', label:'Aguardando Cliente', color:'#8B5CF6', bg:'#F5F3FF', border:'#DDD6FE' },
  { status:'concluida',  label:'Concluído',          color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0' },
]

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(s)  { return s >= 80 ? '#16A34A' : s >= 60 ? '#D97706' : '#DC2626' }
function scoreBg(s)     { return s >= 80 ? '#F0FDF4' : s >= 60 ? '#FFFBEB' : '#FEF2F2' }
function scoreBorder(s) { return s >= 80 ? '#BBF7D0' : s >= 60 ? '#FDE68A' : '#FECDD3' }

// ─────────────────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { profile, empresa } = useAuthStore()
  const { data: tasks = [],  isLoading: tLoad  } = useTasks()
  const { data: clients = [], isLoading: clLoad } = useClients()
  const { data: aponts = [] }  = useApontamentos()
  const { data: pends = [] }   = usePendencias({ status: 'aberta' })
  const { data: todasRotinas = [] } = useRotinas()
  const nav = useNavigate()
  const qc  = useQueryClient()

  // Membros
  const { data: membros = [] } = useQuery({
    queryKey: ['membros_central', empresa?.id],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('id, nome, perfil').eq('empresa_id', empresa?.id)
      return data || []
    },
    enabled: !!empresa?.id,
  })

  const today = fmtDate(new Date())
  const hora  = new Date().getHours()

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('central')

  // ── Filtros Central ───────────────────────────────────────────────────────
  const [fCliente,   setFCliente]   = useState('')
  const [fOperador,  setFOperador]  = useState('')
  const [fCategoria, setFCategoria] = useState('')
  const [fPrio,      setFPrio]      = useState('hoje') // 'hoje'|'atrasadas'|'aguardando'|'impedimento'
  const [rotinasDone, setRotinasDone] = useState(new Set())
  const toggleRotina = id => setRotinasDone(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // ── Filtros Kanban ────────────────────────────────────────────────────────
  const [kanbanPeriodo, setKanbanPeriodo] = useState('semana')
  const [kanbanCliente, setKanbanCliente] = useState('')

  // ── Calendário ────────────────────────────────────────────────────────────
  const [base,          setBase]          = useState(new Date())
  const [viewMode,      setViewMode]      = useState('mes')
  const [diaFoco,       setDiaFoco]       = useState(today)
  const [diaSelecionado,setDiaSelecionado]= useState(null)

  // ── Drag and drop ─────────────────────────────────────────────────────────
  const draggedId   = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  // ─────────────────────────────────────────────────────────────────────────
  // DATA COMPUTED
  // ─────────────────────────────────────────────────────────────────────────
  const tarefasAtivas = useMemo(() => tasks.filter(t => t.status !== 'cancelada'), [tasks])

  const atrasadas = useMemo(() =>
    tarefasAtivas.filter(t => {
      const d = t.data_execucao || t.prazo
      return d && d < today && t.status !== 'concluida'
    }), [tarefasAtivas, today])

  const tarefasHoje = useMemo(() =>
    tarefasAtivas.filter(t => (t.data_execucao || t.prazo) === today)
  , [tarefasAtivas, today])

  const conclHoje = useMemo(() =>
    tasks.filter(t => (t.data_execucao || t.prazo) === today && t.status === 'concluida')
  , [tasks, today])

  const aguardando = useMemo(() => tarefasAtivas.filter(t => t.status === 'aguardando'), [tarefasAtivas])
  const impedimentos = useMemo(() => tarefasAtivas.filter(t => t.status === 'impedimento'), [tarefasAtivas])

  const horasHoje = useMemo(() =>
    aponts.filter(ap => ap.inicio?.slice(0,10) === today).reduce((a,ap) => a + (ap.segundos||0), 0) / 3600
  , [aponts, today])

  // Rotinas de hoje — converte JS getDay() (0=Dom..6=Sáb) para (0=Seg..6=Dom)
  const rotinasHoje = useMemo(() => {
    const d = new Date()
    const jsDow = d.getDay() // 0=Dom, 1=Seg... 6=Sab
    const dow   = jsDow === 0 ? 6 : jsDow - 1 // 0=Seg..6=Dom
    const dom   = d.getDate()
    const mes   = d.getMonth() + 1
    return todasRotinas
      .filter(r => r.ativo && (
        r.tipo === 'diaria' ||
        (r.tipo === 'semanal' && (r.dias_semana?.length ? r.dias_semana.includes(dow) : r.dia_semana === dow)) ||
        (r.tipo === 'mensal'  && r.dia_mes === dom) ||
        (r.tipo === 'anual'   && r.dia_mes === dom && r.mes === mes)
      ))
      .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
  }, [todasRotinas])

  // Lista filtrada para Tarefas de Hoje
  const listaFiltrada = useMemo(() => {
    const base = fPrio === 'atrasadas' ? atrasadas : fPrio === 'aguardando' ? aguardando : fPrio === 'impedimento' ? impedimentos : tarefasHoje
    return base.filter(t =>
      (!fCliente   || t.cliente_id     === fCliente) &&
      (!fOperador  || t.responsavel_id === fOperador) &&
      (!fCategoria || t.categoria      === fCategoria)
    )
  }, [fPrio, atrasadas, aguardando, impedimentos, tarefasHoje, fCliente, fOperador, fCategoria])

  const categorias = useMemo(() => [...new Set(tarefasAtivas.map(t => t.categoria).filter(Boolean))].sort(), [tarefasAtivas])

  // Saúde dos clientes
  const saudeClientes = useMemo(() => {
    return clients.filter(c => c.status === 'ativo').map(c => {
      const ct    = tarefasAtivas.filter(t => t.cliente_id === c.id)
      const aber  = ct.filter(t => t.status !== 'concluida').length
      const venc  = ct.filter(t => { const d = t.data_execucao||t.prazo; return d && d < today && t.status !== 'concluida' }).length
      const pend  = pends.filter(p => p.cliente_id === c.id).length
      const score = Math.max(0, Math.min(100, 100 - venc*12 - pend*6))
      return { ...c, aber, venc, pend, score }
    }).sort((a,b) => a.score - b.score)
  }, [clients, tarefasAtivas, pends, today])

  // Planejamento — "Hoje" conta tarefa real (já foi gerada pelo cron do dia).
  // Os demais são projeção: o gerador só cria a tarefa do dia, não existe
  // "tarefa de amanhã" no banco ainda, então precisa simular a recorrência
  // (gerar-tarefas em dry_run) pra saber quantas VÃO existir.
  const amanha = fmtDate(addDays(new Date(), 1))
  const fim7   = fmtDate(addDays(new Date(), 7))
  const fim30  = fmtDate(addDays(new Date(), 30))
  const fimMesStr = fmtDate(endOfMonth(new Date()))
  const fimFechamento = fimMesStr >= amanha ? fimMesStr : null

  const { data: proj7,   isLoading: proj7Loading }   = useProjecaoTarefas(amanha, fim7)
  const { data: proj30,  isLoading: proj30Loading }  = useProjecaoTarefas(amanha, fim30)
  const { data: projFechamento, isLoading: projFechamentoLoading } = useProjecaoTarefas(amanha, fimFechamento)

  const planejamento = useMemo(() => ({
    hoje:       tarefasHoje.filter(t => t.status !== 'concluida').length,
    d7:         proj7 ?? 0,
    d30:        proj30 ?? 0,
    fechamento: fimFechamento ? (projFechamento ?? 0) : 0,
    carregando: proj7Loading || proj30Loading || projFechamentoLoading,
    fimMes:     fimMesStr,
  }), [tarefasHoje, proj7, proj30, projFechamento, proj7Loading, proj30Loading, projFechamentoLoading, fimFechamento, fimMesStr])

  // Kanban tasks
  const kanbanTasks = useMemo(() => {
    let base = [...tarefasAtivas]
    if (kanbanPeriodo === 'hoje') {
      base = base.filter(t => { const d=t.data_execucao||t.prazo; return d===today || t.status==='andamento' })
    } else if (kanbanPeriodo === 'semana') {
      const fim = fmtDate(addDays(new Date(), 7))
      base = base.filter(t => { const d=t.data_execucao||t.prazo; return !d || d<=fim || t.status==='andamento' })
    } else if (kanbanPeriodo === 'mes') {
      const fim = fmtDate(addDays(new Date(), 30))
      base = base.filter(t => { const d=t.data_execucao||t.prazo; return !d || d<=fim })
    }
    if (kanbanCliente) base = base.filter(t => t.cliente_id === kanbanCliente)
    return base
  }, [tarefasAtivas, kanbanPeriodo, kanbanCliente, today])

  // Calendário porDia — aplica filtros de cliente e categoria
  const porDia = useMemo(() => {
    const map = {}
    tasks
      .filter(t => !fCliente  || t.cliente_id === fCliente)
      .filter(t => !fCategoria || t.categoria === fCategoria)
      .forEach(t => {
        const d = t.data_execucao || t.prazo
        if (d) { if (!map[d]) map[d]=[]; map[d].push(t) }
      })
    return map
  }, [tasks, fCliente, fCategoria])

  // Calendário: rotinas por dia (recorrências visuais)
  const rotinasPorDia = useMemo(() => {
    const map = {}
    const hoje = new Date()
    const ini  = startOfMonth(base), fim = endOfMonth(base)
    for (let d = new Date(ini); d <= fim; d.setDate(d.getDate()+1)) {
      const key    = fmtDate(d)
      const jsDow  = d.getDay()
      const dow    = jsDow === 0 ? 6 : jsDow - 1
      const dom    = d.getDate()
      const mes    = d.getMonth() + 1
      const lista  = todasRotinas.filter(r => r.ativo &&
        (!fCliente || r.cliente_id === fCliente) && (
          r.tipo === 'diaria' ||
          (r.tipo === 'semanal' && (r.dias_semana?.length ? r.dias_semana.includes(dow) : r.dia_semana === dow)) ||
          (r.tipo === 'mensal'  && r.dia_mes === dom) ||
          (r.tipo === 'anual'   && r.dia_mes === dom && r.mes === mes)
        )
      )
      if (lista.length) map[key] = lista
    }
    return map
  }, [todasRotinas, base, fCliente])

  const semanaBase = useMemo(() => startOfWeek(base), [base])
  const diasSemana = useMemo(() => Array.from({length:7},(_,i)=>addDays(semanaBase,i)), [semanaBase])
  const diasMes    = useMemo(() => {
    const ini = startOfMonth(base), fim = endOfMonth(base), dias = []
    const off = ini.getDay() === 0 ? 6 : ini.getDay() - 1
    for (let i=0; i<off; i++) dias.push(null)
    for (let d=new Date(ini); d<=fim; d.setDate(d.getDate()+1)) dias.push(new Date(d))
    while (dias.length%7!==0) dias.push(null)
    return dias
  }, [base])

  // ── Drag and drop ─────────────────────────────────────────────────────────
  async function handleDrop(e, newStatus) {
    e.preventDefault(); setDragOver(null)
    if (!draggedId.current) return
    const id = draggedId.current; draggedId.current = null
    const { error } = await supabase.from('tarefas').update({ status: newStatus }).eq('id', id).eq('empresa_id', empresa?.id)
    if (error) { console.error('[Fluxe] mover tarefa', error); alert('Não foi possível mover a tarefa: ' + error.message) }
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const nomeCliente    = id => { const c = clients.find(c=>c.id===id); return c ? (c.fantasia||c.razao_social) : '—' }
  const nomeResponsavel= id => { const m = membros.find(m=>m.id===id); return m ? m.nome.split(' ')[0] : '—' }
  const fi = { padding:'6px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:11, fontFamily:'inherit', background:'#fff', color:'#334155', outline:'none' }

  const navCal = dir => {
    if (viewMode === 'dia') setBase(d => addDays(d, dir))
    else if (viewMode === 'semana') setBase(d => addDays(d, dir*7))
    else setBase(d => new Date(d.getFullYear(), d.getMonth()+dir, 1))
  }

  if (tLoad || clLoad) return <Loader />

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 110px)', gap:0 }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexShrink:0, flexWrap:'wrap', gap:8 }}>
        <div>
          <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:'#0F172A' }}>Central Operacional</h1>
          <p style={{ margin:0, fontSize:12, color:'#64748B', textTransform:'capitalize' }}>
            {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            {atrasadas.length > 0 && <span style={{ marginLeft:10, color:'#EF4444', fontWeight:700 }}>· ⚠ {atrasadas.length} atrasada{atrasadas.length>1?'s':''}</span>}
          </p>
        </div>
        {/* Tab switcher */}
        <div style={{ display:'flex', background:'#F1F5F9', borderRadius:10, padding:3, gap:2 }}>
          {[['central','⚡ Central'],['kanban','☰ Fila de Trabalho'],['calendario','📅 Calendário']].map(([v,l]) => (
            <button key={v} onClick={()=>setTab(v)} style={{
              padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: tab===v?'#fff':'transparent', color: tab===v?'#6366F1':'#64748B',
              boxShadow: tab===v?'0 1px 4px rgba(0,0,0,.08)':'none', transition:'all .15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: CENTRAL OPERACIONAL
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'central' && (
        <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', gap:16, paddingBottom:8 }}>

          {/* ── PRIORIDADES DO DIA ── */}
          <section>
            <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>⚡ Prioridades do Dia</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
              {[
                { key:'atrasadas',   label:'Atrasadas',       count:atrasadas.length,  icon:'🔴', c:'#991B1B', bg:'#FEF2F2', border:'#FECDD3', sub:'de dias anteriores' },
                { key:'hoje',        label:'Vencem Hoje',     count:tarefasHoje.filter(t=>t.status!=='concluida').length, icon:'🟡', c:'#92400E', bg:'#FFFBEB', border:'#FDE68A', sub:'tarefas do dia' },
                { key:'aguardando',  label:'Ag. Cliente',     count:aguardando.length, icon:'🟣', c:'#5B21B6', bg:'#F5F3FF', border:'#DDD6FE', sub:'aguardando retorno' },
                { key:'impedimento', label:'Impedimentos',    count:impedimentos.length,icon:'🟠', c:'#9A3412', bg:'#FFF7ED', border:'#FED7AA', sub:'bloqueadas' },
              ].map(p => (
                <div key={p.key} onClick={() => setFPrio(fPrio===p.key ? 'hoje' : p.key)}
                  style={{
                    background:p.bg, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all .15s',
                    border:`2px solid ${fPrio===p.key ? p.c : p.border}`,
                    transform: fPrio===p.key ? 'translateY(-2px)' : 'none',
                    boxShadow: fPrio===p.key ? `0 4px 14px ${p.c}25` : 'none',
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <span style={{ fontSize:20 }}>{p.icon}</span>
                    {p.count > 0 && <span style={{ fontSize:9, fontWeight:800, color:p.c, background:`${p.c}18`, padding:'2px 7px', borderRadius:99 }}>{p.count}</span>}
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color:p.count>0?p.c:'#CBD5E1', lineHeight:1, marginBottom:3 }}>{p.count}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:p.c }}>{p.label}</div>
                  <div style={{ fontSize:9, color:'#94A3B8', marginTop:2 }}>{p.sub}</div>
                </div>
              ))}
              {/* Concluídas hoje */}
              <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <span style={{ fontSize:20 }}>✅</span>
                  {horasHoje > 0 && <span style={{ fontSize:9, fontWeight:700, color:'#15803D' }}>{horasHoje.toFixed(1)}h</span>}
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:'#15803D', lineHeight:1, marginBottom:3 }}>{conclHoje.length}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'#15803D' }}>Concluídas hoje</div>
                <div style={{ fontSize:9, color:'#94A3B8', marginTop:2 }}>{horasHoje>0 ? `${horasHoje.toFixed(1)}h registradas` : 'sem apontamentos'}</div>
              </div>
            </div>
          </section>

          {/* ── ROTINAS DE HOJE ── */}
          {rotinasHoje.length > 0 && (
            <section style={{ background:'#F0FDF4', borderRadius:12, border:'1px solid #BBF7D0', overflow:'hidden', flexShrink:0 }}>
              <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13 }}>🔁</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#065F46', flex:1 }}>
                  Rotinas de Hoje
                  <span style={{ marginLeft:6, fontSize:11, color:'#6EE7B7', fontWeight:400 }}>
                    {rotinasDone.size}/{rotinasHoje.length}
                  </span>
                </span>
                {rotinasDone.size > 0 && (
                  <button onClick={() => setRotinasDone(new Set())}
                    style={{ fontSize:10, color:'#6EE7B7', background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>
                    limpar ✕
                  </button>
                )}
              </div>
              {/* Barra de progresso */}
              <div style={{ height:3, background:'#D1FAE5', margin:'0 0 0 0' }}>
                <div style={{ height:'100%', background:'#16A34A', borderRadius:2,
                  width: rotinasHoje.length ? `${Math.round(rotinasDone.size/rotinasHoje.length*100)}%` : '0%',
                  transition:'width .3s' }} />
              </div>
              {/* Linha do tempo horizontal com scroll */}
              <div style={{ overflowX:'auto', padding:'10px 16px', display:'flex', gap:8, alignItems:'center',
                scrollbarWidth:'thin', scrollbarColor:'#BBF7D0 transparent' }}>
                {rotinasHoje.map(r => {
                  const cl = clients.find(c => c.id === r.cliente_id)
                  const nomeCliente = cl ? (cl.fantasia || cl.razao_social) : '—'
                  const nomeResp = cl?.usuarios?.nome
                  const iniciais = nomeResp ? nomeResp.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : null
                  const done = rotinasDone.has(r.id)
                  return (
                    <button key={r.id} onClick={() => toggleRotina(r.id)}
                      title={`${nomeCliente}${nomeResp ? ' · ' + nomeResp : ''}${r.observacao ? '\n' + r.observacao : ''}`}
                      style={{
                        flexShrink:0, display:'flex', alignItems:'center', gap:6,
                        background: done ? '#DCFCE7' : '#fff',
                        border: done ? '1.5px solid #16A34A' : '1px solid #BBF7D0',
                        borderRadius:20, padding:'5px 12px 5px 8px',
                        cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap',
                        opacity: done ? 0.7 : 1,
                      }}>
                      <span style={{
                        width:16, height:16, borderRadius:'50%', flexShrink:0,
                        border: done ? 'none' : '1.5px solid #BBF7D0',
                        background: done ? '#16A34A' : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:9, color:'#fff', fontWeight:700,
                      }}>{done ? '✓' : ''}</span>
                      {r.hora && <span style={{ fontSize:10, fontWeight:700, color:'#16A34A' }}>{r.hora.slice(0,5)}</span>}
                      <span style={{ fontSize:11, fontWeight:600, color:'#065F46',
                        textDecoration: done ? 'line-through' : 'none' }}>{r.titulo}</span>
                      <span style={{ fontSize:10, color:'#6EE7B7', fontWeight:500 }}>· {nomeCliente}</span>
                      {iniciais && (
                        <span style={{
                          width:18, height:18, borderRadius:'50%', background:'#6366F1',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:8, color:'#fff', fontWeight:700, flexShrink:0,
                        }}>{iniciais}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── TAREFAS DE HOJE ── */}
          <section style={{ background:'#fff', borderRadius:12, border:'1px solid #E2E8F0', overflow:'hidden', flexShrink:0 }}>
            <div style={{ padding:'11px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:14 }}>
                {fPrio==='atrasadas'?'🔴':fPrio==='aguardando'?'🟣':fPrio==='impedimento'?'🟠':'☀️'}
              </span>
              <span style={{ fontSize:13, fontWeight:700, color:'#0F172A', flex:1 }}>
                {fPrio==='atrasadas'?'Tarefas Atrasadas':fPrio==='aguardando'?'Aguardando Cliente':fPrio==='impedimento'?'Impedimentos':'Tarefas de Hoje'}
                <span style={{ marginLeft:6, fontSize:11, color:'#94A3B8', fontWeight:400 }}>({listaFiltrada.length})</span>
              </span>
              <select value={fCliente}   onChange={e=>setFCliente(e.target.value)}   style={fi}>
                <option value="">Todos os clientes</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
              </select>
              <select value={fOperador}  onChange={e=>setFOperador(e.target.value)}  style={fi}>
                <option value="">Todos os operadores</option>
                {membros.map(m=><option key={m.id} value={m.id}>{m.nome.split(' ')[0]}</option>)}
              </select>
              <select value={fCategoria} onChange={e=>setFCategoria(e.target.value)} style={fi}>
                <option value="">Todas as categorias</option>
                {categorias.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              {(fCliente||fOperador||fCategoria) && (
                <button onClick={()=>{setFCliente('');setFOperador('');setFCategoria('')}}
                  style={{...fi,color:'#EF4444',cursor:'pointer'}}>✕</button>
              )}
            </div>

            {listaFiltrada.length === 0 ? (
              <div style={{ padding:32, textAlign:'center', color:'#94A3B8', fontSize:13 }}>
                {fPrio==='hoje' ? '🎉 Nenhuma tarefa para hoje!' : 'Nenhuma tarefa nesta categoria.'}
              </div>
            ) : (
              <div style={{ overflowX:'auto', maxHeight:320, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead style={{ position:'sticky', top:0, zIndex:1 }}>
                    <tr style={{ background:'#F8FAFC' }}>
                      {['Cliente','Tarefa','Categoria','Responsável','Data','Status'].map(h=>(
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, color:'#64748B', borderBottom:'1px solid #E2E8F0', whiteSpace:'nowrap', fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listaFiltrada.map(t => {
                      const d = t.data_execucao || t.prazo
                      const atras = d && d < today && t.status !== 'concluida'
                      return (
                        <tr key={t.id} style={{ borderBottom:'1px solid #F8FAFC', cursor:'pointer', background:atras?'#FFF8F8':'transparent' }}
                          onClick={()=>nav('/tasks')}
                          onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                          onMouseLeave={e=>e.currentTarget.style.background=atras?'#FFF8F8':'transparent'}>
                          <td style={{ padding:'8px 12px', color:'#334155', whiteSpace:'nowrap', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis' }}>
                            {nomeCliente(t.cliente_id)}
                          </td>
                          <td style={{ padding:'8px 12px', fontWeight:600, color:'#0F172A', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {t.modelo_id && <span style={{ color:'#6366F1', marginRight:4, fontSize:10 }}>↻</span>}
                            {t.titulo}
                          </td>
                          <td style={{ padding:'8px 12px' }}>
                            {t.categoria
                              ? <span style={{ background:'#EEF2FF', color:'#6366F1', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600 }}>{t.categoria}</span>
                              : <span style={{ color:'#CBD5E1' }}>—</span>}
                          </td>
                          <td style={{ padding:'8px 12px', color:'#64748B', whiteSpace:'nowrap' }}>{nomeResponsavel(t.responsavel_id)}</td>
                          <td style={{ padding:'8px 12px', color:atras?'#EF4444':'#334155', fontWeight:atras?700:400, whiteSpace:'nowrap' }}>
                            {d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) : '—'}
                            {atras && <span style={{ marginLeft:3, fontSize:9 }}>⚠</span>}
                          </td>
                          <td style={{ padding:'8px 12px' }}>
                            <span style={{ background:STATUS_COLOR[t.status]+'22', color:STATUS_COLOR[t.status], padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
                              {STATUS_LABEL[t.status]||t.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── GRID: SAÚDE + PLANEJAMENTO ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

            {/* Saúde dos clientes */}
            <section style={{ background:'#fff', borderRadius:12, border:'1px solid #E2E8F0', overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>🏥</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#0F172A', flex:1 }}>Saúde dos Clientes</span>
                <span style={{ fontSize:9, color:'#94A3B8' }}>pior score primeiro</span>
              </div>
              <div style={{ maxHeight:280, overflowY:'auto' }}>
                {saudeClientes.length === 0
                  ? <div style={{ padding:24, textAlign:'center', color:'#94A3B8', fontSize:12 }}>Nenhum cliente ativo</div>
                  : saudeClientes.map(c => (
                    <div key={c.id}
                      onClick={()=>{ setFCliente(c.id); setFPrio('hoje') }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      {/* Score badge */}
                      <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, border:`2px solid ${scoreBorder(c.score)}`, background:scoreBg(c.score), display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ fontSize:13, fontWeight:800, color:scoreColor(c.score), lineHeight:1 }}>{c.score}</div>
                        <div style={{ fontSize:7, color:scoreColor(c.score), fontWeight:700 }}>score</div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {c.fantasia||c.razao_social}
                        </div>
                        <div style={{ fontSize:10, color:'#94A3B8', marginTop:1 }}>
                          {c.aber} abertas
                          {c.venc > 0 && <span style={{ color:'#EF4444', marginLeft:6, fontWeight:700 }}>· {c.venc} atrasada{c.venc>1?'s':''}</span>}
                          {c.pend > 0 && <span style={{ color:'#F59E0B', marginLeft:6, fontWeight:600 }}>· {c.pend} pendência{c.pend>1?'s':''}</span>}
                        </div>
                      </div>
                      <div style={{ width:56, height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden', flexShrink:0 }}>
                        <div style={{ height:'100%', borderRadius:99, width:`${c.score}%`, background:scoreColor(c.score), transition:'width .4s' }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </section>

            {/* Planejamento Operacional */}
            <section style={{ background:'#fff', borderRadius:12, border:'1px solid #E2E8F0', overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>📆</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>Planejamento Operacional</span>
              </div>
              <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { label:'Hoje',               value:planejamento.hoje, icon:'☀️', color:'#6366F1', sub:today, projetado:false },
                  { label:'Próximos 7 dias',     value:planejamento.d7,   icon:'📅', color:'#0EA5E9', sub:'excluindo hoje · projeção', projetado:true },
                  { label:'Próximos 30 dias',    value:planejamento.d30,  icon:'🗓', color:'#8B5CF6', sub:'excluindo hoje · projeção', projetado:true },
                  { label:'Até o fechamento',    value:planejamento.fechamento, icon:'📊', color:'#F59E0B', projetado:true,
                    sub:`projeção até ${new Date(planejamento.fimMes+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}` },
                ].map(p => (
                  <div key={p.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#F8FAFC', borderRadius:10, border:'1px solid #F1F5F9' }}>
                    <span style={{ fontSize:18 }}>{p.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#334155' }}>{p.label}</div>
                      <div style={{ fontSize:9, color:'#94A3B8' }}>{p.sub}</div>
                    </div>
                    <div style={{ fontSize:24, fontWeight:800, color:p.value>0?p.color:'#CBD5E1' }}>
                      {p.projetado && planejamento.carregando ? '…' : p.value}
                    </div>
                    <div style={{ fontSize:10, color:'#94A3B8' }}>tarefas</div>
                  </div>
                ))}
                <div style={{ fontSize:9, color:'#CBD5E1', textAlign:'center', marginTop:2 }}>
                  "Projeção" simula a recorrência configurada, ainda não existe como tarefa gerada
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: FILA DE TRABALHO (KANBAN)
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'kanban' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, overflow:'hidden' }}>
          {/* Filtros */}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, fontWeight:600, color:'#64748B' }}>Período:</span>
            {[['hoje','Hoje'],['semana','7 dias'],['mes','30 dias'],['todos','Todos']].map(([v,l])=>(
              <button key={v} onClick={()=>setKanbanPeriodo(v)} style={{
                padding:'5px 12px', borderRadius:8, border:`1px solid ${kanbanPeriodo===v?'#6366F1':'#E2E8F0'}`,
                background:kanbanPeriodo===v?'#6366F1':'#fff', color:kanbanPeriodo===v?'#fff':'#334155',
                cursor:'pointer', fontSize:11, fontWeight:600 }}>
                {l}
              </button>
            ))}
            <div style={{ width:1, height:20, background:'#E2E8F0' }} />
            <select value={kanbanCliente} onChange={e=>setKanbanCliente(e.target.value)} style={fi}>
              <option value="">Todos os clientes</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
            </select>
            <span style={{ fontSize:11, color:'#94A3B8', marginLeft:'auto' }}>
              {kanbanTasks.length} tarefas · arraste para mover
            </span>
          </div>

          {/* Colunas */}
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, overflow:'hidden', minWidth:700 }}>
            {KANBAN_COLS.map(col => {
              const colTasks = kanbanTasks.filter(t => t.status === col.status)
              const isOver   = dragOver === col.status
              return (
                <div key={col.status}
                  onDragOver={e=>{ e.preventDefault(); setDragOver(col.status) }}
                  onDragLeave={()=>setDragOver(null)}
                  onDrop={e=>handleDrop(e, col.status)}
                  style={{ display:'flex', flexDirection:'column', borderRadius:12, overflow:'hidden',
                    border:`2px solid ${isOver?col.color:col.border}`, background:isOver?col.bg:'#FAFAFA', transition:'all .15s' }}>
                  {/* Header */}
                  <div style={{ padding:'10px 14px', background:col.bg, borderBottom:`1px solid ${col.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:col.color }}>{col.label}</span>
                    <span style={{ fontSize:11, background:`${col.color}22`, color:col.color, padding:'2px 8px', borderRadius:99, fontWeight:700 }}>{colTasks.length}</span>
                  </div>
                  {/* Cards */}
                  <div style={{ flex:1, overflowY:'auto', padding:8, display:'flex', flexDirection:'column', gap:6 }}>
                    {colTasks.length === 0 && (
                      <div style={{ padding:16, textAlign:'center', color:'#CBD5E1', fontSize:11, border:'2px dashed #E2E8F0', borderRadius:8 }}>
                        Solte aqui
                      </div>
                    )}
                    {colTasks.map(t => {
                      const d     = t.data_execucao || t.prazo
                      const atras = d && d < today && t.status !== 'concluida'
                      const cl    = clients.find(c => c.id === t.cliente_id)
                      return (
                        <div key={t.id}
                          draggable
                          onDragStart={()=>{ draggedId.current = t.id }}
                          onDragEnd={()=>setDragOver(null)}
                          style={{
                            background:'#fff', borderRadius:8, padding:'10px 12px', cursor:'grab',
                            border:`1px solid ${atras?'#FECDD3':'#E2E8F0'}`,
                            borderLeft:`3px solid ${atras?'#EF4444':col.color}`,
                            boxShadow:'0 1px 3px rgba(0,0,0,.06)', transition:'box-shadow .15s',
                          }}
                          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'}
                          onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)'}>
                          {/* Cliente */}
                          <div style={{ fontSize:9, fontWeight:700, color:'#6366F1', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            🏢 {cl ? (cl.fantasia||cl.razao_social) : 'Sem cliente'}
                          </div>
                          {/* Título */}
                          <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', marginBottom:6, lineHeight:1.3 }}>
                            {t.modelo_id && <span style={{ color:'#6366F1', fontSize:10, marginRight:3 }}>↻</span>}
                            {t.titulo}
                          </div>
                          {/* Footer */}
                          <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
                            {t.categoria && <span style={{ fontSize:9, background:'#EEF2FF', color:'#6366F1', padding:'2px 6px', borderRadius:4, fontWeight:600 }}>{t.categoria}</span>}
                            {t.prioridade === 'alta'  && <span style={{ fontSize:9, background:'#FEF2F2', color:'#EF4444', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>↑ Alta</span>}
                            {t.prioridade === 'baixa' && <span style={{ fontSize:9, background:'#F0FDF4', color:'#22C55E', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>↓ Baixa</span>}
                            {d && <span style={{ fontSize:9, color:atras?'#EF4444':'#94A3B8', fontWeight:atras?700:400, marginLeft:'auto', whiteSpace:'nowrap' }}>
                              {atras?'⚠ ':'📅 '}{new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
                            </span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: CALENDÁRIO
      ══════════════════════════════════════════════════════════════════ */}
      {tab === 'calendario' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
            <button onClick={()=>navCal(-1)} style={{...fi,padding:'6px 11px',cursor:'pointer',fontWeight:700}}>‹</button>
            <button onClick={()=>{ setBase(new Date()); setDiaFoco(today); setDiaSelecionado(null) }}
              style={{...fi,padding:'6px 12px',cursor:'pointer',fontWeight:700,color:'#6366F1',border:'1px solid #C7D2FE'}}>Hoje</button>
            <button onClick={()=>navCal(1)} style={{...fi,padding:'6px 11px',cursor:'pointer',fontWeight:700}}>›</button>
            <span style={{ fontSize:14, fontWeight:800, color:'#0F172A', minWidth:160 }}>
              {viewMode==='mes' ? `${MESES[base.getMonth()]} ${base.getFullYear()}` : `${MESES_SHORT[semanaBase.getMonth()]} ${base.getFullYear()}`}
            </span>
            <select value={fCliente} onChange={e=>setFCliente(e.target.value)} style={{...fi,minWidth:140}}>
              <option value="">Todos os clientes</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
            </select>
            <select value={fCategoria} onChange={e=>setFCategoria(e.target.value)} style={{...fi,minWidth:130}}>
              <option value="">Todas as categorias</option>
              {[...new Set(tarefasAtivas.map(t=>t.categoria).filter(Boolean))].sort().map(cat=>(
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div style={{ flex:1 }} />
            <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden' }}>
              {[['mes','Mês'],['semana','Semana'],['dia','Dia']].map(([v,l])=>(
                <button key={v} onClick={()=>{ setViewMode(v); setDiaSelecionado(null) }}
                  style={{ padding:'5px 12px', border:'none', cursor:'pointer', fontSize:11, fontWeight:700,
                    background:viewMode===v?'#6366F1':'#fff', color:viewMode===v?'#fff':'#64748B' }}>{l}</button>
              ))}
            </div>
          </div>

          {/* View Mês */}
          {viewMode === 'mes' && (
            <div style={{ flex:1, display:'flex', gap:12, overflow:'hidden' }}>
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4, flexShrink:0 }}>
                  {DIAS_SEMANA.map(d=><div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#94A3B8', padding:'4px 0', textTransform:'uppercase', letterSpacing:'.05em' }}>{d}</div>)}
                </div>
                <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:4, overflow:'hidden' }}>
                  {diasMes.map((d,i) => {
                    if (!d) return <div key={`e${i}`} style={{ background:'#FAFAFA', borderRadius:8, border:'1px solid #F1F5F9' }} />
                    const key = fmtDate(d)
                    const dt  = porDia[key] || []
                    const isT = key === today, isPast = key < today, isSel = key === diaSelecionado
                    const venc = dt.filter(t => t.status!=='concluida'&&t.status!=='cancelada'&&key<today).length
                    const concl= dt.filter(t => t.status==='concluida').length
                    return (
                      <div key={key} onClick={()=>setDiaSelecionado(isSel?null:key)} style={{
                        background:isT?'#EEF2FF':isSel?'#F5F3FF':'#fff',
                        border:`${isSel?2:1}px solid ${isT?'#6366F1':isSel?'#8B5CF6':isPast?'#F1F5F9':'#E2E8F0'}`,
                        borderRadius:8, padding:6, cursor:'pointer', overflow:'hidden', opacity:isPast&&dt.length===0?0.4:1,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            background:isT?'#6366F1':'transparent', fontSize:10, fontWeight:800, color:isT?'#fff':isPast?'#94A3B8':'#0F172A' }}>{d.getDate()}</div>
                          <div style={{ display:'flex', gap:2 }}>
                            {venc>0 && <span style={{ fontSize:8, background:'#FEF2F2', color:'#991B1B', padding:'1px 3px', borderRadius:3, fontWeight:700 }}>⚠{venc}</span>}
                            {concl>0 && <span style={{ fontSize:8, background:'#F0FDF4', color:'#15803D', padding:'1px 3px', borderRadius:3, fontWeight:700 }}>✓{concl}</span>}
                          </div>
                        </div>
                        {dt.slice(0,2).map(t=>(
                          <div key={t.id} style={{ fontSize:8, padding:'1px 4px', borderRadius:3, marginBottom:1,
                            background:STATUS_COLOR[t.status]+'18', borderLeft:`2px solid ${STATUS_COLOR[t.status]||'#CBD5E1'}`,
                            color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                        ))}
                        {dt.length>2 && <div style={{ fontSize:8, color:'#6366F1', fontWeight:700 }}>+{dt.length-2}</div>}
                        {(rotinasPorDia[key]||[]).slice(0,2).map(r=>(
                          <div key={r.id} style={{ fontSize:8, padding:'1px 4px', borderRadius:3, marginBottom:1,
                            background:'#D1FAE5', borderLeft:'2px solid #16A34A',
                            color:'#065F46', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            🔁 {r.titulo}
                          </div>
                        ))}
                        {(rotinasPorDia[key]||[]).length>2 && <div style={{ fontSize:8, color:'#16A34A', fontWeight:700 }}>+{(rotinasPorDia[key]||[]).length-2} rotina(s)</div>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ display:'flex', gap:10, marginTop:6, fontSize:9, color:'#64748B', flexShrink:0, flexWrap:'wrap' }}>
                  {Object.entries(STATUS_COLOR).slice(0,5).map(([st,color])=>(
                    <div key={st} style={{ display:'flex', alignItems:'center', gap:3 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:color+'30', borderLeft:`2px solid ${color}` }} />{st}
                    </div>
                  ))}
                  <span style={{ marginLeft:'auto' }}>
                    {tasks.filter(t=>(t.data_execucao||t.prazo||'').startsWith(`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}`)).length} tarefas no mês
                  </span>
                </div>
              </div>
              {/* Painel lateral */}
              {diaSelecionado && (() => {
                const dt = porDia[diaSelecionado] || []
                const d  = new Date(diaSelecionado+'T12:00:00')
                return (
                  <div style={{ width:260, flexShrink:0, background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:14, overflow:'auto' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{DIAS_SEMANA[(d.getDay()+6)%7]}</div>
                        <div style={{ fontSize:22, fontWeight:800, color:diaSelecionado===today?'#4338CA':'#0F172A', lineHeight:1 }}>{d.getDate()}</div>
                        <div style={{ fontSize:10, color:'#94A3B8' }}>{MESES[d.getMonth()]}</div>
                      </div>
                      <button onClick={()=>setDiaSelecionado(null)} style={{ border:'none', background:'none', cursor:'pointer', color:'#94A3B8', fontSize:18 }}>×</button>
                    </div>
                    {/* Rotinas do dia selecionado */}
                    {(rotinasPorDia[diaSelecionado]||[]).length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:9, fontWeight:700, color:'#15803D', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:5 }}>🔁 Rotinas do dia</div>
                        {(rotinasPorDia[diaSelecionado]||[]).map(r => {
                          const cl = clients.find(c=>c.id===r.cliente_id)
                          return (
                            <div key={r.id} style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderLeft:'3px solid #16A34A', borderRadius:6, padding:'7px 10px', marginBottom:5 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                {r.hora && <span style={{ fontSize:10, fontWeight:700, color:'#16A34A' }}>{r.hora.slice(0,5)}</span>}
                                <span style={{ fontSize:11, fontWeight:600, color:'#065F46' }}>{r.titulo}</span>
                              </div>
                              {cl && <div style={{ fontSize:9, color:'#6B7280', marginTop:2 }}>🏢 {cl.fantasia||cl.razao_social}</div>}
                              {r.observacao && <div style={{ fontSize:9, color:'#6EE7B7', marginTop:2, fontStyle:'italic' }}>{r.observacao}</div>}
                            </div>
                          )
                        })}
                        <div style={{ borderTop:'1px solid #E2E8F0', margin:'8px 0' }} />
                      </div>
                    )}
                    {dt.length===0
                      ? <div style={{ textAlign:'center', color:'#CBD5E1', fontSize:11, padding:'8px 0' }}>Nenhuma tarefa 🎉</div>
                      : dt.map(t => {
                          const cl = clients.find(c=>c.id===t.cliente_id)
                          const dd = t.data_execucao||t.prazo
                          const atras = dd && dd<today && t.status!=='concluida'
                          return (
                            <div key={t.id} onClick={()=>nav('/tasks')} style={{
                              background:atras?'#FEF2F2':STATUS_BG[t.status]||'#fff',
                              border:`1px solid ${atras?'#FECDD3':'#E2E8F0'}`,
                              borderLeft:`3px solid ${atras?'#EF4444':STATUS_COLOR[t.status]||'#CBD5E1'}`,
                              borderRadius:6, padding:'8px 10px', marginBottom:6, cursor:'pointer' }}>
                              <div style={{ fontSize:11, fontWeight:600, color:'#0F172A' }}>{t.titulo}</div>
                              {cl && <div style={{ fontSize:9, color:'#64748B', marginTop:2 }}>🏢 {cl.fantasia||cl.razao_social}</div>}
                              <span style={{ fontSize:8, padding:'1px 5px', borderRadius:3, background:STATUS_COLOR[t.status]+'22', color:STATUS_COLOR[t.status], fontWeight:700, marginTop:4, display:'inline-block' }}>{STATUS_LABEL[t.status]||t.status}</span>
                            </div>
                          )
                        })
                    }
                  </div>
                )
              })()}
            </div>
          )}

          {/* View Semana */}
          {viewMode === 'semana' && (
            <div style={{ flex:1, overflow:'auto' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, minWidth:700 }}>
                {diasSemana.map((d,i) => {
                  const key = fmtDate(d), dt = porDia[key]||[], isT = key===today
                  return (
                    <div key={key} onClick={()=>{ setDiaFoco(key); setViewMode('dia') }} style={{
                      background:isT?'#EEF2FF':'#fff', border:`2px solid ${isT?'#6366F1':'#E2E8F0'}`,
                      borderRadius:10, padding:8, minHeight:140, cursor:'pointer' }}>
                      <div style={{ marginBottom:6 }}>
                        <div style={{ fontSize:9, fontWeight:700, color:isT?'#4338CA':'#94A3B8', textTransform:'uppercase' }}>{DIAS_SEMANA[i]}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:isT?'#4338CA':'#0F172A', lineHeight:1.1 }}>{d.getDate()}</div>
                        {dt.length>0 && <span style={{ fontSize:8, background:'#E2E8F0', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>{dt.length}</span>}
                      </div>
                      {dt.slice(0,4).map(t=>(
                        <div key={t.id} style={{ fontSize:8, padding:'2px 5px', borderRadius:4, marginBottom:2,
                          background:STATUS_COLOR[t.status]+'18', borderLeft:`2px solid ${STATUS_COLOR[t.status]||'#CBD5E1'}`,
                          color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                      ))}
                      {dt.length>4 && <div style={{ fontSize:8, color:'#6366F1', fontWeight:700 }}>+{dt.length-4}</div>}
                      {dt.length===0 && <div style={{ fontSize:9, color:'#CBD5E1', marginTop:8 }}>livre</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* View Dia */}
          {viewMode === 'dia' && (
            <div style={{ flex:1, overflow:'auto' }}>
              <div style={{ display:'flex', gap:6, marginBottom:10, overflowX:'auto' }}>
                {diasSemana.map((d,i) => {
                  const key = fmtDate(d), cnt=(porDia[key]||[]).length, isT=key===today, isFoco=key===diaFoco
                  return (
                    <button key={key} onClick={()=>setDiaFoco(key)} style={{
                      padding:'6px 12px', borderRadius:8, border:`2px solid ${isFoco?'#6366F1':isT?'#C7D2FE':'#E2E8F0'}`,
                      background:isFoco?'#6366F1':isT?'#EEF2FF':'#fff', color:isFoco?'#fff':isT?'#4338CA':'#334155',
                      cursor:'pointer', fontSize:11, fontWeight:700, flexShrink:0 }}>
                      {DIAS_SEMANA[i]} {d.getDate()}{cnt>0?` (${cnt})`:''}
                    </button>
                  )
                })}
              </div>
              {(() => {
                const dt = porDia[diaFoco]||[], d = new Date(diaFoco+'T12:00:00')
                return (
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#0F172A', marginBottom:10, textTransform:'capitalize' }}>
                      {diaFoco===today?'☀️ Hoje':`${DIAS_SEMANA[(d.getDay()+6)%7]}, ${d.getDate()} de ${MESES[d.getMonth()]}`}
                      <span style={{ fontSize:11, color:'#94A3B8', fontWeight:400, marginLeft:8 }}>{dt.length} tarefa{dt.length!==1?'s':''}</span>
                    </div>
                    {dt.length===0
                      ? <div style={{ textAlign:'center', padding:40, color:'#CBD5E1', fontSize:13 }}>Nenhuma tarefa para este dia 🎉</div>
                      : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:8 }}>
                          {dt.map(t => {
                            const cl = clients.find(c=>c.id===t.cliente_id)
                            return (
                              <div key={t.id} onClick={()=>nav('/tasks')} style={{
                                background:'#fff', border:'1px solid #E2E8F0',
                                borderLeft:`3px solid ${STATUS_COLOR[t.status]||'#CBD5E1'}`,
                                borderRadius:8, padding:'10px 12px', cursor:'pointer' }}>
                                <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', marginBottom:4 }}>{t.titulo}</div>
                                {cl && <div style={{ fontSize:10, color:'#64748B' }}>🏢 {cl.fantasia||cl.razao_social}</div>}
                                <span style={{ fontSize:9, background:STATUS_COLOR[t.status]+'22', color:STATUS_COLOR[t.status], padding:'2px 6px', borderRadius:4, fontWeight:700, marginTop:6, display:'inline-block' }}>
                                  {STATUS_LABEL[t.status]||t.status}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                    }
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
