import { useTasks } from '../hooks/useData'
import { useClients } from '../hooks/useData'
import { Card, CardHeader, Badge, Loader } from '../components/ui'

export default function AgendaPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()

  if (isLoading) return <Loader />

  const today = new Date()
  const days = []
  for (let i=0; i<7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }

  const fmtDate = d => d.toISOString().slice(0,10)
  const fmtDay = d => d.toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' })

  const tasksByDay = {}
  days.forEach(d => {
    const key = fmtDate(d)
    tasksByDay[key] = tasks.filter(t => t.prazo === key && t.status !== 'concluida')
  })

  const semVenc = tasks.filter(t => !t.prazo && t.status !== 'concluida').slice(0,10)

  return (
    <div>
      <div style={{ fontSize:13, color:'#64748B', marginBottom:16 }}>Próximos 7 dias — tarefas por vencimento</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10, marginBottom:20 }}>
        {days.map((d, i) => {
          const key = fmtDate(d)
          const dayTasks = tasksByDay[key] || []
          const isToday = i === 0
          return (
            <div key={key} style={{ background: isToday?'#EEF2FF':'#fff', border: `1px solid ${isToday?'#6366F1':'#E2E8F0'}`, borderRadius:10, padding:10, minHeight:120 }}>
              <div style={{ fontSize:10, fontWeight:700, color: isToday?'#4338CA':'#64748B', marginBottom:6, textTransform:'capitalize' }}>
                {isToday ? 'HOJE' : fmtDay(d)}
              </div>
              {dayTasks.length === 0
                ? <div style={{ fontSize:10, color:'#CBD5E1' }}>Livre</div>
                : dayTasks.map(t => (
                  <div key={t.id} style={{ fontSize:10, padding:'4px 6px', borderRadius:6, background:'#fff', border:'1px solid #E2E8F0', marginBottom:4, color:'#334155', fontWeight:500 }}>
                    {t.titulo?.slice(0,30)}{t.titulo?.length>30?'…':''}
                  </div>
                ))
              }
              {dayTasks.length > 0 && (
                <div style={{ fontSize:9, color: isToday?'#4338CA':'#94A3B8', marginTop:4, fontWeight:600 }}>
                  {dayTasks.length} tarefa{dayTasks.length>1?'s':''}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {semVenc.length > 0 && (
        <Card>
          <CardHeader title="Tarefas sem prazo definido" icon="📌" />
          {semVenc.map(t => (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom:'1px solid #F8FAFC' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{t.titulo}</div>
                <div style={{ fontSize:10, color:'#94A3B8' }}>{t.clientes?.fantasia||t.clientes?.razao_social||'—'} · {t.categoria||'—'}</div>
              </div>
              <Badge label={t.prioridade} color={t.prioridade==='alta'?'red':t.prioridade==='media'?'yellow':'green'} />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
