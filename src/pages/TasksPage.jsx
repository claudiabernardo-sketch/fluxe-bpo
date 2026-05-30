import { useState, useMemo } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useClients, useUsuarios } from '../hooks/useData'
import { Loader, PrioBadge, StatusBadge, fmt, isVencida, Btn, EmptyState } from '../components/ui'
import { useTimerStore } from '../components/layout/TimerBar'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const CATEGORIAS = ['Contas a Pagar','Contas a Receber','Conciliação Bancária','Emissão de NF','Emissão de Boletos','Cobrança / Inadimplência','Fluxo de Caixa','Pagamentos','Relatórios','Implantação','Onboarding','Estratégico','Relacionamento']
const BANCOS = ['Banco do Brasil','Santander','Caixa Econômica Federal','Bradesco','Itaú','Nubank','C6 Bank','Banco Inter','Mercado Pago','PagBank','Sicoob','Sicredi','Banco Original','BTG Pactual','Stone','Cora','Asaas','Outro']
const RECORRENCIA_LABEL = { diaria_util:'📅 Todo dia útil', semanal:'📆 Semanal', mensal_dia_fixo:'🗓 Mensal (dia fixo)', mensal_dia_util:'🗓 Mensal (dia útil)', por_cliente:'👤 Dia do cliente' }
const DIAS_SEMANA_MOD = [{ v:1,l:'Seg' },{ v:2,l:'Ter' },{ v:3,l:'Qua' },{ v:4,l:'Qui' },{ v:5,l:'Sex' }]

const STATUS_CONFIG = {
  aberta:      { color:'#3B82F6', bg:'#EFF6FF', label:'Aberta' },
  andamento:   { color:'#F59E0B', bg:'#FFFBEB', label:'Em andamento' },
  aguardando:  { color:'#8B5CF6', bg:'#F5F3FF', label:'Ag. cliente' },
  revisao:     { color:'#06B6D4', bg:'#ECFEFF', label:'Em revisão' },
  concluida:   { color:'#22C55E', bg:'#F0FDF4', label:'Concluída' },
  impedimento: { color:'#EF4444', bg:'#FEF2F2', label:'Impedimento' },
  cancelada:   { color:'#94A3B8', bg:'#F8FAFC', label:'Cancelada' },
}

const PRIO_CONFIG = {
  alta:  { color:'#EF4444', bg:'#FEF2F2', label:'Alta', icon:'🔴' },
  media: { color:'#F59E0B', bg:'#FFFBEB', label:'Média', icon:'🟡' },
  baixa: { color:'#22C55E', bg:'#F0FDF4', label:'Baixa', icon:'🟢' },
}

