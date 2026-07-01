import { useState } from 'react'
import { useTarefaModelos, useCreateModelo, useUpdateModelo, useDeleteModelo, useClients,
         useClienteModelos, useVincularModelo, useDesvincularModelo, useGerarTarefas } from '../hooks/useData'
import { Card, Btn, Loader } from '../components/ui'
import ContextTooltip from '../components/ui/ContextTooltip'
import { supabase } from '../lib/supabase'

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

function lastDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString('en-CA')
}

export default function ModelosPage() {
  const { data: modelos = [], isLoading } = useTarefaModelos()
  const { data: clients = [] } = useClients()
  const createModelo = useCreateModelo()
  const updateModelo = useUpdateModelo()
  const deleteModelo = useDeleteModelo()

  const [fCliente, setFCliente] = useState('')
  const [fEtapa,   setFEtapa]   = useState('')

  // Hooks de vínculo — só ativam quando há cliente específico
  const isSpecificClient = !!(fCliente && fCliente !== '__geral')
  const { data: clienteModelos = [], isLoading: cmLoading } = useClienteModelos(isSpecificClient ? fCliente : null)
  const vincularModelo    = useVincularModelo()
  const desvincularModelo = useDesvincularModelo()
  const gerarTarefas      = useGerarTarefas()

  // Geração
  const [dataInicio, setDataInicio] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [geracaoMsg, setGeracaoMsg] = useState(null) // { ok, texto }
  const [removerConfirm, setRemoverConfirm] = useState(false)
  const [removendo,      setRemovendo]      = useState(false)
  const [removerMsg,     setRemoverMsg]     = useState(null)

  // Modal CRUD modelos
  const [modal, setModal]   = useState(null)
  const [form,  setForm]    = useState(EMPTY_FORM)
  const [newCk, setNewCk]   = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function abrirNovo()    { setForm(EMPTY_FORM); setNewCk(''); setModal('new') }
  function abrirEditar(m) {
    setForm({
      titulo: m.titulo, descricao: m.descricao || '', categoria: m.categoria || '',
      etapa: m.etapa || '', prioridade: m.prioridade, recorrencia: m.recorrencia,
      dias_semana: m.dias_semana || [], dia_mes: m.dia_mes || 5,
      dias_mes: m.dias_mes || [], checklist_items: m.checklist_items || [],
      ativo: m.ativo, _id: m.id,
    })
    setNewCk('')
    setModal('edit')
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
    const txt = newCk.trim()
    if (!txt) return
    set('checklist_items', [...form.checklist_items, txt])
    setNewCk('')
  }

  function toggleDia(v) {
    const arr = form.dias_semana.includes(v) ? form.dias_semana.filter(d => d !== v) : [...form.dias_semana, v]
    set('dias_semana', arr)
  }

  function toggleDiaMes(v) {
    const arr = form.dias_mes.includes(v) ? form.dias_mes.filter(d => d !== v) : [...form.dias_mes, v]
    set('dias_mes', arr.sort((a, b) => a - b))
  }

  async function handleVincular(modeloId) {
    try {
      await vincularModelo.mutateAsync({ clienteId: fCliente, modeloId })
    } catch (err) { alert('Erro ao vincular: ' + err.message) }
  }

  async function handleDesvincular(cm) {
    if (!confirm(`Desvincular "${cm.tarefa_modelos?.titulo || 'modelo'}"? As tarefas abertas futuras deste modelo serão removidas.`)) return
    // Remove tarefas abertas futuras deste modelo para este cliente
    const hoje = new Date().toLocaleDateString('en-CA')
    await supabase.from('tarefas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('cliente_id', fCliente)
      .eq('modelo_id', cm.modelo_id)
      .neq('status', 'concluida')
      .gte('data_execucao', hoje)
      .is('deleted_at', null)
    desvincularModelo.mutate({ id: cm.id, clienteId: fCliente })
  }

  async function handleGerar() {
    setGeracaoMsg(null)
    try {
      const resultado = await gerarTarefas.mutateAsync({
        clienteId: fCliente,
        dataInicio,
        dataFim: lastDayOfMonth(),
      })
      const criadas = resultado?.criadas ?? resultado?.total_criadas ?? '?'
      setGeracaoMsg({ ok: true, texto: `${criadas} tarefa(s) gerada(s) com sucesso!` })
    } catch (err) {
      setGeracaoMsg({ ok: false, texto: 'Erro: ' + (err.message || 'falha ao gerar') })
    }
  }

  async function handleRemoverTarefas() {
    setRemovendo(true)
    setRemoverMsg(null)
    const hoje = new Date().toLocaleDateString('en-CA')
    const { error } = await supabase.from('tarefas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('cliente_id', fCliente)
      .neq('status', 'concluida')
      .gte('data_execucao', hoje)
      .is('deleted_at', null)
    setRemovendo(false)
    setRemoverConfirm(false)
    setRemoverMsg(error
      ? { ok: false, texto: 'Erro ao remover: ' + error.message }
      : { ok: true, texto: 'Tarefas abertas futuras removidas.' }
    )
  }

  // Dados calculados
  const linkedModelIds = new Set(clienteModelos.map(cm => cm.modelo_id))
  const clienteNome = isSpecificClient
    ? (clients.find(c => c.id === fCliente)?.fantasia || clients.find(c => c.id === fCliente)?.razao_social || '')
    : ''

  const modelosFiltrados = modelos
    .filter(m => {
      if (!fCliente) return true
      if (fCliente === '__geral') return !m.cliente_id
      return true // quando cliente específico, mostra tudo na seção de vincular
    })
    .filter(m => !fEtapa || m.etapa === fEtapa)

  const modelosDisponiveis = modelos
    .filter(m => !linkedModelIds.has(m.id))
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
          'Configure uma tarefa recorrente uma vez — o sistema gera automaticamente todo mês.',
          'Filtre por cliente para vincular/desvincular modelos e gerar tarefas.',
          'Defina a recorrência (diária, semanal, mensal) e o dia de execução.',
          'As tarefas geradas aparecem automaticamente na página de Tarefas.',
        ]}
      />

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ fontSize:13, color:'#64748B' }}>
          Configure tarefas recorrentes — o sistema gera automaticamente conforme a recorrência.
        </div>
        <Btn variant="primary" onClick={abrirNovo}>+ Novo modelo</Btn>
      </div>

      {/* FILTROS */}
      <div style={{ marginBottom:20, display:'flex', gap:8 }}>
        <select value={fCliente} onChange={e => { setFCliente(e.target.value); setGeracaoMsg(null); setRemoverMsg(null) }}
          style={{ flex:1.5, padding:'9px 12px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
            border:'1px solid #E2E8F0', background:'#fff', color:'#334155' }}>
          <option value="">Todos os clientes</option>
          <option value="__geral">Geral (sem cliente)</option>
          {clients
            .slice()
            .sort((a,b) => (a.fantasia||a.razao_social||'').localeCompare(b.fantasia||b.razao_social||''))
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

          {/* MODELOS VINCULADOS */}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:10 }}>
              Modelos vinculados a <span style={{ color:'#6366F1' }}>{clienteNome}</span>
            </div>
            {cmLoading ? <Loader /> : clienteModelos.length === 0 ? (
              <Card>
                <div style={{ padding:'24px 20px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
                  Nenhum modelo vinculado. Vincule abaixo para começar a gerar tarefas.
                </div>
              </Card>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {clienteModelos.map(cm => {
                  const m = cm.tarefa_modelos
                  if (!m) return null
                  return (
                    <div key={cm.id} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10,
                      padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: prioColor[m.prioridade] || '#94A3B8', flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{m.titulo}</div>
                        <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, display:'flex', gap:8, flexWrap:'wrap' }}>
                          {m.categoria && <span>📂 {m.categoria}</span>}
                          {m.checklist_items?.length > 0 && <span>✓ {m.checklist_items.length} itens</span>}
                        </div>
                      </div>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:'#EFF6FF', color:'#1D4ED8', fontWeight:600, whiteSpace:'nowrap' }}>
                        {recLabel[m.recorrencia] || m.recorrencia}
                      </span>
                      <button
                        onClick={() => handleDesvincular(cm)}
                        disabled={desvincularModelo.isPending}
                        style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #FECDD3', background:'#FEF2F2',
                          color:'#991B1B', cursor:'pointer', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
                        Desvincular
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* VINCULAR MODELO */}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:10 }}>
              Vincular modelo ao cliente
            </div>
            {modelosDisponiveis.length === 0 ? (
              <Card>
                <div style={{ padding:'16px 20px', textAlign:'center', color:'#94A3B8', fontSize:13 }}>
                  {fEtapa ? 'Nenhum modelo disponível para esta etapa.' : 'Todos os modelos já estão vinculados.'}
                </div>
              </Card>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {modelosDisponiveis.map(m => (
                  <div key={m.id} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:10,
                    padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: prioColor[m.prioridade] || '#94A3B8', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#334155' }}>{m.titulo}</div>
                      <div style={{ fontSize:11, color:'#94A3B8', marginTop:2, display:'flex', gap:8, flexWrap:'wrap' }}>
                        {m.etapa && <span>🔖 {ETAPAS_MODELO.find(e=>e.v===m.etapa)?.label || m.etapa}</span>}
                        {m.categoria && <span>📂 {m.categoria}</span>}
                        {!m.cliente_id && <span>🌐 Geral</span>}
                        {m.checklist_items?.length > 0 && <span>✓ {m.checklist_items.length} itens</span>}
                      </div>
                    </div>
                    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:'#F1F5F9', color:'#475569', fontWeight:600, whiteSpace:'nowrap' }}>
                      {recLabel[m.recorrencia] || m.recorrencia}
                    </span>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={() => abrirEditar(m)}
                        style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:11 }}>✏</button>
                      <button
                        onClick={() => handleVincular(m.id)}
                        disabled={vincularModelo.isPending}
                        style={{ padding:'5px 14px', borderRadius:8, border:'none', background:'#6366F1',
                          color:'#fff', cursor:'pointer', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
                        Vincular
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GERAÇÃO */}
          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#0F172A', marginBottom:4 }}>Geração de tarefas</div>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>
              Gera todas as tarefas do(s) modelo(s) vinculado(s) a partir da data escolhida até o fim do mês.
              Após isso, o sistema continua gerando automaticamente a cada dia.
            </div>

            <div style={{ display:'flex', alignItems:'flex-end', gap:10, marginBottom:geracaoMsg ? 12 : 0 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748B', marginBottom:4 }}>DATA DE INÍCIO</div>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => { setDataInicio(e.target.value); setGeracaoMsg(null) }}
                  style={{ ...fi, width:160 }}
                />
              </div>
              <Btn variant="primary" onClick={handleGerar} disabled={gerarTarefas.isPending || !fCliente}>
                {gerarTarefas.isPending ? 'Gerando...' : 'Gerar tarefas'}
              </Btn>
            </div>

            {geracaoMsg && (
              <div style={{ fontSize:12, padding:'8px 12px', borderRadius:8, marginBottom:8,
                background: geracaoMsg.ok ? '#F0FDF4' : '#FEF2F2',
                color: geracaoMsg.ok ? '#15803D' : '#991B1B',
                border: `1px solid ${geracaoMsg.ok ? '#BBF7D0' : '#FECDD3'}` }}>
                {geracaoMsg.ok ? '✅ ' : '⚠️ '}{geracaoMsg.texto}
              </div>
            )}

            {/* ÁREA DE RISCO */}
            <div style={{ marginTop:16, padding:16, background:'#FEF2F2', borderRadius:10, border:'1px solid #FECDD3' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#991B1B', marginBottom:4 }}>⚠️ Área de risco</div>
              <div style={{ fontSize:12, color:'#7F1D1D', marginBottom:12 }}>
                Remove todas as tarefas abertas futuras deste cliente, ignorando qualquer interação registrada.
                Esta ação não pode ser desfeita.
              </div>
              {removerMsg && (
                <div style={{ fontSize:12, padding:'8px 10px', borderRadius:8, marginBottom:10,
                  background: removerMsg.ok ? '#F0FDF4' : '#fff3cd',
                  color: removerMsg.ok ? '#15803D' : '#856404',
                  border: `1px solid ${removerMsg.ok ? '#BBF7D0' : '#ffc107'}` }}>
                  {removerMsg.texto}
                </div>
              )}
              {!removerConfirm ? (
                <button
                  onClick={() => { setRemoverConfirm(true); setRemoverMsg(null) }}
                  style={{ padding:'7px 16px', borderRadius:8, border:'1px solid #FECDD3',
                    background:'#fff', color:'#991B1B', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  Remover tarefas abertas
                </button>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, color:'#7F1D1D', fontWeight:600 }}>Tem certeza? Esta ação é irreversível.</span>
                  <button
                    onClick={handleRemoverTarefas}
                    disabled={removendo}
                    style={{ padding:'7px 16px', borderRadius:8, border:'none',
                      background:'#DC2626', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                    {removendo ? 'Removendo...' : 'Confirmar remoção'}
                  </button>
                  <button
                    onClick={() => setRemoverConfirm(false)}
                    style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #E2E8F0',
                      background:'#fff', color:'#64748B', cursor:'pointer', fontSize:12 }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (
        /* ── VISÃO GERAL / TODOS OS CLIENTES ── */
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
              <input style={fi} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Conferência Bancária Matinal" />
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Descrição operacional</label>
              <textarea style={{ ...fi, minHeight:70, resize:'vertical' }} value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} placeholder="Descreva o que deve ser feito, ferramentas usadas, cuidados importantes..." />
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
                <label style={{ fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase' }}>Dia do mês (1–28)</label>
                <input style={{ ...fi, width:100 }} type="number" min={1} max={28} value={form.dia_mes} onChange={e => set('dia_mes', parseInt(e.target.value) || 1)} />
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
                  <button type="button" onClick={() => set('checklist_items', form.checklist_items.filter((_, j) => j !== i))}
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

      {/* CONFIRM DELETE MODELO */}
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
