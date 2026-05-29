import { useState } from 'react'
import { useClients } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, Loader, EmptyState, Btn } from '../components/ui'
import { useAuthStore } from '../store/authStore'

export default function CofrePage() {
  const { data: clients = [] } = useClients()
  const { temPermissao } = useAuthStore()
  const [filterCl, setFilterCl] = useState('')
  const canSee = temPermissao('ver_senhas')

  const { data: acessos = [], isLoading } = useQuery({
    queryKey: ['acessos_all', filterCl],
    queryFn: async () => {
      let q = supabase.from('acessos').select('*, clientes(razao_social, fantasia)').order('sistema')
      if (filterCl) q = q.eq('cliente_id', filterCl)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })

  const [revealed, setRevealed] = useState({})
  function toggleReveal(id) {
    if (!canSee) return
    setRevealed(p => ({ ...p, [id]: !p[id] }))
  }

  const byClient = {}
  acessos.forEach(a => {
    const k = a.cliente_id
    if (!byClient[k]) byClient[k] = { name: a.clientes?.razao_social||'?', items:[] }
    byClient[k].items.push(a)
  })

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <select value={filterCl} onChange={e=>setFilterCl(e.target.value)}
          style={{ padding:'7px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, background:'#fff', width:240 }}>
          <option value="">Todos os clientes</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}
        </select>
        <div style={{ flex:1 }} />
        <div style={{ fontSize:11, padding:'4px 10px', borderRadius:99, background: canSee?'#F0FDF4':'#FEF2F2', color: canSee?'#166534':'#991B1B', fontWeight:600 }}>
          {canSee ? '🔓 Admin — senhas visíveis' : '🔒 Sem permissão para ver senhas'}
        </div>
      </div>

      {isLoading ? <Loader /> : acessos.length === 0 ? (
        <EmptyState icon="🔐" title="Nenhum acesso cadastrado" sub="Adicione acessos na aba do cliente" />
      ) : (
        <Card>
          <CardHeader title={`Cofre Digital — ${acessos.length} acessos`} icon="🛡" />
          {Object.values(byClient).map(grp => (
            <div key={grp.name}>
              <div style={{ padding:'7px 16px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.07em' }}>{grp.name}</span>
              </div>
              {grp.items.map(ac => (
                <div key={ac.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid #F8FAFC' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{ac.sistema}</div>
                    <div style={{ fontSize:11, color:'#64748B', marginTop:2, display:'flex', gap:10 }}>
                      {ac.login && <span>👤 {ac.login}</span>}
                      {ac.url && <a href={'https://'+ac.url} target="_blank" rel="noreferrer" style={{ color:'#6366F1' }}>🔗 {ac.url}</a>}
                    </div>
                    {ac.obs && <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>{ac.obs}</div>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {ac.senha_enc ? (
                      <div>
                        <div style={{ fontFamily:'monospace', fontSize:12, cursor: canSee?'pointer':'default', color: canSee?'#0F172A':'#CBD5E1' }}
                          onClick={() => toggleReveal(ac.id)}>
                          {revealed[ac.id] && canSee ? '(clique p/ ocultar)' : '••••••••'}
                        </div>
                        {canSee && <div style={{ fontSize:9, color:'#94A3B8' }}>clique para revelar</div>}
                        {!canSee && <div style={{ fontSize:9, color:'#EF4444' }}>🔒 sem permissão</div>}
                      </div>
                    ) : <span style={{ fontSize:11, color:'#94A3B8' }}>sem senha</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
