import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTarefaModelos, useCreateModelo, useUpdateModelo, useDeleteModelo, useClients,
         useClienteModelos, useVincularModelo, useDesvincularModelo, useGerarTarefas,
         useRotinas, useUpdateClienteModelo } from '../hooks/useData'
import { Card, Btn, Loader } from '../components/ui'
import ContextTooltip from '../components/ui/ContextTooltip'
import { supabase } from '../lib/supabase'

// Prefixo "Rotina:" pra não confundir com a etapa da esteira, que também
// tem um valor "Operacional" (coisa completamente diferente).
const STATUS_OP_LABEL = { em_configuracao:'Rotina: Em Configuração', pausado:'Rotina: Pausada', encerrado:'Rotina: Encerrada' }

const CATEGORIAS = ['Contas a Pagar','Contas a Receber','Conciliação Bancária','Emissão de NF','Emissão de Boletos','Cobrança / Inadimplência','Fluxo de Caixa','Pagamentos','DRE Gerencial / Relatórios','Implantação','Onboarding','Estratégico','Relacionamento','Outro']
const PRIORIDADES = [{ v:'baixa', label:'Baixa' }, { v:'media', label:'Média' }, { v:'alta', label:'Alta' }]
const RECORRENCIAS = [
  { v:'diaria',          label:'Diária',           desc:'Todo dia, incluindo fins de semana' },
  { v:'dias_uteis',      label:'Dias úteis',        desc:'Segunda a sexta-feira' },
  { v:'semanal',         label:'Semanal',           desc:'Dias específicos da semana' },
  { v:'quinzenal',       label:'Quinzenal',         desc:'A cada 15 dias' },
  { v:'mensal',          label:'Mensal',            desc:'Um dia fixo do mês' },
  { v:'dias_especificos',label:'Dias específicos',  desc:'Múltiplos dias do mês' },
  { v:'bimestral',       label:'Bimestral',         desc:'A cada 2 meses' },
  { v:'trimestral',      label:'Trimestral',        desc:'A cada 3 meses (Jan/Abr/Jul/Out)' },
  { v:'semestral',       label:'Semestral',         desc:'A cada 6 meses (Jan/Jul)' },
  { v:'anual',           label:'Anual',             desc:'Uma vez por ano' },
]
const DIAS_SEMANA = [
  { v:1, label:'Seg' }, { v:2, label:'Ter' }, { v:3, label:'Qua' },
  { v:4, label:'Qui' }, { v:5, label:'Sex' }, { v:6, label:'Sáb' }, { v:0, label:'Dom' },
]
const ETAPAS_MODELO = [
  { v:'',               label:'— Todas as etapas —' },
  { v:'comercial',      label:'Comercial' },
  { v:'pre_ob',         label:'Pré-Onboarding' },
  { v:'onboarding',     label:'Onboarding' },
  { v:'implantacao',    label:'Implantação' },
  { v:'operacional',    label:'Operacional' },
  { v:'estrategico',    label:'Estratégico' },
  { v:'acompanhamento', label:'Acompanhamento' },
  { v:'encerramento',   label:'Encerramento' },
]
const EMPTY_FORM = { titulo:'', descricao:'', categoria:'', etapa:'', prioridade:'media', recorrencia:'dias_uteis', dias_semana:[], dia_mes:5, dias_mes:[], checklist_items:[], ativo:true }

const fi = { width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'#fff', outline:'none' }
const recLabel = { unica:'⚡ Pontual', diaria:'Diária', dias_uteis:'Dias úteis', semanal:'Semanal', quinzenal:'Quinzenal', mensal:'Mensal', dias_especificos:'Dias espec.', bimestral:'Bimestral', trimestral:'Trimestral', semestral:'Semestral', anual:'Anual' }
const prioColor = { baixa:'#16A34A', media:'#D97706', alta:'#DC2626' }
const diasLabel = { 0:'Seg', 1:'Ter', 2:'Qua', 3:'Qui', 4:'Sex', 5:'Sáb', 6:'Dom' }

function lastDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString('en-CA')
}

// Matching rotina → modelo por título (case-insensitive, ignora acentos)
function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}
function matchRotinasModelos(rotinas, modelos) {
  return rotinas.map(rot => {
    const nRot = normalize(rot.titulo)
    const match = modelos.find(m => {
      const nMod = normalize(m.titulo)
      return nMod === nRot || nMod.includes(nRot) || nRot.includes(nMod)
    })
    return { rotina: rot, modelo: match || null }
  })
}

