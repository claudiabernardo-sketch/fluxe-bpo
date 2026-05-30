import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useData'
import { useClients } from '../hooks/useData'
import { Loader } from '../components/ui'
import { useNavigate } from 'react-router-dom'

const PRIO_COLOR = { alta:'#EF4444', media:'#F59E0B', baixa:'#22C55E' }
const STATUS_COLOR = {
  aberta:'#3B82F6', andamento:'#F59E0B', aguardando:'#8B5CF6',
  concluida:'#22C55E', impedimento:'#EF4444', cancelada:'#94A3B8'
}
const STATUS_BG = {
  aberta:'#EFF6FF', andamento:'#FFFBEB', aguardando:'#F5F3FF',
  concluida:'#F0FDF4', impedimento:'#FEF2F2', cancelada:'#F8FAFC'
}

function fmtDate(d) { return d.toISOString().slice(0,10) }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate()+n); return r }
function startOfWeek(d) {
  const r = new Date(d)
  const day = r.getDay()
  const diff = day === 0 ? -6 : 1 - day
  r.setDate(r.getDate() + diff)
  return r
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth()+1, 0) }

const DIAS_SEMANA = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function AgendaPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const nav = useNavigate()

  const [base, setBase] = useState(new Date())
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [viewMode, setViewMode] = useState('mes')
  const [diaFoco, setDiaFoco] = useState(fmtDate(new Date()))
  const [diaSelecionado, setDiaSelecionado] = useState(null)

  const today = fmtDate(new Date())

  const semanaBase = useMemo(() => startOfWeek(base), [base])

  const diasSemana = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i))
  , [semanaBase])

  const tarefasFiltradas = useMemo(() =>
    tasks.filter(t =>
      (!filtroCliente || t.cliente_id === filtroCliente) &&
      (!filtroStatus || t.status === filtroStatus)
    )
  , [tasks, filtroCliente, filtroStatus])

  const porDia = useMemo(() => {
    const map = {}
    tarefasFiltradas.forEach(t => {
      if (t.prazo) {
        if (!map[t.prazo]) map[t.prazo] = []
        map[t.prazo].push(t)
      }
    })
    return map
  }, [tarefasFiltradas])

  const semPrazo = useMemo(() =>
    tarefasFiltradas.filter(t => !t.prazo && t.status !== 'concluida')
  , [tarefasFiltradas])

  const atrasadas = useMemo(() =>
    tarefasFiltradas.filter(t => t.prazo && t.prazo < today && !['concluida','cancelada'].includes(t.status))
  , [tarefasFiltradas, today])

  // Dias do mês para view mensal
  const diasMes = useMemo(() => {
    const inicio = startOfMonth(base)
    const fim = endOfMonth(base)
    const dias = []
    // Preencher dias vazios antes do primeiro dia
    let diaSemana = inicio.getDay() // 0=dom, 1=seg...
    const offset = diaSemana === 0 ? 6 : diaSemana - 1 // segunda = 0
    for (let i = 0; i < offset; i++) dias.push(null)
    // Dias do mês
    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate()+1)) {
      dias.push(new Date(d))
    }
    // Preencher dias vazios depois do último dia para completar a grade
    while (dias.length % 7 !== 0) dias.push(null)
    return dias
  }, [base])

  function navPeriodo(dir) {
    if (viewMode === 'semana' || viewMode === 'dia') {
      setBase(d => addDays(d, dir * 7))
    } else if (viewMode === 'mes') {
      setBase(d => new Date(d.getFullYear(), d.getMonth() + dir, 1))
    } else {
      setBase(d => addDays(d, dir * 30))
    }
  }

  function irHoje() {
    setBase(new Date())
    setDiaFoco(today)
    setDiaSelecionado(null)
  }

  const periodoLabel = viewMode === 'mes'
    ? `${MESES[base.getMonth()]} ${base.getFullYear()}`
    : `${MESES_SHORT[semanaBase.getMonth()]} ${base.getFullYear()}`

  const fi = { padding:'6px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:11, fontFamily:'inherit', background:'#fff', color:'#334155', outline:'none' }

  if (isLoading) return <Loader />

  function TarefaCard({ t, compact }) {
    const cl = clients.find(c => c.id === t.cliente_id)
    const venc = t.prazo && t.prazo < today && !['concluida','cancelada'].includes(t.status)
    return (
      <div style={{
        background: venc ? '#FEF2F2' : STATUS_BG[t.status] || '#fff',
        border: `1px solid ${venc ? '#FECDD3' : '#E2E8F0'}`,
        borderLeft: `3px solid ${venc ? '#EF4444' : STATUS_COLOR[t.status] || '#CBD5E1'}`,
        borderRadius: 6, padding: compact ? '3px 6px' : '8px 10px',
        marginBottom: 3, cursor: 'pointer',
      }} onClick={() => nav('/tasks')}>
        <div style={{ fontSize: compact ? 9 : 11, fontWeight: 600, color: '#0F172A',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {t.titulo}
          {t.modelo_id && <span style={{ marginLeft:3, fontSize:8, color:'#6366F1' }}>🔁</span>}
        </div>
        {!compact && cl && (
          <div style={{ fontSize:9, color:'#64748B', marginTop:2 }}>🏢 {cl.fantasia||cl.razao_social}</div>
        )}
        {!compact && (
          <div style={{ display:'flex', gap:4, marginTop:4, alignItems:'center' }}>
            <span style={{ fontSize:8, padding:'1px 4px', borderRadius:3, background: STATUS_COLOR[t.status]+'22', color: STATUS_COLOR[t.status], fontWeight:700 }}>{t.status}</span>
            {t.prazo && venc && <span style={{ fontSize:8, color:'#991B1B', fontWeight:700 }}>⚠ atrasada</span>}
          </div>
        )}
      </div>
    )
  }

  // Painel lateral de dia selecionado (view mês)
  function PainelDia({ dateKey }) {
    const dayTasks = porDia[dateKey] || []
    const d = new Date(dateKey + 'T12:00:00')
    const isToday = dateKey === today
    const porCliente = {}
    dayTasks.forEach(t => {
      const key = t.cliente_id || '__sem__'
      if (!porCliente[key]) porCliente[key] = []
      porCliente[key].push(t)
    })
    return (
      <div style={{ width:280, flexShrink:0, background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'14px', overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color: isToday?'#4338CA':'#94A3B8', textTransform:'uppercase' }}>
              {DIAS_SEMANA[(d.getDay()+6)%7]}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color: isToday?'#4338CA':'#0F172A', lineHeight:1 }}>{d.getDate()}</div>
            <div style={{ fontSize:10, color:'#94A3B8' }}>{MESES[d.getMonth()]}</div>
          </div>
          <button onClick={()=>setDiaSelecionado(null)} style={{ border:'none', background:'none', cursor:'pointer', color:'#94A3B8', fontSize:18 }}>×</button>
        </div>
        {dayTasks.length === 0 ? (
          <div style={{ textAlign:'center', color:'#CBD5E1', fontSize:11, padding:'20px 0' }}>
            Nenhuma tarefa 🎉
          </div>
        ) : (
          Object.entries(porCliente).map(([clienteId, cts]) => {
            const cl = clients.find(c => c.id === clienteId)
            return (
              <div key={clienteId} style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#334155', marginBottom:5 }}>
                  🏢 {cl ? (cl.fantasia||cl.razao_social) : 'Sem cliente'}
                  <span style={{ marginLeft:5, fontSize:9, background:'#F1F5F9', color:'#64748B', padding:'1px 4px', borderRadius:3 }}>{cts.length}</span>
                </div>
                {cts.map(t => <TarefaCard key={t.id} t={t} compact={false} />)}
              </div>
            )
          })
        )}
        <button onClick={()=>nav('/tasks')} style={{ width:'100%', marginTop:8, padding:'8px', borderRadius:8, border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#6366F1', cursor:'pointer', fontSize:11, fontWeight:700 }}>
          Ver todas no módulo de tarefas →
        </button>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 110px)', gap:12 }}>

      {/* ── TOOLBAR ── */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
        <button onClick={()=>navPeriodo(-1)} style={{ ...fi, padding:'6px 11px', cursor:'pointer', fontWeight:700 }}>‹</button>
        <button onClick={irHoje} style={{ ...fi, padding:'6px 12px', cursor:'pointer', fontWeight:700, color:'#6366F1', border:'1px solid #C7D2FE' }}>Hoje</button>
        <button onClick={()=>navPeriodo(1)} style={{ ...fi, padding:'6px 11px', cursor:'pointer', fontWeight:700 }}>›</button>
        <span style={{ fontSize:14, fontWeight:800, color:'#0F172A', minWidth:160 }}>{periodoLabel}</span>

        <div style={{ width:1, height:20, background:'#E2E8F0' }} />

        <select value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)} style={{ ...fi, width:160 }}>
          <option value="">Todos os clientes</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
        </select>
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} style={{ ...fi, width:130 }}>
          <option value="">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="andamento">Em andamento</option>
          <option value="aguardando">Ag. cliente</option>
          <option value="concluida">Concluída</option>
          <option value="impedimento">Impedimento</option>
        </select>

        <div style={{ flex:1 }} />

        {atrasadas.length > 0 && (
          <div style={{ padding:'4px 10px', borderRadius:8, background:'#FEF2F2', border:'1px solid #FECDD3', fontSize:11, color:'#991B1B', fontWeight:700 }}>
            ⚠ {atrasadas.length} atrasada{atrasadas.length>1?'s':''}
          </div>
        )}

        <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden' }}>
          {[['mes','📅 Mês'],['semana','📆 Semana'],['dia','☀️ Dia'],['lista','☰ Lista']].map(([v,l])=>(
            <button key={v} onClick={()=>{ setViewMode(v); setDiaSelecionado(null) }}
              style={{ padding:'5px 10px', border:'none', cursor:'pointer', fontSize:10, fontWeight:700,
                background:viewMode===v?'#6366F1':'#fff', color:viewMode===v?'#fff':'#64748B' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── VIEW MÊS ── */}
      {viewMode === 'mes' && (
        <div style={{ flex:1, display:'flex', gap:12, overflow:'hidden' }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* Header dias da semana */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4, flexShrink:0 }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#94A3B8', padding:'4px 0', textTransform:'uppercase', letterSpacing:'.05em' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grade do mês */}
            <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', gap:4, overflow:'hidden' }}>
              {diasMes.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} style={{ background:'#FAFAFA', borderRadius:8, border:'1px solid #F1F5F9' }} />
                const key = fmtDate(d)
                const dayTasks = porDia[key] || []
                const isToday = key === today
                const isPast = key < today
                const isSel = key === diaSelecionado
                const concluidas = dayTasks.filter(t=>t.status==='concluida').length
                const atras = dayTasks.filter(t=>t.status!=='concluida'&&t.status!=='cancelada'&&key<today).length
                const abertas = dayTasks.filter(t=>!['concluida','cancelada'].includes(t.status)).length

                return (
                  <div key={key}
                    onClick={()=>setDiaSelecionado(isSel ? null : key)}
                    style={{
                      background: isToday?'#EEF2FF': isSel?'#F5F3FF': isPast&&dayTasks.length===0?'#FAFAFA':'#fff',
                      border: `${isSel?2:1}px solid ${isToday?'#6366F1':isSel?'#8B5CF6':isPast?'#F1F5F9':'#E2E8F0'}`,
                      borderRadius:8, padding:'6px', cursor:'pointer', overflow:'hidden',
                      transition:'all .1s', opacity: isPast&&dayTasks.length===0?0.5:1
                    }}
                    onMouseEnter={e=>{ if(!isToday&&!isSel) e.currentTarget.style.borderColor='#C7D2FE' }}
                    onMouseLeave={e=>{ if(!isToday&&!isSel) e.currentTarget.style.borderColor=isPast?'#F1F5F9':'#E2E8F0' }}>
                    {/* Número do dia */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      <div style={{
                        width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                        background: isToday?'#6366F1':'transparent',
                        fontSize:11, fontWeight:800,
                        color: isToday?'#fff': isPast?'#94A3B8':'#0F172A'
                      }}>
                        {d.getDate()}
                      </div>
                      {dayTasks.length > 0 && (
                        <div style={{ display:'flex', gap:2 }}>
                          {atras > 0 && <span style={{ fontSize:8, background:'#FEF2F2', color:'#991B1B', padding:'1px 3px', borderRadius:3, fontWeight:700 }}>⚠{atras}</span>}
                          {concluidas > 0 && <span style={{ fontSize:8, background:'#F0FDF4', color:'#15803D', padding:'1px 3px', borderRadius:3, fontWeight:700 }}>✓{concluidas}</span>}
                        </div>
                      )}
                    </div>

                    {/* Tarefas do dia (max 3) */}
                    {dayTasks.slice(0,3).map(t => (
                      <div key={t.id} style={{
                        fontSize:9, padding:'2px 5px', borderRadius:4, marginBottom:2,
                        background: STATUS_COLOR[t.status]+'18',
                        borderLeft:`2px solid ${STATUS_COLOR[t.status]||'#CBD5E1'}`,
                        color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        fontWeight:500
                      }}>
                        {t.titulo}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize:8, color:'#6366F1', fontWeight:700, marginTop:1 }}>
                        +{dayTasks.length-3} mais
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legenda */}
            <div style={{ display:'flex', gap:12, marginTop:8, flexShrink:0, flexWrap:'wrap' }}>
              {Object.entries(STATUS_COLOR).slice(0,5).map(([st, color]) => (
                <div key={st} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, color:'#64748B' }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:color+'30', borderLeft:`2px solid ${color}` }} />
                  {st}
                </div>
              ))}
              <div style={{ marginLeft:'auto', fontSize:9, color:'#94A3B8' }}>
                {tarefasFiltradas.filter(t=>t.prazo && t.prazo.startsWith(base.getFullYear()+'-'+(String(base.getMonth()+1).padStart(2,'0')))).length} tarefas no mês
              </div>
            </div>
          </div>

          {/* Painel lateral do dia selecionado */}
          {diaSelecionado && <PainelDia dateKey={diaSelecionado} />}
        </div>
      )}

      {/* ── VIEW SEMANA ── */}
      {viewMode === 'semana' && (
        <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, minWidth:700 }}>
            {diasSemana.map((d, i) => {
              const key = fmtDate(d)
              const dayTasks = porDia[key] || []
              const isToday = key === today
              const isPast = key < today
              const concluidas = dayTasks.filter(t=>t.status==='concluida').length
              const atras = dayTasks.filter(t=>t.status!=='concluida'&&t.status!=='cancelada'&&key<today).length
              return (
                <div key={key}
                  style={{ background:isToday?'#EEF2FF':'#fff', border:`2px solid ${isToday?'#6366F1':'#E2E8F0'}`, borderRadius:10, padding:'8px', minHeight:160, opacity:isPast&&!isToday?0.85:1, cursor:'pointer' }}
                  onClick={()=>{ setDiaFoco(key); setViewMode('dia') }}>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:isToday?'#4338CA':'#94A3B8', textTransform:'uppercase' }}>{DIAS_SEMANA[i]}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:isToday?'#4338CA':isPast?'#94A3B8':'#0F172A', lineHeight:1.1 }}>{d.getDate()}</div>
                    {dayTasks.length > 0 && (
                      <div style={{ display:'flex', gap:3, marginTop:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:8, padding:'1px 4px', borderRadius:3, background:'#E2E8F0', color:'#475569', fontWeight:700 }}>{dayTasks.length}</span>
                        {concluidas > 0 && <span style={{ fontSize:8, padding:'1px 4px', borderRadius:3, background:'#F0FDF4', color:'#15803D', fontWeight:700 }}>✓{concluidas}</span>}
                        {atras > 0 && <span style={{ fontSize:8, padding:'1px 4px', borderRadius:3, background:'#FEF2F2', color:'#991B1B', fontWeight:700 }}>⚠{atras}</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    {dayTasks.slice(0,4).map(t => <TarefaCard key={t.id} t={t} compact />)}
                    {dayTasks.length > 4 && <div style={{ fontSize:9, color:'#6366F1', fontWeight:700, textAlign:'center', padding:'3px', background:'#EEF2FF', borderRadius:5 }}>+{dayTasks.length-4}</div>}
                    {dayTasks.length === 0 && <div style={{ fontSize:9, color:'#CBD5E1', textAlign:'center', marginTop:8 }}>livre</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {atrasadas.filter(t=>t.prazo < fmtDate(semanaBase)).length > 0 && (
            <div style={{ marginTop:14, padding:'12px 14px', background:'#FEF2F2', borderRadius:10, border:'1px solid #FECDD3' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#991B1B', marginBottom:8 }}>⚠ Atrasadas de semanas anteriores ({atrasadas.filter(t=>t.prazo<fmtDate(semanaBase)).length})</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
                {atrasadas.filter(t=>t.prazo<fmtDate(semanaBase)).map(t=><TarefaCard key={t.id} t={t} compact={false} />)}
              </div>
            </div>
          )}

          {semPrazo.length > 0 && (
            <div style={{ marginTop:12, padding:'12px 14px', background:'#FAFAFA', borderRadius:10, border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#64748B', marginBottom:8 }}>📋 Sem prazo ({semPrazo.length})</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
                {semPrazo.slice(0,8).map(t=><TarefaCard key={t.id} t={t} compact={false} />)}
                {semPrazo.length > 8 && <div style={{ fontSize:11, color:'#6366F1', fontWeight:700, padding:'8px', textAlign:'center', cursor:'pointer' }} onClick={()=>nav('/tasks')}>Ver todas ({semPrazo.length}) →</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW DIA ── */}
      {viewMode === 'dia' && (
        <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:4 }}>
            {diasSemana.map((d, i) => {
              const key = fmtDate(d)
              const cnt = (porDia[key]||[]).length
              const isToday = key === today
              const isFoco = key === diaFoco
              return (
                <button key={key} onClick={()=>setDiaFoco(key)}
                  style={{ padding:'6px 12px', borderRadius:8, border:`2px solid ${isFoco?'#6366F1':isToday?'#C7D2FE':'#E2E8F0'}`, background:isFoco?'#6366F1':isToday?'#EEF2FF':'#fff', color:isFoco?'#fff':isToday?'#4338CA':'#334155', cursor:'pointer', fontSize:11, fontWeight:700, flexShrink:0 }}>
                  {DIAS_SEMANA[i]} {d.getDate()}
                  {cnt > 0 && <span style={{ marginLeft:4, fontSize:9, background:isFoco?'rgba(255,255,255,.3)':'#E2E8F0', padding:'1px 4px', borderRadius:3 }}>{cnt}</span>}
                </button>
              )
            })}
          </div>
          {(() => {
            const dayTasks = porDia[diaFoco] || []
            const d = new Date(diaFoco+'T12:00:00')
            const isToday = diaFoco === today
            const porCliente = {}
            dayTasks.forEach(t => {
              const key = t.cliente_id || '__sem__'
              if (!porCliente[key]) porCliente[key] = []
              porCliente[key].push(t)
            })
            return (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>
                    {isToday ? '☀️ Hoje' : `${DIAS_SEMANA[(d.getDay()+6)%7]}, ${d.getDate()} de ${MESES[d.getMonth()]}`}
                  </div>
                  <span style={{ fontSize:11, color:'#94A3B8' }}>{dayTasks.length} tarefa{dayTasks.length!==1?'s':''}</span>
                </div>
                {dayTasks.length === 0
                  ? <div style={{ textAlign:'center', padding:'40px', color:'#CBD5E1', fontSize:13 }}>Nenhuma tarefa para este dia 🎉</div>
                  : Object.entries(porCliente).map(([clienteId, cts]) => {
                    const cl = clients.find(c=>c.id===clienteId)
                    return (
                      <div key={clienteId} style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#334155', marginBottom:6 }}>
                          🏢 {cl ? (cl.fantasia||cl.razao_social) : 'Sem cliente'}
                          <span style={{ marginLeft:5, fontSize:9, background:'#F1F5F9', color:'#64748B', padding:'1px 5px', borderRadius:3 }}>{cts.length}</span>
                        </div>
                        <div style={{ paddingLeft:16 }}>
                          {cts.map(t=><TarefaCard key={t.id} t={t} compact={false} />)}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )
          })()}
        </div>
      )}

      {/* ── VIEW LISTA ── */}
      {viewMode === 'lista' && (
        <div style={{ flex:1, overflow:'auto' }}>
          {atrasadas.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#991B1B', marginBottom:8 }}>⚠ Atrasadas ({atrasadas.length})</div>
              {atrasadas.map(t => {
                const cl = clients.find(c=>c.id===t.cliente_id)
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', background:'#FEF2F2', borderRadius:8, marginBottom:4, border:'1px solid #FECDD3', cursor:'pointer' }} onClick={()=>nav('/tasks')}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                      <div style={{ fontSize:10, color:'#94A3B8', marginTop:2, display:'flex', gap:8 }}>
                        {cl && <span>🏢 {cl.fantasia||cl.razao_social}</span>}
                        <span style={{ color:'#991B1B', fontWeight:600 }}>📅 Venceu em {t.prazo}</span>
                      </div>
                    </div>
                    <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:STATUS_COLOR[t.status]+'22', color:STATUS_COLOR[t.status], fontWeight:700 }}>{t.status}</span>
                  </div>
                )
              })}
            </div>
          )}
          {Array.from({ length:30 }, (_,i) => addDays(new Date(), i)).map(d => {
            const key = fmtDate(d)
            const dayTasks = porDia[key] || []
            if (dayTasks.length === 0) return null
            const isToday = key === today
            return (
              <div key={key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:isToday?'#4338CA':'#334155', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:isToday?'#6366F1':'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:isToday?'#fff':'#334155', flexShrink:0 }}>
                    {d.getDate()}
                  </div>
                  <span style={{ textTransform:'capitalize' }}>{isToday?'Hoje — ':''}{d.toLocaleDateString('pt-BR',{weekday:'long',month:'long'})}</span>
                  <span style={{ fontSize:9, background:'#E2E8F0', color:'#475569', padding:'1px 5px', borderRadius:3 }}>{dayTasks.length}</span>
                </div>
                <div style={{ paddingLeft:36, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:6 }}>
                  {dayTasks.map(t=><TarefaCard key={t.id} t={t} compact={false} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
