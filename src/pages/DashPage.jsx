import { useClients } from '../hooks/useData'
import { useTasks } from '../hooks/useData'
import { usePendencias } from '../hooks/useData'
import { useAuthStore } from '../store/authStore'
import { KpiCard, Card, CardHeader, Badge, Loader, fmt, isVencida } from '../components/ui'

export default function DashPage() {
  const { profile } = useAuthStore()
  const { data: clients = [], isLoading: clLoading } = useClients()
  const { data: tasks = [],   isLoading: tLoading  } = useTasks()
  const { data: pends = [] } = usePendencias({ status: 'aberta' })

  if (clLoading || tLoading) return <Loader />

  const ativos    = clients.filter(c => c.status === 'ativo').length
  const onboarding = clients.filter(c => ['onboarding','implantacao'].includes(c.status)).length
  const mrr       = clients.filter(c => c.status === 'ativo').reduce((a,c) => a + (c.valor_mrr||0), 0)
  const vencidas  = tasks.filter(t => isVencida(t.prazo, t.status))
  const abertas   = tasks.filter(t => t.status !== 'concluida')
  const today     = new Date().toISOString().slice(0,10)
  const hoje      = tasks.filter(t => t.prazo === today && t.status !== 'concluida')

  const hora = new Date().getHours()
  const greetz = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const nome = profile?.nome?.split(' ')[0] || 'usuário'

  return (
    <div>
      {/* Morning brief */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:18, fontWeight:700, color:'#0F172A', marginBottom:4 }}>
          {greetz}, {nome}! 👋
        </h1>
        <p style={{ color:'#64748B', fontSize:13 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })}
          {hoje.length > 0 && ` · ${hoje.length} tarefa${hoje.length>1?'s':''} para hoje`}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
        <KpiCard label="MRR" value={`R$ ${(mrr/1000).toFixed(1)}k`} color="blue" sub={`${ativos} clientes ativos`} />
        <KpiCard label="Tarefas abertas" value={abertas.length} color={vencidas.length > 0 ? 'red' : 'green'} sub={vencidas.length > 0 ? `${vencidas.length} vencida${vencidas.length>1?'s':''}` : 'Tudo em dia'} />
        <KpiCard label="Onboarding" value={onboarding} color="purple" sub="em implantação" />
        <KpiCard label="Pendências" value={pends.length} color={pends.length > 5 ? 'red' : 'yellow'} sub="aguardando cliente" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Tarefas vencidas */}
        <Card>
          <CardHeader title="Tarefas vencidas" icon="⚠" />
          <div style={{ padding:'0 0 4px' }}>
            {vencidas.length === 0
              ? <div style={{ padding:'20px', textAlign:'center', color:'#22C55E', fontSize:12 }}>✓ Nenhuma tarefa vencida</div>
              : vencidas.slice(0,6).map(t => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                    <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>
                      {t.clientes?.fantasia || t.clientes?.razao_social || '—'} · venceu {fmt(t.prazo)}
                    </div>
                  </div>
                  <Badge label={t.prioridade} color={t.prioridade==='alta'?'red':t.prioridade==='media'?'yellow':'green'} />
                </div>
              ))
            }
          </div>
        </Card>

        {/* Para hoje */}
        <Card>
          <CardHeader title="Para fazer hoje" icon="📅" />
          <div style={{ padding:'0 0 4px' }}>
            {hoje.length === 0
              ? <div style={{ padding:'20px', textAlign:'center', color:'#64748B', fontSize:12 }}>Nenhuma tarefa programada para hoje</div>
              : hoje.slice(0,6).map(t => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.titulo}</div>
                    <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>
                      {t.clientes?.fantasia || '—'} · {t.categoria || '—'}
                    </div>
                  </div>
                  <Badge label={t.status} color={t.status==='concluida'?'green':t.status==='andamento'?'yellow':'blue'} />
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    </div>
  )
}
