import { useClients, useTasks, usePendencias, useApontamentos } from '../hooks/useData'
import { KpiCard, Card, CardHeader, Loader, Badge, fmtR } from '../components/ui'

export default function ExecPage() {
  const { data: clients = [], isLoading } = useClients()
  const { data: tasks = [] } = useTasks()
  const { data: pends = [] } = usePendencias({ status:'aberta' })
  const { data: aponts = [] } = useApontamentos()

  if (isLoading) return <Loader />

  const ativos = clients.filter(c=>c.status==='ativo')
  const mrr = ativos.reduce((a,c)=>a+(c.valor_mrr||0), 0)
  const arr = mrr * 12
  const onboarding = clients.filter(c=>['onboarding','implantacao'].includes(c.status)).length
  const today = new Date().toISOString().slice(0,10)
  const vencidas = tasks.filter(t=>t.prazo && t.prazo < today && t.status !== 'concluida')
  const horasTotal = aponts.reduce((a,ap)=>a+(ap.segundos||0),0)/3600

  // Health Score simples
  function hs(cl) {
    const ct = tasks.filter(t=>t.cliente_id===cl.id)
    const v = ct.filter(t=>t.prazo && t.prazo < today && t.status!=='concluida').length
    const pa = pends.filter(p=>p.cliente_id===cl.id).length
    return Math.max(0, Math.min(100, 100 - v*10 - pa*6))
  }
  const emRisco = ativos.filter(c=>hs(c)<50)
  const topMrr = [...ativos].sort((a,b)=>b.valor_mrr-a.valor_mrr).slice(0,5)

  const etapaMap = { comercial:'Comercial', pre_ob:'Pré-Onb.', onboarding:'Onboarding', implantacao:'Implantação', operacional:'Operacional', estrategico:'Estratégico', acompanhamento:'Acompanham.' }
  const etapaColor = { comercial:'purple', pre_ob:'yellow', onboarding:'blue', implantacao:'orange', operacional:'green', estrategico:'cyan' }
  const etapaCount = {}
  clients.forEach(c=>{ etapaCount[c.etapa]=(etapaCount[c.etapa]||0)+1 })
  const maxEt = Math.max(...Object.values(etapaCount),1)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:18 }}>
        <KpiCard label="MRR" value={`R$ ${(mrr/1000).toFixed(1)}k`} color="blue" sub={`ARR R$ ${(arr/1000).toFixed(0)}k`} />
        <KpiCard label="Clientes ativos" value={ativos.length} color="green" />
        <KpiCard label="Em onboarding" value={onboarding} color="purple" />
        <KpiCard label="Tarefas atrasadas" value={vencidas.length} color={vencidas.length>0?'red':'green'} />
        <KpiCard label="Pendências" value={pends.length} color={pends.length>3?'yellow':'green'} />
        <KpiCard label="Horas registradas" value={`${horasTotal.toFixed(1)}h`} color="cyan" sub="total apontado" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Card>
          <CardHeader title="Carteira por etapa" icon="🗂" />
          <div style={{ padding:'10px 16px' }}>
            {Object.entries(etapaMap).filter(([k])=>etapaCount[k]).map(([k,l])=>(
              <div key={k} style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 0' }}>
                <div style={{ fontSize:11, color:'#334155', width:90, flexShrink:0 }}>{l}</div>
                <div style={{ flex:1, height:8, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:99, width:`${Math.round((etapaCount[k]||0)/maxEt*100)}%`, background: {green:'#22C55E',blue:'#6366F1',purple:'#A855F7',orange:'#F97316',cyan:'#22D3EE',yellow:'#F59E0B'}[etapaColor[k]]||'#94A3B8' }} />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#334155', width:20, textAlign:'right' }}>{etapaCount[k]||0}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Clientes em risco (Health < 50)" icon="⚠" />
          <div>
            {emRisco.length === 0
              ? <div style={{ padding:20, textAlign:'center', color:'#22C55E', fontSize:12 }}>✓ Todos saudáveis</div>
              : emRisco.map(cl => (
                <div key={cl.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEF2F2', border:'2px solid #EF4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#991B1B' }}>
                    {hs(cl)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{cl.razao_social}</div>
                    <div style={{ fontSize:10, color:'#94A3B8' }}>{cl.segmento}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#15803D' }}>{fmtR(cl.valor_mrr)}</div>
                </div>
              ))
            }
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top clientes por MRR" icon="🏆" />
        <div style={{ padding:'10px 16px' }}>
          {topMrr.map((cl,i) => (
            <div key={cl.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 0' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background: i<3?'#FEF9C3':'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color: i<3?'#92400E':'#475569' }}>
                {i+1}
              </div>
              <div style={{ flex:1, fontSize:12, fontWeight:600, color:'#0F172A' }}>{cl.razao_social}</div>
              <div style={{ height:6, width:120, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'#6366F1', borderRadius:99, width:`${Math.round((cl.valor_mrr/topMrr[0].valor_mrr)*100)}%` }} />
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:'#15803D', width:90, textAlign:'right' }}>{fmtR(cl.valor_mrr)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