function RotinaInfo({ rot }) {
  const dias = rot.dias_semana?.map(d => diasLabel[d]).join(', ')
  return (
    <span style={{ fontSize:11, color:'#94A3B8' }}>
      {rot.hora && `⏰ ${rot.hora}`}
      {rot.tipo === 'semanal' && dias && ` · ${dias}`}
      {rot.tipo === 'mensal'  && rot.dia_mes && ` · dia ${rot.dia_mes}`}
      {rot.tipo === 'diaria'  && ' · Todo dia'}
    </span>
  )
}

export default function ModelosPage() {
  const { data: modelos = [], isLoading } = useTarefaModelos()
  const { data: clients = [] } = useClients()
  const createModelo = useCreateModelo()
  const updateModelo = useUpdateModelo()
  const deleteModelo = useDeleteModelo()

  const [fCliente, setFCliente] = useState('')
  const [fEtapa,   setFEtapa]   = useState('')

  const isSpecificClient = !!(fCliente && fCliente !== '__geral')
  const { data: clienteModelos = [], isLoading: cmLoading } = useClienteModelos(isSpecificClient ? fCliente : null)
  const { data: rotinas = [], isLoading: rotLoad } = useRotinas(isSpecificClient ? fCliente : null)
  const vincularModelo    = useVincularModelo()
  const desvincularModelo = useDesvincularModelo()
  const updateVinculo     = useUpdateClienteModelo()
  const gerarTarefas      = useGerarTarefas()

  // Override de recorrência só para este cliente (não mexe no modelo geral)
  const [overrideId, setOverrideId] = useState(null)
  const [overrideForm, setOverrideForm] = useState(null)
  const [overrideErr, setOverrideErr] = useState('')

  // Geração
  const [dataInicio, setDataInicio] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [geracaoMsg, setGeracaoMsg] = useState(null)
  const [removerConfirm, setRemoverConfirm] = useState(false)
  const [removendo,      setRemovendo]      = useState(false)
  const [removerMsg,     setRemoverMsg]     = useState(null)

  // Modal CRUD modelos
  const [modal, setModal]   = useState(null)
  const [form,  setForm]    = useState(EMPTY_FORM)
  const [newCk, setNewCk]   = useState('')
  const [confirmDel, setConfirmDel] = useState(null)
  const [showOutros, setShowOutros] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function abrirNovo(prefill = {}) { setForm({ ...EMPTY_FORM, ...prefill }); setNewCk(''); setModal('new') }
  function abrirEditar(m) {
    setForm({
      titulo: m.titulo, descricao: m.descricao || '', categoria: m.categoria || '',
      etapa: m.etapa || '', prioridade: m.prioridade, recorrencia: m.recorrencia,
      dias_semana: m.dias_semana || [], dia_mes: m.dia_mes || 5,
      dias_mes: m.dias_mes || [], checklist_items: m.checklist_items || [],
      ativo: m.ativo, _id: m.id,
    })
    setNewCk(''); setModal('edit')
  }

  async function salvar() {
    if (!form.titulo.trim()) return alert('Informe o título do modelo.')
    const payload = {
      titulo: form.titulo.trim(), descricao: form.descricao?.trim() || null,
      categoria: form.categoria || null, etapa: form.etapa || null,
      prioridade: form.prioridade, recorrencia: form.recorrencia,
      dias_semana: form.recorrencia === 'semanal' ? form.dias_semana : null,
      dia_mes: ['mensal','quinzenal','bimestral','trimestral','semestral','anual'].includes(form.recorrencia) ? form.dia_mes : null,
      dias_mes: form.recorrencia === 'dias_especificos' ? form.dias_mes : null,
      checklist_items: form.checklist_items, ativo: form.ativo,
    }
    try {
      if (modal === 'edit') { await updateModelo.mutateAsync({ id: form._id, ...payload }) }
      else                  { await createModelo.mutateAsync(payload) }
      setModal(null)
    } catch (err) { alert('Erro ao salvar modelo: ' + err.message) }
  }

  async function confirmarDelete() { await deleteModelo.mutateAsync(confirmDel); setConfirmDel(null) }

  function addChecklist() {
    const txt = newCk.trim(); if (!txt) return
    set('checklist_items', [...form.checklist_items, txt]); setNewCk('')
  }
  function toggleDia(v) {
    set('dias_semana', form.dias_semana.includes(v) ? form.dias_semana.filter(d=>d!==v) : [...form.dias_semana, v])
  }
  function toggleDiaMes(v) {
    set('dias_mes', (form.dias_mes.includes(v) ? form.dias_mes.filter(d=>d!==v) : [...form.dias_mes, v]).sort((a,b)=>a-b))
  }

  async function handleVincular(modeloId) {
    try { await vincularModelo.mutateAsync({ clienteId: fCliente, modeloId }) }
    catch (err) { alert('Erro ao vincular: ' + err.message) }
  }

  async function handleDesvincular(cm) {
    const tituloMod = cm.tarefa_modelos?.titulo || 'modelo'
    if (!confirm(`Desvincular "${tituloMod}"? As tarefas abertas futuras deste modelo serão removidas.`)) return
    const hoje = new Date().toLocaleDateString('en-CA')
    await supabase.from('tarefas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('cliente_id', fCliente).eq('modelo_id', cm.modelo_id)
      .neq('status', 'concluida').gte('data_execucao', hoje).is('deleted_at', null)
    desvincularModelo.mutate({ id: cm.id, clienteId: fCliente })
  }

  function abrirOverride(vinculo, modelo) {
    setOverrideErr('')
    setOverrideForm({
      recorrencia: vinculo.recorrencia || modelo.recorrencia,
      dias_semana: vinculo.dias_semana || modelo.dias_semana || [],
      dia_mes: vinculo.dia_mes || modelo.dia_mes || 5,
      hora: vinculo.hora || '',
    })
    setOverrideId(vinculo.id)
  }

  async function salvarOverride() {
    try {
      setOverrideErr('')
      await updateVinculo.mutateAsync({
        id: overrideId, clienteId: fCliente,
        recorrencia: overrideForm.recorrencia,
        dias_semana: overrideForm.recorrencia === 'semanal' ? overrideForm.dias_semana : null,
        dia_mes: ['mensal','quinzenal','bimestral','trimestral','semestral','anual'].includes(overrideForm.recorrencia) ? overrideForm.dia_mes : null,
        hora: overrideForm.hora || null,
      })
      setOverrideId(null)
    } catch (err) { setOverrideErr(err.message || 'Erro ao salvar') }
  }

  async function usarPadraoModelo() {
    try {
      setOverrideErr('')
      await updateVinculo.mutateAsync({ id: overrideId, clienteId: fCliente, recorrencia: null, dias_semana: null, dia_mes: null, hora: null })
      setOverrideId(null)
    } catch (err) { setOverrideErr(err.message || 'Erro ao limpar') }
  }

  async function handleGerar() {
    setGeracaoMsg(null)
    try {
      const resultado = await gerarTarefas.mutateAsync({ clienteId: fCliente, dataInicio, dataFim: lastDayOfMonth() })
      const criadas     = resultado?.tarefas_geradas ?? resultado?.criadas ?? resultado?.total_criadas ?? 0
      const duplicadas  = resultado?.duplicadas_evitadas ?? 0
      const semRecorr   = resultado?.nao_bateu_recorrencia ?? 0

      let texto
      if (criadas > 0 && duplicadas > 0) {
        texto = `${criadas} tarefa(s) nova(s) gerada(s). ${duplicadas} já existiam pra esse período — não foram duplicadas.`
      } else if (criadas > 0) {
        texto = `${criadas} tarefa(s) gerada(s) com sucesso!`
      } else if (duplicadas > 0) {
        texto = `Nenhuma tarefa nova — as ${duplicadas} tarefa(s) desse período já tinham sido geradas antes. Sem duplicar, pode clicar em Gerar de novo sempre que quiser.`
      } else if (semRecorr > 0) {
        texto = `Nenhuma tarefa gerada — a recorrência dos modelos vinculados não bate com nenhum dia desse período (ex: um modelo "Mensal" só gera no dia configurado do mês).`
      } else {
        texto = `Nenhuma tarefa gerada. Confira se o cliente está com a Rotina ativa e se há modelos vinculados.`
      }
      setGeracaoMsg({ ok: true, texto })
    } catch (err) {
      setGeracaoMsg({ ok: false, texto: 'Erro: ' + (err.message || 'falha ao gerar') })
    }
  }

  async function handleRemoverTarefas() {
    setRemovendo(true); setRemoverMsg(null)
    const hoje = new Date().toLocaleDateString('en-CA')
    const { error } = await supabase.from('tarefas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('cliente_id', fCliente).neq('status', 'concluida')
      .gte('data_execucao', hoje).is('deleted_at', null)
    setRemovendo(false); setRemoverConfirm(false)
    setRemoverMsg(error
      ? { ok: false, texto: 'Erro ao remover: ' + error.message }
      : { ok: true, texto: 'Tarefas abertas futuras removidas.' })
  }

  // Dados calculados
  const linkedModelIds = new Set(clienteModelos.map(cm => cm.modelo_id))
  const clienteAtual = isSpecificClient ? clients.find(c => c.id === fCliente) : null
  const clienteNome = clienteAtual?.fantasia || clienteAtual?.razao_social || ''
  const statusOpAtual = clienteAtual?.status_operacional || 'em_configuracao'
  const naoOperacional = isSpecificClient && statusOpAtual !== 'operacional'

  // Cruzamento rotinas × modelos
  const cruzamento = matchRotinasModelos(rotinas, modelos)
  const modelosNaRotina = new Set(cruzamento.map(c => c.modelo?.id).filter(Boolean))

  // Modelos que NÃO aparecem na rotina (para seção "Outros modelos")
  const outrosModelos = modelos
    .filter(m => !modelosNaRotina.has(m.id) && !linkedModelIds.has(m.id))
    .filter(m => !fEtapa || m.etapa === fEtapa)

  const modelosFiltrados = modelos
    .filter(m => !fCliente || fCliente === '__geral' ? !m.cliente_id : true)
    .filter(m => !fEtapa || m.etapa === fEtapa)

  if (isLoading) return <Loader />

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <ContextTooltip
        pageKey="modelos"
        icon="🔁"
        title="Como usar os Modelos de Tarefas"
        color="#F59E0B"
        tips={[
          'Selecione um cliente para ver as rotinas dele e vincular os modelos correspondentes.',
          'Após vincular, clique em Gerar para criar as tarefas a partir da data escolhida.',
          'Depois da geração inicial, o sistema cria tarefas automaticamente todo dia.',
        ]}
      />

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:13, color:'#64748B' }}>
          Selecione um cliente para cruzar as rotinas com os modelos e gerar tarefas.
        </div>
        <Btn variant="primary" onClick={() => abrirNovo()}>+ Novo modelo</Btn>
      </div>

      {/* FILTROS */}
      <div style={{ marginBottom:20, display:'flex', gap:8 }}>
        <select value={fCliente} onChange={e => { setFCliente(e.target.value); setGeracaoMsg(null); setRemoverMsg(null); setShowOutros(false) }}
          style={{ flex:1.5, padding:'9px 12px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
            border:'1px solid #E2E8F0', background:'#fff', color:'#334155' }}>
          <option value="">Todos os clientes</option>
          <option value="__geral">Geral (sem cliente)</option>
          {clients.slice().sort((a,b)=>(a.fantasia||a.razao_social||'').localeCompare(b.fantasia||b.razao_social||''))
            .map(c => <option key={c.id} value={c.id}>{c.fantasia || c.razao_social}</option>)}
        </select>
        <select value={fEtapa} onChange={e => setFEtapa(e.target.value)}
          style={{ flex:1, padding:'9px 12px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
            border:'1px solid #E2E8F0', background:'#fff', color:'#334155' }}>
          <option value="">Todas as etapas</option>
          {ETAPAS_MODELO.filter(e=>e.v).map(e => <option key={e.v} value={e.v}>{e.label}</option>)}
        </select>
      </div>

      {/* ── VISÃO CLIENTE ESPECÍFICO ── */}
      {isSpecificClient ? (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* GERAÇÃO — em destaque no topo */}
          <div style={{ background:'#F8FAFF', border:'1px solid #C7D2FE', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#3730A3', marginBottom:4 }}>📅 Geração de tarefas — {clienteNome}</div>
            <div style={{ fontSize:12, color:'#6366F1', marginBottom:14 }}>
              Gera tarefas dos modelos vinculados a partir da data escolhida até o fim do mês.
              Após isso, o sistema continua gerando automaticamente todo dia.
            </div>

            {naoOperacional && (
              <div style={{ fontSize:12, padding:'10px 12px', borderRadius:8, marginBottom:12,
                background:'#FFFBEB', color:'#92400E', border:'1px solid #FDE68A' }}>
                ⚠️ <strong>{STATUS_OP_LABEL[statusOpAtual] || statusOpAtual}</strong> — por isso nenhuma tarefa é gerada pra ele, mesmo clicando em "Gerar tarefas".{' '}
                {statusOpAtual === 'pausado' ? (
                  <Link to={`/clientes/${fCliente}`} style={{ color:'#92400E', fontWeight:700, textDecoration:'underline' }}>
                    Abrir cliente e Reativar →
                  </Link>
                ) : statusOpAtual === 'encerrado' ? (
                  'Contrato encerrado — não é possível gerar tarefas pra ele.'
                ) : (
                  'Vincule um modelo abaixo — a operação ativa sozinha assim que o primeiro modelo é vinculado.'
                )}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'flex-end', gap:10, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#4338CA', marginBottom:4 }}>A PARTIR DE</div>
                <input type="date" value={dataInicio}
                  onChange={e => { setDataInicio(e.target.value); setGeracaoMsg(null) }}
                  style={{ ...fi, width:160, borderColor:'#C7D2FE' }} />
              </div>
              <Btn variant="primary" onClick={handleGerar} disabled={gerarTarefas.isPending || !linkedModelIds.size || naoOperacional}>
                {gerarTarefas.isPending ? 'Gerando...' : '▶ Gerar tarefas'}
              </Btn>
              {!linkedModelIds.size && (
                <span style={{ fontSize:11, color:'#94A3B8' }}>Vincule ao menos 1 modelo para gerar.</span>
              )}
            </div>

            {geracaoMsg && (
              <div style={{ fontSize:12, padding:'8px 12px', borderRadius:8, marginTop:10,
                background: geracaoMsg.ok ? '#F0FDF4' : '#FEF2F2',
                color: geracaoMsg.ok ? '#15803D' : '#991B1B',
                border: `1px solid ${geracaoMsg.ok ? '#BBF7D0' : '#FECDD3'}` }}>
                {geracaoMsg.ok ? '✅ ' : '⚠️ '}{geracaoMsg.texto}
              </div>
            )}

            {/* Área de risco */}
            <div style={{ marginTop:16, padding:14, background:'#FEF2F2', borderRadius:10, border:'1px solid #FECDD3' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#991B1B', marginBottom:6 }}>⚠️ Área de risco — remover tarefas abertas</div>
              {removerMsg && (
                <div style={{ fontSize:12, padding:'6px 10px', borderRadius:6, marginBottom:8,
                  background: removerMsg.ok ? '#F0FDF4' : '#fff3cd',
                  color: removerMsg.ok ? '#15803D' : '#856404' }}>
                  {removerMsg.texto}
                </div>
              )}
              {!removerConfirm ? (
                <button onClick={() => { setRemoverConfirm(true); setRemoverMsg(null) }}
                  style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #FECDD3',
                    background:'#fff', color:'#991B1B', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  Remover tarefas abertas futuras
                </button>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, color:'#7F1D1D', fontWeight:600 }}>Esta ação é irreversível. Confirma?</span>
                  <button onClick={handleRemoverTarefas} disabled={removendo}
                    style={{ padding:'6px 14px', borderRadius:8, border:'none',
                      background:'#DC2626', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                    {removendo ? 'Removendo...' : 'Confirmar remoção'}
                  </button>
                  <button onClick={() => setRemoverConfirm(false)}
                    style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #E2E8F0',
                      background:'#fff', color:'#64748B', cursor:'pointer', fontSize:12 }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ROTINAS × MODELOS */}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:10 }}>
              🔁 Rotinas de <span style={{ color:'#6366F1' }}>{clienteNome}</span>
              <span style={{ fontSize:11, fontWeight:400, color:'#94A3B8', marginLeft:8 }}>
                — cruzadas com os modelos disponíveis
              </span>
            </div>

            {(cmLoading || rotLoad) ? <Loader /> : rotinas.length === 0 ? (
              <Card>
                <div style={{ padding:'24px 20px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
                  Nenhuma rotina configurada para este cliente.
                  <br /><span style={{ fontSize:12 }}>Configure na aba Rotina do cliente primeiro.</span>
                </div>
              </Card>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {cruzamento.map(({ rotina, modelo }) => {
                  const vinculo = modelo ? clienteModelos.find(cm => cm.modelo_id === modelo.id) : null
                  const vinculado = !!vinculo
                  const temOverride = vinculado && !!vinculo.recorrencia
                  const recorrenciaEfetiva = temOverride ? vinculo.recorrencia : modelo?.recorrencia
                  return (
                    <div key={rotina.id}>
                    <div style={{ background:'#fff', border:`1px solid ${vinculado ? '#BBF7D0' : '#E2E8F0'}`,
                      borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>

                      {/* Status indicator */}
                      <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                        background: vinculado ? '#16A34A' : modelo ? '#D97706' : '#E2E8F0' }} />

                      {/* Rotina info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{rotina.titulo}</div>
                        <RotinaInfo rot={rotina} />
                        {modelo ? (
                          <div style={{ fontSize:11, color: vinculado ? '#15803D' : '#92400E', marginTop:2 }}>
                            {vinculado ? '✓ Modelo vinculado: ' : '→ Modelo encontrado: '}
                            <strong>{modelo.titulo}</strong>
                            <span style={{ marginLeft:6, padding:'2px 8px', borderRadius:99,
                              background: vinculado ? '#DCFCE7' : '#FEF3C7', color: vinculado ? '#15803D' : '#92400E',
                              fontSize:10, fontWeight:600 }}>
                              {recLabel[recorrenciaEfetiva] || recorrenciaEfetiva}
                            </span>
                            {temOverride && (
                              <span style={{ marginLeft:4, padding:'2px 8px', borderRadius:99,
                                background:'#EEF2FF', color:'#4338CA', fontSize:10, fontWeight:600 }} title="Recorrência diferente do padrão do modelo, só pra este cliente">
                                🔧 só p/ este cliente
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>
                            Nenhum modelo correspondente encontrado
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        {vinculado && (
                          <button onClick={() => abrirOverride(vinculo, modelo)}
                            style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0',
                              background:'#fff', cursor:'pointer', fontSize:11 }} title="Ajustar recorrência só para este cliente">
                            🔁
                          </button>
                        )}
                        {modelo && (
                          <button onClick={() => abrirEditar(modelo)}
                            style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0',
                              background:'#fff', cursor:'pointer', fontSize:11 }} title="Editar modelo (afeta todos os clientes)">
                            ✏
                          </button>
                        )}
                        {!modelo && (
                          <button
                            onClick={() => abrirNovo({ titulo: rotina.titulo,
                              recorrencia: rotina.tipo === 'semanal' ? 'semanal' : rotina.tipo === 'mensal' ? 'mensal' : 'diaria',
                              dias_semana: rotina.dias_semana || [],
                              dia_mes: rotina.dia_mes || 5 })}
                            style={{ padding:'5px 12px', borderRadius:8, border:'1px dashed #C7D2FE',
                              background:'#EEF2FF', color:'#4338CA', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                            + Criar modelo
                          </button>
                        )}
                        {modelo && !vinculado && (
                          <button onClick={() => handleVincular(modelo.id)} disabled={vincularModelo.isPending}
                            style={{ padding:'5px 14px', borderRadius:8, border:'none', background:'#6366F1',
                              color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                            Vincular
                          </button>
                        )}
                        {modelo && vinculado && (
                          <button onClick={() => handleDesvincular(vinculo)} disabled={desvincularModelo.isPending}
                            style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #FECDD3',
                              background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                            Desvincular
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline: ajustar recorrência só para este cliente */}
                    {vinculado && overrideId === vinculo.id && overrideForm && (
                      <div style={{ background:'#F8FAFF', border:'1px solid #C7D2FE', borderRadius:10, padding:'12px 16px', marginTop:4 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#3730A3', marginBottom:8 }}>
                          🔁 Recorrência de "{modelo.titulo}" só para {clienteNome}
                        </div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
                          <div>
                            <div style={{ fontSize:10, fontWeight:600, color:'#4338CA', marginBottom:4 }}>RECORRÊNCIA</div>
                            <select value={overrideForm.recorrencia}
                              onChange={e => setOverrideForm(f => ({ ...f, recorrencia: e.target.value }))}
                              style={{ ...fi, width:180, borderColor:'#C7D2FE' }}>
                              {RECORRENCIAS.filter(r => r.v !== 'dias_especificos').map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
                            </select>
                          </div>
                          {overrideForm.recorrencia === 'semanal' && (
                            <div>
                              <div style={{ fontSize:10, fontWeight:600, color:'#4338CA', marginBottom:4 }}>DIAS</div>
                              <div style={{ display:'flex', gap:4 }}>
                                {DIAS_SEMANA.map(d => (
                                  <button key={d.v} type="button"
                                    onClick={() => setOverrideForm(f => ({ ...f, dias_semana: f.dias_semana.includes(d.v) ? f.dias_semana.filter(x=>x!==d.v) : [...f.dias_semana, d.v] }))}
                                    style={{ padding:'6px 8px', borderRadius:6, border:'1px solid #C7D2FE', fontSize:11, cursor:'pointer',
                                      background: overrideForm.dias_semana.includes(d.v) ? '#6366F1' : '#fff',
                                      color: overrideForm.dias_semana.includes(d.v) ? '#fff' : '#475569' }}>
                                    {d.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {['mensal','quinzenal','bimestral','trimestral','semestral','anual'].includes(overrideForm.recorrencia) && (
                            <div>
                              <div style={{ fontSize:10, fontWeight:600, color:'#4338CA', marginBottom:4 }}>DIA DO MÊS</div>
                              <input type="number" min={1} max={31} value={overrideForm.dia_mes}
                                onChange={e => setOverrideForm(f => ({ ...f, dia_mes: parseInt(e.target.value, 10) || 1 }))}
                                style={{ ...fi, width:80, borderColor:'#C7D2FE' }} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize:10, fontWeight:600, color:'#4338CA', marginBottom:4 }}>HORÁRIO (opcional)</div>
                            <input type="time" value={overrideForm.hora}
                              onChange={e => setOverrideForm(f => ({ ...f, hora: e.target.value }))}
                              style={{ ...fi, width:100, borderColor:'#C7D2FE' }} />
                          </div>
                          <button onClick={salvarOverride} disabled={updateVinculo.isPending}
                            style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                            {updateVinculo.isPending ? 'Salvando…' : 'Salvar'}
                          </button>
                          {temOverride && (
                            <button onClick={usarPadraoModelo} disabled={updateVinculo.isPending}
                              style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#64748B', cursor:'pointer', fontSize:12 }}>
                              Usar padrão do modelo
                            </button>
                          )}
                          <button onClick={() => setOverrideId(null)}
                            style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#64748B', cursor:'pointer', fontSize:12 }}>
                            Cancelar
                          </button>
                        </div>
                        {overrideErr && <div style={{ fontSize:11, color:'#EF4444', marginTop:6 }}>{overrideErr}</div>}
                      </div>
                    )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* OUTROS MODELOS (não na rotina, não vinculados) */}
          {outrosModelos.length > 0 && (
            <div>
              <button onClick={() => setShowOutros(v => !v)}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
                  color:'#6366F1', padding:0, marginBottom:showOutros ? 10 : 0 }}>
                {showOutros ? '▾' : '▸'} Outros modelos disponíveis ({outrosModelos.length})
              </button>
              {showOutros && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {outrosModelos.map(m => (
                    <div key={m.id} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10,
                      padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: prioColor[m.prioridade] || '#94A3B8', flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#334155' }}>{m.titulo}</div>
                        <div style={{ fontSize:11, color:'#94A3B8', display:'flex', gap:8, flexWrap:'wrap', marginTop:2 }}>
                          {m.etapa && <span>🔖 {ETAPAS_MODELO.find(e=>e.v===m.etapa)?.label || m.etapa}</span>}
                          {m.categoria && <span>📂 {m.categoria}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:'#F1F5F9', color:'#475569', fontWeight:600, whiteSpace:'nowrap' }}>
                        {recLabel[m.recorrencia] || m.recorrencia}
                      </span>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => abrirEditar(m)}
                          style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11 }}>✏</button>
                        <button onClick={() => handleVincular(m.id)} disabled={vincularModelo.isPending}
                          style={{ padding:'5px 14px', borderRadius:8, border:'none', background:'#6366F1',
                            color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                          Vincular
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      ) : (
        /* ── VISÃO GERAL ── */
        <>
          {modelosFiltrados.length === 0 ? (
            <Card>
              <div style={{ padding:'40px 20px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
                Nenhum modelo cadastrado. Clique em <strong>+ Novo modelo</strong> para começar.
              </div>
            </Card>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {modelosFiltrados.map(m => {
                const cliente = clients.find(c => c.id === m.cliente_id)
                return (
                  <div key={m.id} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10,
                    padding:'14px 16px', display:'flex', alignItems:'center', gap:12, opacity: m.ativo ? 1 : 0.5 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: prioColor[m.prioridade], flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{m.titulo}</div>
                      <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, display:'flex', gap:8, flexWrap:'wrap' }}>
                        {m.etapa && <span>🔖 {ETAPAS_MODELO.find(e=>e.v===m.etapa)?.label || m.etapa}</span>}
                        {m.categoria && <span>📂 {m.categoria}</span>}
                        {cliente && <span>🏢 {cliente.fantasia || cliente.razao_social}</span>}
                        {!m.cliente_id && <span>🌐 Geral</span>}
                        {m.checklist_items?.length > 0 && <span>✓ {m.checklist_items.length} itens</span>}
                      </div>
                    </div>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:'#EFF6FF', color:'#1D4ED8', fontWeight:600, whiteSpace:'nowrap' }}>
                      {recLabel[m.recorrencia] || m.recorrencia}
                    </span>
                    {!m.ativo && <span style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>INATIVO</span>}
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button onClick={() => abrirEditar(m)} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11 }}>✏</button>
                      <button onClick={() => setConfirmDel(m.id)} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:11 }}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL CRUD MODELO */}
      {(modal === 'new' || modal === 'edit') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>{modal === 'new' ? 'Novo modelo' : 'Editar modelo'}</div>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#64748B' }}>×</button>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Título *</label>
              <input style={fi} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Conciliação Bancária" />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Descrição operacional</label>
              <textarea style={{ ...fi, minHeight:70, resize:'vertical' }} value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} placeholder="Descreva o que deve ser feito, ferramentas, cuidados..." />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Etapa BPO</label>
                <select style={fi} value={form.etapa} onChange={e => set('etapa', e.target.value)}>
                  {ETAPAS_MODELO.map(e => <option key={e.v} value={e.v}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Categoria</label>
                <select style={fi} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  <option value="">Sem categoria</option>
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Prioridade</label>
                <select style={fi} value={form.prioridade} onChange={e => set('prioridade', e.target.value)}>
                  {PRIORIDADES.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
                </select>
              </div>
            </div>
            {form.categoria === 'Conciliação Bancária' && (
              <div style={{ marginBottom:12, padding:'10px 12px', borderRadius:8, background:'#EFF6FF', border:'1px solid #BFDBFE', fontSize:12, color:'#1E40AF' }}>
                💡 Não precisa incluir o nome do banco no título — pra clientes com bancos cadastrados,
                o Fluxe gera uma tarefa por banco automaticamente (ex: "{form.titulo || 'Conciliação bancária'} — Nubank"),
                usando a lista de <strong>Bancos</strong> do cadastro do cliente. Só inclua o nome de um banco
                manualmente no título se ele ainda não estiver naquela lista.
              </div>
            )}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Recorrência</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {RECORRENCIAS.map(r => (
                  <label key={r.v} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px',
                    border:`1px solid ${form.recorrencia === r.v ? '#6366F1' : '#E2E8F0'}`,
                    borderRadius:8, cursor:'pointer', background: form.recorrencia === r.v ? '#EEF2FF' : '#fff' }}>
                    <input type="radio" name="rec" value={r.v} checked={form.recorrencia === r.v} onChange={() => set('recorrencia', r.v)} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{r.label}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {form.recorrencia === 'semanal' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Dias da semana</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {DIAS_SEMANA.map(d => (
                    <button key={d.v} type="button" onClick={() => toggleDia(d.v)}
                      style={{ padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
                        background: form.dias_semana.includes(d.v) ? '#6366F1' : '#F1F5F9',
                        color: form.dias_semana.includes(d.v) ? '#fff' : '#475569' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {['mensal','quinzenal','bimestral','trimestral','semestral','anual'].includes(form.recorrencia) && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Dia do mês (1–31)</label>
                <input style={{ ...fi, width:100 }} type="number" min={1} max={31} value={form.dia_mes} onChange={e => set('dia_mes', parseInt(e.target.value) || 1)} />
              </div>
            )}
            {form.recorrencia === 'dias_especificos' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Dias do mês</label>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <button key={d} type="button" onClick={() => toggleDiaMes(d)}
                      style={{ width:32, height:32, borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
                        background: form.dias_mes.includes(d) ? '#6366F1' : '#F1F5F9',
                        color: form.dias_mes.includes(d) ? '#fff' : '#475569' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:6, textTransform:'uppercase' }}>Checklist padrão</label>
              {form.checklist_items.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{ flex:1, fontSize:12, color:'#475569', padding:'4px 8px', background:'#F8FAFC', borderRadius:6 }}>{item}</span>
                  <button type="button" onClick={() => set('checklist_items', form.checklist_items.filter((_,j)=>j!==i))}
                    style={{ background:'none', border:'none', color:'#94A3B8', cursor:'pointer', fontSize:14 }}>×</button>
                </div>
              ))}
              <div style={{ display:'flex', gap:6 }}>
                <input style={{ ...fi, flex:1 }} placeholder="Adicionar item..." value={newCk}
                  onChange={e => setNewCk(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklist())} />
                <button type="button" onClick={addChecklist}
                  style={{ padding:'8px 14px', borderRadius:8, background:'#6366F1', color:'#fff', border:'none', cursor:'pointer', fontSize:13 }}>+</button>
              </div>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#475569', marginBottom:20, cursor:'pointer' }}>
              <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} />
              Modelo ativo (gera tarefas automaticamente)
            </label>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={salvar} disabled={createModelo.isPending || updateModelo.isPending}>
                {createModelo.isPending || updateModelo.isPending ? 'Salvando...' : 'Salvar modelo'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Excluir modelo?</div>
            <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>As tarefas já geradas <strong>não serão excluídas</strong>. Apenas novos dias não serão gerados.</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <Btn variant="ghost" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
              <Btn variant="danger" onClick={confirmarDelete} disabled={deleteModelo.isPending}>Excluir</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
