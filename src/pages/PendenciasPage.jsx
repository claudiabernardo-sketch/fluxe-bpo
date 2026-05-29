import { useState } from 'react'
import { usePendencias, useCreatePendencia, useUpdatePendencia, useClients } from '../hooks/useData'
import { Card, Btn, Loader, EmptyState, Badge, fmt } from '../components/ui'

export default function PendenciasPage() {
  const { data: pends = [], isLoading } = usePendencias()
  const { data: clients = [] } = useClients()
  const create = useCreatePendencia()
  const update = useUpdatePendencia()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})

  if (isLoading) return <Loader />

  async function save() {
    if (!form.descricao) return
    await create.mutateAsync({ descricao:form.descricao, cliente_id:form.cliente_id||null, prazo_cobranca:form.prazo||null, prioridade:form.prioridade||'media', obs:form.obs||'' })
    setModal(false); setForm({})
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <Btn variant="primary" onClick={()=>{ setForm({ prioridade:'media' }); setModal(true) }}>+ Nova pendência</Btn>
      </div>
      <Card>
        {pends.length === 0
          ? <EmptyState icon="✅" title="Sem pendências abertas" sub="Todas as pendências foram resolvidas" />
          : pends.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{p.descricao}</div>
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>
                  {p.clientes?.razao_social||'—'} · prazo {fmt(p.prazo_cobranca)}
                </div>
              </div>
              <Badge label={p.prioridade} color={p.prioridade==='alta'?'red':p.prioridade==='media'?'yellow':'green'} />
              <Badge label={p.status} color={p.status==='resolvida'?'green':'blue'} />
              {p.status === 'aberta' && (
                <Btn small variant="success" onClick={() => update.mutate({ id:p.id, status:'resolvida' })}>✓ Resolver</Btn>
              )}
            </div>
          ))
        }
      </Card>
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, width:480, padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Nova pendência</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <input placeholder="Descrição *" value={form.descricao||''} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))}
                style={{ padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit' }} />
              <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null}))}
                style={{ padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                <option value="">— Selecionar cliente —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
              </select>
              <input type="date" placeholder="Prazo" value={form.prazo||''} onChange={e=>setForm(f=>({...f,prazo:e.target.value}))}
                style={{ padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit' }} />
              <select value={form.prioridade||'media'} onChange={e=>setForm(f=>({...f,prioridade:e.target.value}))}
                style={{ padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <Btn onClick={()=>setModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save} disabled={create.isPending}>Salvar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
