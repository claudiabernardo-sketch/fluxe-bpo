import { useClients, useApontamentos, useUsuarios } from '../hooks/useData'
import { KpiCard, Card, CardHeader, Loader, fmtR } from '../components/ui'
import ContextTooltip from '../components/ui/ContextTooltip'

const CUSTO_HORA_PADRAO = 65 // R$65/h — referência realista para analista BPO financeiro

export default function RentPage() {
  const { data: clients = [], isLoading } = useClients()
  const { data: aponts = [] } = useApontamentos()
  const { data: usuarios = [] } = useUsuarios()
  if (isLoading) return <Loader />

  // Custo/hora médio real da equipe (configurado em Capacidade), ou fallback R$35
  const usuariosComCusto = usuarios.filter(u => u.custo_hora)
  const CUSTO_HORA = usuariosComCusto.length
    ? Math.round(usuariosComCusto.reduce((a, u) => a + u.custo_hora, 0) / usuariosComCusto.length)
    : CUSTO_HORA_PADRAO

  const ativos = clients.filter(c=>c.status==='ativo')
  const mrr = ativos.reduce((a,c)=>a+(c.valor_mrr||0),0)
  const arr = mrr * 12
  const tm = ativos.length ? Math.round(mrr/ativos.length) : 0

  const rows = ativos.map(cl => {
    const horas = aponts.filter(a=>a.cliente_id===cl.id).reduce((s,a)=>s+(a.segundos||0),0)/3600
    const custo = horas * CUSTO_HORA
    const receita = cl.valor_mrr || 0
    const margem = receita - custo
    const pct = receita > 0 ? margem/receita*100 : 0
    return { ...cl, horas, custo, margem, pct }
  }).sort((a,b)=>b.pct-a.pct)

  const totalMargem = rows.reduce((a,r)=>a+r.margem,0)
  const margemGlobal = mrr > 0 ? totalMargem/mrr*100 : 0

  return (
    <div>
      <ContextTooltip
        pageKey="rentabilidade"
        icon="📊"
        title="Como funciona a Rentabilidade"
        color="#22C55E"
        tips={[
          'Compara o MRR do cliente com o custo real de atendimento (horas × custo/hora).',
          'Margem negativa significa que você está perdendo dinheiro nesse cliente.',
          'Para o cálculo ser preciso, registre horas via timer nas tarefas.',
          'Configure o custo/hora de cada analista em Capacidade.',
        ]}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:18 }}>
        <KpiCard label="MRR" value={`R$ ${(mrr/1000).toFixed(1)}k`} color="blue" />
        <KpiCard label="ARR" value={`R$ ${(arr/1000).toFixed(0)}k`} color="green" />
        <KpiCard label="Ticket médio" value={`R$ ${tm.toLocaleString('pt-BR')}`} color="cyan" />
        <KpiCard label="LTV estimado" value={`R$ ${(tm*24/1000).toFixed(1)}k`} color="purple" sub="24 meses" />
        <KpiCard label="Custo/hora" value={`R$ ${CUSTO_HORA}`} color="orange" sub="configurável" />
        <KpiCard label="Margem global" value={`${margemGlobal.toFixed(1)}%`} color={margemGlobal>40?'green':margemGlobal>0?'yellow':'red'} />
      </div>

      <Card>
        <CardHeader title="Rentabilidade por cliente" icon="📊" />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #F1F5F9' }}>
                {['Cliente','MRR','Horas/mês','Custo (R$)','Margem R$','Margem %','Situação'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const cor = r.pct > 40 ? '#15803D' : r.pct > 0 ? '#92400E' : '#991B1B'
                const bgCor = r.pct > 40 ? '#F0FDF4' : r.pct > 0 ? '#FFFBEB' : '#FEF2F2'
                const label = r.pct > 40 ? 'Lucrativo' : r.pct > 0 ? 'Margem baixa' : 'Prejuízo'
                return (
                  <tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:12 }}>{r.razao_social}</div>
                      {r.fantasia && <div style={{ fontSize:10, color:'#94A3B8' }}>{r.fantasia}</div>}
                    </td>
                    <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:700, color:'#15803D', fontSize:12 }}>{fmtR(r.valor_mrr)}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12 }}>{r.horas.toFixed(1)}h</td>
                    <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:'#991B1B' }}>{fmtR(r.custo)}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:700, fontSize:12, color: r.margem>=0?'#15803D':'#991B1B' }}>{fmtR(r.margem)}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, background:bgCor, color:cor }}>{r.pct.toFixed(1)}%</span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:bgCor, color:cor }}>{label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
