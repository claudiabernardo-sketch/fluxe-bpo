import { useApontamentosMes, useUsuarios } from '../hooks/useData'
import { KpiCard, Card, CardHeader, Loader } from '../components/ui'
import ContextTooltip from '../components/ui/ContextTooltip'

const HORAS_MES_PADRAO = 160
const CUSTO_HORA_PADRAO = 65 // R$65/h — referência realista para analista BPO financeiro

export default function CapPage() {
  const { data: aponts = [], isLoading } = useApontamentosMes()
  const { data: usuarios = [] } = useUsuarios()

  if (isLoading) return <Loader />

  // Usa horas_mes e custo_hora individuais de cada usuário; fallback nos padrões
  const horasTotal = usuarios.reduce((a,u) => a + (u.horas_mes || HORAS_MES_PADRAO), 0)
  const custoEquipeMes = usuarios.reduce((a,u) => a + ((u.custo_hora || CUSTO_HORA_PADRAO) * (u.horas_mes || HORAS_MES_PADRAO)), 0)
  const horasUsadas = aponts.reduce((a,ap)=>a+(ap.segundos||0),0)/3600
  const horasLivres = Math.max(0, horasTotal - horasUsadas)
  const ocupacao = horasTotal > 0 ? Math.min(100, Math.round(horasUsadas/horasTotal*100)) : 0
  const hrsNovoCl = 20
  const novosClientes = Math.floor(horasLivres/hrsNovoCl)
  const cor = ocupacao>85?'#EF4444':ocupacao>60?'#F97316':'#22C55E'
  const custoHoraMedia = usuarios.length > 0
    ? usuarios.reduce((a,u)=>a+(u.custo_hora||CUSTO_HORA_PADRAO),0)/usuarios.length
    : CUSTO_HORA_PADRAO

  const byUser = {}
  aponts.forEach(ap => {
    if (!ap.usuario_id) return
    byUser[ap.usuario_id] = (byUser[ap.usuario_id]||0) + (ap.segundos||0)/3600
  })

  return (
    <div>
      <ContextTooltip
        pageKey="capacidade"
        icon="⚡"
        title="Como usar o Painel de Capacidade"
        color="#6366F1"
        tips={[
          'Informe o custo/hora e horas mensais de cada analista para cálculos precisos.',
          'A ocupação mostra % das horas disponíveis do mês já comprometidas com apontamentos.',
          'Use "Novos clientes cabem" para saber quantos clientes pode aceitar sem sobrecarregar a equipe.',
          'Acima de 85% de ocupação, o risco de atraso nos prazos aumenta significativamente.',
        ]}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:18 }}>
        <KpiCard label="Horas disponíveis" value={`${horasTotal}h`} color="blue" sub={`${usuarios.length} analistas`} />
        <KpiCard label="Horas utilizadas" value={`${horasUsadas.toFixed(1)}h`} color={ocupacao>85?'red':ocupacao>60?'orange':'green'} sub={`${ocupacao}% da capacidade (este mês)`} />
        <KpiCard label="Horas livres" value={`${horasLivres.toFixed(1)}h`} color="cyan" sub="disponível para venda" />
        <KpiCard label="Novos clientes cabem" value={novosClientes} color="purple" sub={`${hrsNovoCl}h/cliente médio`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Card>
          <CardHeader title="Ocupação da equipe" icon="👥" />
          <div style={{ padding:16 }}>
            {usuarios.length === 0
              ? <div style={{ textAlign:'center', color:'#94A3B8', fontSize:12, padding:20 }}>Nenhum usuário cadastrado</div>
              : usuarios.map(u => {
                const h = byUser[u.id] || 0
                const horasMes = u.horas_mes || HORAS_MES_PADRAO
                const pct = Math.min(100, Math.round(h/horasMes*100))
                const c = pct>85?'#EF4444':pct>60?'#F97316':'#22C55E'
                return (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #F8FAFC' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'#6366F1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {u.nome?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:600 }}>{u.nome?.split(' ')[0]}</div>
                      <div style={{ fontSize:9, color:'#94A3B8' }}>
                        {h.toFixed(1)}h / {horasMes}h
                        {u.custo_hora ? ` · R$${u.custo_hora.toFixed(0)}/h` : ''}
                      </div>
                    </div>
                    <div style={{ width:80 }}>
                      <div style={{ height:6, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:c, borderRadius:99, width:`${pct}%` }} />
                      </div>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:c, width:28, textAlign:'right' }}>{pct}%</div>
                  </div>
                )
              })
            }
          </div>
        </Card>

        <Card>
          <CardHeader title="Capacidade disponível" icon="🎯" />
          <div style={{ padding:24, textAlign:'center' }}>
            <svg width="140" height="90" viewBox="-10 0 160 90" style={{ overflow:'visible' }}>
              <path d="M 10 80 A 60 60 0 0 1 130 80" fill="none" stroke="#F1F5F9" strokeWidth="14" strokeLinecap="round"/>
              <path d="M 10 80 A 60 60 0 0 1 130 80" fill="none" stroke={cor} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${(Math.PI*60*ocupacao/100).toFixed(1)} ${(Math.PI*60).toFixed(1)}`} style={{ transition:'stroke-dasharray .8s' }}/>
            </svg>
            <div style={{ fontSize:28, fontWeight:800, color:cor, marginTop:-20 }}>{ocupacao}%</div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:4 }}>ocupação da equipe</div>
            <div style={{ marginTop:16, fontSize:13, color: ocupacao>85?'#991B1B':'#166534', fontWeight:600 }}>
              {ocupacao>85 ? '⚠️ Equipe sobrecarregada' : `✓ Espaço para ${novosClientes} novos clientes`}
            </div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:4 }}>{horasLivres.toFixed(0)}h disponíveis</div>
          </div>
        </Card>
      </div>

      {/* Custo da equipe */}
      {usuarios.some(u => u.custo_hora) && (
        <Card>
          <CardHeader title="Custo da equipe" icon="💰" />
          <div style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:16 }}>
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>Custo mensal da equipe</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#0F172A' }}>
                  R$ {custoEquipeMes.toLocaleString('pt-BR', { minimumFractionDigits:0, maximumFractionDigits:0 })}
                </div>
              </div>
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>Custo/hora médio</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#0F172A' }}>
                  R$ {custoHoraMedia.toFixed(2)}/h
                </div>
              </div>
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>Custo das horas utilizadas</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#EF4444' }}>
                  R$ {(horasUsadas * custoHoraMedia).toLocaleString('pt-BR', { minimumFractionDigits:0, maximumFractionDigits:0 })}
                </div>
              </div>
            </div>
            <div style={{ fontSize:11, color:'#94A3B8', textAlign:'center' }}>
              💡 Configure o custo/hora de cada analista em <strong>Configurações → Equipe</strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
