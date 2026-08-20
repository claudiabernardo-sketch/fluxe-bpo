// ── RadarPainel ──────────────────────────────────────────────────────────
// Conteúdo do Radar do Cliente (score + 13 áreas + ajuste manual), extraído
// de ClientePage.jsx pra ser reaproveitado tanto na aba "🩺 Radar" quanto
// no painel lateral que abre direto da lista de Clientes (sem carregar o
// resto da ficha do cliente).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRadarPanelStore } from '../../store/radarPanelStore'
import {
  useClients, useTasks, useApontamentos, useApontamentosMes, useUsuarios,
  useRadarScore, useRadarScoreHistorico, useRadarAjustesManuais, useSalvarAjusteManual, useRemoverAjusteManual,
  useRadarMetricaMes, useSalvarMetricaMes, useRadarMetricasHistorico,
} from '../../hooks/useData'
import {
  computeMargemPorCliente, computeAreaStatusPorCliente, computeRadarScore,
  gerarAlertaComposto, gerarOportunidadeComercial, computeProjecaoCaixa,
  aplicarAjustesManuais, aplicarMetricaMes, AREA_LABEL, AREA_EXPLICACAO, CUSTO_HORA_PADRAO,
} from '../../utils/radar'
import { Loader } from './index'
import InfoTip from './InfoTip'
import { parseBRL, formatBRL } from '../../utils/currency'

const SEMAFORO_COR = { verde:'#15803D', amarelo:'#B45309', vermelho:'#DC2626', sem_dado:'#94A3B8' }
const SEMAFORO_LABEL = { verde:'Saudável', amarelo:'Atenção', vermelho:'Crítico', sem_dado:'Sem dado suficiente' }
const SEMAFORO_BADGE = { verde:'gr', amarelo:'yw', vermelho:'rd', sem_dado:'gy' }
const STATUS_LABEL_RADAR = { saudavel:'Saudável', atencao:'Atenção', critico:'Crítico' }
const STATUS_BADGE_RADAR = { saudavel:'gr', atencao:'yw', critico:'rd' }

const METRICA_EXPLICACAO = {
  valor_a_receber: 'Quanto esse cliente ainda tem pra receber dos clientes dele, agora — o que está pendente hoje, não uma previsão do que vai receber no futuro.',
  valor_recebido: 'Quanto esse cliente já recebeu dos clientes dele, nesse mês.',
  valor_a_pagar: 'Quanto esse cliente ainda tem pra pagar (fornecedores, despesas), agora — pendente hoje, não previsão futura.',
  valor_pago: 'Quanto esse cliente já pagou de despesas, nesse mês.',
  saldo_caixa: 'Quanto esse cliente tem em caixa/conta hoje. Pode ser negativo (conta no vermelho) — nesse caso a área "Caixa" do radar, abaixo, acende crítica.',
}

