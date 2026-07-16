import { useState } from 'react'
import { useClients, useTasks, usePendencias, useApontamentosMes, useUsuarios, useRadarScores, useRadarAjustesManuaisTodos, useRadarMetricasMesTodos, useMetaCrescimento, useSalvarMetaCrescimento } from '../hooks/useData'
import { KpiCard, Card, CardHeader, Loader, Badge, fmtR } from '../components/ui'
import { computeMargemPorCliente, computeAreaStatusPorCliente, computeRadarScore, aplicarAjustesManuais, aplicarMetricaMes, CUSTO_HORA_PADRAO } from '../utils/radar'
import { formatBRL, parseBRL } from '../utils/currency'

export default function ExecPage() {
  const { data: clients = [], isLoading } = useClients()
  const { data: tasks = [] } = useTasks()
  const { data: pends = [] } = usePendencias({ status:'aberta' })
  const { data: aponts = [] } = useApontamentosMes()
  const { data: usuarios = [] } = useUsuarios()
  const { data: radarScores = [] } = useRadarScores()
  const { data: ajustesTodos = [] } = useRadarAjustesManuaisTodos()
  const { data: metricasTodos = [] } = useRadarMetricasMesTodos()
  const { data: meta = null } = useMetaCrescimento()
  const salvarMeta = useSalvarMetaCrescimento()
  const [metaForm, setMetaForm] = useState(null)

  if (isLoading) return <Loader />

  const ativos = clients.filter(c=>c.status==='ativo')
  const mrr = ativos.reduce((a,c)=>a+(c.valor_mrr||0), 0)
  const arr = mrr * 12
  const onboarding = clients.filter(c=>['onboarding','implantacao'].includes(c.etapa)).length
  const today = new Date().toLocaleDateString('en-CA')
  const vencidas = tasks.filter(t=>t.prazo && t.prazo < today && t.status !== 'concluida')
  const horasTotal = aponts.reduce((a,ap)=>a+(ap.segundos||0),0)/3600

  // Mesma conta usada no Radar do Cliente (radar.js) — pra não divergir do
  // que aparece na aba Radar e nos insights do Dashboard.
  const custoHoraMedio = usuarios.length > 0
    ? usuarios.reduce((a, u) => a + (u.custo_hora || CUSTO_HORA_PADRAO), 0) / usuarios.length
    : CUSTO_HORA_PADRAO
  const margensPorCliente = computeMargemPorCliente(clients, aponts, custoHoraMedio)
  const radarMap = {}
  radarScores.forEach(r => { radarMap[r.cliente_id] = r })
  const ajustesPorCliente = {}
  ajustesTodos.forEach(a => {
    if (!ajustesPorCliente[a.cliente_id]) ajustesPorCliente[a.cliente_id] = {}
    ajustesPorCliente[a.cliente_id][a.area] = { status: a.status, observacao: a.observacao, criado_em: a.criado_em, expira_em: a.expira_em }
  })
  const metricaPorCliente = {}
  metricasTodos.forEach(m => { metricaPorCliente[m.cliente_id] = m })

  // Cliente com snapshot do servidor (radar-calcular) usa ele direto — só
  // recalcula na hora quem ainda não tem snapshot (empresa/cliente novo).
  // Métrica real e ajustes manuais entram por cima de qualquer fonte, pra
  // refletir edição na hora.
  function radarDoCliente(cl) {
    const snap = radarMap[cl.id]
    let areas
    if (snap) {
      areas = snap.areas
    } else {
      const m = margensPorCliente.find(x => x.clienteId === cl.id)
      const tarefasCliente = tasks.filter(t => t.cliente_id === cl.id && !t.deleted_at)
      areas = computeAreaStatusPorCliente(cl, tarefasCliente, m, usuarios, aponts)
    }
    const areasComMetrica = aplicarMetricaMes(areas, metricaPorCliente[cl.id], cl.valor_mrr || 0)
    return computeRadarScore(aplicarAjustesManuais(areasComMetrica, ajustesPorCliente[cl.id]))
  }
  const emRisco = ativos.filter(c => radarDoCliente(c).semaforo === 'vermelho')
  const topMrr = [...ativos].sort((a,b)=>(b.valor_mrr||0)-(a.valor_mrr||0)).slice(0,5)
  const topMrrMax = topMrr.length ? (topMrr[0].valor_mrr || 0) : 0

  const etapaMap = { comercial:'Comercial', pre_ob:'Pré-Onb.', onboarding:'Onboarding', implantacao:'Implantação', operacional:'Operacional', estrategico:'Estratégico', acompanhamento:'Acompanham.' }
  const etapaColor = { comercial:'purple', pre_ob:'yellow', onboarding:'blue', implantacao:'orange', operacional:'green', estrategico:'cyan' }
  const etapaCount = {}
  clients.forEach(c=>{ etapaCount[c.etapa]=(etapaCount[c.etapa]||0)+1 })
  const maxEt = Math.max(...Object.values(etapaCount),1)

  // ── Meta de crescimento: mesmo ritmo real (novos clientes ativos/mês, 6
  // meses) usado na previsão de capacidade, aplicado aqui pra projetar
  // quando a meta de MRR ou nº de clientes deve ser atingida.
  const hoje = new Date()
  const mesesHist = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 6 + i, 1)
    return { ano: d.getFullYear(), mes: d.getMonth() }
  })
  const novosPorMes = mesesHist.map(({ ano, mes }) =>
    ativos.filter(c => {
      if (!c.criado_em) return false
      const d = new Date(c.criado_em)
      return d.getFullYear() === ano && d.getMonth() === mes
    }).length
  )
  const mediaNovosClientesMes = novosPorMes.reduce((a,b) => a+b, 0) / 6
  const ticketMedioAtual = ativos.length ? mrr/ativos.length : 0
  const ritmoMrrMes = mediaNovosClientesMes * ticketMedioAtual

  const metaAtual = meta?.tipo === 'clientes' ? ativos.length : mrr
  const metaRitmoMes = meta?.tipo === 'clientes' ? mediaNovosClientesMes : ritmoMrrMes
  const metaProgresso = meta?.valor_alvo > 0 ? Math.min(100, Math.round(metaAtual/meta.valor_alvo*100)) : 0
  const metaAtingida = meta ? metaAtual >= meta.valor_alvo : false
  const metaFalta = meta ? Math.max(0, meta.valor_alvo - metaAtual) : 0
  const metaMeses = (!metaAtingida && metaRitmoMes > 0) ? metaFalta/metaRitmoMes : null
  const metaDataProjetada = metaMeses != null ? new Date(hoje.getFullYear(), hoje.getMonth() + Math.ceil(metaMeses), 1) : null
  const metaDataAlvo = meta?.data_alvo ? new Date(meta.data_alvo + 'T12:00:00') : null

  async function salvarMetaHandler() {
    const valor = metaForm.tipo === 'mrr' ? parseBRL(metaForm.valorStr) : (Number(metaForm.valorStr) || 0)
    if (!valor || valor <= 0) return alert('Informe um valor de meta válido.')
    await salvarMeta.mutateAsync({ id: metaForm.id, tipo: metaForm.tipo, valor_alvo: valor, data_alvo: metaForm.dataAlvo || null })
    setMetaForm(null)
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:18 }}>
        <KpiCard label="MRR" value={`R$ ${(mrr/1000).toFixed(1)}k`} color="blue" sub={`ARR R$ ${(arr/1000).toFixed(0)}k`} />
        <KpiCard label="Clientes ativos" value={ativos.length} color="green" />
        <KpiCard label="Em onboarding" value={onboarding} color="purple" />
        <KpiCard label="Tarefas atrasadas" value={vencidas.length} color={vencidas.length>0?'red':'green'} />
        <KpiCard label="Pendências" value={pends.length} color={pends.length>3?'yellow':'green'} />
        <KpiCard label="Horas registradas" value={`${horasTotal.toFixed(1)}h`} color="cyan" sub="apontado este mês" />
      </div>

      <Card style={{ marginBottom:14 }}>
        <CardHeader title="Meta de crescimento" icon="🎯" />
        <div style={{ padding:16 }}>
          {metaForm !== null ? (
            <div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                <select value={metaForm.tipo} onChange={e => setMetaForm(f => ({ ...f, tipo: e.target.value }))}
                  style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #E2E8F0', fontSize:13 }}>
                  <option value="mrr">MRR (R$/mês)</option>
                  <option value="clientes">Nº de clientes ativos</option>
                </select>
                {metaForm.tipo === 'mrr' ? (
                  <input type="text" inputMode="decimal" placeholder="Ex: 30.000,00" value={metaForm.valorStr}
                    onChange={e => setMetaForm(f => ({ ...f, valorStr: e.target.value }))}
                    style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #E2E8F0', fontSize:13, width:140 }} />
                ) : (
                  <input type="number" min={1} placeholder="Ex: 20" value={metaForm.valorStr}
                    onChange={e => setMetaForm(f => ({ ...f, valorStr: e.target.value }))}
                    style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #E2E8F0', fontSize:13, width:100 }} />
                )}
                <input type="date" value={metaForm.dataAlvo}
                  onChange={e => setMetaForm(f => ({ ...f, dataAlvo: e.target.value }))}
                  style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #E2E8F0', fontSize:13 }} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={salvarMetaHandler} disabled={salvarMeta.isPending}
                  style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  {salvarMeta.isPending ? 'Salvando...' : 'Salvar meta'}
                </button>
                {meta && (
                  <button onClick={() => setMetaForm(null)}
                    style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:13 }}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ) : !meta ? (
            <div style={{ textAlign:'center', padding:10 }}>
              <div style={{ fontSize:12, color:'#64748B', marginBottom:10 }}>Nenhuma meta definida ainda.</div>
              <button onClick={() => setMetaForm({ tipo:'mrr', valorStr:'', dataAlvo:'' })}
                style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                + Definir meta
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8, flexWrap:'wrap', gap:6 }}>
                <div style={{ fontSize:13, color:'#334155' }}>
                  {meta.tipo === 'mrr'
                    ? <>MRR: <strong>R$ {mrr.toLocaleString('pt-BR',{maximumFractionDigits:0})}</strong> de R$ {meta.valor_alvo.toLocaleString('pt-BR',{maximumFractionDigits:0})}</>
                    : <>Clientes ativos: <strong>{ativos.length}</strong> de {meta.valor_alvo}</>}
                </div>
                <button onClick={() => setMetaForm({ id: meta.id, tipo: meta.tipo, valorStr: meta.tipo==='mrr' ? formatBRL(meta.valor_alvo) : String(meta.valor_alvo), dataAlvo: meta.data_alvo || '' })}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#6366F1', fontSize:11, fontWeight:600 }}>
                  ✏ Editar
                </button>
              </div>
              <div style={{ height:10, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginBottom:10 }}>
                <div style={{ height:'100%', borderRadius:99, width:`${metaProgresso}%`, background: metaAtingida?'#22C55E':'#6366F1', transition:'width .5s' }} />
              </div>
              {metaAtingida ? (
                <div style={{ fontSize:12, color:'#166534', fontWeight:600 }}>🎉 Meta atingida!</div>
              ) : metaMeses == null ? (
                <div style={{ fontSize:12, color:'#94A3B8' }}>Ainda não há ritmo de crescimento suficiente pra projetar quando a meta será atingida.</div>
              ) : (
                <div style={{ fontSize:12, color: metaDataAlvo ? (metaDataProjetada<=metaDataAlvo?'#166534':'#991B1B') : '#334155' }}>
                  No ritmo atual, a meta deve ser atingida por volta de <strong>{metaDataProjetada.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</strong>
                  {metaDataAlvo && <> — prazo definido: {metaDataAlvo.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})} ({metaDataProjetada<=metaDataAlvo ? 'no caminho ✓' : 'fora do ritmo ⚠️'})</>}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

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
          <CardHeader title="Clientes em risco (Radar)" icon="⚠" />
          <div>
            {emRisco.length === 0
              ? <div style={{ padding:20, textAlign:'center', color:'#22C55E', fontSize:12 }}>✓ Todos saudáveis</div>
              : emRisco.map(cl => {
                const { score } = radarDoCliente(cl)
                return (
                  <div key={cl.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEF2F2', border:'2px solid #EF4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#991B1B' }}>
                      {score ?? '–'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{cl.razao_social}</div>
                      <div style={{ fontSize:10, color:'#94A3B8' }}>{cl.segmento}</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#15803D' }}>{fmtR(cl.valor_mrr)}</div>
                  </div>
                )
              })
            }
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top clientes por valor mensal" icon="🏆" />
        <div style={{ padding:'10px 16px' }}>
          {topMrr.map((cl,i) => (
            <div key={cl.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 0' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background: i<3?'#FEF9C3':'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color: i<3?'#92400E':'#475569' }}>
                {i+1}
              </div>
              <div style={{ flex:1, fontSize:12, fontWeight:600, color:'#0F172A' }}>{cl.razao_social}</div>
              <div style={{ height:6, width:120, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'#6366F1', borderRadius:99, width:`${topMrrMax > 0 ? Math.round(((cl.valor_mrr||0)/topMrrMax)*100) : 0}%` }} />
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:'#15803D', width:90, textAlign:'right' }}>{fmtR(cl.valor_mrr)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
