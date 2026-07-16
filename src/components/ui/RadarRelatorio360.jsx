// ── RadarRelatorio360 ────────────────────────────────────────────────────
// Relatório 360 do cliente pronto pra levar numa reunião: score, 13 áreas,
// resumo financeiro (com as métricas reais do mês) e histórico do score.
// Botão "Imprimir / Salvar PDF" usa window.print() — mesmo padrão já usado
// em RelatoriosPage.jsx e nas propostas/contratos de PrecificacaoPage.jsx
// (o CSS global @media print já esconde sidebar/topbar via .sb/.topbar).
import { useAuthStore } from '../../store/authStore'
import {
  useClients, useTasks, useApontamentos, useApontamentosMes, useUsuarios,
  useRadarScore, useRadarAjustesManuais, useRadarMetricaMes, useRadarScoreHistorico,
} from '../../hooks/useData'
import {
  computeMargemPorCliente, computeAreaStatusPorCliente, computeRadarScore,
  gerarAlertaComposto, gerarOportunidadeComercial, aplicarAjustesManuais, aplicarMetricaMes, AREA_LABEL, CUSTO_HORA_PADRAO,
} from '../../utils/radar'
import { Loader, fmtR } from './index'

const SEMAFORO_COR = { verde:'#15803D', amarelo:'#B45309', vermelho:'#DC2626', sem_dado:'#94A3B8' }
const SEMAFORO_LABEL = { verde:'Saudável', amarelo:'Atenção', vermelho:'Crítico', sem_dado:'Sem dado suficiente' }
const STATUS_LABEL_RADAR = { saudavel:'Saudável', atencao:'Atenção', critico:'Crítico', sem_dado:'Sem dado' }
const STATUS_COR_RADAR = { saudavel:'#15803D', atencao:'#B45309', critico:'#DC2626', sem_dado:'#94A3B8' }

