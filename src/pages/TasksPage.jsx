import { useState, useMemo } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useClients, useUsuarios } from '../hooks/useData'
import { Loader, PrioBadge, StatusBadge, fmt, isVencida, Btn } from '../components/ui'
import { useTimerStore } from '../components/layout/TimerBar'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const CATEGORIAS = ['Contas a Pagar','Contas a Receber','Conciliação Bancária','Emissão de NF','Emissão de Boletos','Cobrança / Inadimplência','Fluxo de Caixa','Pagamentos','DRE / Relatórios','Implantação','Onboarding','Estratégico','Relacionamento']
const BANCOS = ['Banco do Brasil','Santander','Caixa Econômica Federal','Bradesco','Itaú','Nubank','C6 Bank','Banco Inter','Mercado Pago','PagBank','Sicoob','Sicredi','Banco Original','BTG Pactual','Stone','Cora','Asaas','Outro']
const COLS = [{id:'aberta',label:'Abertas',color:'#3B82F6'},{id:'andamento',label:'Em andamento',color:'#F59E0B'},{id:'aguardando',label:'Ag. cliente',color:'#8B5CF6'},{id:'concluida',label:'Concluídas',color:'#22C55E'}]

const STATUS_OPTS = [
  {v:'aberta',l:'Aberta',c:'#3B82F6'},
  {v:'andamento',l:'Em andamento',c:'#F59E0B'},
  {v:'aguardando',l:'Ag. cliente',c:'#8B5CF6'},
  {v:'revisao',l:'Em revisão',c:'#06B6D4'},
  {v:'concluida',l:'Concluída',c:'#22C55E'},
  {v:'impedimento',l:'Impedimento',c:'#EF4444'},
]

const ACT_COLOR = { criou:'#6366F1', editou:'#F59E0B', concluiu:'#22C55E', comentou:'#06B6D4', status:'#8B5CF6', checklist:'#10B981' }

function Avatar({ nome, size=26 }) {
  const ini = (nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const colors = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6']
  const bg = colors[(nome||'').charCodeAt(0)%colors.length]
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:700,color:'#fff',flexShrink:0}}>
      {ini}
    </div>
  )
}