export default function RadarPainel({ clienteId }) {
  const navigate = useNavigate()
  const { data: clients = [] } = useClients()
  const cliente = clients.find(c => c.id === clienteId)
  const { data: tasks = [] } = useTasks()
  const tarefasCliente = tasks.filter(t => t.cliente_id === clienteId && !t.deleted_at)

  const { data: apontamentosCliente = [] } = useApontamentos({ clientId: clienteId })
  // Horas do time inteiro (não só deste cliente) — só pra medir a ocupação do responsável na área "Equipe".
  const { data: apontamentosEquipeMes = [] } = useApontamentosMes()
  const { data: usuariosRadar = [] } = useUsuarios()
  const custoHoraRadar = (() => {
    const comCusto = usuariosRadar.filter(u => u.custo_hora)
    return comCusto.length ? Math.round(comCusto.reduce((a,u)=>a+u.custo_hora,0)/comCusto.length) : CUSTO_HORA_PADRAO
  })()

  // Prefere o snapshot calculado pela Edge Function (radar-calcular, 1x/dia);
  // sem snapshot ainda (empresa nova, cliente criado hoje) cai no cálculo na
  // hora, igual sempre funcionou.
  const { data: radarServer } = useRadarScore(clienteId)
  const margemRadar = cliente ? computeMargemPorCliente([cliente], apontamentosCliente, custoHoraRadar)[0] : null
  const areasRadarCalc = cliente ? computeAreaStatusPorCliente(cliente, tarefasCliente, margemRadar, usuariosRadar, apontamentosEquipeMes) : null
  const areasRadarBase = radarServer?.areas || areasRadarCalc

  // Métricas reais do mês: sobrepõem o proxy de tarefa em dia com números de
  // verdade (quanto recebeu, quanto pagou, saldo em caixa).
  const { data: metricaServer, isLoading: metricaLoading } = useRadarMetricaMes(clienteId)
  const areasComMetrica = areasRadarBase ? aplicarMetricaMes(areasRadarBase, metricaServer, margemRadar?.receita ?? 0) : null

  // Ajustes manuais: aplicados por cima de qualquer fonte (servidor, cálculo
  // na hora, ou métrica real) — assim uma edição aparece na tela sem esperar
  // o próximo ciclo do cron.
  const { data: ajustesRaw = [] } = useRadarAjustesManuais(clienteId)
  const ajustesManuais = {}
  ajustesRaw.forEach(a => {
    ajustesManuais[a.area] = { status: a.status, observacao: a.observacao, criado_por_nome: a.usuarios?.nome, criado_em: a.criado_em, expira_em: a.expira_em }
  })
  const areasRadar = areasComMetrica ? aplicarAjustesManuais(areasComMetrica, ajustesManuais) : null
  const scoreRadar = areasRadar ? computeRadarScore(areasRadar) : null
  const projecaoCaixa = computeProjecaoCaixa(metricaServer)
  const alertaRadar = areasRadar ? gerarAlertaComposto(areasRadar, { runwayDias: projecaoCaixa?.runwayDias, semaforo: scoreRadar?.semaforo }) : null
  const oportunidadeRadar = areasRadar ? gerarOportunidadeComercial(areasRadar) : null

  const [editandoArea, setEditandoArea] = useState(null)
  const [ajusteForm, setAjusteForm] = useState({ status: 'saudavel', observacao: '' })
  const [ajusteErro, setAjusteErro] = useState('')
  const salvarAjuste = useSalvarAjusteManual()
  const removerAjuste = useRemoverAjusteManual()

  // Formulário de métricas mensais — inicializa uma vez quando os dados chegam,
  // sem sobrescrever o que a pessoa está digitando.
  const [metricaForm, setMetricaForm] = useState(null)
  const [metricaErro, setMetricaErro] = useState('')
  const salvarMetrica = useSalvarMetricaMes()
  if (!metricaLoading && metricaForm === null) {
    setMetricaForm({
      valor_a_receber: formatBRL(metricaServer?.valor_a_receber),
      valor_recebido: formatBRL(metricaServer?.valor_recebido),
      valor_a_pagar: formatBRL(metricaServer?.valor_a_pagar),
      valor_pago: formatBRL(metricaServer?.valor_pago),
      saldo_caixa: formatBRL(metricaServer?.saldo_caixa),
      observacao: metricaServer?.observacao || '',
    })
  }
  async function salvarMetricasDoMes() {
    try {
      setMetricaErro('')
      await salvarMetrica.mutateAsync({
        clienteId,
        valor_a_receber: parseBRL(metricaForm.valor_a_receber),
        valor_recebido: parseBRL(metricaForm.valor_recebido),
        valor_a_pagar: parseBRL(metricaForm.valor_a_pagar),
        valor_pago: parseBRL(metricaForm.valor_pago),
        saldo_caixa: parseBRL(metricaForm.saldo_caixa),
        observacao: metricaForm.observacao || null,
      })
    } catch (err) {
      setMetricaErro(err?.message || 'Erro ao salvar métricas')
    }
  }

  const mesLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const { data: scoreHistorico = [] } = useRadarScoreHistorico(clienteId)
  const { data: metricasHistorico = [] } = useRadarMetricasHistorico(clienteId)
  function mesCurto(mesRef) {
    return new Date(mesRef + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  }

  if (!cliente || !areasRadar || metricaForm === null) return <Loader />

  return (
    <div>
      <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:16 }}>
        Placar de saúde calculado automaticamente a partir de tarefas e rentabilidade —
        sem nada digitado à mão. {scoreRadar.areasCalculadas} de {scoreRadar.areasTotal} áreas
        têm dado suficiente pra calcular hoje.
        {radarServer?.calculado_em && (
          <> Atualizado em {new Date(radarServer.calculado_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}.</>
        )}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, padding:'16px 20px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background:'var(--sur)' }}>
        <div style={{ fontSize:32, fontWeight:800, color: SEMAFORO_COR[scoreRadar.semaforo] }}>
          {scoreRadar.score ?? '—'}
        </div>
        <div style={{ flex:1 }}>
          <span className={`b b-${SEMAFORO_BADGE[scoreRadar.semaforo]}`}>{SEMAFORO_LABEL[scoreRadar.semaforo]}</span>
          <div style={{ fontSize:10, color:'var(--tx3)', marginTop:4 }}>Score de 0 a 100</div>
        </div>
        <button
          onClick={() => { useRadarPanelStore.getState().fechar(); navigate(`/clientes/${clienteId}?tab=relatorio360`) }}
          className="btn bo bsm"
          style={{ flexShrink:0, whiteSpace:'nowrap' }}
        >📄 Relatório 360</button>
      </div>

      <div style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:16, background:'var(--sur)' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6, flexWrap:'wrap', gap:6 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)' }}>
            📊 Métricas de {mesLabel}
          </div>
          {metricaServer?.atualizado_em && (
            <div style={{ fontSize:10, color:'var(--tx3)' }}>
              Atualizado {new Date(metricaServer.atualizado_em).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
        {!metricaServer && (
          <div style={{ fontSize:11, fontWeight:600, color:'#B45309', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 10px', marginBottom:10 }}>
            ⚠️ Esse mês ainda não foi preenchido. Todo mês começa em branco de novo, preencha os números atuais pra manter o Radar confiável.
          </div>
        )}
        <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:10, lineHeight:1.4 }}>
          Preencha os números reais desse cliente — o Radar usa eles pra calcular Recebíveis, Pagtos, Fluxo de Caixa e Caixa, em vez de só olhar se a tarefa está em dia.
          "Em aberto" é o valor pendente agora (não pago/recebido ainda), não uma previsão futura.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:8, marginBottom:10 }}>
          {[
            ['valor_a_receber', 'Em aberto a receber (R$)'],
            ['valor_recebido', 'Recebido (R$)'],
            ['valor_a_pagar', 'Em aberto a pagar (R$)'],
            ['valor_pago', 'Pago (R$)'],
            ['saldo_caixa', 'Saldo em caixa (R$)'],
          ].map(([campo, label]) => (
            <div key={campo}>
              <label style={{ fontSize:10, color:'var(--tx3)', display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
                {label} <InfoTip text={METRICA_EXPLICACAO[campo]} width={220} />
              </label>
              <input
                type="text" inputMode="decimal" placeholder="Ex: 15.000,00"
                value={metricaForm[campo]}
                onChange={e => setMetricaForm(f => ({ ...f, [campo]: e.target.value }))}
                style={{ width:'100%', fontSize:12, padding:'6px 8px', border:'1px solid var(--bo)', borderRadius:6, background:'var(--sur)', color:'var(--tx)', boxSizing:'border-box' }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:10, color:'var(--tx3)', display:'block', marginBottom:3 }}>Observação do mês (opcional)</label>
          <textarea
            placeholder="Ex: recebimento atrasou porque o maior cliente pagou com 20 dias de atraso"
            value={metricaForm.observacao}
            onChange={e => setMetricaForm(f => ({ ...f, observacao: e.target.value }))}
            rows={2}
            style={{ width:'100%', fontSize:12, padding:'6px 8px', border:'1px solid var(--bo)', borderRadius:6, background:'var(--sur)', color:'var(--tx)', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }}
          />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <button className="btn bp bsm" disabled={salvarMetrica.isPending} onClick={salvarMetricasDoMes}>
            {salvarMetrica.isPending ? 'Salvando…' : 'Salvar métricas'}
          </button>
          {metricaErro && <div style={{ fontSize:10, color:'#EF4444' }}>{metricaErro}</div>}
          <button
            onClick={() => setHistoricoAberto(x => !x)}
            style={{ marginLeft:'auto', border:'none', background:'none', cursor:'pointer', color:'#6366F1', fontSize:11, fontWeight:600 }}
          >
            {historicoAberto ? 'Fechar histórico ▲' : 'Ver histórico de meses anteriores ▼'}
          </button>
        </div>

        {historicoAberto && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--bo)' }}>
            {metricasHistorico.length === 0 ? (
              <div style={{ fontSize:11, color:'var(--tx3)' }}>Nenhum mês anterior preenchido ainda.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {metricasHistorico.map(m => (
                  <div key={m.mes_referencia} style={{ fontSize:11, border:'1px solid var(--bo)', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontWeight:700, color:'var(--tx)', marginBottom:4, textTransform:'capitalize' }}>{mesCurto(m.mes_referencia)}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:4, color:'var(--tx2)' }}>
                      <div>A receber: {formatBRL(m.valor_a_receber) || '—'}</div>
                      <div>Recebido: {formatBRL(m.valor_recebido) || '—'}</div>
                      <div>A pagar: {formatBRL(m.valor_a_pagar) || '—'}</div>
                      <div>Pago: {formatBRL(m.valor_pago) || '—'}</div>
                      <div>Caixa: {formatBRL(m.saldo_caixa) || '—'}</div>
                    </div>
                    {m.observacao && <div style={{ marginTop:4, fontStyle:'italic', color:'var(--tx3)' }}>"{m.observacao}"</div>}
                  </div>
                ))}
              </div>
            )}
            {scoreHistorico.length > 1 && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Score ao longo do tempo</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[...scoreHistorico].reverse().map((s, i) => (
                    <div key={i} title={new Date(s.calculado_em).toLocaleDateString('pt-BR')} style={{ fontSize:11, fontWeight:700, padding:'4px 8px', borderRadius:6, background:'var(--s2)', color: SEMAFORO_COR[s.semaforo] }}>
                      {s.score ?? '—'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {alertaRadar && (
        <div style={{ padding:'12px 16px', borderRadius:'var(--r)', background:'var(--rd-bg, #FEF2F2)', border:'1px solid var(--rd, #FCA5A5)', color:'var(--rdt, #991B1B)', fontSize:12, fontWeight:600, marginBottom:12 }}>
          ⚠️ {alertaRadar}
        </div>
      )}
      {(scoreRadar.semaforo === 'vermelho' || scoreRadar.semaforo === 'amarelo') && (() => {
        const problemas = Object.entries(areasRadar)
          .filter(([, a]) => a.status === 'critico')
          .map(([id]) => AREA_LABEL[id])
        const msg = `🩺 Radar Fluxe — ${cliente.razao_social}\n` +
          `Score: ${scoreRadar.score}/100 (${SEMAFORO_LABEL[scoreRadar.semaforo]})\n` +
          (problemas.length ? `Áreas críticas: ${problemas.join(', ')}\n` : '') +
          `Ver detalhes: ${window.location.origin}/clientes/${clienteId}?tab=radar`
        return (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn bo bsm"
            style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:16, textDecoration:'none' }}
          >
            📲 Avisar time no WhatsApp
          </a>
        )
      })()}
      {oportunidadeRadar && (
        <div style={{ padding:'12px 16px', borderRadius:'var(--r)', background:'var(--gr-bg, #F0FDF4)', border:'1px solid var(--gr, #86EFAC)', color:'var(--grt, #15803D)', fontSize:12, fontWeight:600, marginBottom:16 }}>
          💡 {oportunidadeRadar}
        </div>
      )}

      <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>
        13 áreas de saúde
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8 }}>
        {Object.entries(areasRadar).map(([id, a]) => (
          <div key={id} style={{
            padding:'10px 12px', borderRadius:'var(--r)',
            border: a.manual ? '1px solid #6366F1' : '1px solid var(--bo)',
            borderLeft: a.manual ? '4px solid #6366F1' : '1px solid var(--bo)',
            background: a.manual ? 'rgba(99,102,241,.05)' : a.status==='sem_dado' ? 'var(--s2)' : 'var(--sur)',
            opacity: a.status==='sem_dado' && editandoArea!==id ? .6 : 1,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--tx)', display:'flex', alignItems:'center', gap:4 }}>
                {AREA_LABEL[id]}
                <InfoTip text={AREA_EXPLICACAO[id]} />
              </div>
              <button
                onClick={() => {
                  if (editandoArea === id) { setEditandoArea(null); return }
                  setAjusteForm({ status: a.status === 'sem_dado' ? 'saudavel' : a.status, observacao: a.observacao || '' })
                  setAjusteErro('')
                  setEditandoArea(id)
                }}
                title="Ajustar manualmente"
                style={{ border:'none', background:'none', cursor:'pointer', fontSize:11, color:'var(--tx3)', padding:0, lineHeight:1 }}
              >✏️</button>
            </div>

            {editandoArea === id ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <select value={ajusteForm.status} onChange={e => setAjusteForm(f => ({ ...f, status: e.target.value }))}
                  style={{ fontSize:11, padding:'4px 6px', border:'1px solid var(--bo)', borderRadius:6, background:'var(--sur)', color:'var(--tx)' }}>
                  <option value="saudavel">Saudável</option>
                  <option value="atencao">Atenção</option>
                  <option value="critico">Crítico</option>
                </select>
                <textarea value={ajusteForm.observacao} onChange={e => setAjusteForm(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="Observação (opcional)" rows={2}
                  style={{ fontSize:11, padding:'4px 6px', border:'1px solid var(--bo)', borderRadius:6, background:'var(--sur)', color:'var(--tx)', resize:'vertical', fontFamily:'inherit' }} />
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <button className="btn bp bsm" style={{ fontSize:10, padding:'4px 8px' }} disabled={salvarAjuste.isPending}
                    onClick={async () => {
                      try {
                        setAjusteErro('')
                        await salvarAjuste.mutateAsync({ clienteId, area: id, status: ajusteForm.status, observacao: ajusteForm.observacao })
                        setEditandoArea(null)
                      } catch (err) {
                        setAjusteErro(err?.message || 'Erro ao salvar o ajuste')
                      }
                    }}>
                    {salvarAjuste.isPending ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button className="btn bo bsm" style={{ fontSize:10, padding:'4px 8px' }} onClick={() => setEditandoArea(null)}>Cancelar</button>
                  {a.manual && (
                    <button
                      style={{ fontSize:10, color:'#EF4444', border:'none', background:'none', cursor:'pointer', marginLeft:'auto' }}
                      onClick={async () => {
                        const ajusteExistente = ajustesRaw.find(x => x.area === id)
                        if (!ajusteExistente) return
                        if (!confirm('Remover o ajuste manual e voltar pro cálculo automático?')) return
                        try {
                          setAjusteErro('')
                          await removerAjuste.mutateAsync({ id: ajusteExistente.id, clienteId })
                          setEditandoArea(null)
                        } catch (err) {
                          setAjusteErro(err?.message || 'Erro ao remover o ajuste')
                        }
                      }}
                    >Remover</button>
                  )}
                </div>
                {ajusteErro && <div style={{ fontSize:10, color:'#EF4444' }}>{ajusteErro}</div>}
              </div>
            ) : (
              <>
                <span className={`b b-${a.status==='sem_dado' ? 'gy' : STATUS_BADGE_RADAR[a.status]}`}>{a.status==='sem_dado' ? 'Sem dado' : STATUS_LABEL_RADAR[a.status]}</span>
                {a.manual && (
                  <div style={{ fontSize:10, fontWeight:700, color:'#6366F1', marginTop:5, lineHeight:1.4 }}>
                    ✏️ Ajustado manualmente{a.criado_por_nome ? ` por ${a.criado_por_nome}` : ''}
                    <div style={{ fontWeight:400, color:'var(--tx3)' }}>{a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : ''}</div>
                    {a.observacao && <div style={{ marginTop:2, fontStyle:'italic', fontWeight:400, color:'var(--tx2)' }}>"{a.observacao}"</div>}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
