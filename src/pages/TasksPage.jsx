import { useState, useEffect } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useClients, useUsuarios } from '../hooks/useData'
import { Card, Badge, Btn, Loader, EmptyState, PrioBadge, StatusBadge, fmt, isVencida } from '../components/ui'
import { useTimerStore } from '../components/layout/TimerBar'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const CATEGORIAS = ['Contas a Pagar','Contas a Receber','Conciliação Bancária','Emissão de NF','Emissão de Boletos','Cobrança / Inadimplência','Fluxo de Caixa','Pagamentos','DRE / Relatórios','Implantação','Onboarding','Estratégico','Relacionamento']
const COLS = [{id:'aberta',label:'Abertas',color:'#3B82F6'},{id:'andamento',label:'Em andamento',color:'#F59E0B'},{id:'aguardando',label:'Ag. cliente',color:'#8B5CF6'},{id:'concluida',label:'Concluídas',color:'#22C55E'}]
const BANCOS = ['Banco do Brasil','Santander','Caixa Econômica Federal','Bradesco','Itaú','Nubank','C6 Bank','Banco Inter','Mercado Pago','PagBank','Sicoob','Sicredi','Banco Original','BTG Pactual','Stone','Cora','Asaas','Outro']

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

  const [view, setView] = useState('list')
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fClient, setFClient] = useState('')
  const [fResp, setFResp] = useState('')
  const [fPrio, setFPrio] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [selTask, setSelTask] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  // Checklist hooks
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
    mutationFn: async (texto) => {
      const { data } = await supabase.from('tarefa_checklists').insert({ tarefa_id: selTask, texto, ordem: checklists.length }).select().single()
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] })
  })

  const toggleCheck = useMutation({
    mutationFn: async ({ id, concluido }) => {
      await supabase.from('tarefa_checklists').update({ concluido }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] })
  })

  const deleteCheck = useMutation({
    mutationFn: async (id) => {
      await supabase.from('tarefa_checklists').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists', selTask] })
  })

  const logHistorico = async (tarefa_id, acao) => {
    await supabase.from('tarefa_historico').insert({ tarefa_id, usuario_id: profile?.id, acao })
    qc.invalidateQueries({ queryKey: ['historico', tarefa_id] })
  }

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase()
    return (!q || t.titulo?.toLowerCase().includes(q)) &&
      (!fStatus || t.status === fStatus) &&
      (!fClient || t.cliente_id === fClient) &&
      (!fResp || t.responsavel_id === fResp) &&
      (!fPrio || t.prioridade === fPrio)
  })

  const selectedTask = tasks.find(t => t.id === selTask)

  function openNew() { setForm({ status:'aberta', prioridade:'media' }); setModal({ mode:'new' }) }
  function openEdit(t) { setForm({...t}); setModal({ mode:'edit', id:t.id }) }
  function closeModal() { setModal(null); setForm({}) }

  async function save() {
    if (!form.titulo?.trim()) return alert('Título obrigatório')
    const payload = { titulo:form.titulo, categoria:form.categoria||null, prioridade:form.prioridade||'media', status:form.status||'aberta', prazo:form.prazo||null, obs:form.obs||null, cliente_id:form.cliente_id||null, responsavel_id:form.responsavel_id||null, banco:form.banco||null }
    if (modal.mode === 'new') {
      const t = await createTask.mutateAsync(payload)
      await logHistorico(t.id, 'Tarefa criada')
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

  // Drag & drop kanban
  const [dragId, setDragId] = useState(null)
  async function onDrop(colId) {
    if (!dragId || !colId) return
    await updateTask.mutateAsync({ id: dragId, status: colId })
    await logHistorico(dragId, `Movido para ${colId}`)
    setDragId(null); setDragOver(null)
  }

  const [newCk, setNewCk] = useState('')
  const [showHist, setShowHist] = useState(false)

  const fi = { width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff' }
  const fi2 = { ...fi, padding:'4px 8px', fontSize:11 }

  if (isLoading) return <Loader />

  const showBanco = form.categoria === 'Conciliação Bancária'
  const clientBancos = clients.find(c=>c.id===form.cliente_id)?.bancos || []

  return (
    <div style={{ display:'flex', gap:14, height:'calc(100vh - 110px)' }}>
      {/* ── LISTA / KANBAN ─────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Toolbar */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tarefa..." style={{ ...fi, width:180 }} />
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...fi, width:130 }}>
            <option value="">Todos status</option>
            <option value="aberta">Aberta</option><option value="andamento">Andamento</option>
            <option value="aguardando">Ag. cliente</option><option value="revisao">Revisão</option>
            <option value="concluida">Concluída</option><option value="impedimento">Impedimento</option>
          </select>
          <select value={fClient} onChange={e=>setFClient(e.target.value)} style={{ ...fi, width:150 }}>
            <option value="">Todos clientes</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
          </select>
          <select value={fPrio} onChange={e=>setFPrio(e.target.value)} style={{ ...fi, width:110 }}>
            <option value="">Prioridade</option>
            <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
          </select>
          <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden' }}>
            {['list','kanban'].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{ padding:'6px 12px', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, background:view===v?'#6366F1':'#fff', color:view===v?'#fff':'#64748B' }}>
                {v==='list'?'☰ Lista':'⬛ Kanban'}
              </button>
            ))}
          </div>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:10, color:'#94A3B8' }}>{filtered.length} tarefa{filtered.length!==1?'s':''}</span>
          <Btn variant="primary" onClick={openNew}>+ Nova tarefa</Btn>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:'auto' }}>
          {view === 'list' ? (
            <Card>
              {filtered.length === 0
                ? <EmptyState icon="✅" title="Nenhuma tarefa" sub="Crie tarefas para organizar a operação" action={<Btn variant="primary" onClick={openNew}>+ Nova tarefa</Btn>} />
                : filtered.map(t => {
                  const venc = isVencida(t.prazo, t.status)
                  const active = selTask === t.id
                  return (
                    <div key={t.id} onClick={()=>setSelTask(t.id===selTask?null:t.id)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:'1px solid #F8FAFC', cursor:'pointer', background: active?'#EEF2FF':venc?'#FFFBEB':'' }}
                      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=venc?'#FEF3C7':'#F8FAFC' }}
                      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background=venc?'#FFFBEB':'' }}>
                      <button onClick={e=>{ e.stopPropagation(); quickStatus(t.id, t.status==='concluida'?'aberta':'concluida') }}
                        style={{ width:18,height:18,borderRadius:4,border:`2px solid ${t.status==='concluida'?'#22C55E':'#CBD5E1'}`,background:t.status==='concluida'?'#22C55E':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        {t.status==='concluida' && <span style={{ color:'#fff',fontSize:9 }}>✓</span>}
                      </button>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:t.status==='concluida'?'#94A3B8':'#0F172A',textDecoration:t.status==='concluida'?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                          {t.titulo}
                        </div>
                        <div style={{ fontSize:10,color:'#94A3B8',marginTop:2,display:'flex',gap:8,flexWrap:'wrap' }}>
                          {t.clientes && <span>🏢 {t.clientes.fantasia||t.clientes.razao_social}</span>}
                          {t.categoria && <span>📂 {t.categoria}</span>}
                          {t.banco && <span style={{ color:'#1D4ED8',fontWeight:600 }}>🏦 {t.banco}</span>}
                          {t.prazo && <span style={{ color:venc?'#991B1B':'' }}>📅 {fmt(t.prazo)}{venc?' ⚠':''}</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex',gap:5,alignItems:'center',flexShrink:0 }}>
                        <PrioBadge v={t.prioridade} />
                        <StatusBadge v={t.status} />
                        <button onClick={e=>{ e.stopPropagation(); const cl=clients.find(c=>c.id===t.cliente_id); startTimer(t.id, t.titulo, t.cliente_id, cl?.fantasia||cl?.razao_social||'') }}
                          style={{ padding:'3px 8px',borderRadius:6,border:'1px solid #BBF7D0',background:'#F0FDF4',color:'#15803D',cursor:'pointer',fontSize:10,fontWeight:700 }}>▶</button>
                        <button onClick={e=>{ e.stopPropagation(); openEdit(t) }} style={{ padding:'3px 7px',borderRadius:6,border:'1px solid #E2E8F0',background:'#fff',color:'#475569',cursor:'pointer',fontSize:11 }}>✎</button>
                        <button onClick={e=>{ e.stopPropagation(); if(confirm('Excluir?')) deleteTask.mutate(t.id) }} style={{ padding:'3px 7px',borderRadius:6,border:'1px solid #FECDD3',background:'#FEF2F2',color:'#991B1B',cursor:'pointer',fontSize:11 }}>×</button>
                      </div>
                    </div>
                  )
                })
              }
            </Card>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {COLS.map(col => {
                const colTasks = filtered.filter(t=>t.status===col.id)
                return (
                  <div key={col.id}
                    onDragOver={e=>{ e.preventDefault(); setDragOver(col.id) }}
                    onDrop={()=>onDrop(col.id)}
                    onDragLeave={()=>setDragOver(null)}
                    style={{ background: dragOver===col.id?'#EEF2FF':'#F8FAFC', borderRadius:10, border:`1px solid ${dragOver===col.id?'#6366F1':'#E2E8F0'}`, transition:'all .15s' }}>
                    <div style={{ padding:'8px 12px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:col.color }} />
                      <span style={{ fontWeight:700,fontSize:11,color:'#0F172A',flex:1 }}>{col.label}</span>
                      <span style={{ fontSize:10,background:'#E2E8F0',color:'#475569',padding:'1px 6px',borderRadius:99 }}>{colTasks.length}</span>
                    </div>
                    <div style={{ padding:8,display:'flex',flexDirection:'column',gap:7,minHeight:80 }}>
                      {colTasks.map(t=>(
                        <div key={t.id} draggable onDragStart={()=>setDragId(t.id)}
                          onClick={()=>setSelTask(t.id===selTask?null:t.id)}
                          style={{ background:'#fff',borderRadius:8,padding:'9px 11px',border:`1px solid ${selTask===t.id?'#6366F1':'#E2E8F0'}`,cursor:'grab',boxShadow:selTask===t.id?'0 0 0 2px #C7D2FE':'' }}>
                          <div style={{ fontSize:11,fontWeight:600,color:'#0F172A',marginBottom:5 }}>{t.titulo}</div>
                          {t.clientes && <div style={{ fontSize:10,color:'#94A3B8',marginBottom:5 }}>{t.clientes.fantasia||t.clientes.razao_social}</div>}
                          {t.banco && <div style={{ fontSize:9,color:'#1D4ED8',fontWeight:700,marginBottom:4 }}>🏦 {t.banco}</div>}
                          <div style={{ display:'flex',gap:4,alignItems:'center' }}>
                            <PrioBadge v={t.prioridade} />
                            {t.prazo && <span style={{ fontSize:9,color:isVencida(t.prazo,t.status)?'#991B1B':'#94A3B8',marginLeft:'auto' }}>{fmt(t.prazo)}</span>}
                          </div>
                        </div>
                      ))}
                      <button onClick={openNew} style={{ border:'1px dashed #CBD5E1',background:'transparent',borderRadius:8,padding:'7px',color:'#94A3B8',cursor:'pointer',fontSize:10 }}>+ Adicionar</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── PAINEL DE DETALHE ──────────────────────────── */}
      {selectedTask && (
        <div style={{ width:340,flexShrink:0,background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,display:'flex',flexDirection:'column',overflow:'hidden' }}>
          {/* Header */}
          <div style={{ padding:'12px 14px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'flex-start',gap:8 }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:700,color:'#0F172A',marginBottom:4 }}>{selectedTask.titulo}</div>
              <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                <PrioBadge v={selectedTask.prioridade} />
                <StatusBadge v={selectedTask.status} />
              </div>
            </div>
            <div style={{ display:'flex',gap:5,flexShrink:0 }}>
              <Btn small onClick={()=>openEdit(selectedTask)}>✎</Btn>
              <button onClick={()=>setSelTask(null)} style={{ border:'none',background:'none',cursor:'pointer',color:'#94A3B8',fontSize:18,lineHeight:1 }}>×</button>
            </div>
          </div>

          {/* Meta */}
          <div style={{ padding:'10px 14px',borderBottom:'1px solid #F1F5F9',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:11,color:'#64748B' }}>
            {selectedTask.clientes && <div>🏢 {selectedTask.clientes.fantasia||selectedTask.clientes.razao_social}</div>}
            {selectedTask.categoria && <div>📂 {selectedTask.categoria}</div>}
            {selectedTask.banco && <div style={{ color:'#1D4ED8',fontWeight:600 }}>🏦 {selectedTask.banco}</div>}
            {selectedTask.prazo && <div style={{ color:isVencida(selectedTask.prazo,selectedTask.status)?'#991B1B':'' }}>📅 {fmt(selectedTask.prazo)}</div>}
          </div>

          {/* Timer */}
          <div style={{ padding:'8px 14px',borderBottom:'1px solid #F1F5F9' }}>
            <Btn variant="success" small onClick={()=>{ const cl=clients.find(c=>c.id===selectedTask.cliente_id); startTimer(selectedTask.id, selectedTask.titulo, selectedTask.cliente_id, cl?.fantasia||cl?.razao_social||'') }}>
              ▶ Iniciar timer
            </Btn>
          </div>

          {/* Status rápido */}
          <div style={{ padding:'8px 14px',borderBottom:'1px solid #F1F5F9',display:'flex',gap:4,flexWrap:'wrap' }}>
            {['aberta','andamento','aguardando','concluida','impedimento'].map(st=>(
              <button key={st} onClick={()=>quickStatus(selectedTask.id,st)}
                style={{ fontSize:9,padding:'3px 7px',borderRadius:99,border:'none',cursor:'pointer',fontWeight:600,
                  background:selectedTask.status===st?'#6366F1':'#F1F5F9',color:selectedTask.status===st?'#fff':'#475569' }}>
                {st}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex',borderBottom:'1px solid #F1F5F9' }}>
            {['checklist','historico'].map(tab=>(
              <button key={tab} onClick={()=>setShowHist(tab==='historico')}
                style={{ flex:1,padding:'8px',border:'none',cursor:'pointer',fontSize:11,fontWeight:600,
                  background:'transparent',color:showHist===(tab==='historico')?'#6366F1':'#94A3B8',
                  borderBottom:showHist===(tab==='historico')?'2px solid #6366F1':'2px solid transparent' }}>
                {tab==='checklist'?`✓ Checklist (${checklists.length})`:'📋 Histórico'}
              </button>
            ))}
          </div>

          {/* Checklist */}
          <div style={{ flex:1,overflow:'auto',padding:'8px 0' }}>
            {!showHist ? (
              <>
                {checklists.map(ck=>(
                  <div key={ck.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 14px' }}>
                    <input type="checkbox" checked={ck.concluido} onChange={e=>toggleCheck.mutate({id:ck.id,concluido:e.target.checked})}
                      style={{ width:14,height:14,accentColor:'#6366F1',flexShrink:0,cursor:'pointer' }} />
                    <span style={{ flex:1,fontSize:11,color:ck.concluido?'#94A3B8':'#334155',textDecoration:ck.concluido?'line-through':'none' }}>{ck.texto}</span>
                    <button onClick={()=>deleteCheck.mutate(ck.id)} style={{ border:'none',background:'none',cursor:'pointer',color:'#CBD5E1',fontSize:12 }}>×</button>
                  </div>
                ))}
                <div style={{ display:'flex',gap:6,padding:'6px 14px',marginTop:4 }}>
                  <input value={newCk} onChange={e=>setNewCk(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&newCk.trim()){ addCheck.mutate(newCk.trim()); setNewCk('') }}}
                    placeholder="Adicionar item... (Enter)" style={{ ...fi2, flex:1 }} />
                  <button onClick={()=>{ if(newCk.trim()){ addCheck.mutate(newCk.trim()); setNewCk('') }}}
                    style={{ padding:'4px 10px',borderRadius:7,border:'none',background:'#6366F1',color:'#fff',cursor:'pointer',fontSize:11 }}>+</button>
                </div>
                {checklists.length > 0 && (
                  <div style={{ padding:'4px 14px',fontSize:10,color:'#94A3B8' }}>
                    {checklists.filter(c=>c.concluido).length}/{checklists.length} concluídos
                    <div style={{ height:3,background:'#F1F5F9',borderRadius:99,overflow:'hidden',marginTop:3 }}>
                      <div style={{ height:'100%',background:'#22C55E',borderRadius:99,width:`${checklists.length?Math.round(checklists.filter(c=>c.concluido).length/checklists.length*100):0}%`,transition:'width .3s' }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding:'4px 0' }}>
                {historico.length === 0
                  ? <div style={{ padding:'16px',textAlign:'center',color:'#94A3B8',fontSize:11 }}>Sem histórico</div>
                  : historico.map(h=>(
                    <div key={h.id} style={{ padding:'6px 14px',borderBottom:'1px solid #F8FAFC' }}>
                      <div style={{ fontSize:11,color:'#334155' }}>{h.acao}</div>
                      <div style={{ fontSize:9,color:'#94A3B8',marginTop:2 }}>
                        {h.usuarios?.nome||'—'} · {new Date(h.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Obs */}
          {selectedTask.obs && (
            <div style={{ padding:'10px 14px',borderTop:'1px solid #F1F5F9',fontSize:11,color:'#64748B',fontStyle:'italic' }}>
              {selectedTask.obs}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────────── */}
      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16 }}>
          <div style={{ background:'#fff',borderRadius:16,width:'100%',maxWidth:560,maxHeight:'90vh',display:'flex',flexDirection:'column' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontWeight:700,fontSize:14 }}>{modal.mode==='new'?'Nova tarefa':'Editar tarefa'}</span>
              <button onClick={closeModal} style={{ border:'none',background:'none',cursor:'pointer',fontSize:20,color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:18,overflowY:'auto',flex:1,display:'flex',flexDirection:'column',gap:11 }}>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Título *</label>
                <input value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} style={fi} placeholder="Descreva a tarefa..." />
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:11 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Cliente</label>
                  <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null,banco:null}))} style={fi}>
                    <option value="">— Sem cliente —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Responsável</label>
                  <select value={form.responsavel_id||''} onChange={e=>setForm(f=>({...f,responsavel_id:e.target.value||null}))} style={fi}>
                    <option value="">— Selecionar —</option>
                    {usuarios.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Categoria</label>
                  <select value={form.categoria||''} onChange={e=>setForm(f=>({...f,categoria:e.target.value||null}))} style={fi}>
                    <option value="">— Categoria —</option>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Prazo</label>
                  <input type="date" value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value||null}))} style={fi} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Prioridade</label>
                  <select value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))} style={fi}>
                    <option value="alta">🔴 Alta</option><option value="media">🟡 Média</option><option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Status</label>
                  <select value={form.status||'aberta'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={fi}>
                    <option value="aberta">Aberta</option><option value="andamento">Em andamento</option>
                    <option value="aguardando">Ag. cliente</option><option value="revisao">Em revisão</option>
                    <option value="concluida">Concluída</option><option value="impedimento">Impedimento</option>
                  </select>
                </div>
              </div>
              {showBanco && (
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#1D4ED8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>🏦 Banco a conciliar</label>
                  <select value={form.banco||''} onChange={e=>{ const b=e.target.value; setForm(f=>({...f,banco:b||null})); if(b&&form.titulo===''||form.titulo===undefined) setForm(f=>({...f,titulo:`Conciliar extrato ${b} — ${new Date().toLocaleString('pt-BR',{month:'long',year:'numeric'})}`})) }} style={fi}>
                    <option value="">— Selecione o banco —</option>
                    {clientBancos.length>0 && <optgroup label="Bancos do cliente">{clientBancos.map(b=><option key={b} value={b}>{b}</option>)}</optgroup>}
                    <optgroup label="Todos os bancos">{BANCOS.map(b=><option key={b} value={b}>{b}</option>)}</optgroup>
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#94A3B8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em' }}>Observações</label>
                <textarea value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={{ ...fi,height:65,resize:'vertical' }} />
              </div>
            </div>
            <div style={{ padding:'11px 18px',borderTop:'1px solid #F1F5F9',display:'flex',justifyContent:'flex-end',gap:8 }}>
              <Btn onClick={closeModal}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={createTask.isPending||updateTask.isPending}>
                {createTask.isPending||updateTask.isPending?'Salvando…':'Salvar'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
