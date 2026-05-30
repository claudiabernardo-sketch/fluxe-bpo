import { useClients } from '../hooks/useData'
import { useTasks } from '../hooks/useData'
import { useApontamentos } from '../hooks/useData'
import { KpiCard, Card, CardHeader, Loader, fmtR } from '../components/ui'

export default function RelatoriosPage() {
  const { data: clients = [], isLoading } = useClients()
  const { data: tasks = [] } = useTasks()
  const { data: aponts = [] } = useApontamentos()

  if (isLoading) return <Loader />

  const ativos = clients.filter(c=>c.status==='ativo')
  const mrr = ativos.reduce((a,c)=>a+(c.valor_mrr||0),0)
  const today = new Date().toISOString().slice(0,10)
  const vencidas = tasks.filter(t=>t.prazo&&t.prazo<today&&t.status!=='concluida')
  const concluidas = tasks.filter(t=>t.status==='concluida')
  const taxaConcl = tasks.length ? Math.round(concluidas.length/tasks.length*100) : 0
  const horasTotal = aponts.reduce((a,ap)=>a+(ap.segundos||0),0)/3600

  const byCategoria = {}
  tasks.forEach(t => {
    if (!t.categoria) return
    byCategoria[t.categoria] = (byCategoria[t.categoria]||0) + 1
  })
  const topCats = Object.entries(byCategoria).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const maxCat = topCats[0]?.[1] || 1

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:18 }}>
        <KpiCard label="MRR" value={`R$ ${(mrr/1000).toFixed(1)}k`} color="blue" />
        <KpiCard label="Clientes ativos" value={ativos.length} color="green" />
        <KpiCard label="Taxa de conclusão" value={`${taxaConcl}%`} color={taxaConcl>70?'green':'yellow'} sub={`${concluidas.length}/${tasks.length} tarefas`} />
        <KpiCard label="Tarefas vencidas" value={vencidas.length} color={vencidas.length>0?'red':'green'} />
        <KpiCard label="Horas registradas" value={`${horasTotal.toFixed(1)}h`} color="cyan" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card>
          <CardHeader title="Tarefas por categoria" icon="📂" />
          <div style={{ padding:16 }}>
            {topCats.map(([cat, count]) => (
              <div key={cat} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ fontSize:11, color:'#334155', width:150, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat}</div>
                <div style={{ flex:1, height:8, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'#6366F1', borderRadius:99, width:`${Math.round(count/maxCat*100)}%` }} />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#334155', width:20, textAlign:'right' }}>{count}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Clientes por etapa" icon="🗂" />
          <div style={{ padding:16 }}>
            {['comercial','pre_ob','onboarding','implantacao','operacional','estrategico'].map(et => {
              const count = clients.filter(c=>c.etapa===et).length
              const labels = {comercial:'Comercial',pre_ob:'Pré-Onb.',onboarding:'Onboarding',implantacao:'Implantação',operacional:'Operacional',estrategico:'Estratégico'}
              const max = Math.max(...['comercial','pre_ob','onboarding','implantacao','operacional','estrategico'].map(e=>clients.filter(c=>c.etapa===e).length),1)
              return count > 0 ? (
                <div key={et} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ fontSize:11, color:'#334155', width:90, flexShrink:0 }}>{labels[et]}</div>
                  <div style={{ flex:1, height:8, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'#22C55E', borderRadius:99, width:`${Math.round(count/max*100)}%` }} />
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, width:20, textAlign:'right' }}>{count}</div>
                </div>
              ) : null
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
