import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Btn } from '../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function ConfigPage() {
  const { empresa, profile } = useAuthStore()
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('empresa') // empresa | equipe | operacional

  // Dados da empresa
  const [empForm, setEmpForm] = useState({ nome:'', email:'', telefone:'', cnpj:'', site:'' })

  // Config operacional
  const [opForm, setOpForm] = useState({ custoHora:35, aprovacaoLimite:2000, fechamentoDia:5, nfDia:1, reuniaoDia:10 })

  // Usuários da empresa
  const { data: usuarios = [], isLoading: uLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('*').order('nome')
      return data || []
    }
  })

  const [novoUser, setNovoUser] = useState({ nome:'', email:'', perfil:'operador', custo_hora:35 })
  const [showNovoUser, setShowNovoUser] = useState(false)

  const addUser = useMutation({
    mutationFn: async (u) => {
      // Cria usuário via auth
      const { data: authData, error } = await supabase.functions.invoke('swift-api', {
        email: u.email, password: 'FluxeBPO@2026', email_confirm: true
      })
      // Insere na tabela usuarios
      await supabase.from('usuarios').insert({
        nome: u.nome, email: u.email, perfil: u.perfil,
        custo_hora: u.custo_hora, empresa_id: empresa?.id,
        ativo: true
      })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey:['usuarios'] }); setShowNovoUser(false); setNovoUser({ nome:'', email:'', perfil:'operador', custo_hora:35 }) }
  })

  useEffect(() => {
    if (empresa) {
      setEmpForm({ nome: empresa.nome||'', email: empresa.email||'', telefone:'', cnpj:'', site:'' })
      if (empresa.config) {
        try { setOpForm(o => ({ ...o, ...empresa.config })) } catch{}
      }
    }
  }, [empresa])

  async function salvarEmpresa() {
    if (!empresa) return
    await supabase.from('empresas').update({ nome: empForm.nome, email: empForm.email }).eq('id', empresa.id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function salvarOp() {
    if (!empresa) return
    await supabase.from('empresas').update({ config: opForm }).eq('id', empresa.id)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const fi = { width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'inherit', background:'#fff' }
  const PERFIS = [ {v:'admin',l:'Administrador'}, {v:'gestor',l:'Gestor'}, {v:'supervisor',l:'Supervisor'}, {v:'operador',l:'Operador'}, {v:'comercial',l:'Comercial'} ]
  const PERFIL_COLOR = { admin:'#4338CA', gestor:'#0E7490', supervisor:'#F59E0B', operador:'#22C55E', comercial:'#8B5CF6' }

  return (
    <div style={{ maxWidth:760 }}>
      {saved && (
        <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'10px 16px', marginBottom:14, color:'#15803D', fontWeight:600, fontSize:12 }}>
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, borderBottom:'1px solid #E2E8F0', paddingBottom:0 }}>
        {[['empresa','🏢 Empresa'],['equipe','👥 Equipe'],['operacional','⚙️ Operacional']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 16px', border:'none', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color: tab===id?'#6366F1':'#94A3B8', borderBottom: tab===id?'2px solid #6366F1':'2px solid transparent', marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ABA EMPRESA */}
      {tab === 'empresa' && (
        <Card>
          <CardHeader title="Dados da empresa" icon="🏢" />
          <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome do BPO *</label>
              <input style={fi} value={empForm.nome} onChange={e=>setEmpForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Empreenda BPO" />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>CNPJ</label>
              <input style={fi} value={empForm.cnpj} onChange={e=>setEmpForm(f=>({...f,cnpj:e.target.value}))} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>E-mail</label>
              <input style={fi} type="email" value={empForm.email} onChange={e=>setEmpForm(f=>({...f,email:e.target.value}))} placeholder="contato@seubpo.com.br" />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>WhatsApp / Telefone</label>
              <input style={fi} value={empForm.telefone} onChange={e=>setEmpForm(f=>({...f,telefone:e.target.value}))} placeholder="(11) 99999-0000" />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Site</label>
              <input style={fi} value={empForm.site} onChange={e=>setEmpForm(f=>({...f,site:e.target.value}))} placeholder="www.seubpo.com.br" />
            </div>
            <div style={{ display:'flex', alignItems:'flex-end' }}>
              <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 14px', border:'1px solid #E2E8F0', fontSize:11, color:'#64748B', width:'100%' }}>
                <div style={{ fontWeight:600, color:'#0F172A' }}>Plano atual</div>
                <div style={{ color:'#6366F1', fontWeight:700, fontSize:13, marginTop:2 }}>{empresa?.plano?.toUpperCase() || 'PRO'}</div>
              </div>
            </div>
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="primary" onClick={salvarEmpresa}>Salvar dados</Btn>
          </div>
        </Card>
      )}

      {/* ABA EQUIPE */}
      {tab === 'equipe' && (
        <Card>
          <CardHeader title="Equipe" icon="👥" right={
            <Btn small variant="primary" onClick={() => setShowNovoUser(true)}>+ Adicionar membro</Btn>
          } />

          {showNovoUser && (
            <div style={{ padding:16, borderBottom:'1px solid #E2E8F0', background:'#F8FAFC' }}>
              <div style={{ fontWeight:600, fontSize:12, marginBottom:12 }}>Novo membro da equipe</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome *</label>
                  <input style={fi} value={novoUser.nome} onChange={e=>setNovoUser(u=>({...u,nome:e.target.value}))} placeholder="Nome completo" />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>E-mail *</label>
                  <input style={fi} type="email" value={novoUser.email} onChange={e=>setNovoUser(u=>({...u,email:e.target.value}))} placeholder="email@seubpo.com.br" />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Perfil</label>
                  <select style={fi} value={novoUser.perfil} onChange={e=>setNovoUser(u=>({...u,perfil:e.target.value}))}>
                    {PERFIS.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Custo-hora (R$)</label>
                  <input style={fi} type="number" value={novoUser.custo_hora} onChange={e=>setNovoUser(u=>({...u,custo_hora:+e.target.value}))} />
                </div>
              </div>
              <div style={{ fontSize:11, color:'#64748B', marginBottom:10 }}>
                ℹ️ O membro receberá um e-mail para definir sua senha de acesso.
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn onClick={() => setShowNovoUser(false)}>Cancelar</Btn>
                <Btn variant="primary" disabled={!novoUser.nome||!novoUser.email} onClick={() => addUser.mutate(novoUser)}>
                  Adicionar membro
                </Btn>
              </div>
            </div>
          )}

          <div>
            {uLoading ? <div style={{ padding:20, textAlign:'center', color:'#94A3B8', fontSize:12 }}>Carregando...</div>
              : usuarios.map(u => (
              <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #F8FAFC' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#6366F1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {u.nome?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{u.nome}</div>
                  <div style={{ fontSize:11, color:'#64748B' }}>{u.email}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:99, background: PERFIL_COLOR[u.perfil]+'20', color: PERFIL_COLOR[u.perfil] }}>
                    {PERFIS.find(p=>p.v===u.perfil)?.l || u.perfil}
                  </span>
                  <span style={{ fontSize:11, color:'#64748B', fontFamily:'monospace' }}>R$ {u.custo_hora}/h</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ABA OPERACIONAL */}
      {tab === 'operacional' && (
        <>
          <Card style={{ marginBottom:14 }}>
            <CardHeader title="Financeiro e rentabilidade" icon="💰" />
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Custo-hora padrão da equipe (R$)</label>
                <input type="number" style={fi} value={opForm.custoHora} onChange={e=>setOpForm(f=>({...f,custoHora:+e.target.value}))} />
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>Usado para calcular a rentabilidade por cliente</div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Valor mínimo para aprovação (R$)</label>
                <input type="number" style={fi} value={opForm.aprovacaoLimite} onChange={e=>setOpForm(f=>({...f,aprovacaoLimite:+e.target.value}))} />
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>Pagamentos acima deste valor precisam de aprovação</div>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom:14 }}>
            <CardHeader title="Calendário mensal padrão" icon="📅" />
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Início fechamento (dia)</label>
                <input type="number" style={fi} value={opForm.fechamentoDia} min={1} max={10} onChange={e=>setOpForm(f=>({...f,fechamentoDia:+e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Emissão de NFs (dia)</label>
                <input type="number" style={fi} value={opForm.nfDia} min={1} max={28} onChange={e=>setOpForm(f=>({...f,nfDia:+e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Reunião mensal (dia)</label>
                <input type="number" style={fi} value={opForm.reuniaoDia} min={1} max={28} onChange={e=>setOpForm(f=>({...f,reuniaoDia:+e.target.value}))} />
              </div>
            </div>
          </Card>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="primary" onClick={salvarOp}>Salvar configurações</Btn>
          </div>
        </>
      )}
    </div>
  )
}