const fi = {width:'100%',padding:'7px 10px',border:'1px solid #E2E8F0',borderRadius:8,fontFamily:'inherit',fontSize:12,color:'#0F172A',background:'#F8FAFC',outline:'none'}

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
  const [fPrio, setFPrio] = useState('')
  const [sfMode, setSfMode] = useState('all')
  const [selId, setSelId] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [newCheck, setNewCheck] = useState('')
  const [newCmt, setNewCmt] = useState('')

  const today = new Date().toISOString().slice(0,10)

  // Checklist
  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists', selId],
    queryFn: async () => {
      if (!selId) return []
      const { data } = await supabase.from('tarefa_checklists').select('*').eq('tarefa_id', selId).order('ordem')
      return data || []
    },
    enabled: !!selId,
  })

  // Histórico
  const { data: historico = [] } = useQuery({
    queryKey: ['historico', selId],
    queryFn: async () => {
      if (!selId) return []
      const { data } = await supabase.from('tarefa_historico').select('*, usuarios(nome)').eq('tarefa_id', selId).order('criado_em', { ascending: false })
      return data || []
    },
    enabled: !!selId,
  })

  const addCheck = useMutation({
    mutationFn: async (texto) => {
      await supabase.from('tarefa_checklists').insert({ tarefa_id: selId, texto, ordem: checklists.length, feito: false })
    },
    onSuccess: () => { qc.invalidateQueries(['checklists', selId]); setNewCheck('') }
  })

  const toggleCheck = useMutation({
    mutationFn: async ({id, feito}) => {
      await supabase.from('tarefa_checklists').update({ feito: !feito }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries(['checklists', selId])
  })

  const deleteCheck = useMutation({
    mutationFn: async (id) => {
      await supabase.from('tarefa_checklists').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries(['checklists', selId])
  })

  const addComment = useMutation({
    mutationFn: async (texto) => {
      await supabase.from('tarefa_historico').insert({
        tarefa_id: selId,
        acao: 'comentou',
        detalhe: texto,
        usuario_id: profile?.id,
      })
    },
    onSuccess: () => { qc.invalidateQueries(['historico', selId]); setNewCmt('') }
  })

  // Filtros
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks.filter(t => {
      if (sfMode === 'hoje' && t.prazo !== today) return false
      if (sfMode === 'atraso' && !isVencida(t.prazo, t.status)) return false
      if (sfMode === 'abertas' && ['concluida','cancelada'].includes(t.status)) return false
      if (q && !t.titulo?.toLowerCase().includes(q)) return false
      if (fStatus && t.status !== fStatus) return false
      if (fClient && t.cliente_id !== fClient) return false
      if (fPrio && t.prioridade !== fPrio) return false
      return true
    })
  }, [tasks, search, fStatus, fClient, fPrio, sfMode, today])

  const selectedTask = tasks.find(t => t.id === selId)
  const checkDone = checklists.filter(c => c.feito).length
  const checkTotal = checklists.length

  function openNew() { setForm({ status:'aberta', prioridade:'media' }); setModal('new') }
  function openEdit(t) { setForm({...t}); setModal('edit') }
  async function save() {
    const d = { ...form }
    if (modal === 'new') await createTask.mutateAsync(d)
    else await updateTask.mutateAsync({ id: form.id, updates: d })
    setModal(null)
  }
  async function del(id) {
    if (!confirm('Excluir tarefa?')) return
    await deleteTask.mutateAsync(id)
    if (selId === id) setSelId(null)
  }
  async function changeStatus(id, status) {
    await updateTask.mutateAsync({ id, updates: { status } })
    qc.invalidateQueries(['tasks'])
  }

  const clientBancos = clients.find(c => c.id === form.cliente_id)?.bancos || []
  const showBanco = ['Conciliação Bancária'].includes(form.categoria)

  if (isLoading) return <Loader />

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* TOOLBAR */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'#fff', borderBottom:'1px solid #F1F5F9', flexShrink:0, flexWrap:'wrap' }}>
        {/* Filtros rápidos */}
        <div style={{ display:'flex', gap:4 }}>
          {[{v:'all',l:'Todas'},{v:'hoje',l:'Hoje'},{v:'atraso',l:'Atraso'},{v:'abertas',l:'Abertas'}].map(s=>(
            <button key={s.v} onClick={()=>setSfMode(s.v)}
              style={{ fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:99,border:'1px solid',cursor:'pointer',fontFamily:'inherit',
                background:sfMode===s.v?'#EEF2FF':'transparent',
                borderColor:sfMode===s.v?'#C7D2FE':'#E2E8F0',
                color:sfMode===s.v?'#6366F1':'#64748B' }}>
              {s.l}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:20, background:'#E2E8F0' }} />

        {/* Busca */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar tarefa..." style={{ ...fi, width:160, height:28, padding:'4px 8px', fontSize:11 }} />

        {/* Filtro status */}
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...fi, width:130, height:28, padding:'4px 7px', fontSize:11 }}>
          <option value="">Todos status</option>
          {STATUS_OPTS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
        </select>

        {/* Filtro cliente */}
        <select value={fClient} onChange={e=>setFClient(e.target.value)} style={{ ...fi, width:140, height:28, padding:'4px 7px', fontSize:11 }}>
          <option value="">Todos clientes</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
        </select>

        {/* Filtro prioridade */}
        <select value={fPrio} onChange={e=>setFPrio(e.target.value)} style={{ ...fi, width:110, height:28, padding:'4px 7px', fontSize:11 }}>
          <option value="">Prioridade</option>
          <option value="alta">🔴 Alta</option>
          <option value="media">🟡 Média</option>
          <option value="baixa">🟢 Baixa</option>
        </select>

        <span style={{ fontSize:10, color:'#94A3B8', marginLeft:4 }}>{filtered.length} tarefas</span>

        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {/* View toggle */}
          <div style={{ display:'flex', gap:2, background:'#F1F5F9', padding:3, borderRadius:8 }}>
            {[{v:'list',i:'fa-solid fa-list'},{v:'kanban',i:'fa-solid fa-table-columns'}].map(vv=>(
              <button key={vv.v} onClick={()=>setView(vv.v)}
                style={{ width:26,height:26,border:'none',borderRadius:6,cursor:'pointer',fontSize:11,
                  background:view===vv.v?'#fff':'transparent',
                  color:view===vv.v?'#6366F1':'#94A3B8',
                  boxShadow:view===vv.v?'0 1px 3px rgba(0,0,0,.1)':'none' }}>
                <i className={vv.i}></i>
              </button>
            ))}
          </div>
          <button onClick={openNew}
            style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit' }}>
            <i className="fa-solid fa-plus"></i> Nova tarefa
          </button>
        </div>
      </div>

      {/* CONTENT — 3 colunas */}
      <div className="three" style={{ flex:1, overflow:'hidden' }}>

        {/* COL-L: Lista */}
        <div className="col-l" style={{ width:300 }}>
          <div className="tl">
            {filtered.length === 0 ? (
              <div style={{ padding:24, textAlign:'center', color:'#94A3B8', fontSize:12 }}>
                <div style={{ fontSize:28, marginBottom:8, opacity:.3 }}>📋</div>
                Nenhuma tarefa encontrada
              </div>
            ) : (
              view === 'list' ? filtered.map(t => {
                const venc = isVencida(t.prazo, t.status)
                const cl = clients.find(c => c.id === t.cliente_id)
                const active = selId === t.id
                return (
                  <div key={t.id} className={`ti${active?' on':''}`} onClick={()=>setSelId(t.id===selId?null:t.id)}>
                    <div className="ti-tt" style={{ color: venc?'#B91C1C':'' }}>{t.titulo}</div>
                    {cl && <div className="ti-cl">🏢 {cl.fantasia||cl.razao_social}</div>}
                    <div className="ti-bot">
                      <PrioBadge v={t.prioridade} />
                      {t.prazo && <div className={`ti-due${venc?' v':''}`}>📅 {fmt(t.prazo)}</div>}
                    </div>
                  </div>
                )
              }) : (
                // KANBAN
                <div style={{ padding:8 }}>
                  {COLS.map(col => {
                    const colTasks = filtered.filter(t => t.status === col.id)
                    return (
                      <div key={col.id} style={{ marginBottom:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, padding:'4px 4px' }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:col.color }} />
                          <span style={{ fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em' }}>{col.label}</span>
                          <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:99, background:'#F1F5F9', color:'#64748B' }}>{colTasks.length}</span>
                        </div>
                        {colTasks.map(t => {
                          const cl = clients.find(c => c.id === t.cliente_id)
                          const active = selId === t.id
                          return (
                            <div key={t.id} onClick={()=>setSelId(t.id===selId?null:t.id)}
                              style={{ background:active?'#EEF2FF':'#fff', border:`1px solid ${active?'#C7D2FE':'#E2E8F0'}`, borderRadius:8, padding:'8px 9px', marginBottom:5, cursor:'pointer', borderLeft:`3px solid ${col.color}` }}>
                              <div style={{ fontSize:11, fontWeight:600, color:'#0F172A', marginBottom:3 }}>{t.titulo}</div>
                              {cl && <div style={{ fontSize:9, color:'#94A3B8', marginBottom:3 }}>{cl.fantasia||cl.razao_social}</div>}
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <PrioBadge v={t.prioridade} />
                                {t.prazo && <span style={{ fontSize:9, color: isVencida(t.prazo,t.status)?'#B91C1C':'#94A3B8' }}>{fmt(t.prazo)}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* COL-D: Detalhe */}
        <div className="col-d">
          {!selectedTask ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#94A3B8', gap:8 }}>
              <div style={{ fontSize:36, opacity:.2 }}>📋</div>
              <div style={{ fontSize:12 }}>Selecione uma tarefa</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="dh">
                <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div className="dcat">{selectedTask.categoria || 'Tarefa'}</div>
                    <div className="dtit">{selectedTask.titulo}</div>
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    <button onClick={()=>openEdit(selectedTask)} style={{ width:28,height:28,border:'1px solid #E2E8F0',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:11,color:'#64748B' }} title="Editar">✎</button>
                    <button onClick={()=>del(selectedTask.id)} style={{ width:28,height:28,border:'1px solid #FECDD3',borderRadius:6,background:'#FEF2F2',cursor:'pointer',fontSize:11,color:'#B91C1C' }} title="Excluir">✕</button>
                    <button onClick={()=>setSelId(null)} style={{ width:28,height:28,border:'1px solid #E2E8F0',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:14,color:'#94A3B8',lineHeight:1 }}>×</button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <PrioBadge v={selectedTask.prioridade} />
                  <StatusBadge v={selectedTask.status} />
                  {selectedTask.banco && <span style={{ fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:99,background:'#EFF6FF',color:'#1D4ED8' }}>🏦 {selectedTask.banco}</span>}
                </div>
              </div>

              {/* Toolbar de ações */}
              <div className="tbar">
                <button className="t-btn" onClick={()=>{
                  const cl = clients.find(c=>c.id===selectedTask.cliente_id)
                  startTimer(selectedTask.id, selectedTask.titulo, selectedTask.cliente_id, cl?.fantasia||cl?.razao_social||'')
                }}>▶ Iniciar timer</button>
                <div style={{ display:'flex', gap:4, marginLeft:'auto' }}>
                  {STATUS_OPTS.filter(s=>s.v!==selectedTask.status).slice(0,3).map(s=>(
                    <button key={s.v} onClick={()=>changeStatus(selectedTask.id, s.v)}
                      style={{ fontSize:9,fontWeight:700,padding:'3px 7px',borderRadius:99,border:'none',cursor:'pointer',fontFamily:'inherit',background:s.c+'22',color:s.c }}>
                      → {s.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="dbody">
                {/* Meta */}
                <div className="dsec">
                  <div className="dsh">Informações</div>
                  <div className="mg">
                    {clients.find(c=>c.id===selectedTask.cliente_id) && (
                      <div>
                        <div className="ml">Cliente</div>
                        <div className="mv">🏢 {clients.find(c=>c.id===selectedTask.cliente_id)?.fantasia||clients.find(c=>c.id===selectedTask.cliente_id)?.razao_social}</div>
                      </div>
                    )}
                    {selectedTask.prazo && (
                      <div>
                        <div className="ml">Prazo</div>
                        <div className="mv" style={{ color:isVencida(selectedTask.prazo,selectedTask.status)?'#B91C1C':'' }}>📅 {fmt(selectedTask.prazo)}</div>
                      </div>
                    )}
                    {selectedTask.responsavel_id && (
                      <div>
                        <div className="ml">Responsável</div>
                        <div className="mv" style={{ display:'flex',alignItems:'center',gap:5 }}>
                          <Avatar nome={usuarios.find(u=>u.id===selectedTask.responsavel_id)?.nome} size={18} />
                          {usuarios.find(u=>u.id===selectedTask.responsavel_id)?.nome||'—'}
                        </div>
                      </div>
                    )}
                    {selectedTask.valor > 0 && (
                      <div>
                        <div className="ml">Valor</div>
                        <div className="mv">R$ {Number(selectedTask.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
                      </div>
                    )}
                  </div>
                  {selectedTask.obs && (
                    <div style={{ marginTop:8, fontSize:11, color:'#475569', background:'#F8FAFC', borderRadius:6, padding:'8px 10px', lineHeight:1.5 }}>
                      {selectedTask.obs}
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div className="dsec">
                  <div className="dsh">
                    <span>✅ Checklist {checkTotal > 0 ? `${checkDone}/${checkTotal}` : ''}</span>
                    {checkTotal > 0 && (
                      <span style={{ fontSize:9,color:'#94A3B8' }}>{Math.round(checkDone/checkTotal*100)}%</span>
                    )}
                  </div>
                  {checkTotal > 0 && (
                    <div style={{ height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginBottom:8 }}>
                      <div style={{ height:'100%', background:'#22C55E', borderRadius:99, width:`${Math.round(checkDone/checkTotal*100)}%`, transition:'width .4s' }} />
                    </div>
                  )}
                  {checklists.map(ck => (
                    <div key={ck.id} className="cki">
                      <div className={`ckb${ck.feito?' done':''}`} onClick={()=>toggleCheck.mutate({id:ck.id,feito:ck.feito})} />
                      <span className={`ck-l${ck.feito?' done':''}`}>{ck.texto}</span>
                      <button onClick={()=>deleteCheck.mutate(ck.id)} style={{ border:'none',background:'none',cursor:'pointer',color:'#CBD5E1',fontSize:11,padding:'0 2px',flexShrink:0 }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:5, marginTop:8 }}>
                    <input value={newCheck} onChange={e=>setNewCheck(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&newCheck.trim()) addCheck.mutate(newCheck.trim()) }}
                      placeholder="Adicionar item... (Enter)" style={{ ...fi, flex:1, height:28, padding:'4px 8px', fontSize:11 }} />
                    <button onClick={()=>{ if(newCheck.trim()) addCheck.mutate(newCheck.trim()) }}
                      style={{ width:28,height:28,background:'#6366F1',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
                  </div>
                </div>

                {/* Status rápido */}
                <div className="dsec">
                  <div className="dsh">Alterar status</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {STATUS_OPTS.map(s=>(
                      <button key={s.v} onClick={()=>changeStatus(selectedTask.id,s.v)}
                        style={{ fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:99,border:'none',cursor:'pointer',fontFamily:'inherit',
                          background:selectedTask.status===s.v?s.c:'#F1F5F9',
                          color:selectedTask.status===s.v?'#fff':'#64748B',
                          outline:selectedTask.status===s.v?`2px solid ${s.c}`:'none',
                          outlineOffset:1 }}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* COL-H: Histórico */}
        <div className="col-h">
          <div className="hhd">
            <span>Histórico</span>
            {selId && <button onClick={()=>qc.invalidateQueries(['historico',selId])} style={{ border:'none',background:'none',cursor:'pointer',color:'#94A3B8',fontSize:9 }}>↺ atualizar</button>}
          </div>
          <div className="hbody">
            {!selId ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#94A3B8',opacity:.4,gap:5 }}>
                <div style={{ fontSize:18 }}>🕐</div>
                <span style={{ fontSize:10 }}>Sem histórico</span>
              </div>
            ) : historico.length === 0 ? (
              <div style={{ textAlign:'center', padding:20, color:'#94A3B8', fontSize:11 }}>Nenhuma atividade ainda</div>
            ) : historico.map((h, i) => {
              const cor = ACT_COLOR[h.acao] || '#94A3B8'
              const ini = (h.usuarios?.nome||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
              const dt = new Date(h.criado_em)
              const dtStr = dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) + ' ' + dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
              return (
                <div key={h.id||i} className="hitem">
                  <div className="hdot" style={{ background:cor }}>{ini}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="hact">
                      <span style={{ color:cor, fontWeight:700 }}>{h.usuarios?.nome||'Sistema'}</span>
                      {' '}{h.acao}
                      {h.detalhe && h.acao !== 'comentou' && <span style={{ color:'#64748B' }}> — {h.detalhe}</span>}
                    </div>
                    {h.acao === 'comentou' && h.detalhe && (
                      <div style={{ fontSize:10,color:'#475569',background:'#F8FAFC',borderRadius:5,padding:'4px 7px',marginTop:3,lineHeight:1.4 }}>{h.detalhe}</div>
                    )}
                    <div className="htm">{dtStr}</div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Campo de comentário */}
          <div className="cmt">
            <textarea value={newCmt} onChange={e=>setNewCmt(e.target.value)} placeholder="Comentário..."
              rows={1} style={{ flex:1,padding:'6px 8px',border:'1px solid #E2E8F0',borderRadius:6,fontFamily:'inherit',fontSize:11,color:'#0F172A',resize:'none',outline:'none',maxHeight:56,minHeight:28,lineHeight:1.4 }}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey&&newCmt.trim()){e.preventDefault();addComment.mutate(newCmt.trim())} }} />
            <button onClick={()=>{ if(newCmt.trim()) addComment.mutate(newCmt.trim()) }}
              className="snd" title="Enviar comentário">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL Nova/Editar */}
      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(3px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:14 }}>
          <div style={{ background:'#fff',borderRadius:14,border:'1px solid #E2E8F0',width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 56px rgba(0,0,0,.18)' }}>
            <div style={{ padding:'14px 18px 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
              <div style={{ fontSize:14,fontWeight:700 }}>{modal==='new'?'Nova tarefa':'Editar tarefa'}</div>
              <button onClick={()=>setModal(null)} style={{ width:26,height:26,borderRadius:6,border:'1px solid #E2E8F0',background:'#F8FAFC',cursor:'pointer',fontSize:12,color:'#64748B' }}>✕</button>
            </div>
            <div style={{ padding:'0 18px 12px', display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Título</label>
                <input value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} style={fi} placeholder="Ex: Conciliar extrato Bradesco — junho" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Cliente</label>
                  <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null}))} style={fi}>
                    <option value="">— Selecione —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Categoria</label>
                  <select value={form.categoria||''} onChange={e=>setForm(f=>({...f,categoria:e.target.value||null}))} style={fi}>
                    <option value="">— Selecione —</option>
                    {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {showBanco && (
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#1D4ED8',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>🏦 Banco a conciliar</label>
                  <select value={form.banco||''} onChange={e=>setForm(f=>({...f,banco:e.target.value||null}))} style={fi}>
                    <option value="">— Selecione —</option>
                    {BANCOS.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Prazo</label>
                  <input type="date" value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value||null}))} style={fi} />
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Prioridade</label>
                  <select value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))} style={fi}>
                    <option value="alta">🔴 Alta</option>
                    <option value="media">🟡 Média</option>
                    <option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Status</label>
                  <select value={form.status||'aberta'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={fi}>
                    {STATUS_OPTS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Responsável</label>
                <select value={form.responsavel_id||''} onChange={e=>setForm(f=>({...f,responsavel_id:e.target.value||null}))} style={fi}>
                  <option value="">— Sem responsável —</option>
                  {usuarios.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#374151',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em' }}>Observações</label>
                <textarea value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={{ ...fi,height:65,resize:'vertical' }} />
              </div>
            </div>
            <div style={{ padding:'11px 18px',borderTop:'1px solid #F1F5F9',display:'flex',justifyContent:'flex-end',gap:8 }}>
              <button onClick={()=>setModal(null)} style={{ padding:'7px 14px',borderRadius:8,border:'1px solid #E2E8F0',background:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit',color:'#64748B' }}>Cancelar</button>
              <button onClick={save} disabled={createTask.isPending||updateTask.isPending}
                style={{ padding:'7px 16px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit',opacity:createTask.isPending||updateTask.isPending?.7:1 }}>
                {createTask.isPending||updateTask.isPending?'Salvando…':'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
