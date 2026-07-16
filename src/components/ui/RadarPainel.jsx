// ── RadarPainel ──────────────────────────────────────────────────────────
// Conteúdo do Radar do Cliente (score + 13 áreas + ajuste manual), extraído
// de ClientePage.jsx pra ser reaproveitado tanto na aba "🩺 Radar" quanto
// no painel lateral que abre direto da lista de Clientes (sem carregar o
// resto da ficha do cliente).
import { useState } from 'react'
import {
  useClients, useTasks, useApontamentos, useApontamentosMes, useUsuarios,
  useRadarScore, useRadarAjustesManuais, useSalvarAjusteManual, useRemoverAjusteManual,
  useRadarMetricaMes, useSalvarMetricaMes,
} from '../../hooks/useData'
import {
  computeMargemPorCliente, computeAreaStatusPorCliente, computeRadarScore,
  gerarAlertaComposto, gerarOportunidadeComercial, aplicarAjustesManuais, aplicarMetricaMes, AREA_LABEL, CUSTO_HORA_PADRAO,
} from '../../utils/radar'
import { Loader } from './index'

const SEMAFORO_COR = { verde:'#15803D', amarelo:'#B45309', vermelho:'#DC2626', sem_dado:'#94A3B8' }
const SEMAFORO_LABEL = { verde:'Saudável', amarelo:'Atenção', vermelho:'Crítico', sem_dado:'Sem dado suficiente' }
const SEMAFORO_BADGE = { verde:'gr', amarelo:'yw', vermelho:'rd', sem_dado:'gy' }
const STATUS_LABEL_RADAR = { saudavel:'Saudável', atencao:'Atenção', critico:'Crítico' }
const STATUS_BADGE_RADAR = { saudavel:'gr', atencao:'yw', critico:'rd' }

export default function RadarPainel({ clienteId }) {
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
  const alertaRadar = areasRadar ? gerarAlertaComposto(areasRadar) : null
  const oportunidadeRadar = areasRadar ? gerarOportunidadeComercial(areasRadar, cliente) : null

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
      valor_a_receber: metricaServer?.valor_a_receber ?? '',
      valor_recebido: metricaServer?.valor_recebido ?? '',
      valor_a_pagar: metricaServer?.valor_a_pagar ?? '',
      valor_pago: metricaServer?.valor_pago ?? '',
      saldo_caixa: metricaServer?.saldo_caixa ?? '',
    })
  }
  async function salvarMetricasDoMes() {
    try {
      setMetricaErro('')
      const n = v => (v === '' || v === null || v === undefined ? null : Number(v))
      await salvarMetrica.mutateAsync({
        clienteId,
        valor_a_receber: n(metricaForm.valor_a_receber),
        valor_recebido: n(metricaForm.valor_recebido),
        valor_a_pagar: n(metricaForm.valor_a_pagar),
        valor_pago: n(metricaForm.valor_pago),
        saldo_caixa: n(metricaForm.saldo_caixa),
      })
    } catch (err) {
      setMetricaErro(err?.message || 'Erro ao salvar métricas')
    }
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
        <div>
          <span className={`b b-${SEMAFORO_BADGE[scoreRadar.semaforo]}`}>{SEMAFORO_LABEL[scoreRadar.semaforo]}</span>
          <div style={{ fontSize:10, color:'var(--tx3)', marginTop:4 }}>Score de 0 a 100</div>
        </div>
      </div>

      <div style={{ border:'1px solid var(--bo)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:16, background:'var(--sur)' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6, flexWrap:'wrap', gap:6 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.05em' }}>
            📊 Métricas reais do mês
          </div>
          {metricaServer?.atualizado_em && (
            <div style={{ fontSize:10, color:'var(--tx3)' }}>
              Atualizado {new Date(metricaServer.atualizado_em).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
        <div style={{ fontSize:11, color:'var(--tx3)', marginBottom:10, lineHeight:1.4 }}>
          Preencha os números reais desse cliente — o Radar usa eles pra calcular Recebíveis, Pagtos, Fluxo de Caixa e Caixa, em vez de só olhar se a tarefa está em dia.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:8, marginBottom:10 }}>
          {[
            ['valor_a_receber', 'A receber (R$)'],
            ['valor_recebido', 'Recebido (R$)'],
            ['valor_a_pagar', 'A pagar (R$)'],
            ['valor_pago', 'Pago (R$)'],
            ['saldo_caixa', 'Saldo em caixa (R$)'],
          ].map(([campo, label]) => (
            <div key={campo}>
              <label style={{ fontSize:10, color:'var(--tx3)', display:'block', marginBottom:3 }}>{label}</label>
              <input
                type="number" step="0.01" placeholder="0,00"
                value={metricaForm[campo]}
                onChange={e => setMetricaForm(f => ({ ...f, [campo]: e.target.value }))}
                style={{ width:'100%', fontSize:12, padding:'6px 8px', border:'1px solid var(--bo)', borderRadius:6, background:'var(--sur)', color:'var(--tx)', boxSizing:'border-box' }}
              />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button className="btn bp bsm" disabled={salvarMetrica.isPending} onClick={salvarMetricasDoMes}>
            {salvarMetrica.isPending ? 'Salvando…' : 'Salvar métricas'}
          </button>
          {metricaErro && <div style={{ fontSize:10, color:'#EF4444' }}>{metricaErro}</div>}
        </div>
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
          <div key={id} style={{ padding:'10px 12px', border:'1px solid var(--bo)', borderRadius:'var(--r)', background: a.status==='sem_dado' ? 'var(--s2)' : 'var(--sur)', opacity: a.status==='sem_dado' && editandoArea!==id ? .6 : 1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--tx)' }}>{AREA_LABEL[id]}</div>
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
                  <div style={{ fontSize:9, color:'var(--tx3)', marginTop:4, lineHeight:1.4 }}>
                    ✏️ Manual{a.criado_por_nome ? ` por ${a.criado_por_nome}` : ''} · {a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : ''}
                    {a.observacao && <div style={{ marginTop:2, fontStyle:'italic' }}>"{a.observacao}"</div>}
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
