import { useState } from 'react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useData'
import { Card, CardHeader, Badge, Btn, Loader, EmptyState, fmt, fmtR } from '../components/ui'
import { useAuthStore } from '../store/authStore'

const ETAPA_COLOR = { comercial:'pu', pre_ob:'yw', onboarding:'bl', implantacao:'or', operacional:'gr', estrategico:'cy', acompanhamento:'gy' }
const ETAPA_LABEL = { comercial:'Comercial', pre_ob:'Pré-Onb.', onboarding:'Onboarding', implantacao:'Implantação', operacional:'Operacional', estrategico:'Estratégico', acompanhamento:'Acompanham.' }
const STATUS_COLOR = { ativo:'gr', onboarding:'bl', implantacao:'or', inativo:'gy', pausado:'yw' }

const BANCOS_LIST = ['Banco do Brasil','Santander','Caixa Econômica Federal','Bradesco','Itaú','Nubank','C6 Bank','Banco Inter','Mercado Pago','PagBank','Sicoob','Sicredi','Banco Original','BTG Pactual','Stone','Cora','Asaas','Outro']
const SOFTWARES = ['Omie','Conta Azul','Meu Dinheiro Web','Nibo','Bom Controle','Bling','Nexaas','Gestão Fácil','Outro']

function fmtCNPJ(v) {
  const n = v.replace(/\D/g, '').slice(0, 14)
  return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1.$2.$3/$4')
    .replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
    .replace(/^(\d{2})(\d{3})$/, '$1.$2')
    .replace(/^(\d{2})$/, '$1')
}

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const { temPermissao } = useAuthStore()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [cnpjError, setCnpjError] = useState('')
  const [selectedBancos, setSelectedBancos] = useState([])
  const [tab, setTab] = useState('dados') // dados | financeiro | bancos

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const ms = !q || c.razao_social?.toLowerCase().includes(q) || c.fantasia?.toLowerCase().includes(q) || c.cnpj?.includes(q)
    const mst = !filterStatus || c.status === filterStatus
    return ms && mst
  })

  function openNew() {
    setForm({ status:'ativo', etapa:'operacional' })
    setSelectedBancos([])
    setTab('dados')
    setModal({ mode:'new' })
    setCnpjError('')
  }

  function openEdit(cl) {
    setForm({ ...cl })
    setSelectedBancos(cl.bancos || [])
    setTab('dados')
    setModal({ mode:'edit', id: cl.id })
    setCnpjError('')
  }

  function close() { setModal(null); setForm({}); setSelectedBancos([]) }

  // Busca CNPJ na BrasilAPI
  async function buscarCNPJ() {
    const cnpj = (form.cnpj || '').replace(/\D/g, '')
    if (cnpj.length !== 14) { setCnpjError('CNPJ deve ter 14 dígitos'); return }
    setCnpjLoading(true)
    setCnpjError('')
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (!res.ok) { setCnpjError('CNPJ não encontrado na Receita Federal'); setCnpjLoading(false); return }
      const data = await res.json()
      setForm(f => ({
        ...f,
        razao_social: data.razao_social || f.razao_social,
        fantasia: data.nome_fantasia || f.fantasia,
        email: data.email || f.email,
        segmento: data.cnae_fiscal_descricao || f.segmento,
        // Endereço
        logradouro: data.logradouro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
      }))
      setCnpjError('')
    } catch (e) {
      setCnpjError('Erro ao consultar CNPJ. Tente novamente.')
    }
    setCnpjLoading(false)
  }

  function toggleBanco(banco) {
    setSelectedBancos(prev =>
      prev.includes(banco) ? prev.filter(b => b !== banco) : [...prev, banco]
    )
  }

  async function save() {
    if (!form.razao_social) { alert('Razão social é obrigatória'); return }
    const payload = { ...form, bancos: selectedBancos }
    if (modal.mode === 'new') {
      await createClient.mutateAsync(payload)
    } else {
      await updateClient.mutateAsync({ id: modal.id, ...payload })
    }
    close()
  }

  if (isLoading) return <Loader />

  const fi = { width:'100%', padding:'7px 10px', border:'1px solid var(--bo)', borderRadius:'var(--r)', fontSize:12, fontFamily:'inherit', background:'var(--sur)', color:'var(--tx)', outline:'none' }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente..."
          className="fi" style={{ width:220 }} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="fi" style={{ width:150 }}>
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="onboarding">Onboarding</option>
          <option value="implantacao">Implantação</option>
          <option value="inativo">Inativo</option>
          <option value="pausado">Pausado</option>
        </select>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:'var(--tx3)' }}>{filtered.length} cliente{filtered.length!==1?'s':''}</span>
        <button className="btn bp bsm" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> Novo cliente
        </button>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0
          ? <EmptyState icon="🏢" title="Nenhum cliente cadastrado" sub="Clique em novo cliente para começar"
              action={<button className="btn bp" onClick={openNew}><i className="fa-solid fa-plus"></i> Novo cliente</button>} />
          : <table className="tbl">
              <thead>
                <tr>
                  {['Cliente','CNPJ','Etapa','Status','MRR','Software','Ações'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--bo)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(cl => (
                  <tr key={cl.id} style={{ borderBottom:'1px solid var(--s2)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--s2)'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:12, color:'var(--tx)' }}>{cl.razao_social}</div>
                      {cl.fantasia && <div style={{ fontSize:10, color:'var(--tx3)' }}>{cl.fantasia}</div>}
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--tx2)', fontFamily:'var(--mo)' }}>{cl.cnpj || '—'}</td>
                    <td style={{ padding:'10px 14px' }}><span className={`b b-${ETAPA_COLOR[cl.etapa]||'gy'}`}>{ETAPA_LABEL[cl.etapa]||cl.etapa}</span></td>
                    <td style={{ padding:'10px 14px' }}><span className={`b b-${STATUS_COLOR[cl.status]||'gy'}`}>{cl.status}</span></td>
                    <td style={{ padding:'10px 14px', fontSize:12, fontWeight:600, color:'var(--grt)', fontFamily:'var(--mo)' }}>{fmtR(cl.valor_mrr)}</td>
                    <td style={{ padding:'10px 14px', fontSize:11, color:'var(--tx2)' }}>{cl.software_erp || '—'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="btn bo bsm" onClick={() => openEdit(cl)}>
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        {temPermissao('delete_client') && (
                          <button className="btn bsm" style={{ background:'var(--rdb)', color:'var(--rdt)', border:'1px solid #FECDD3' }}
                            onClick={() => { if(confirm('Excluir cliente permanentemente?')) deleteClient.mutate(cl.id) }}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'var(--sur)', borderRadius:'var(--rx)', width:'100%', maxWidth:640, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'var(--sh3)' }}>
            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--bo)' }}>
              <span style={{ fontWeight:700, fontSize:15, color:'var(--tx)' }}>
                {modal.mode==='new' ? 'Novo cliente' : 'Editar cliente'}
              </span>
              <button onClick={close} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'var(--tx3)' }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--bo)', padding:'0 18px' }}>
              {[['dados','📋 Dados'],['financeiro','💰 Financeiro'],['bancos','🏦 Bancos']].map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding:'8px 14px', border:'none', background:'transparent', cursor:'pointer', fontSize:11, fontWeight:600,
                    color: tab===id?'var(--br)':'var(--tx3)', borderBottom: tab===id?'2px solid var(--br)':'2px solid transparent', marginBottom:-1 }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div style={{ padding:18, overflowY:'auto', flex:1 }}>

              {/* ABA DADOS */}
              {tab === 'dados' && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {/* CNPJ com busca */}
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>CNPJ</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <input value={form.cnpj||''} onChange={e=>setForm(f=>({...f,cnpj:fmtCNPJ(e.target.value)}))}
                        placeholder="00.000.000/0001-00" className="fi" style={{ flex:1 }} />
                      <button className="btn bp bsm" onClick={buscarCNPJ} disabled={cnpjLoading}
                        style={{ whiteSpace:'nowrap', flexShrink:0 }}>
                        {cnpjLoading
                          ? <><i className="fa-solid fa-spinner spin"></i> Buscando...</>
                          : <><i className="fa-solid fa-magnifying-glass"></i> Buscar na Receita</>
                        }
                      </button>
                    </div>
                    {cnpjError && <div style={{ fontSize:11, color:'var(--rdt)', marginTop:4 }}>{cnpjError}</div>}
                    <div style={{ fontSize:10, color:'var(--tx3)', marginTop:4 }}>
                      Digite o CNPJ e clique em "Buscar na Receita" para preencher automaticamente
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Razão social *</label>
                      <input value={form.razao_social||''} onChange={e=>setForm(f=>({...f,razao_social:e.target.value}))} className="fi" placeholder="Razão Social Ltda" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome fantasia</label>
                      <input value={form.fantasia||''} onChange={e=>setForm(f=>({...f,fantasia:e.target.value}))} className="fi" placeholder="Nome fantasia" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Segmento / atividade</label>
                      <input value={form.segmento||''} onChange={e=>setForm(f=>({...f,segmento:e.target.value}))} className="fi" placeholder="Ex: Comércio varejista" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>E-mail</label>
                      <input type="email" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="fi" placeholder="financeiro@empresa.com.br" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Contato / responsável</label>
                      <input value={form.contato||''} onChange={e=>setForm(f=>({...f,contato:e.target.value}))} className="fi" placeholder="Nome do responsável" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>WhatsApp</label>
                      <input value={form.whatsapp||''} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} className="fi" placeholder="(11) 99999-0000" />
                    </div>
                  </div>

                  {/* Endereço se buscou CNPJ */}
                  {form.municipio && (
                    <div style={{ background:'var(--s2)', borderRadius:'var(--r)', padding:'10px 12px', fontSize:11, color:'var(--tx2)' }}>
                      <i className="fa-solid fa-location-dot" style={{ color:'var(--br)', marginRight:6 }}></i>
                      {form.logradouro && `${form.logradouro}, `}{form.municipio} — {form.uf} · CEP {form.cep}
                    </div>
                  )}
                </div>
              )}

              {/* ABA FINANCEIRO */}
              {tab === 'financeiro' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>MRR (R$/mês)</label>
                    <input type="number" value={form.valor_mrr||''} onChange={e=>setForm(f=>({...f,valor_mrr:e.target.value}))} className="fi" placeholder="0,00" step="0.01" />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Vencimento (dia do mês)</label>
                    <input type="number" value={form.vencimento_dia||''} onChange={e=>setForm(f=>({...f,vencimento_dia:e.target.value}))} className="fi" placeholder="10" min={1} max={28} />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Etapa BPO</label>
                    <select value={form.etapa||'operacional'} onChange={e=>setForm(f=>({...f,etapa:e.target.value}))} className="fi">
                      {Object.entries(ETAPA_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Status</label>
                    <select value={form.status||'ativo'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="fi">
                      <option value="ativo">Ativo</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="implantacao">Implantação</option>
                      <option value="inativo">Inativo</option>
                      <option value="pausado">Pausado</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Software / ERP</label>
                    <select value={form.software_erp||''} onChange={e=>setForm(f=>({...f,software_erp:e.target.value||null}))} className="fi">
                      <option value="">— Selecionar —</option>
                      {SOFTWARES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Início do contrato</label>
                    <input type="date" value={form.inicio_contrato||''} onChange={e=>setForm(f=>({...f,inicio_contrato:e.target.value||null}))} className="fi" />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Escopo dos serviços</label>
                    <textarea value={form.escopo||''} onChange={e=>setForm(f=>({...f,escopo:e.target.value}))}
                      placeholder="Descreva os serviços contratados..."
                      style={{ width:'100%', height:70, padding:'8px 10px', border:'1px solid var(--bo)', borderRadius:'var(--r)', fontSize:12, fontFamily:'inherit', background:'var(--sur)', color:'var(--tx)', resize:'vertical' }} />
                  </div>
                </div>
              )}

              {/* ABA BANCOS */}
              {tab === 'bancos' && (
                <div>
                  <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:14 }}>
                    Selecione os bancos utilizados por este cliente. Eles aparecerão em destaque ao criar tarefas de conciliação bancária.
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {BANCOS_LIST.map(banco => (
                      <label key={banco} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--r)', border:`1px solid ${selectedBancos.includes(banco)?'var(--br)':'var(--bo)'}`, background: selectedBancos.includes(banco)?'var(--brl)':'var(--sur)', cursor:'pointer', transition:'all .15s' }}>
                        <input type="checkbox" checked={selectedBancos.includes(banco)} onChange={() => toggleBanco(banco)}
                          style={{ width:14, height:14, accentColor:'var(--br)', flexShrink:0 }} />
                        <span style={{ fontSize:12, fontWeight: selectedBancos.includes(banco)?600:400, color: selectedBancos.includes(banco)?'var(--br)':'var(--tx)' }}>
                          {banco}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedBancos.length > 0 && (
                    <div style={{ marginTop:12, padding:'8px 12px', background:'var(--brl)', borderRadius:'var(--r)', fontSize:11, color:'var(--br)', fontWeight:600 }}>
                      <i className="fa-solid fa-check-circle" style={{ marginRight:6 }}></i>
                      {selectedBancos.length} banco{selectedBancos.length>1?'s':'s'} selecionado{selectedBancos.length>1?'s':''}:  {selectedBancos.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--bo)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn bo" onClick={close}>Cancelar</button>
              <button className="btn bp" onClick={save} disabled={createClient.isPending||updateClient.isPending}>
                {createClient.isPending||updateClient.isPending ? 'Salvando…' : 'Salvar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
