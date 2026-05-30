import { useState } from 'react'
import { useClients } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader } from '../components/ui'
import { useAuthStore } from '../store/authStore'

const CATEGORIAS = [
  { id:'banco',    icon:'🏦', label:'Banco',       color:'#1D4ED8', bg:'#EFF6FF' },
  { id:'erp',      icon:'💻', label:'ERP / Sistema', color:'#7C3AED', bg:'#F5F3FF' },
  { id:'governo',  icon:'🏛', label:'Governo',     color:'#065F46', bg:'#ECFDF5' },
  { id:'email',    icon:'📧', label:'E-mail',      color:'#B45309', bg:'#FFFBEB' },
  { id:'outro',    icon:'🔑', label:'Outro',       color:'#374151', bg:'#F9FAFB' },
]

function getCat(id) { return CATEGORIAS.find(c=>c.id===id) || CATEGORIAS[4] }

function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #E2E8F0', background: copied?'#F0FDF4':'#fff', color: copied?'#15803D':'#475569', cursor:'pointer', fontSize:10, fontWeight:600, transition:'all .15s' }}>
      {copied ? '✓ Copiado' : `📋 ${label}`}
    </button>
  )
}

export default function CofrePage() {
  const { data: clients = [] } = useClients()
  const { temPermissao, profile } = useAuthStore()
  const canSee = temPermissao('ver_senhas')
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [filterCl, setFilterCl] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [revealed, setRevealed] = useState({})
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})

  const { data: acessos = [], isLoading } = useQuery({
    queryKey: ['acessos_cofre', filterCl],
    queryFn: async () => {
      let q = supabase.from('acessos').select('*, clientes(razao_social, fantasia)').order('sistema')
      if (filterCl) q = q.eq('cliente_id', filterCl)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })

  const saveAcesso = useMutation({
    mutationFn: async (dados) => {
      if (dados.id) {
        const { id, ...rest } = dados
        const { data, error } = await supabase.from('acessos').update(rest).eq('id', id).select().single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase.from('acessos').insert(dados).select().single()
        if (error) throw error
        return data
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['acessos_cofre'] }); setModal(null); setForm({}) }
  })

  const deleteAcesso = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('acessos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acessos_cofre'] })
  })

  const filtered = acessos.filter(a => {
    const q = search.toLowerCase()
    return (!q || a.sistema?.toLowerCase().includes(q) || a.login?.toLowerCase().includes(q) || a.clientes?.razao_social?.toLowerCase().includes(q)) &&
      (!filterCat || a.categoria === filterCat)
  })

  // Agrupar por cliente
  const porCliente = {}
  filtered.forEach(a => {
    const k = a.cliente_id || '__sem__'
    if (!porCliente[k]) {
      const cl = clients.find(c=>c.id===a.cliente_id)
      porCliente[k] = { nome: cl ? (cl.fantasia||cl.razao_social) : 'Sem cliente', items: [] }
    }
    porCliente[k].items.push(a)
  })

  function openNew() { setForm({ categoria:'outro' }); setModal({ mode:'new' }) }
  function openEdit(a) { setForm({...a}); setModal({ mode:'edit', id:a.id }) }

  async function save() {
    if (!form.sistema?.trim()) return alert('Nome do sistema obrigatório')
    if (!form.cliente_id) return alert('Selecione um cliente')
    await saveAcesso.mutateAsync(modal.mode==='edit' ? { id:modal.id, ...form } : form)
  }

  const fi = { width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff', color:'#0F172A', outline:'none' }

  if (isLoading) return <Loader />

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar sistema, login ou cliente..."
            style={{ ...fi, paddingLeft:12 }} />
        </div>
        <select value={filterCl} onChange={e=>setFilterCl(e.target.value)} style={{ ...fi, width:180 }}>
          <option value="">Todos os clientes</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ ...fi, width:140 }}>
          <option value="">Todas categorias</option>
          {CATEGORIAS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <div style={{ flex:1 }} />
        <div style={{ fontSize:11, padding:'5px 12px', borderRadius:99, background: canSee?'#F0FDF4':'#FEF2F2', color: canSee?'#166534':'#991B1B', fontWeight:600, border:`1px solid ${canSee?'#BBF7D0':'#FECDD3'}` }}>
          {canSee ? '🔓 Senhas visíveis' : '🔒 Sem permissão'}
        </div>
        {canSee && (
          <button onClick={openNew} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            + Novo acesso
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
        {CATEGORIAS.map(cat => {
          const cnt = acessos.filter(a=>a.categoria===cat.id).length
          return (
            <div key={cat.id} onClick={()=>setFilterCat(filterCat===cat.id?'':cat.id)}
              style={{ padding:'10px 12px', borderRadius:10, background: filterCat===cat.id?cat.bg:'#F8FAFC', border:`1px solid ${filterCat===cat.id?cat.color:'#E2E8F0'}`, cursor:'pointer', textAlign:'center', transition:'all .15s' }}>
              <div style={{ fontSize:18, marginBottom:3 }}>{cat.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color: filterCat===cat.id?cat.color:'#0F172A' }}>{cnt}</div>
              <div style={{ fontSize:9, color:'#94A3B8', fontWeight:600 }}>{cat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Lista agrupada por cliente */}
      {Object.keys(porCliente).length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', background:'#fff', borderRadius:12, border:'1px solid #F1F5F9' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#94A3B8' }}>Nenhum acesso encontrado</div>
          {canSee && <button onClick={openNew} style={{ marginTop:16, padding:'8px 16px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>+ Adicionar primeiro acesso</button>}
        </div>
      ) : (
        Object.entries(porCliente).map(([clienteId, grp]) => (
          <div key={clienteId} style={{ marginBottom:16, background:'#fff', borderRadius:12, border:'1px solid #F1F5F9', overflow:'hidden' }}>
            {/* Header do grupo */}
            <div style={{ padding:'10px 16px', background:'#F8FAFC', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14 }}>🏢</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{grp.nome}</span>
              <span style={{ fontSize:10, background:'#E2E8F0', color:'#64748B', padding:'1px 6px', borderRadius:99, fontWeight:600 }}>{grp.items.length}</span>
            </div>

            {/* Itens */}
            {grp.items.map(ac => {
              const cat = getCat(ac.categoria)
              const isRev = revealed[ac.id]
              return (
                <div key={ac.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #F8FAFC' }}>
                  {/* Ícone categoria */}
                  <div style={{ width:36, height:36, borderRadius:8, background:cat.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {cat.icon}
                  </div>

                  {/* Info principal */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{ac.sistema}</span>
                      <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:cat.bg, color:cat.color, fontWeight:700 }}>{cat.label}</span>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                      {ac.login && (
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontSize:11, color:'#64748B' }}>👤 {ac.login}</span>
                          <CopyBtn text={ac.login} label="login" />
                        </div>
                      )}
                      {ac.url && (
                        <a href={ac.url.startsWith('http')?ac.url:'https://'+ac.url} target="_blank" rel="noreferrer"
                          style={{ fontSize:11, color:'#6366F1', textDecoration:'none', display:'flex', alignItems:'center', gap:3 }}>
                          🔗 {ac.url}
                        </a>
                      )}
                      {ac.obs && <span style={{ fontSize:10, color:'#94A3B8', fontStyle:'italic' }}>{ac.obs}</span>}
                    </div>
                    {ac.atualizado_em && (
                      <div style={{ fontSize:9, color:'#CBD5E1', marginTop:3 }}>
                        Atualizado em {new Date(ac.atualizado_em).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Senha */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    {canSee && ac.senha_enc ? (
                      <div>
                        <div style={{ fontFamily:'monospace', fontSize:12, color:'#0F172A', marginBottom:4, minWidth:120, textAlign:'right' }}>
                          {isRev ? ac.senha_enc : '••••••••'}
                        </div>
                        <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                          <button onClick={()=>setRevealed(p=>({...p,[ac.id]:!p[ac.id]}))}
                            style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#475569', cursor:'pointer', fontSize:10, fontWeight:600 }}>
                            {isRev ? '🙈 Ocultar' : '👁 Revelar'}
                          </button>
                          {isRev && <CopyBtn text={ac.senha_enc} label="senha" />}
                        </div>
                      </div>
                    ) : !canSee && ac.senha_enc ? (
                      <span style={{ fontSize:10, color:'#CBD5E1', fontFamily:'monospace' }}>••••••••</span>
                    ) : (
                      <span style={{ fontSize:10, color:'#CBD5E1' }}>sem senha</span>
                    )}
                  </div>

                  {/* Ações */}
                  {canSee && (
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button onClick={()=>openEdit(ac)} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:11 }}>✏</button>
                      <button onClick={()=>{ if(confirm('Excluir acesso?')) deleteAcesso.mutate(ac.id) }}
                        style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:11 }}>🗑</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}

      {/* Modal novo/editar acesso */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:500, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 50px rgba(0,0,0,.15)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontWeight:800, fontSize:15, color:'#0F172A' }}>🔐 {modal.mode==='new'?'Novo acesso':'Editar acesso'}</span>
              <button onClick={()=>{ setModal(null); setForm({}) }} style={{ border:'none', background:'none', cursor:'pointer', fontSize:22, color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:'16px 20px', overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Sistema / Nome *</label>
                  <input value={form.sistema||''} onChange={e=>setForm(f=>({...f,sistema:e.target.value}))} style={fi} placeholder="Ex: Banco do Brasil, Omie, SEFAZ..." autoFocus />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cliente *</label>
                  <select value={form.cliente_id||''} onChange={e=>setForm(f=>({...f,cliente_id:e.target.value||null}))} style={fi}>
                    <option value="">— Selecionar —</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.fantasia||c.razao_social}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Categoria</label>
                  <select value={form.categoria||'outro'} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))} style={fi}>
                    {CATEGORIAS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Login / Usuário</label>
                  <input value={form.login||''} onChange={e=>setForm(f=>({...f,login:e.target.value}))} style={fi} placeholder="usuario@email.com ou CPF/CNPJ" />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#6366F1', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>🔑 Senha</label>
                  <input type="text" value={form.senha_enc||''} onChange={e=>setForm(f=>({...f,senha_enc:e.target.value}))} style={fi} placeholder="Senha ou token de acesso" />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>URL / Endereço</label>
                  <input value={form.url||''} onChange={e=>setForm(f=>({...f,url:e.target.value}))} style={fi} placeholder="https://..." />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#94A3B8', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Observações</label>
                  <textarea value={form.obs||''} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} style={{ ...fi, height:60, resize:'vertical' }} placeholder="Informações adicionais, token de acesso, etc..." />
                </div>
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={()=>{ setModal(null); setForm({}) }} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:12, fontWeight:600 }}>Cancelar</button>
              <button onClick={save} disabled={saveAcesso.isPending} style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#6366F1', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                {saveAcesso.isPending ? 'Salvando...' : 'Salvar acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
