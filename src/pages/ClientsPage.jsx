import { useState } from 'react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useData'
import { Card, CardHeader, Badge, Btn, Loader, EmptyState, Input, fmt, fmtR } from '../components/ui'
import { useAuthStore } from '../store/authStore'

const ETAPA_COLOR = { comercial:'purple', pre_ob:'yellow', onboarding:'blue', implantacao:'orange', operacional:'green', estrategico:'cyan', acompanhamento:'gray' }
const ETAPA_LABEL = { comercial:'Comercial', pre_ob:'Pré-Onb.', onboarding:'Onboarding', implantacao:'Implantação', operacional:'Operacional', estrategico:'Estratégico', acompanhamento:'Acompanham.' }
const STATUS_COLOR = { ativo:'green', onboarding:'blue', implantacao:'orange', inativo:'gray', pausado:'yellow' }

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const { temPermissao } = useAuthStore()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(null) // null | { mode:'new'|'edit', data }
  const [form, setForm] = useState({})

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.razao_social?.toLowerCase().includes(q) || c.fantasia?.toLowerCase().includes(q) || c.cnpj?.includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  function openNew() {
    setForm({ status:'ativo', etapa:'operacional', prioridade:'media' })
    setModal({ mode:'new' })
  }
  function openEdit(cl) {
    setForm({ ...cl })
    setModal({ mode:'edit', id: cl.id })
  }
  function close() { setModal(null); setForm({}) }

  async function save() {
    if (!form.razao_social) return alert('Razão social é obrigatória')
    if (modal.mode === 'new') {
      await createClient.mutateAsync(form)
    } else {
      await updateClient.mutateAsync({ id: modal.id, ...form })
    }
    close()
  }

  async function del(id) {
    if (!confirm('Excluir cliente permanentemente?')) return
    await deleteClient.mutateAsync(id)
  }

  if (isLoading) return <Loader />

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Input value={search} onChange={setSearch} placeholder="Buscar cliente..." style={{ width:220 }} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="onboarding">Onboarding</option>
          <option value="implantacao">Implantação</option>
          <option value="inativo">Inativo</option>
        </select>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:'#94A3B8' }}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
        <Btn variant="primary" onClick={openNew}>+ Novo cliente</Btn>
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0
          ? <EmptyState icon="🏢" title="Nenhum cliente encontrado" sub="Crie o primeiro cliente para começar" action={<Btn variant="primary" onClick={openNew}>+ Novo cliente</Btn>} />
          : <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #F1F5F9' }}>
                  {['Cliente','CNPJ','Etapa','Status','MRR','Responsável','Início','Ações'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(cl => (
                  <tr key={cl.id} style={{ borderBottom:'1px solid #F8FAFC' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:12, color:'#0F172A' }}>{cl.razao_social}</div>
                      {cl.fantasia && <div style={{ fontSize:10, color:'#94A3B8' }}>{cl.fantasia}</div>}
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'#64748B', fontFamily:'monospace' }}>{cl.cnpj || '—'}</td>
                    <td style={{ padding:'10px 14px' }}><Badge label={ETAPA_LABEL[cl.etapa]||cl.etapa} color={ETAPA_COLOR[cl.etapa]||'gray'} /></td>
                    <td style={{ padding:'10px 14px' }}><Badge label={cl.status} color={STATUS_COLOR[cl.status]||'gray'} /></td>
                    <td style={{ padding:'10px 14px', fontSize:12, fontWeight:600, color:'#15803D', fontFamily:'monospace' }}>{fmtR(cl.valor_mrr)}</td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'#64748B' }}>{cl.usuarios?.nome || '—'}</td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'#64748B' }}>{fmt(cl.inicio_contrato)}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Btn small onClick={() => openEdit(cl)}>Editar</Btn>
                        {temPermissao('delete_client') && <Btn small variant="danger" onClick={() => del(cl.id)}>Del</Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Card>

      {/* Modal */}
      {modal && (
        <Modal title={modal.mode === 'new' ? 'Novo cliente' : 'Editar cliente'} onClose={close} onSave={save} loading={createClient.isPending || updateClient.isPending}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <FormField label="Razão social *" value={form.razao_social||''} onChange={v=>setForm(f=>({...f,razao_social:v}))} />
            <FormField label="Nome fantasia" value={form.fantasia||''} onChange={v=>setForm(f=>({...f,fantasia:v}))} />
            <FormField label="CNPJ" value={form.cnpj||''} onChange={v=>setForm(f=>({...f,cnpj:v}))} />
            <FormField label="Segmento" value={form.segmento||''} onChange={v=>setForm(f=>({...f,segmento:v}))} />
            <FormField label="Contato" value={form.contato||''} onChange={v=>setForm(f=>({...f,contato:v}))} />
            <FormField label="WhatsApp" value={form.whatsapp||''} onChange={v=>setForm(f=>({...f,whatsapp:v}))} />
            <FormField label="E-mail" value={form.email||''} onChange={v=>setForm(f=>({...f,email:v}))} />
            <FormField label="MRR (R$)" value={form.valor_mrr||''} onChange={v=>setForm(f=>({...f,valor_mrr:v}))} type="number" />
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Etapa</label>
              <select value={form.etapa||'operacional'} onChange={e=>setForm(f=>({...f,etapa:e.target.value}))}
                style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                {Object.entries(ETAPA_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Status</label>
              <select value={form.status||'ativo'} onChange={e=>setForm(f=>({...f,status:e.target.value}))}
                style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff' }}>
                <option value="ativo">Ativo</option>
                <option value="onboarding">Onboarding</option>
                <option value="implantacao">Implantação</option>
                <option value="inativo">Inativo</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            <FormField label="Início do contrato" value={form.inicio_contrato||''} onChange={v=>setForm(f=>({...f,inicio_contrato:v}))} type="date" />
            <FormField label="Vencimento (dia do mês)" value={form.vencimento_dia||''} onChange={v=>setForm(f=>({...f,vencimento_dia:v}))} type="number" />
          </div>
          <div style={{ marginTop:12 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Observações</label>
            <textarea value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))}
              placeholder="Informações adicionais sobre o cliente..."
              style={{ width:'100%', height:70, padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', resize:'vertical' }} />
          </div>
        </Modal>
      )}
    </div>
  )
}

function FormField({ label, value, onChange, type='text' }) {
  return (
    <div>
      <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff' }}
        onFocus={e=>e.target.style.borderColor='#6366F1'}
        onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
    </div>
  )
}

function Modal({ title, children, onClose, onSave, loading }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:640, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
          <span style={{ fontWeight:700, fontSize:15, color:'#0F172A' }}>{title}</span>
          <button onClick={onClose} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'#94A3B8' }}>×</button>
        </div>
        <div style={{ padding:20, overflowY:'auto', flex:1 }}>{children}</div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={onSave} disabled={loading}>{loading ? 'Salvando…' : 'Salvar'}</Btn>
        </div>
      </div>
    </div>
  )
}
