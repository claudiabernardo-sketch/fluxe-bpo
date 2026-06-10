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

  // Config proposta
  const [propForm, setPropForm] = useState({
    quemSomos: '',
    instagram: '',
    representante: '',
    cargo: '',
    cpf_rep: '',
    endereco: '',
    cidade: '',
    foro: '',
    num1_valor: '+120', num1_label: 'Rotinas financeiras geridas',
    num2_valor: '+200', num2_label: 'Empresas impactadas',
    num3_valor: '+95%', num3_label: 'De satisfação dos clientes',
    num4_valor: '+3 anos', num4_label: 'De experiência',
    dep1_nome: '', dep1_texto: '',
    dep2_nome: '', dep2_texto: '',
    dep3_nome: '', dep3_texto: '',
  })

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
        body: { nome: u.nome, email: u.email, perfil: u.perfil, custo_hora: u.custo_hora, empresa_id: empresa?.id }
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
        try { if (empresa.config.proposta) setPropForm(o => ({ ...o, ...empresa.config.proposta })) } catch{}
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

  async function salvarProposta() {
    if (!empresa) return
    const configAtual = empresa.config || {}
    await supabase.from('empresas').update({ config: { ...configAtual, proposta: propForm } }).eq('id', empresa.id)
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
        {[['empresa','🏢 Empresa'],['equipe','👥 Equipe'],['operacional','⚙️ Operacional'],['proposta','📊 Proposta']].map(([id, label]) => (
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

      {/* ABA PROPOSTA */}
      {tab === 'proposta' && (
        <>
          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#1E40AF' }}>
            📊 Esses dados aparecem automaticamente na sua Proposta Visual gerada pelo sistema.
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:14 }}>🏢 Identidade do BPO</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Quem somos (aparece na proposta)</label>
                <textarea style={{ ...fi, minHeight:80, resize:'vertical' }} value={propForm.quemSomos} onChange={e=>setPropForm(f=>({...f,quemSomos:e.target.value}))} placeholder="Ex: Na [Sua Empresa], transformamos números em estratégia. Atuamos como o braço financeiro das empresas..." />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Instagram</label>
                <input style={fi} value={propForm.instagram} onChange={e=>setPropForm(f=>({...f,instagram:e.target.value}))} placeholder="@seubpo" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Representante Legal</label>
                <input style={fi} value={propForm.representante} onChange={e=>setPropForm(f=>({...f,representante:e.target.value}))} placeholder="Nome completo" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cargo</label>
                <input style={fi} value={propForm.cargo} onChange={e=>setPropForm(f=>({...f,cargo:e.target.value}))} placeholder="Ex: Sócia Administradora" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>CPF do Representante</label>
                <input style={fi} value={propForm.cpf_rep} onChange={e=>setPropForm(f=>({...f,cpf_rep:e.target.value}))} placeholder="000.000.000-00" />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Endereço completo</label>
                <input style={fi} value={propForm.endereco} onChange={e=>setPropForm(f=>({...f,endereco:e.target.value}))} placeholder="Rua, número, bairro, cidade/UF, CEP" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cidade (para assinatura)</label>
                <input style={fi} value={propForm.cidade} onChange={e=>setPropForm(f=>({...f,cidade:e.target.value}))} placeholder="Ex: Barueri/SP" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Foro (cláusula contratual)</label>
                <input style={fi} value={propForm.foro} onChange={e=>setPropForm(f=>({...f,foro:e.target.value}))} placeholder="Ex: Barueri/SP" />
              </div>
            </div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:14 }}>📊 Números da empresa (aparecem na proposta)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['num1_valor','num1_label'],
                ['num2_valor','num2_label'],
                ['num3_valor','num3_label'],
                ['num4_valor','num4_label'],
              ].map(([vk, lk], i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Número {i+1}</label>
                    <input style={fi} value={propForm[vk]} onChange={e=>setPropForm(f=>({...f,[vk]:e.target.value}))} placeholder="+120" />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Descrição</label>
                    <input style={fi} value={propForm[lk]} onChange={e=>setPropForm(f=>({...f,[lk]:e.target.value}))} placeholder="Rotinas geridas" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:4 }}>💬 Depoimentos (até 3)</div>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:14 }}>Aparecem na proposta visual. Se vazio, a seção é omitida.</div>
            {[1,2,3].map(n => (
              <div key={n} style={{ borderTop: n>1 ? '1px solid #F1F5F9' : 'none', paddingTop: n>1 ? 14 : 0, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#6366F1', marginBottom:8 }}>Depoimento {n}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:8 }}>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome do cliente</label>
                    <input style={fi} value={propForm['dep'+n+'_nome']} onChange={e=>setPropForm(f=>({...f,['dep'+n+'_nome']:e.target.value}))} placeholder="Ex: João Silva" />
                  </div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Depoimento</label>
                    <textarea style={{ ...fi, minHeight:60, resize:'vertical' }} value={propForm['dep'+n+'_texto']} onChange={e=>setPropForm(f=>({...f,['dep'+n+'_texto']:e.target.value}))} placeholder="O que o cliente disse..." />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={salvarProposta} style={{ padding:'10px 24px', background:'#6366F1', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Salvar configurações da proposta
            </button>
          </div>
        </>
      )}

    </div>
  )
}