function Avatar({ nome, size=28 }) {
  const ini = nome?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?'
  const colors = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899']
  const color = colors[(nome?.charCodeAt(0)||0) % colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:700, color:'#fff', flexShrink:0 }}>
      {ini}
    </div>
  )
}

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: usuarios = [] } = useUsuarios()
  const { profile } = useAuthStore()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const startTimer = useTimerStore(s => s.start)
  const qc = useQueryClient()

  const [mainTab, setMainTab] = useState('tarefas')
  const [selTask, setSelTask] = useState(null)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fClient, setFClient] = useState('')
  const [fPrio, setFPrio] = useState('')
  const [fResp, setFResp] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [showHist, setShowHist] = useState(false)
  const [newCk, setNewCk] = useState('')
  const [newComentario, setNewComentario] = useState('')

  // Modelos
  const [modalModelo, setModalModelo] = useState(null)
  const [formModelo, setFormModelo] = useState({})
  const [diasSem, setDiasSem] = useState([])
  const [gerandoMes, setGerandoMes] = useState(false)
  const [msgGerar, setMsgGerar] = useState('')

  const { data: modelos = [] } = useQuery({
    queryKey: ['modelos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefa_modelos')
        .select('*, clientes(razao_social, fantasia), usuarios!tarefa_modelos_responsavel_id_fkey(nome)')
        .order('titulo')
      if (error) throw error
      return data
    },
  })

  const createModelo = useMutation({
    mutationFn: async (m) => { const { data, error } = await supabase.from('tarefa_modelos').insert(m).select().single(); if (error) throw error; return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos'] }),
  })
  const updateModelo = useMutation({
    mutationFn: async ({ id, ...m }) => { const { data, error } = await supabase.from('tarefa_modelos').update(m).eq('id', id).select().single(); if (error) throw error; return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos'] }),
  })
  const deleteModelo = useMutation({
    mutationFn: async (id) => { const { error } = await supabase.from('tarefa_modelos').delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['modelos'] }),
  })

  async function gerarMes() {
    setGerandoMes(true); setMsgGerar('')
    try {
      const { data, error } = await supabase.rpc('gerar_tarefas_mes')
      if (error) throw error
      setMsgGerar(`✅ ${data} tarefa${data!==1?'s':''} gerada${data!==1?'s':''} com sucesso!`)
      qc.invalidateQueries({ queryKey: ['tasks'] })
    } catch (e) { setMsgGerar('❌ Erro: ' + e.message) }
    setGerandoMes(false)
  }

  // Checklist
  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selTask],
    queryFn: async () => {
      if (!selTask) return []
      const { data, error } = await supabase.from('tarefa_checklists').select('*').eq('tarefa_id', selTask).order('ordem')
      if (error) throw error
      return data
    },
    enabled: !!selTask,
  })

  // Histórico
  const { data: historico = [] } = useQuery({
    queryKey: ['historico', selTask],
    queryFn: async () => {
      if (!selTask) return []
      const { data } = await supabase.from('tarefa_historico').select('*, usuarios(nome)').eq('tarefa_id', selTask).order('criado_em', { ascending: false })
      return data || []
    },
    enabled: !!selTask,
  })

  const addCheck = useMutation({
    mutationFn: async (texto) => { const { data } = await supabase.from('tarefa_checklists').insert({ tarefa_id: selTask, texto, ordem: checklists.length }).select().single(); return data },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] })
  })
  const toggleCheck = useMutation({
    mutationFn: async ({ id, concluido }) => { await supabase.from('tarefa_checklists').update({ concluido }).eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] })
  })
  const deleteCheck = useMutation({
    mutationFn: async (id) => { await supabase.from('tarefa_checklists').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] })
  })

  const logHistorico = async (tarefa_id, acao) => {
    await supabase.from('tarefa_historico').insert({ tarefa_id, usuario_id: profile?.id, acao })
    qc.invalidateQueries({ queryKey: ['historico', tarefa_id] })
  }

  const filtered = useMemo(() => tasks.filter(t => {
    const q = search.toLowerCase()
    return (!q || t.titulo?.toLowerCase().includes(q)) &&
      (!fStatus || t.status === fStatus) &&
      (!fClient || t.cliente_id === fClient) &&
      (!fResp || t.responsavel_id === fResp) &&
      (!fPrio || t.prioridade === fPrio)
  }), [tasks, search, fStatus, fClient, fResp, fPrio])

  const selectedTask = tasks.find(t => t.id === selTask)
  const selCliente = clients.find(c => c.id === selectedTask?.cliente_id)
  const selResp = usuarios.find(u => u.id === selectedTask?.responsavel_id)
  const selCriador = usuarios.find(u => u.id === selectedTask?.criado_por)
  const checkPct = checklists.length ? Math.round(checklists.filter(c=>c.concluido).length / checklists.length * 100) : 0

  function openNew() { setForm({ status:'aberta', prioridade:'media' }); setModal({ mode:'new' }) }
  function openEdit(t) { setForm({...t}); setModal({ mode:'edit', id:t.id }) }
  function closeModal() { setModal(null); setForm({}) }

  async function save() {
    if (!form.titulo?.trim()) return alert('Título obrigatório')
    const payload = { titulo:form.titulo, categoria:form.categoria||null, prioridade:form.prioridade||'media', status:form.status||'aberta', prazo:form.prazo||null, obs:form.obs||null, cliente_id:form.cliente_id||null, responsavel_id:form.responsavel_id||null, banco:form.banco||null, valor:form.valor||null }
    if (modal.mode === 'new') {
      const t = await createTask.mutateAsync(payload)
      await logHistorico(t.id, 'Tarefa criada')
      setSelTask(t.id)
    } else {
      await updateTask.mutateAsync({ id: modal.id, ...payload })
      await logHistorico(modal.id, 'Tarefa editada')
    }
    closeModal()
  }

  async function quickStatus(id, status) {
    await updateTask.mutateAsync({ id, status })
    await logHistorico(id, `Status → ${status}`)
  }

  async function enviarComentario() {
    if (!newComentario.trim() || !selTask) return
    await logHistorico(selTask, `💬 ${newComentario.trim()}`)
    setNewComentario('')
  }

  function openNovoModelo() { setFormModelo({ recorrencia:'mensal_dia_fixo', prioridade:'media', ativo:true, antecedencia_dias:0 }); setDiasSem([]); setModalModelo({ mode:'new' }) }
  function openEditModelo(m) { setFormModelo({...m}); setDiasSem(m.dias_semana||[]); setModalModelo({ mode:'edit', id:m.id }) }
  async function saveModelo() {
    if (!formModelo.titulo?.trim()) return alert('Título obrigatório')
    const payload = { titulo:formModelo.titulo, categoria:formModelo.categoria||null, prioridade:formModelo.prioridade||'media', recorrencia:formModelo.recorrencia||'mensal_dia_fixo', dia_mes:formModelo.dia_mes?parseInt(formModelo.dia_mes):null, dia_util_num:formModelo.dia_util_num?parseInt(formModelo.dia_util_num):1, dias_semana:diasSem, antecedencia_dias:parseInt(formModelo.antecedencia_dias)||0, cliente_id:formModelo.cliente_id||null, responsavel_id:formModelo.responsavel_id||null, obs:formModelo.obs||null, ativo:formModelo.ativo!==false }
    if (modalModelo.mode === 'new') await createModelo.mutateAsync(payload)
    else await updateModelo.mutateAsync({ id:modalModelo.id, ...payload })
    setModalModelo(null); setFormModelo({})
  }

  const fi = { width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff', color:'#0F172A', outline:'none' }

  if (isLoading) return <Loader />

  // Contadores para badges
  const hoje = new Date().toISOString().slice(0,10)
  const cntHoje = tasks.filter(t => t.prazo === hoje && !['concluida','cancelada'].includes(t.status)).length
  const cntAtrasadas = tasks.filter(t => t.prazo && t.prazo < hoje && !['concluida','cancelada'].includes(t.status)).length

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 110px)' }}>

      {/* ── TABS ── */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid #F1F5F9', marginBottom:0, flexShrink:0 }}>
        <button onClick={()=>setMainTab('tarefas')} style={{ padding:'10px 18px', border:'none', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:700, color:mainTab==='tarefas'?'#6366F1':'#94A3B8', borderBottom:mainTab==='tarefas'?'2px solid #6366F1':'2px solid transparent', marginBottom:-2 }}>
          ✅ Tarefas
          {cntHoje > 0 && <span style={{ marginLeft:6, fontSize:9, background:'#EEF2FF', color:'#6366F1', padding:'1px 5px', borderRadius:99, fontWeight:700 }}>{cntHoje} hoje</span>}
          {cntAtrasadas > 0 && <span style={{ marginLeft:4, fontSize:9, background:'#FEF2F2', color:'#991B1B', padding:'1px 5px', borderRadius:99, fontWeight:700 }}>⚠{cntAtrasadas}</span>}
        </button>
        <button onClick={()=>setMainTab('modelos')} style={{ padding:'10px 18px', border:'none', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:700, color:mainTab==='modelos'?'#6366F1':'#94A3B8', borderBottom:mainTab==='modelos'?'2px solid #6366F1':'2px solid transparent', marginBottom:-2 }}>
          🔁 Modelos recorrentes
          <span style={{ marginLeft:6, fontSize:9, background:'#F1F5F9', color:'#64748B', padding:'1px 5px', borderRadius:99 }}>{modelos.filter(m=>m.ativo).length} ativos</span>
        </button>
      </div>

      {/* ══════════ ABA TAREFAS ══════════ */}
      {mainTab === 'tarefas' && (
        <div style={{ flex:1, display:'flex', overflow:'hidden', gap:0, marginTop:12 }}>

          {/* ── COLUNA ESQUERDA: Lista ── */}
          <div style={{ width:320, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid #F1F5F9', paddingRight:12, marginRight:12 }}>
            {/* Filtros */}
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
              <div style={{ position:'relative' }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar tarefa..." style={{ ...fi, paddingLeft:12 }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...fi }}>
                  <option value="">Todos status</option>
                  <option value="aberta">Aberta</option>
                  <option value="andamento">Andamento</option>
                  <option value="aguardando">Ag. cliente</option>
                  <option value="revisao">Revisão</option>
                  <option value="concluida">Concluída</option>
                  <option value="impedimento">Impedimento</option>
                </select>
                <select value={fPrio} onChange={e=>setFPrio(e.target.value)} style={{ ...fi }}>
                  <option value="">Prioridade</option>
                  <option value="alta">🔴 Alta</option>
                  <option value="media">🟡 Média</option>
                  <option value="baixa">🟢 Baixa</option>
                </select>
              </div>
              <select value={fClient} onChange={e=>setFClient(e.target.value)} style={{ ...fi }}>
                <option value="">Todos os clientes</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
              </select>
            </div>

            {/* Header lista */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>{filtered.length} tarefa{filtered.length!==1?'s':''}</span>
              <button onClick={openNew} style={{ padding:'5px 10px', borderRadius:7, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>+ Nova</button>
            </div>

            {/* Lista de tarefas */}
            <div style={{ flex:1, overflow:'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px 16px', color:'#CBD5E1', fontSize:12 }}>
                  Nenhuma tarefa encontrada
                </div>
              ) : (
                filtered.map(t => {
                  const venc = isVencida(t.prazo, t.status)
                  const active = selTask === t.id
                  const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.aberta
                  const cl = clients.find(c=>c.id===t.cliente_id)
                  const resp = usuarios.find(u=>u.id===t.responsavel_id)
                  return (
                    <div key={t.id}
                      onClick={()=>{ setSelTask(t.id===selTask?null:t.id); setShowHist(false) }}
                      style={{ padding:'10px 12px', borderRadius:10, marginBottom:6, cursor:'pointer', border:`1px solid ${active?'#6366F1':venc?'#FECDD3':'#F1F5F9'}`, background: active?'#EEF2FF':venc?'#FFFBEB':'#fff', borderLeft:`3px solid ${active?'#6366F1':venc?'#EF4444':st.color}`, transition:'all .15s' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                        {/* Checkbox rápido */}
                        <button onClick={e=>{ e.stopPropagation(); quickStatus(t.id, t.status==='concluida'?'aberta':'concluida') }}
                          style={{ width:16, height:16, borderRadius:4, border:`2px solid ${t.status==='concluida'?'#22C55E':'#CBD5E1'}`, background:t.status==='concluida'?'#22C55E':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                          {t.status==='concluida' && <span style={{ color:'#fff', fontSize:8 }}>✓</span>}
                        </button>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:t.status==='concluida'?'#94A3B8':'#0F172A', textDecoration:t.status==='concluida'?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                            {t.titulo}
                            {t.modelo_id && <span style={{ marginLeft:5, fontSize:8, background:'#EEF2FF', color:'#6366F1', padding:'1px 4px', borderRadius:3, fontWeight:700 }}>🔁</span>}
                          </div>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
                            {cl && <span style={{ fontSize:9, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:90 }}>🏢 {cl.fantasia||cl.razao_social}</span>}
                            {t.prazo && <span style={{ fontSize:9, color:venc?'#991B1B':'#94A3B8', fontWeight:venc?700:400 }}>📅 {fmt(t.prazo)}{venc?' ⚠':''}</span>}
                          </div>
                          <div style={{ display:'flex', gap:5, marginTop:5, alignItems:'center' }}>
                            <span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:st.bg, color:st.color, fontWeight:700 }}>{st.label}</span>
                            <span style={{ fontSize:9, color: PRIO_CONFIG[t.prioridade]?.color }}>{PRIO_CONFIG[t.prioridade]?.icon}</span>
                            {resp && (
                              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3 }}>
                                <Avatar nome={resp.nome} size={16} />
                                <span style={{ fontSize:9, color:'#94A3B8' }}>{resp.nome.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── COLUNA CENTRO: Detalhe da tarefa ── */}
          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {!selectedTask ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#CBD5E1' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#94A3B8' }}>Selecione uma tarefa</div>
                <div style={{ fontSize:11, color:'#CBD5E1', marginTop:4 }}>ou crie uma nova</div>
                <button onClick={openNew} style={{ marginTop:16, padding:'8px 16px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>+ Nova tarefa</button>
              </div>
            ) : (
              <div style={{ flex:1, overflow:'auto', paddingRight:12 }}>
                {/* Header tarefa */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', lineHeight:1.3, marginBottom:6 }}>
                        {selectedTask.titulo}
                        {selectedTask.modelo_id && <span style={{ marginLeft:8, fontSize:10, background:'#EEF2FF', color:'#6366F1', padding:'2px 7px', borderRadius:4, fontWeight:700 }}>🔁 Recorrente</span>}
                      </div>
                      {selCliente && (
                        <div style={{ fontSize:12, color:'#64748B', marginBottom:4 }}>
                          🏢 <strong>{selCliente.fantasia||selCliente.razao_social}</strong>
                          {selCliente.cnpj && <span style={{ marginLeft:8, fontSize:10, color:'#94A3B8' }}>{selCliente.cnpj}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button onClick={()=>openEdit(selectedTask)} style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:11, fontWeight:600 }}>✏ Editar</button>
                      <button onClick={()=>{ if(confirm('Excluir tarefa?')) { deleteTask.mutate(selectedTask.id); setSelTask(null) } }} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:11 }}>🗑</button>
                    </div>
                  </div>

                  {/* Status rápido */}
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                    {Object.entries(STATUS_CONFIG).filter(([k])=>k!=='cancelada').map(([st, cfg])=>(
                      <button key={st} onClick={()=>quickStatus(selectedTask.id, st)}
                        style={{ padding:'4px 10px', borderRadius:99, border:`1px solid ${selectedTask.status===st?cfg.color:'#E2E8F0'}`, background:selectedTask.status===st?cfg.color:'#fff', color:selectedTask.status===st?'#fff':'#64748B', cursor:'pointer', fontSize:10, fontWeight:700, transition:'all .15s' }}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>

                  {/* Timer */}
                  <button onClick={()=>{ const cl=selCliente; startTimer(selectedTask.id, selectedTask.titulo, selectedTask.cliente_id, cl?.fantasia||cl?.razao_social||'') }}
                    style={{ width:'100%', padding:'10px', borderRadius:10, border:'1px solid #BBF7D0', background:'#F0FDF4', color:'#15803D', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:14 }}>
                    ▶ Iniciar timer para esta tarefa
                  </button>
                </div>

                {/* Grid de informações */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16, padding:'14px', background:'#F8FAFC', borderRadius:10, border:'1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Responsável</div>
                    {selResp ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Avatar nome={selResp.nome} size={22} />
                        <span style={{ fontSize:12, fontWeight:600, color:'#334155' }}>{selResp.nome}</span>
                      </div>
                    ) : <span style={{ fontSize:11, color:'#CBD5E1' }}>Não definido</span>}
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Prazo</div>
                    <div style={{ fontSize:12, fontWeight:600, color: isVencida(selectedTask.prazo, selectedTask.status)?'#991B1B':'#334155' }}>
                      {selectedTask.prazo ? `📅 ${fmt(selectedTask.prazo)}${isVencida(selectedTask.prazo,selectedTask.status)?' ⚠':''}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Prioridade</div>
                    <div style={{ fontSize:12, fontWeight:600, color: PRIO_CONFIG[selectedTask.prioridade]?.color }}>
                      {PRIO_CONFIG[selectedTask.prioridade]?.icon} {PRIO_CONFIG[selectedTask.prioridade]?.label}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Categoria</div>
                    <div style={{ fontSize:12, color:'#334155' }}>{selectedTask.categoria || '—'}</div>
                  </div>
                  {selectedTask.banco && (
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Banco</div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#1D4ED8' }}>🏦 {selectedTask.banco}</div>
                    </div>
                  )}
                  {selectedTask.valor && (
                    <div>
                      <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Valor</div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#15803D' }}>
                        {Number(selectedTask.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Criado por</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>{selCriador?.nome || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Criado em</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>
                      {selectedTask.criado_em ? new Date(selectedTask.criado_em).toLocaleDateString('pt-BR') : '—'}
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedTask.obs && (
                  <div style={{ padding:'10px 14px', background:'#FFFBEB', borderRadius:8, border:'1px solid #FEF08A', marginBottom:14, fontSize:12, color:'#713F12' }}>
                    💬 {selectedTask.obs}
                  </div>
                )}

                {/* Checklist */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#334155' }}>
                      ✔ Checklist
                      <span style={{ marginLeft:6, fontSize:10, color:'#94A3B8' }}>{checklists.filter(c=>c.concluido).length}/{checklists.length}</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color: checkPct===100?'#15803D':'#64748B' }}>{checkPct}%</span>
                  </div>

                  {/* Barra de progresso */}
                  {checklists.length > 0 && (
                    <div style={{ height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginBottom:10 }}>
                      <div style={{ height:'100%', background: checkPct===100?'#22C55E':'#6366F1', borderRadius:99, width:`${checkPct}%`, transition:'width .3s' }} />
                    </div>
                  )}

                  {checklists.map(ck=>(
                    <div key={ck.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, background: ck.concluido?'#F0FDF4':'#F8FAFC', marginBottom:4, border:'1px solid', borderColor: ck.concluido?'#BBF7D0':'#F1F5F9' }}>
                      <input type="checkbox" checked={ck.concluido} onChange={e=>toggleCheck.mutate({id:ck.id,concluido:e.target.checked})}
                        style={{ width:14, height:14, accentColor:'#6366F1', flexShrink:0, cursor:'pointer' }} />
                      <span style={{ flex:1, fontSize:12, color:ck.concluido?'#94A3B8':'#334155', textDecoration:ck.concluido?'line-through':'none' }}>{ck.texto}</span>
                      <button onClick={()=>deleteCheck.mutate(ck.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'#CBD5E1', fontSize:13, padding:'0 2px' }}>×</button>
                    </div>
                  ))}

                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <input value={newCk} onChange={e=>setNewCk(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&newCk.trim()){ addCheck.mutate(newCk.trim()); setNewCk('') }}}
                      placeholder="+ Adicionar item (Enter para confirmar)" style={{ ...fi, flex:1, fontSize:11 }} />
                    <button onClick={()=>{ if(newCk.trim()){ addCheck.mutate(newCk.trim()); setNewCk('') }}}
                      style={{ padding:'6px 12px', borderRadius:7, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>+</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── COLUNA DIREITA: Histórico ── */}
          {selectedTask && (
            <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', borderLeft:'1px solid #F1F5F9', paddingLeft:12, marginLeft:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#334155', marginBottom:12, paddingTop:2 }}>📋 Histórico</div>

              {/* Campo de comentário */}
              <div style={{ marginBottom:12 }}>
                <textarea value={newComentario} onChange={e=>setNewComentario(e.target.value)}
                  placeholder="Adicionar comentário ou atualização..."
                  style={{ ...fi, height:70, resize:'none', fontSize:11 }}
                  onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey) enviarComentario() }} />
                <button onClick={enviarComentario} disabled={!newComentario.trim()}
                  style={{ width:'100%', marginTop:4, padding:'6px', borderRadius:7, border:'none', background: newComentario.trim()?'#6366F1':'#F1F5F9', color: newComentario.trim()?'#fff':'#94A3B8', cursor: newComentario.trim()?'pointer':'default', fontSize:11, fontWeight:700 }}>
                  Enviar (Ctrl+Enter)
                </button>
              </div>

              {/* Timeline de histórico */}
              <div style={{ flex:1, overflow:'auto' }}>
                {historico.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#CBD5E1', fontSize:11, padding:'20px 0' }}>Sem atividades</div>
                ) : (
                  <div style={{ position:'relative' }}>
                    {historico.map((h, i) => {
                      const isComentario = h.acao?.startsWith('💬')
                      const data = new Date(h.criado_em)
                      const hoje = new Date().toDateString() === data.toDateString()
                      return (
                        <div key={h.id} style={{ display:'flex', gap:8, marginBottom:12, position:'relative' }}>
                          {/* Linha da timeline */}
                          {i < historico.length-1 && (
                            <div style={{ position:'absolute', left:10, top:22, width:1, height:'calc(100% + 4px)', background:'#F1F5F9' }} />
                          )}
                          {/* Dot */}
                          <div style={{ width:20, height:20, borderRadius:'50%', background: isComentario?'#6366F1':'#F1F5F9', border:`2px solid ${isComentario?'#6366F1':'#E2E8F0'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, zIndex:1 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background: isComentario?'#fff':'#CBD5E1' }} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:11, color: isComentario?'#334155':'#64748B', fontWeight: isComentario?500:400, lineHeight:1.4 }}>
                              {h.acao}
                            </div>
                            <div style={{ fontSize:9, color:'#94A3B8', marginTop:2, display:'flex', gap:4 }}>
                              {h.usuarios?.nome && <span style={{ fontWeight:600 }}>{h.usuarios.nome.split(' ')[0]}</span>}
                              <span>·</span>
                              <span>{hoje ? data.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : data.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ' ' + data.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ ABA MODELOS ══════════ */}
      {mainTab === 'modelos' && (
        <div style={{ flex:1, overflow:'auto', marginTop:12 }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
            <div style={{ fontSize:12, color:'#64748B', flex:1 }}>Configure tarefas recorrentes. O sistema gera automaticamente no dia 1º de cada mês.</div>
            <button onClick={gerarMes} disabled={gerandoMes} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #BBF7D0', background:'#F0FDF4', color:'#15803D', cursor:'pointer', fontSize:11, fontWeight:700 }}>
              {gerandoMes ? '⏳ Gerando...' : '⚡ Gerar tarefas do mês agora'}
            </button>
            <button onClick={openNovoModelo} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:700 }}>+ Novo modelo</button>
          </div>
          {msgGerar && <div style={{ padding:'10px 14px', borderRadius:8, background:msgGerar.startsWith('✅')?'#F0FDF4':'#FEF2F2', color:msgGerar.startsWith('✅')?'#15803D':'#991B1B', fontSize:12, fontWeight:600, marginBottom:12 }}>{msgGerar}</div>}
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid #F1F5F9', overflow:'hidden' }}>
            {modelos.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:'#CBD5E1' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔁</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#94A3B8' }}>Nenhum modelo configurado</div>
                <button onClick={openNovoModelo} style={{ marginTop:12, padding:'8px 16px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>+ Criar primeiro modelo</button>
              </div>
            ) : modelos.map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'1px solid #F8FAFC' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:m.ativo?'#22C55E':'#CBD5E1', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:m.ativo?'#0F172A':'#94A3B8', marginBottom:3 }}>
                    {m.titulo}
                    {!m.ativo && <span style={{ marginLeft:6, fontSize:9, background:'#F1F5F9', color:'#94A3B8', padding:'1px 5px', borderRadius:4 }}>pausado</span>}
                  </div>
                  <div style={{ fontSize:10, color:'#94A3B8', display:'flex', gap:8, flexWrap:'wrap' }}>
                    <span>{RECORRENCIA_LABEL[m.recorrencia]||m.recorrencia}</span>
                    {m.dia_mes && m.recorrencia==='mensal_dia_fixo' && <span>• Dia {m.dia_mes}</span>}
                    {m.antecedencia_dias>0 && <span>• {m.antecedencia_dias}d antes</span>}
                    {m.clientes && <span>• 🏢 {m.clientes.fantasia||m.clientes.razao_social}</span>}
                    {m.usuarios && <span>• 👤 {m.usuarios.nome}</span>}
                    {m.categoria && <span>• 📂 {m.categoria}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                  <button onClick={()=>updateModelo.mutate({id:m.id,ativo:!m.ativo})} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${m.ativo?'#FEF08A':'#BBF7D0'}`, background:m.ativo?'#FEFCE8':'#F0FDF4', color:m.ativo?'#854D0E':'#15803D', cursor:'pointer', fontSize:10, fontWeight:700 }}>
                    {m.ativo?'Pausar':'Ativar'}
                  </button>
                  <button onClick={()=>openEditModelo(m)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:11 }}>✏</button>
                  <button onClick={()=>{ if(confirm('Excluir modelo?')) deleteModelo.mutate(m.id) }} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:11 }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL NOVA/EDITAR TAREFA ── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 50px rgba(0,0,0,.15)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontWeight:800, fontSize:15, color:'#0F172A' }}>{modal.mode==='new'?'✅ Nova tarefa':'✏ Editar tarefa'}</span>
              <button onClick={closeModal} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:'16px 20px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Título *</label>
                <input value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} style={fi} placeholder="Descreva a tarefa..." autoFocus />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Cliente</label>
                  <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null,banco:null}))} style={fi}>
                    <option value="">— Sem cliente —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Responsável</label>
                  <select value={form.responsavel_id||''} onChange={e=>setForm(f=>({...f,responsavel_id:e.target.value||null}))} style={fi}>
                    <option value="">— Selecionar —</option>
                    {usuarios.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Categoria</label>
                  <select value={form.categoria||''} onChange={e=>setForm(f=>({...f,categoria:e.target.value||null}))} style={fi}>
                    <option value="">— Categoria —</option>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Prazo</label>
                  <input type="date" value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value||null}))} style={fi} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Prioridade</label>
                  <select value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))} style={fi}>
                    <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Status</label>
                  <select value={form.status||'aberta'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={fi}>
                    <option value="aberta">Aberta</option><option value="andamento">Em andamento</option>
                    <option value="aguardando">Ag. cliente</option><option value="revisao">Em revisão</option>
                    <option value="concluida">Concluída</option><option value="impedimento">Impedimento</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Valor (R$)</label>
                  <input type="number" step="0.01" value={form.valor||''} onChange={e=>setForm(f=>({...f,valor:e.target.value||null}))} style={fi} placeholder="0,00" />
                </div>
                {form.categoria==='Conciliação Bancária' && (
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#1D4ED8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>🏦 Banco</label>
                    <select value={form.banco||''} onChange={e=>setForm(f=>({...f,banco:e.target.value||null}))} style={fi}>
                      <option value="">— Selecione —</option>
                      {(clients.find(c=>c.id===form.cliente_id)?.bancos||[]).length>0 && <optgroup label="Bancos do cliente">{(clients.find(c=>c.id===form.cliente_id)?.bancos||[]).map(b=><option key={b} value={b}>{b}</option>)}</optgroup>}
                      <optgroup label="Todos os bancos">{BANCOS.map(b=><option key={b} value={b}>{b}</option>)}</optgroup>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Observações</label>
                <textarea value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={{ ...fi, height:70, resize:'vertical' }} placeholder="Informações adicionais..." />
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={closeModal} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:12, fontWeight:600 }}>Cancelar</button>
              <button onClick={save} disabled={createTask.isPending||updateTask.isPending} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                {createTask.isPending||updateTask.isPending?'Salvando…':'Salvar tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MODELO ── */}
      {modalModelo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:540, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 50px rgba(0,0,0,.15)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontWeight:800, fontSize:15, color:'#0F172A' }}>🔁 {modalModelo.mode==='new'?'Novo modelo recorrente':'Editar modelo'}</span>
              <button onClick={()=>setModalModelo(null)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:'16px 20px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Título *</label>
                <input value={formModelo.titulo||''} onChange={e=>setFormModelo(f=>({...f,titulo:e.target.value}))} style={fi} placeholder="Ex: Conciliação bancária mensal" autoFocus />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Cliente</label>
                  <select value={formModelo.cliente_id||''} onChange={e=>setFormModelo(f=>({...f,cliente_id:e.target.value||null}))} style={fi}>
                    <option value="">— Todos / Geral —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Responsável</label>
                  <select value={formModelo.responsavel_id||''} onChange={e=>setFormModelo(f=>({...f,responsavel_id:e.target.value||null}))} style={fi}>
                    <option value="">— Selecionar —</option>
                    {usuarios.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Categoria</label>
                  <select value={formModelo.categoria||''} onChange={e=>setFormModelo(f=>({...f,categoria:e.target.value||null}))} style={fi}>
                    <option value="">— Categoria —</option>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Prioridade</label>
                  <select value={formModelo.prioridade||'media'} onChange={e=>setFormModelo(f=>({...f,prioridade:e.target.value}))} style={fi}>
                    <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#6366F1', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>🔁 Recorrência</label>
                <select value={formModelo.recorrencia||'mensal_dia_fixo'} onChange={e=>setFormModelo(f=>({...f,recorrencia:e.target.value}))} style={fi}>
                  {Object.entries(RECORRENCIA_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {formModelo.recorrencia==='mensal_dia_fixo' && (
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Dia do mês (1–28)</label>
                  <input type="number" min={1} max={28} value={formModelo.dia_mes||''} onChange={e=>setFormModelo(f=>({...f,dia_mes:e.target.value}))} style={{...fi,width:100}} placeholder="Ex: 20" />
                </div>
              )}
              {formModelo.recorrencia==='mensal_dia_util' && (
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Nº do dia útil</label>
                  <select value={formModelo.dia_util_num||1} onChange={e=>setFormModelo(f=>({...f,dia_util_num:e.target.value}))} style={{...fi,width:200}}>
                    <option value={1}>1º dia útil</option><option value={2}>2º dia útil</option><option value={3}>3º dia útil</option>
                    <option value={-1}>Último dia útil</option><option value={-2}>Penúltimo dia útil</option>
                  </select>
                </div>
              )}
              {formModelo.recorrencia==='semanal' && (
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Dias da semana</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {DIAS_SEMANA_MOD.map(d=>(
                      <button key={d.v} onClick={()=>setDiasSem(prev=>prev.includes(d.v)?prev.filter(x=>x!==d.v):[...prev,d.v])}
                        style={{ padding:'6px 12px', borderRadius:7, border:`1px solid ${diasSem.includes(d.v)?'#6366F1':'#E2E8F0'}`, background:diasSem.includes(d.v)?'#EEF2FF':'#fff', color:diasSem.includes(d.v)?'#6366F1':'#64748B', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                        {d.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {formModelo.recorrencia==='por_cliente' && (
                <div style={{ padding:'10px 12px', background:'#EEF2FF', borderRadius:8, fontSize:11, color:'#4338CA' }}>
                  💡 O prazo será o dia de vencimento cadastrado em cada cliente.
                </div>
              )}
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Antecedência (dias antes)</label>
                <input type="number" min={0} max={30} value={formModelo.antecedencia_dias||0} onChange={e=>setFormModelo(f=>({...f,antecedencia_dias:e.target.value}))} style={{...fi,width:100}} />
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:3 }}>Ex: 5 = cria a tarefa 5 dias antes do prazo</div>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12 }}>
                <input type="checkbox" checked={formModelo.ativo!==false} onChange={e=>setFormModelo(f=>({...f,ativo:e.target.checked}))} style={{ width:14, height:14, accentColor:'#6366F1' }} />
                <span style={{ color:'#334155', fontWeight:600 }}>Modelo ativo</span>
              </label>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={()=>setModalModelo(null)} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:12, fontWeight:600 }}>Cancelar</button>
              <button onClick={saveModelo} disabled={createModelo.isPending||updateModelo.isPending} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                {createModelo.isPending||updateModelo.isPending?'Salvando…':'Salvar modelo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
