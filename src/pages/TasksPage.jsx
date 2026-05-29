import { useState } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useClients, useUsuarios } from '../hooks/useData'
import { Card, CardHeader, Badge, Btn, Loader, EmptyState, StatusBadge, PrioBadge, fmt, isVencida } from '../components/ui'
import { useTimerStore } from '../components/layout/TimerBar'

const COLS = [
  { id:'aberta',    label:'Abertas',      color:'#3B82F6' },
  { id:'andamento', label:'Em andamento', color:'#F59E0B' },
  { id:'concluida', label:'Concluídas',   color:'#22C55E' },
]

export default function TasksPage() {
  const { data: tasks = [],   isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: usuarios = [] } = useUsuarios()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const startTimer = useTimerStore(s => s.start)

  const [view, setView] = useState('list') // list | kanban
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase()
    const ms = !q || t.titulo?.toLowerCase().includes(q)
    const mst = !filterStatus || t.status === filterStatus
    return ms && mst
  })

  function openNew() {
    setForm({ status:'aberta', prioridade:'media' })
    setModal({ mode:'new' })
  }
  function openEdit(t) { setForm({...t}); setModal({ mode:'edit', id:t.id }) }
  function close() { setModal(null); setForm({}) }

  async function save() {
    if (!form.titulo) return alert('Título obrigatório')
    const payload = {
      titulo: form.titulo, categoria: form.categoria||null, prioridade: form.prioridade||'media',
      status: form.status||'aberta', prazo: form.prazo||null, obs: form.obs||null,
      cliente_id: form.cliente_id||null, responsavel_id: form.responsavel_id||null,
    }
    if (modal.mode === 'new') await createTask.mutateAsync(payload)
    else await updateTask.mutateAsync({ id: modal.id, ...payload })
    close()
  }

  async function quickStatus(id, status) {
    await updateTask.mutateAsync({ id, status })
  }

  if (isLoading) return <Loader />

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tarefa..."
          style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, width:200 }} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
          <option value="">Todos os status</option>
          <option value="aberta">Aberta</option>
          <option value="andamento">Em andamento</option>
          <option value="aguardando">Ag. cliente</option>
          <option value="concluida">Concluída</option>
          <option value="impedimento">Impedimento</option>
        </select>
        <div style={{ display:'flex', border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden' }}>
          {['list','kanban'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'6px 12px', border:'none', cursor:'pointer', fontSize:11, fontWeight:600,
                background: view===v ? '#6366F1' : '#fff', color: view===v ? '#fff' : '#64748B' }}>
              {v === 'list' ? '☰ Lista' : '⬛ Kanban'}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:'#94A3B8' }}>{filtered.length} tarefa{filtered.length!==1?'s':''}</span>
        <Btn variant="primary" onClick={openNew}>+ Nova tarefa</Btn>
      </div>

      {view === 'list' ? (
        <Card>
          {filtered.length === 0
            ? <EmptyState icon="✅" title="Nenhuma tarefa" sub="Crie tarefas para organizar a operação" action={<Btn variant="primary" onClick={openNew}>+ Nova tarefa</Btn>} />
            : filtered.map(t => {
              const venc = isVencida(t.prazo, t.status)
              const cl = t.clientes
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
                  borderBottom:'1px solid #F8FAFC', background: venc ? '#FFFBEB' : '' }}
                  onMouseEnter={e=>e.currentTarget.style.background=venc?'#FEF3C7':'#F8FAFC'}
                  onMouseLeave={e=>e.currentTarget.style.background=venc?'#FFFBEB':''}>
                  {/* Status toggle */}
                  <button onClick={() => quickStatus(t.id, t.status==='concluida'?'aberta':'concluida')}
                    style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${t.status==='concluida'?'#22C55E':'#CBD5E1'}`,
                      background: t.status==='concluida'?'#22C55E':'transparent', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {t.status==='concluida' && <span style={{ color:'#fff', fontSize:9, lineHeight:1 }}>✓</span>}
                  </button>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color: t.status==='concluida'?'#94A3B8':'#0F172A',
                      textDecoration: t.status==='concluida'?'line-through':'none',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.titulo}
                    </div>
                    <div style={{ fontSize:10, color:'#94A3B8', marginTop:2, display:'flex', gap:8 }}>
                      {cl && <span>🏢 {cl.fantasia||cl.razao_social}</span>}
                      {t.categoria && <span>📂 {t.categoria}</span>}
                      {t.prazo && <span style={{ color: venc?'#991B1B':'' }}>📅 {fmt(t.prazo)}{venc?' ⚠':''}</span>}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                    <PrioBadge v={t.prioridade} />
                    <StatusBadge v={t.status} />
                    <Btn small onClick={() => {
                      const cl = clients.find(c=>c.id===t.cliente_id)
                      startTimer(t.id, t.titulo, t.cliente_id, cl?.fantasia||cl?.razao_social||'')
                    }}>▶</Btn>
                    <Btn small onClick={() => openEdit(t)}>✎</Btn>
                    <Btn small variant="danger" onClick={() => { if(confirm('Excluir?')) deleteTask.mutate(t.id) }}>×</Btn>
                  </div>
                </div>
              )
            })
          }
        </Card>
      ) : (
        /* Kanban */
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {COLS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.id)
            return (
              <div key={col.id} style={{ background:'#F8FAFC', borderRadius:12, border:'1px solid #E2E8F0' }}>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:col.color }} />
                  <span style={{ fontWeight:700, fontSize:12, color:'#0F172A' }}>{col.label}</span>
                  <span style={{ marginLeft:'auto', fontSize:10, background:'#E2E8F0', color:'#475569', padding:'1px 7px', borderRadius:99 }}>{colTasks.length}</span>
                </div>
                <div style={{ padding:8, display:'flex', flexDirection:'column', gap:8, minHeight:100 }}>
                  {colTasks.map(t => (
                    <div key={t.id} style={{ background:'#fff', borderRadius:10, padding:'10px 12px', border:'1px solid #E2E8F0', cursor:'pointer' }}
                      onClick={() => openEdit(t)}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', marginBottom:4 }}>{t.titulo}</div>
                      {t.clientes && <div style={{ fontSize:10, color:'#94A3B8' }}>{t.clientes.fantasia||t.clientes.razao_social}</div>}
                      <div style={{ display:'flex', gap:4, marginTop:6, alignItems:'center' }}>
                        <PrioBadge v={t.prioridade} />
                        {t.prazo && <span style={{ fontSize:9, color: isVencida(t.prazo,t.status)?'#991B1B':'#94A3B8', marginLeft:'auto' }}>{fmt(t.prazo)}</span>}
                      </div>
                    </div>
                  ))}
                  <button onClick={openNew} style={{ border:'1px dashed #CBD5E1', background:'transparent', borderRadius:10, padding:'8px', color:'#94A3B8', cursor:'pointer', fontSize:11 }}>
                    + Adicionar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontWeight:700, fontSize:15 }}>{modal.mode==='new'?'Nova tarefa':'Editar tarefa'}</span>
              <button onClick={close} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:20, overflowY:'auto', flex:1, display:'grid', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Título *</label>
                <input value={form.titulo||''} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Descreva a tarefa..."
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cliente</label>
                  <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null}))}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                    <option value="">— Sem cliente —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Responsável</label>
                  <select value={form.responsavel_id||''} onChange={e=>setForm(f=>({...f,responsavel_id:e.target.value||null}))}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                    <option value="">— Selecionar —</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Categoria</label>
                  <select value={form.categoria||''} onChange={e=>setForm(f=>({...f,categoria:e.target.value||null}))}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                    <option value="">— Categoria —</option>
                    {['Contas a Pagar','Contas a Receber','Conciliação Bancária','Emissão de NF','Emissão de Boletos','Cobrança / Inadimplência','Fluxo de Caixa','Pagamentos','DRE / Relatórios','Implantação','Onboarding','Estratégico'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Prazo</label>
                  <input type="date" value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value||null}))}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Prioridade</label>
                  <select value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                    <option value="alta">🔴 Alta</option>
                    <option value="media">🟡 Média</option>
                    <option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Status</label>
                  <select value={form.status||'aberta'} onChange={e=>setForm(f=>({...f,status:e.target.value}))}
                    style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                    <option value="aberta">Aberta</option>
                    <option value="andamento">Em andamento</option>
                    <option value="aguardando">Ag. cliente</option>
                    <option value="revisao">Em revisão</option>
                    <option value="concluida">Concluída</option>
                    <option value="impedimento">Impedimento</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Observações</label>
                <textarea value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))}
                  style={{ width:'100%', height:70, padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Btn onClick={close}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={createTask.isPending||updateTask.isPending}>
                {createTask.isPending||updateTask.isPending ? 'Salvando…' : 'Salvar'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