export default function RadarRelatorio360({ clienteId }) {
  const { empresa } = useAuthStore()
  const { data: clients = [] } = useClients()
  const cliente = clients.find(c => c.id === clienteId)
  const { data: tasks = [] } = useTasks()
  const tarefasCliente = tasks.filter(t => t.cliente_id === clienteId && !t.deleted_at)

  const { data: apontamentosCliente = [] } = useApontamentos({ clientId: clienteId })
  const { data: apontamentosEquipeMes = [] } = useApontamentosMes()
  const { data: usuariosRadar = [] } = useUsuarios()
  const custoHoraRadar = (() => {
    const comCusto = usuariosRadar.filter(u => u.custo_hora)
    return comCusto.length ? Math.round(comCusto.reduce((a,u)=>a+u.custo_hora,0)/comCusto.length) : CUSTO_HORA_PADRAO
  })()

  const { data: radarServer } = useRadarScore(clienteId)
  const margemRadar = cliente ? computeMargemPorCliente([cliente], apontamentosCliente, custoHoraRadar)[0] : null
  const areasRadarCalc = cliente ? computeAreaStatusPorCliente(cliente, tarefasCliente, margemRadar, usuariosRadar, apontamentosEquipeMes) : null
  const areasRadarBase = radarServer?.areas || areasRadarCalc

  const { data: metricaServer } = useRadarMetricaMes(clienteId)
  const areasComMetrica = areasRadarBase ? aplicarMetricaMes(areasRadarBase, metricaServer, margemRadar?.receita ?? 0) : null

  const { data: ajustesRaw = [] } = useRadarAjustesManuais(clienteId)
  const ajustesManuais = {}
  ajustesRaw.forEach(a => {
    ajustesManuais[a.area] = { status: a.status, observacao: a.observacao, criado_por_nome: a.usuarios?.nome, criado_em: a.criado_em, expira_em: a.expira_em }
  })
  const areasRadar = areasComMetrica ? aplicarAjustesManuais(areasComMetrica, ajustesManuais) : null
  const scoreRadar = areasRadar ? computeRadarScore(areasRadar) : null
  const alertaRadar = areasRadar ? gerarAlertaComposto(areasRadar) : null
  const oportunidadeRadar = areasRadar ? gerarOportunidadeComercial(areasRadar, cliente) : null

  const { data: historico = [] } = useRadarScoreHistorico(clienteId, 6)

  if (!cliente || !areasRadar) return <Loader />

  const hoje = new Date().toLocaleDateString('pt-BR')
  const clienteDesde = cliente.inicio_contrato
    ? new Date(cliente.inicio_contrato + 'T12:00:00').toLocaleDateString('pt-BR')
    : null
  const cor = empresa?.cor_primaria || '#6366F1'

  return (
    <div>
      <button className="btn bp no-print" onClick={() => window.print()} style={{ marginBottom:16 }}>
        🖨️ Imprimir / Salvar PDF
      </button>

      <div style={{ maxWidth:800, margin:'0 auto', background:'#fff', color:'#0F172A', fontSize:13, lineHeight:1.5 }}>

        {/* Cabeçalho */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:16, marginBottom:20, borderBottom:`2px solid ${cor}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {empresa?.logo_url && <img src={empresa.logo_url} alt="" style={{ height:32, width:'auto', objectFit:'contain' }} />}
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:cor }}>{empresa?.nome || 'Seu BPO'}</div>
              {empresa?.slogan && <div style={{ fontSize:10, color:'#64748B', fontStyle:'italic' }}>{empresa.slogan}</div>}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.06em' }}>Relatório 360°</div>
            <div style={{ fontSize:11, color:'#334155' }}>Gerado em {hoje}</div>
          </div>
        </div>

        {/* Cliente */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:700 }}>{cliente.fantasia || cliente.razao_social}</div>
          <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>
            {cliente.razao_social}{cliente.cnpj ? ` · ${cliente.cnpj}` : ''}{clienteDesde ? ` · Cliente desde ${clienteDesde}` : ''}
          </div>
        </div>

        {/* Score geral */}
        <div style={{ display:'flex', alignItems:'center', gap:20, padding:'18px 22px', border:'1px solid #E2E8F0', borderRadius:10, marginBottom:16 }}>
          <div style={{ fontSize:44, fontWeight:800, color: SEMAFORO_COR[scoreRadar.semaforo] }}>{scoreRadar.score ?? '—'}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color: SEMAFORO_COR[scoreRadar.semaforo] }}>{SEMAFORO_LABEL[scoreRadar.semaforo]}</div>
            <div style={{ fontSize:11, color:'#64748B' }}>Score de saúde geral · {scoreRadar.areasCalculadas} de {scoreRadar.areasTotal} áreas calculadas</div>
          </div>
        </div>

        {alertaRadar && (
          <div style={{ padding:'10px 14px', borderRadius:8, background:'#FEF2F2', border:'1px solid #FCA5A5', color:'#991B1B', fontSize:12, fontWeight:600, marginBottom:10 }}>
            ⚠️ {alertaRadar}
          </div>
        )}
        {oportunidadeRadar && (
          <div style={{ padding:'10px 14px', borderRadius:8, background:'#F0FDF4', border:'1px solid #86EFAC', color:'#15803D', fontSize:12, fontWeight:600, marginBottom:16 }}>
            💡 {oportunidadeRadar}
          </div>
        )}

        {/* Resumo financeiro */}
        <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8, marginTop:20 }}>
          Resumo financeiro
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20, fontSize:12 }}>
          <tbody>
            <tr>
              <td style={tdLabel}>Valor mensal (MRR)</td><td style={tdVal}>{fmtR(cliente.valor_mrr || 0)}</td>
              <td style={tdLabel}>Margem</td><td style={tdVal}>{margemRadar ? `${margemRadar.margemPct.toFixed(0)}% (${fmtR(margemRadar.margem)})` : '—'}</td>
            </tr>
            {metricaServer && (
              <>
                <tr>
                  <td style={tdLabel}>A receber no mês</td><td style={tdVal}>{fmtR(metricaServer.valor_a_receber || 0)}</td>
                  <td style={tdLabel}>Recebido</td><td style={tdVal}>{fmtR(metricaServer.valor_recebido || 0)}</td>
                </tr>
                <tr>
                  <td style={tdLabel}>A pagar no mês</td><td style={tdVal}>{fmtR(metricaServer.valor_a_pagar || 0)}</td>
                  <td style={tdLabel}>Pago</td><td style={tdVal}>{fmtR(metricaServer.valor_pago || 0)}</td>
                </tr>
                <tr>
                  <td style={tdLabel}>Saldo em caixa</td><td style={tdVal}>{fmtR(metricaServer.saldo_caixa || 0)}</td>
                  <td style={tdLabel}></td><td style={tdVal}></td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* 13 áreas */}
        <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>
          13 áreas de saúde
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:20 }}>
          {Object.entries(areasRadar).map(([id, a]) => (
            <div key={id} style={{ padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:6, background: a.status==='sem_dado' ? '#F8FAFC' : '#fff' }}>
              <div style={{ fontSize:10, fontWeight:600, color:'#334155' }}>{AREA_LABEL[id]}</div>
              <div style={{ fontSize:10, fontWeight:700, color: STATUS_COR_RADAR[a.status] }}>{STATUS_LABEL_RADAR[a.status]}</div>
            </div>
          ))}
        </div>

        {/* Histórico do score */}
        {historico.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>
              Histórico do score
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20, fontSize:12 }}>
              <thead>
                <tr><th style={thHist}>Data</th><th style={thHist}>Score</th><th style={thHist}>Situação</th></tr>
              </thead>
              <tbody>
                {historico.map((h, i) => (
                  <tr key={i}>
                    <td style={tdHist}>{new Date(h.calculado_em).toLocaleDateString('pt-BR')}</td>
                    <td style={tdHist}>{h.score ?? '—'}</td>
                    <td style={{ ...tdHist, color: SEMAFORO_COR[h.semaforo], fontWeight:600 }}>{SEMAFORO_LABEL[h.semaforo]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Rodapé */}
        <div style={{ fontSize:10, color:'#94A3B8', textAlign:'center', marginTop:32, paddingTop:12, borderTop:'1px solid #E2E8F0' }}>
          Relatório gerado automaticamente pelo Fluxe BPO em {hoje}
        </div>
      </div>
    </div>
  )
}

const tdLabel = { padding:'6px 10px', color:'#64748B', width:'20%' }
const tdVal = { padding:'6px 10px', fontWeight:700, width:'30%' }
const thHist = { padding:'6px 10px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid #E2E8F0' }
const tdHist = { padding:'6px 10px', borderBottom:'1px solid #F1F5F9' }
