import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePendencias, useCreatePendencia, useUpdatePendencia, useClients, useTasks } from '../hooks/useData'
import { Card, Btn, Loader, EmptyState, Badge, fmt, isVencida } from '../components/ui'

const fi = { padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff', width:'100%' }

export default function PendenciasPage() {
  const { data: pends = [], isLoading } = usePendencias()
  const { data: clients = [] } = useClients()
  const { data: tarefas = [] } = useTasks()
  const create = useCreatePendencia()
  const update = useUpdatePendencia()
  const nav = useNavigate()
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [showResolvidas, setShowResolvidas] = useState(false)

  if (isLoading) return <Loader />

  const abertas    = pends.filter(p => p.status === 'aberta')
  const resolvidas = pends.filter(p => p.status === 'resolvida')
  // Tudo que está em aberto de verdade, junto num lugar só — não só o que
  // foi cadastrado como "pendência", mas também tarefa normal que já venceu.
  const tarefasAtrasadas = tarefas
    .filter(t => isVencida(t.prazo, t.status))
    .sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''))

  function openNew() { setForm({ prioridade:'media' }); setEditId(null); setModal(true) }
  function openEdit(p) {
    setForm({ descricao:p.descricao, cliente_id:p.cliente_id||'', prazo:p.prazo_cobranca||'', prioridade:p.prioridade||'media', obs:p.obs||'' })
    setEditId(p.id); setModal(true)
  }

  async function save() {
    if (!form.descricao) return
    const payload = { descricao:form.descricao, cliente_id:form.cliente_id||null, prazo_cobranca:form.prazo||null, prioridade:form.prioridade||'media', obs:form.obs||'' }
    if (editId) await update.mutateAsync({ id:editId, ...payload })
    else await create.mutateAsync(payload)
    setModal(false); setForm({}); setEditId(null)
  }

  function PendRow({ p }) {
    const cl = clients.find(c => c.id === p.cliente_id)
    const vencida = p.prazo_cobranca && p.prazo_cobranca < new Date().toISOString().slice(0,10) && p.status === 'aberta'
    return (
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid #F8FAFC', opacity: p.status === 'resolvida' ? 0.6 : 1 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600, color: vencida ? '#991B1B' : '#0F172A' }}>{p.descricao}</div>
          <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>
            {cl?.fantasia || cl?.razao_social || '—'} · prazo {fmt(p.prazo_cobranca)}
            {vencida && <span style={{ color:'#EF4444', fontWeight:700, marginLeft:6 }}>· VENCIDA</span>}
          </div>
          {p.obs && <div style={{ fontSize:10, color:'#64748B', marginTop:2, fontStyle:'italic' }}>"{p.obs}"</div>}
        </div>
        <Badge label={p.prioridade} color={p.prioridade==='alta'?'red':p.prioridade==='media'?'yellow':'green'} />
        <Badge label={p.status==='resolvida'?'resolvida':'aberta'} color={p.status==='resolvida'?'green':'blue'} />
        {p.status === 'aberta' && <>
          <Btn small onClick={() => openEdit(p)}>✏ Editar</Btn>
          <Btn small variant="success" onClick={() => update.mutate({ id:p.id, status:'resolvida' })}>✓ Resolver</Btn>
        </>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <Btn variant="primary" onClick={openNew}>+ Nova pendência</Btn>
      </div>

      {tarefasAtrasadas.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#991B1B', marginBottom:8 }}>🔴 Tarefas atrasadas ({tarefasAtrasadas.length})</div>
          <Card style={{ borderLeft:'3px solid #EF4444' }}>
            {tarefasAtrasadas.map(t => (
              <div key={t.id} onClick={() => nav('/tasks')}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid #F8FAFC', cursor:'pointer' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#991B1B' }}>{t.titulo}</div>
                  <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>
                    {t.clientes?.fantasia || t.clientes?.razao_social || '—'} · venceu {fmt(t.prazo)}
                  </div>
                </div>
                <Badge label="atrasada" color="red" />
              </div>
            ))}
          </Card>
        </div>
      )}

      <div style={{ fontSize:12, fontWeight:700, color:'#B45309', marginBottom:8 }}>🟠 Pendências ({abertas.length})</div>
      <Card style={{ borderLeft:'3px solid #F97316' }}>
        {abertas.length === 0
          ? <EmptyState icon="✅" title="Sem pendências abertas" sub="Todas as pendências foram resolvidas" />
          : abertas.map(p => <PendRow key={p.id} p={p} />)
        }
      </Card>

      {resolvidas.length > 0 && (
        <div style={{ marginTop:14 }}>
          <button onClick={() => setShowResolvidas(v => !v)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#64748B', fontWeight:600, padding:'4px 0' }}>
            {showResolvidas ? '▾' : '▸'} Resolvidas ({resolvidas.length})
          </button>
          {showResolvidas && (
            <Card style={{ marginTop:6 }}>
              {resolvidas.map(p => <PendRow key={p.id} p={p} />)}
            </Card>
          )}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, width:480, padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>{editId ? 'Editar pendência' : 'Nova pendência'}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input placeholder="Descrição *" value={form.descricao||''} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} style={fi} />
              <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null}))} style={fi}>
                <option value="">— Selecionar cliente —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </select>
              <input type="date" value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value}))} style={fi} />
              <select value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))} style={fi}>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>
              <textarea placeholder="Observações (opcional)" value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))}
                rows={2} style={{ ...fi, resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <Btn onClick={()=>{ setModal(false); setEditId(null); setForm({}) }}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={create.isPending || update.isPending}>
                {editId ? 'Salvar alterações' : 'Criar pendência'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
