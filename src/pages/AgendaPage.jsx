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
  const diff = day === 0 ? -6 : 1 - day // segunda como início
  r.setDate(r.getDate() + diff)
  return r
}

const DIAS_SEMANA = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function AgendaPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const nav = useNavigate()

  const [semanaBase, setSemanaBase] = useState(() => startOfWeek(new Date()))
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [viewMode, setViewMode] = useState('semana') // semana | dia | lista
  const [diaFoco, setDiaFoco] = useState(fmtDate(new Date()))

  const today = fmtDate(new Date())

  // Dias da semana atual
  const diasSemana = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i))
  , [semanaBase])

  // Tarefas filtradas
  const tarefasFiltradas = useMemo(() =>
    tasks.filter(t =>
      (!filtroCliente || t.cliente_id === filtroCliente) &&
      (!filtroStatus || t.status === filtroStatus)
    )
  , [tasks, filtroCliente, filtroStatus])

  // Tarefas por dia
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

  // Tarefas sem prazo
  const semPrazo = useMemo(() =>
    tarefasFiltradas.filter(t => !t.prazo && t.status !== 'concluida')
  , [tarefasFiltradas])

  // Tarefas atrasadas
  const atrasadas = useMemo(() =>
    tarefasFiltradas.filter(t => t.prazo && t.prazo < today && !['concluida','cancelada'].includes(t.status))
  , [tarefasFiltradas, today])

  function navSemana(dir) {
    setSemanaBase(d => addDays(d, dir * 7))
  }

  function irHoje() {
    setSemanaBase(startOfWeek(new Date()))
    setDiaFoco(today)
  }

  const mesAno = `${MESES[semanaBase.getMonth()]} ${semanaBase.getFullYear()}`

  const fi = { padding:'6px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:11, fontFamily:'inherit', background:'#fff', color:'#334155', outline:'none' }

  if (isLoading) return <Loader />

  // ── CARD DE TAREFA ──
  function TarefaCard({ t, compact }) {
    const cl = clients.find(c => c.id === t.cliente_id)
    const venc = t.prazo && t.prazo < today && !['concluida','cancelada'].includes(t.status)
    return (
      <div style={{
        background: venc ? '#FEF2F2' : STATUS_BG[t.status] || '#fff',
        border: `1px solid ${venc ? '#FECDD3' : '#E2E8F0'}`,
        borderLeft: `3px solid ${venc ? '#EF4444' : STATUS_COLOR[t.status] || '#CBD5E1'}`,
        borderRadius: 7, padding: compact ? '5px 8px' : '8px 10px',
        marginBottom: 5, cursor: 'pointer',
      }}
        onClick={() => nav('/tasks')}
      >
        <div style={{ fontSize: compact ? 10 : 11, fontWeight: 600, color: '#0F172A', marginBottom: 2,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {t.titulo}
          {t.modelo_id && <span style={{ marginLeft:4, fontSize:8, color:'#6366F1' }}>🔁</span>}
        </div>
        {!compact && (
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            {cl && <span style={{ fontSize:9, color:'#64748B' }}>🏢 {cl.fantasia||cl.razao_social}</span>}
            {t.categoria && <span style={{ fontSize:9, color:'#94A3B8' }}>📂 {t.categoria}</span>}
            <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background: STATUS_COLOR[t.status]+'22', color: STATUS_COLOR[t.status], fontWeight:700, marginLeft:'auto' }}>
              {t.status}
            </span>
          </div>
        )}
        {compact && cl && (
          <div style={{ fontSize:9, color:'#94A3B8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {cl.fantasia||cl.razao_social}
          </div>
        )}
        {compact && (
          <div style={{ display:'flex', gap:4, marginTop:2, alignItems:'center' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: PRIO_COLOR[t.prioridade]||'#CBD5E1', flexShrink:0 }} />
            <span style={{ fontSize:8, color: STATUS_COLOR[t.status], fontWeight:700 }}>{t.status}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 110px)', gap:12 }}>

      {/* ── TOOLBAR ── */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        {/* Navegação semana */}
        <button onClick={()=>navSemana(-1)} style={{ ...fi, padding:'6px 10px', cursor:'pointer' }}>‹</button>
        <button onClick={irHoje} style={{ ...fi, padding:'6px 12px', cursor:'pointer', fontWeight:700, color:'#6366F1', border:'1px solid #C7D2FE' }}>Hoje</button>
        <button onClick={()=>navSemana(1)} style={{ ...fi, padding:'6px 10px', cursor:'pointer' }}>›</button>
        <span style={{ fontSize:13, fontWeight:700, color:'#0F172A', minWidth:100 }}>{mesAno}</span>

        <div style={{ width:1, height:20, background:'#E2E8F0', margin:'0 4px' }} />

        {/* Filtros */}
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

        {/* Indicadores rápidos */}
        {atrasadas.length > 0 && (
          <div style={{ padding:'4px 10px', borderRadius:8, background:'#FEF2F2', border:'1px solid #FECDD3', fontSize:11, color:'#991B1B', fontWeight:700 }}>
            ⚠ {atrasadas.length} atrasada{atrasadas.length>1?'s':''}
          </div>
        )}

        {/* View toggle */}
        <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden' }}>
          {[['semana','📅 Semana'],['dia','☀️ Dia'],['lista','☰ Lista']].map(([v,l])=>(
            <button key={v} onClick={()=>setViewMode(v)}
              style={{ padding:'5px 10px', border:'none', cursor:'pointer', fontSize:10, fontWeight:700,
                background:viewMode===v?'#6366F1':'#fff', color:viewMode===v?'#fff':'#64748B' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── VIEW SEMANA ── */}
      {viewMode === 'semana' && (
        <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, minWidth:700 }}>
            {diasSemana.map((d, i) => {
              const key = fmtDate(d)
              const dayTasks = porDia[key] || []
              const isToday = key === today
              const isPast = key < today
              const total = dayTasks.length
              const concluidas = dayTasks.filter(t=>t.status==='concluida').length
              const atras = dayTasks.filter(t=>t.status!=='concluida'&&t.status!=='cancelada'&&key<today).length

              return (
                <div key={key}
                  style={{ background: isToday?'#EEF2FF':'#fff', border:`2px solid ${isToday?'#6366F1':'#E2E8F0'}`,
                    borderRadius:10, padding:'8px', minHeight:160, opacity: isPast&&!isToday?0.85:1,
                    cursor:'pointer', transition:'all .15s' }}
                  onClick={()=>{ setDiaFoco(key); setViewMode('dia') }}>
                  {/* Header do dia */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9, fontWeight:700, color: isToday?'#4338CA':'#94A3B8', textTransform:'uppercase', letterSpacing:'.05em' }}>
                      {DIAS_SEMANA[i]}
                    </div>
                    <div style={{ fontSize:18, fontWeight:800, color: isToday?'#4338CA':isPast?'#94A3B8':'#0F172A', lineHeight:1.1 }}>
                      {d.getDate()}
                    </div>
                    {total > 0 && (
                      <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:8, padding:'1px 5px', borderRadius:4, background:'#E2E8F0', color:'#475569', fontWeight:700 }}>
                          {total} tarefa{total>1?'s':''}
                        </span>
                        {concluidas > 0 && (
                          <span style={{ fontSize:8, padding:'1px 5px', borderRadius:4, background:'#F0FDF4', color:'#15803D', fontWeight:700 }}>
                            ✓{concluidas}
                          </span>
                        )}
                        {atras > 0 && (
                          <span style={{ fontSize:8, padding:'1px 5px', borderRadius:4, background:'#FEF2F2', color:'#991B1B', fontWeight:700 }}>
                            ⚠{atras}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tarefas do dia */}
                  <div>
                    {dayTasks.slice(0,4).map(t => <TarefaCard key={t.id} t={t} compact />)}
                    {dayTasks.length > 4 && (
                      <div style={{ fontSize:9, color:'#6366F1', fontWeight:700, textAlign:'center', padding:'4px', background:'#EEF2FF', borderRadius:6, cursor:'pointer' }}>
                        +{dayTasks.length-4} mais
                      </div>
                    )}
                    {total === 0 && (
                      <div style={{ fontSize:9, color:'#CBD5E1', textAlign:'center', marginTop:8 }}>livre</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tarefas atrasadas (antes da semana atual) */}
          {atrasadas.filter(t => t.prazo < fmtDate(semanaBase)).length > 0 && (
            <div style={{ marginTop:16, padding:'12px 14px', background:'#FEF2F2', borderRadius:10, border:'1px solid #FECDD3' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#991B1B', marginBottom:8 }}>
                ⚠ Tarefas atrasadas de semanas anteriores ({atrasadas.filter(t => t.prazo < fmtDate(semanaBase)).length})
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
                {atrasadas.filter(t => t.prazo < fmtDate(semanaBase)).map(t => (
                  <TarefaCard key={t.id} t={t} compact={false} />
                ))}
              </div>
            </div>
          )}

          {/* Sem prazo */}
          {semPrazo.length > 0 && (
            <div style={{ marginTop:12, padding:'12px 14px', background:'#FAFAFA', borderRadius:10, border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#64748B', marginBottom:8 }}>
                📋 Sem prazo definido ({semPrazo.length})
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
                {semPrazo.slice(0,8).map(t => <TarefaCard key={t.id} t={t} compact={false} />)}
                {semPrazo.length > 8 && (
                  <div style={{ fontSize:11, color:'#6366F1', fontWeight:700, padding:'8px', textAlign:'center', cursor:'pointer' }}
                    onClick={() => nav('/tasks')}>
                    Ver todas ({semPrazo.length}) →
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW DIA ── */}
      {viewMode === 'dia' && (
        <div style={{ flex:1, overflow:'auto' }}>
          {/* Seletor de dia */}
          <div style={{ display:'flex', gap:6, marginBottom:12, overflowX:'auto', paddingBottom:4 }}>
            {diasSemana.map((d, i) => {
              const key = fmtDate(d)
              const cnt = (porDia[key]||[]).length
              const isToday = key === today
              const isFoco = key === diaFoco
              return (
                <button key={key} onClick={()=>setDiaFoco(key)}
                  style={{ padding:'6px 12px', borderRadius:8, border:`2px solid ${isFoco?'#6366F1':isToday?'#C7D2FE':'#E2E8F0'}`,
                    background: isFoco?'#6366F1':isToday?'#EEF2FF':'#fff',
                    color: isFoco?'#fff':isToday?'#4338CA':'#334155',
                    cursor:'pointer', fontSize:11, fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>
                  {DIAS_SEMANA[i]} {d.getDate()}
                  {cnt > 0 && <span style={{ marginLeft:5, fontSize:9, background:isFoco?'rgba(255,255,255,.3)':'#E2E8F0', padding:'1px 4px', borderRadius:4 }}>{cnt}</span>}
                </button>
              )
            })}
          </div>

          {/* Tarefas do dia foco */}
          {(() => {
            const dayTasks = porDia[diaFoco] || []
            const isPast = diaFoco < today
            const isToday = diaFoco === today

            // Agrupar por cliente
            const porCliente = {}
            dayTasks.forEach(t => {
              const key = t.cliente_id || '__sem_cliente__'
              if (!porCliente[key]) porCliente[key] = []
              porCliente[key].push(t)
            })

            return (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>
                    {isToday ? '☀️ Hoje' : `${DIAS_SEMANA[diasSemana.findIndex(d=>fmtDate(d)===diaFoco)]} ${new Date(diaFoco+'T12:00:00').getDate()} de ${MESES[new Date(diaFoco+'T12:00:00').getMonth()]}`}
                  </div>
                  <span style={{ fontSize:11, color:'#94A3B8' }}>{dayTasks.length} tarefa{dayTasks.length!==1?'s':''}</span>
                  {isPast && !isToday && dayTasks.filter(t=>t.status!=='concluida').length > 0 && (
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'#FEF2F2', color:'#991B1B', fontWeight:700 }}>
                      ⚠ {dayTasks.filter(t=>t.status!=='concluida').length} pendente{dayTasks.filter(t=>t.status!=='concluida').length>1?'s':''}
                    </span>
                  )}
                </div>

                {dayTasks.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px', color:'#CBD5E1', fontSize:13 }}>
                    Nenhuma tarefa para este dia 🎉
                  </div>
                ) : (
                  Object.entries(porCliente).map(([clienteId, cts]) => {
                    const cl = clients.find(c => c.id === clienteId)
                    return (
                      <div key={clienteId} style={{ marginBottom:14 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#334155', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                          <span>🏢</span>
                          <span>{cl ? (cl.fantasia||cl.razao_social) : 'Sem cliente'}</span>
                          <span style={{ fontSize:9, background:'#F1F5F9', color:'#64748B', padding:'1px 6px', borderRadius:4 }}>{cts.length}</span>
                        </div>
                        <div style={{ paddingLeft:16 }}>
                          {cts.map(t => <TarefaCard key={t.id} t={t} compact={false} />)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── VIEW LISTA ── */}
      {viewMode === 'lista' && (
        <div style={{ flex:1, overflow:'auto' }}>
          {/* Atrasadas primeiro */}
          {atrasadas.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#991B1B', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <span>⚠</span> Atrasadas ({atrasadas.length})
              </div>
              {atrasadas.map(t => {
                const cl = clients.find(c=>c.id===t.cliente_id)
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', background:'#FEF2F2', borderRadius:8, marginBottom:4, border:'1px solid #FECDD3', cursor:'pointer' }}
                    onClick={()=>nav('/tasks')}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                      <div style={{ fontSize:10, color:'#94A3B8', marginTop:2, display:'flex', gap:8 }}>
                        {cl && <span>🏢 {cl.fantasia||cl.razao_social}</span>}
                        <span style={{ color:'#991B1B', fontWeight:600 }}>📅 Venceu em {t.prazo}</span>
                      </div>
                    </div>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, background: STATUS_COLOR[t.status]+'22', color: STATUS_COLOR[t.status], fontWeight:700 }}>{t.status}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Próximos 30 dias agrupados por data */}
          {Array.from({ length: 30 }, (_, i) => addDays(new Date(), i)).map(d => {
            const key = fmtDate(d)
            const dayTasks = porDia[key] || []
            if (dayTasks.length === 0) return null
            const isToday = key === today
            return (
              <div key={key} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color: isToday?'#4338CA':'#334155', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background: isToday?'#6366F1':'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: isToday?'#fff':'#334155', flexShrink:0 }}>
                    {d.getDate()}
                  </div>
                  <span style={{ textTransform:'capitalize' }}>
                    {isToday ? 'Hoje — ' : ''}{d.toLocaleDateString('pt-BR',{weekday:'long', month:'long'})}
                  </span>
                  <span style={{ fontSize:9, background:'#E2E8F0', color:'#475569', padding:'1px 6px', borderRadius:4 }}>{dayTasks.length}</span>
                </div>
                <div style={{ paddingLeft:36, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:6 }}>
                  {dayTasks.map(t => <TarefaCard key={t.id} t={t} compact={false} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

