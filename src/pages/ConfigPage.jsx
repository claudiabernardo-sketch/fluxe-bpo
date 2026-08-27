import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, Btn } from '../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useFeriados, useCreateFeriado, useDeleteFeriado, useRadarCalcLogUltimo, useRecalcularRadar } from '../hooks/useData'
import { parseBRL, formatBRL } from '../utils/currency'

// ── Calculadora de Custo Real da Hora ─────────────────────────────────────
function CalculadoraCustoHora({ usuarios = [], editarUser }) {
  const fi = { width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'#fff' }
  const labelStyle = { fontSize:11, fontWeight:700, color:'#64748B', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.06em' }

  const [regime, setRegime] = useState('clt')
  const [salario, setSalario] = useState('3.000,00')
  const [horasMes, setHorasMes] = useState(160)
  const [vr, setVr] = useState('600,00')
  const [vt, setVt] = useState('200,00')
  const [saude, setSaude] = useState('0,00')
  const [outros, setOutros] = useState('0,00')
  const [margem, setMargem] = useState(30)
  const [usuarioAlvo, setUsuarioAlvo] = useState('')
  const [aplicado, setAplicado] = useState(false)

  const ENCARGOS = {
    clt: {
      label: 'CLT (regime normal)',
      items: [
        { nome: 'INSS Patronal',         pct: 20.0 },
        { nome: 'FGTS',                  pct: 8.0  },
        { nome: '13° Salário',           pct: 8.33 },
        { nome: 'Férias + 1/3',          pct: 11.11},
        { nome: 'Aviso Prévio (prov.)',   pct: 4.17 },
        { nome: 'SAT/RAT (acidentes)',    pct: 2.0  },
        { nome: 'Sistema S (SENAI etc.)', pct: 5.8  },
      ]
    },
    simples: {
      label: 'CLT via Simples Nacional',
      items: [
        { nome: 'INSS Patronal (reduzido)', pct: 8.0  },
        { nome: 'FGTS',                     pct: 8.0  },
        { nome: '13° Salário',              pct: 8.33 },
        { nome: 'Férias + 1/3',             pct: 11.11},
        { nome: 'Aviso Prévio (prov.)',      pct: 4.17 },
        { nome: 'SAT/RAT',                  pct: 1.0  },
      ]
    },
    pj: {
      label: 'PJ / Pessoa Jurídica',
      items: [
        { nome: 'ISS / Simples PJ (estimado)', pct: 6.0 },
        { nome: 'Rescisão contratual (prov.)',  pct: 5.0 },
      ]
    }
  }

  const resultado = useMemo(() => {
    const enc = ENCARGOS[regime]
    const totalPct = enc.items.reduce((a, i) => a + i.pct, 0)
    const salarioNum = parseBRL(salario) || 0
    const beneficiosValor = (parseBRL(vr) || 0) + (parseBRL(vt) || 0) + (parseBRL(saude) || 0) + (parseBRL(outros) || 0)
    const encargosValor = salarioNum * (totalPct / 100)
    const custoMensal = salarioNum + encargosValor + beneficiosValor
    const custoHora = horasMes > 0 ? custoMensal / horasMes : 0
    const precoVenda = custoHora * (1 + margem / 100)
    return { totalPct, encargosValor, beneficiosValor, custoMensal, custoHora, precoVenda, items: enc.items }
  }, [regime, salario, horasMes, vr, vt, saude, outros, margem])

  function fmt(v) { return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) }
  function fmtH(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }) }

  async function aplicarFuncionario() {
    const u = usuarios.find(u => u.id === usuarioAlvo)
    if (!u) return
    await editarUser.mutateAsync({ ...u, custo_hora: parseFloat(resultado.custoHora.toFixed(2)) })
    setAplicado(true)
    setTimeout(() => setAplicado(false), 3000)
  }

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <CardHeader title="Calculadora de Custo Real da Hora" icon="💰" />
        <div style={{ padding:20 }}>
          <div style={{ marginBottom:18 }}>
            <label style={labelStyle}>Regime de contratação</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {Object.entries(ENCARGOS).map(([k, v]) => (
                <button key={k} onClick={() => setRegime(k)} style={{
                  padding:'7px 16px', borderRadius:20, border:`2px solid ${regime===k?'#6366F1':'#E2E8F0'}`,
                  background: regime===k?'#EEF2FF':'#fff', color: regime===k?'#4338CA':'#64748B',
                  cursor:'pointer', fontSize:12, fontWeight:600
                }}>{v.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:12, color:'#0F172A', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #F1F5F9' }}>📥 Dados do funcionário</div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Salário bruto mensal</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#94A3B8', fontWeight:600 }}>R$</span>
                  <input type="text" inputMode="decimal" value={salario} onChange={e => setSalario(e.target.value)} style={{ ...fi, paddingLeft:30 }} placeholder="3.000,00" />
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Horas trabalhadas por mês</label>
                <input type="number" value={horasMes} onChange={e => setHorasMes(Number(e.target.value))} style={fi} min={1} max={240} />
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:3 }}>Padrão CLT = 220h · Meio período = 110h · Remoto custom = 160h</div>
              </div>
              <div style={{ fontWeight:700, fontSize:12, color:'#0F172A', margin:'16px 0 12px', paddingBottom:8, borderBottom:'1px solid #F1F5F9' }}>🎁 Benefícios mensais</div>
              {[
                { label:'Vale-Refeição / Alimentação', val:vr, set:setVr },
                { label:'Vale-Transporte',             val:vt, set:setVt },
                { label:'Plano de Saúde',              val:saude, set:setSaude },
                { label:'Outros benefícios',           val:outros, set:setOutros },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ marginBottom:10 }}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#94A3B8', fontWeight:600 }}>R$</span>
                    <input type="text" inputMode="decimal" value={val} onChange={e => set(e.target.value)} style={{ ...fi, paddingLeft:30 }} placeholder="0,00" />
                  </div>
                </div>
              ))}
              <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid #F1F5F9' }}>
                <label style={labelStyle}>Margem de overhead / lucro desejado</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="range" value={margem} onChange={e => setMargem(Number(e.target.value))} min={0} max={100} style={{ flex:1 }} />
                  <span style={{ fontSize:13, fontWeight:700, color:'#6366F1', minWidth:36 }}>{margem}%</span>
                </div>
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>Percentual adicionado ao custo para cobrir impostos da empresa, estrutura e lucro</div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight:700, fontSize:12, color:'#0F172A', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #F1F5F9' }}>📊 Composição do custo</div>
              <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:10 }}>
                  Encargos trabalhistas ({fmtH(resultado.totalPct)}% sobre o salário)
                </div>
                {resultado.items.map(item => (
                  <div key={item.nome} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748B', marginBottom:5 }}>
                    <span>{item.nome} ({item.pct}%)</span>
                    <span style={{ fontWeight:600 }}>{fmt((parseBRL(salario) || 0) * item.pct / 100)}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:'#1D4ED8', borderTop:'1px solid #E2E8F0', marginTop:8, paddingTop:8 }}>
                  <span>Total encargos</span>
                  <span>{fmt(resultado.encargosValor)}</span>
                </div>
              </div>
              {[
                { label: 'Salário bruto',      val: parseBRL(salario) || 0,    color:'#475569' },
                { label: 'Encargos',           val: resultado.encargosValor,   color:'#DC2626' },
                { label: 'Benefícios',         val: resultado.beneficiosValor, color:'#D97706' },
                { label: 'Custo mensal total', val: resultado.custoMensal,     color:'#0F172A', bold: true },
              ].map(({ label, val, color, bold }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                  <span style={{ fontSize:12, color:'#475569', fontWeight: bold ? 700 : 400 }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight: bold ? 800 : 600, color }}>{fmt(val)}</span>
                </div>
              ))}
              <div style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius:12, padding:18, marginTop:14, textAlign:'center', color:'#fff' }}>
                <div style={{ fontSize:11, opacity:.85, marginBottom:4 }}>💡 Custo real da hora</div>
                <div style={{ fontSize:32, fontWeight:900, letterSpacing:'-1px' }}>{fmt(resultado.custoHora)}<span style={{ fontSize:14 }}>/h</span></div>
                <div style={{ fontSize:10, opacity:.75, marginTop:4 }}>Base: {horasMes}h × {fmtH(resultado.totalPct)}% encargos</div>
              </div>
              {margem > 0 && (
                <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:14, marginTop:10, textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#15803D', marginBottom:4 }}>🎯 Preço de venda sugerido (com {margem}% de margem)</div>
                  <div style={{ fontSize:24, fontWeight:800, color:'#15803D' }}>{fmt(resultado.precoVenda)}<span style={{ fontSize:12 }}>/h</span></div>
                </div>
              )}
              {usuarios.length > 0 && (
                <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginTop:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:8 }}>📌 Aplicar custo em um funcionário</div>
                  <select value={usuarioAlvo} onChange={e => { setUsuarioAlvo(e.target.value); setAplicado(false) }} style={{ ...fi, marginBottom:10 }}>
                    <option value="">— Selecione —</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} (atual: {fmt(u.custo_hora || 0)}/h)</option>
                    ))}
                  </select>
                  {usuarioAlvo && (
                    <Btn variant="primary" onClick={aplicarFuncionario} disabled={editarUser.isPending}>
                      {aplicado ? '✓ Aplicado!' : `Aplicar ${fmt(resultado.custoHora)}/h`}
                    </Btn>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {usuarios.length > 0 && (
        <Card>
          <CardHeader title="Custo/hora atual da equipe" icon="👥" />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Funcionário','Perfil','Custo/hora','Custo mensal (160h)','Preço venda (+{margem}%)'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, color:'#64748B', borderBottom:'1px solid #E2E8F0' }}>
                      {h.replace('{margem}', margem)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const ch = u.custo_hora || 0
                  const mensal = ch * 160
                  const venda = ch * (1 + margem / 100)
                  return (
                    <tr key={u.id} style={{ borderBottom:'1px solid #F8FAFC' }}>
                      <td style={{ padding:'10px 14px', fontWeight:600 }}>{u.nome}</td>
                      <td style={{ padding:'10px 14px', color:'#64748B', textTransform:'capitalize' }}>{u.perfil}</td>
                      <td style={{ padding:'10px 14px', fontWeight:700, color:'#6366F1' }}>{fmt(ch)}</td>
                      <td style={{ padding:'10px 14px', color:'#334155' }}>{fmt(mensal)}</td>
                      <td style={{ padding:'10px 14px', fontWeight:600, color:'#15803D' }}>{fmt(venda)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:'#F8FAFC', borderTop:'2px solid #E2E8F0' }}>
                  <td colSpan={2} style={{ padding:'10px 14px', fontWeight:700, color:'#0F172A' }}>Total equipe (160h/mês)</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#6366F1' }}>{fmt(usuarios.reduce((a, u) => a + (u.custo_hora || 0), 0))}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#334155' }}>{fmt(usuarios.reduce((a, u) => a + (u.custo_hora || 0) * 160, 0))}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#15803D' }}>{fmt(usuarios.reduce((a, u) => a + (u.custo_hora || 0) * (1 + margem / 100), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// Fontes disponíveis no Brand Kit — carregadas dinamicamente para o preview funcionar
const BRAND_FONTS = ['Inter','Poppins','Montserrat','Lato','Open Sans','Raleway','Playfair Display','DM Sans']
function ensureBrandFontsLoaded() {
  if (document.getElementById('brand-fonts-preview')) return
  const families = BRAND_FONTS.map(f => `family=${f.replace(/ /g, '+')}:wght@400;600;700`).join('&')
  const link = document.createElement('link')
  link.id = 'brand-fonts-preview'
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}

export default function ConfigPage() {
  const { empresa, profile, updateEmpresa } = useAuthStore()
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'empresa')

  const [empForm, setEmpForm] = useState({ nome:'', email:'', telefone:'', cnpj:'', site:'', slogan:'', cor_primaria:'#6366F1', cor_secundaria:'#8B5CF6', fonte:'Inter', logo_url:'', autentique_token:'', wa_phone_number_id:'', wa_access_token:'' })
  const [waTesting, setWaTesting] = useState(false)
  const [waStatus, setWaStatus] = useState(null)
  const [waConectando, setWaConectando] = useState(false)
  const [fbReady, setFbReady] = useState(false)
  const [waProviderTab, setWaProviderTab] = useState('meta')
  const [zapiTesting, setZapiTesting] = useState(false)
  const [zapiStatus, setZapiStatus] = useState(null)
  const [zapiRiscoConfirmado, setZapiRiscoConfirmado] = useState(false)
  const [opForm, setOpForm] = useState({ custoHora:35, fechamentoDia:5, nfDia:1, reuniaoDia:10 })
  const [custosOp, setCustosOp] = useState({ itens: [], clientesAtivos: '' })
  const { data: feriados = [] } = useFeriados()
  const createFeriado = useCreateFeriado()
  const deleteFeriado = useDeleteFeriado()
  const { data: radarLog } = useRadarCalcLogUltimo()
  const recalcularRadar = useRecalcularRadar()
  const [novoFeriado, setNovoFeriado] = useState({ data:'', descricao:'' })

  // ── 2FA ──────────────────────────────────────────────────
  const [mfaFactors, setMfaFactors] = useState([])
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaEnrolling, setMfaEnrolling] = useState(null) // { factorId, qrCode, secret }
  const [mfaCode, setMfaCode] = useState('')
  const [mfaMsg, setMfaMsg] = useState('')
  const { mfaListFactors, mfaEnroll, mfaVerifyEnroll, mfaUnenroll } = useAuthStore()

  useEffect(() => {
    mfaListFactors().then(({ factors }) => setMfaFactors(factors))
    ensureBrandFontsLoaded()
  }, [])

  async function handleEnroll() {
    setMfaLoading(true); setMfaMsg('')
    const { factorId, qrCode, secret, error } = await mfaEnroll()
    if (error) { setMfaMsg('Erro ao iniciar configuração: ' + error.message); setMfaLoading(false); return }
    setMfaEnrolling({ factorId, qrCode, secret })
    setMfaLoading(false)
  }

  async function handleVerifyEnroll() {
    setMfaLoading(true); setMfaMsg('')
    const { error } = await mfaVerifyEnroll(mfaEnrolling.factorId, mfaCode.replace(/\s/g,''))
    if (error) { setMfaMsg('Código incorreto. Tente novamente.'); setMfaLoading(false); return }
    setMfaEnrolling(null); setMfaCode('')
    const { factors } = await mfaListFactors()
    setMfaFactors(factors)
    setMfaMsg('✅ 2FA ativado com sucesso!')
    setMfaLoading(false)
  }

  async function handleUnenroll(factorId) {
    if (!confirm('Desativar o 2FA? Você ficará menos protegido.')) return
    setMfaLoading(true)
    const { error } = await mfaUnenroll(factorId)
    if (error) { setMfaMsg('Erro ao desativar: ' + error.message); setMfaLoading(false); return }
    const { factors } = await mfaListFactors()
    setMfaFactors(factors)
    setMfaMsg('')
    setMfaLoading(false)
  }
  const [propForm, setPropForm] = useState({
    quemSomos:'', instagram:'', representante:'', cargo:'', cpf_rep:'', endereco:'', cidade:'', foro:'',
    num1_valor:'+120', num1_label:'Rotinas financeiras geridas',
    num2_valor:'+200', num2_label:'Empresas impactadas',
    num3_valor:'+95%', num3_label:'De satisfação dos clientes',
    num4_valor:'+3 anos', num4_label:'De experiência',
    dep1_nome:'', dep1_texto:'', dep2_nome:'', dep2_texto:'', dep3_nome:'', dep3_texto:'',
  })

  const { data: usuarios = [], isLoading: uLoading } = useQuery({
    queryKey: ['usuarios', empresa?.id],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('*').eq('empresa_id', empresa?.id).order('nome')
      return data || []
    },
    enabled: !!empresa?.id,
  })

  const [novoUser, setNovoUser] = useState({ nome:'', email:'', perfil:'operador', custo_hora:35, mensagem:'' })
  const [showNovoUser, setShowNovoUser] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [planSel, setPlanSel] = useState('essencial')
  const [assinando, setAssinando] = useState(false)

  const handleAssinar = async (planoForcado) => {
    const cnpj = empresa?.cnpj || window.prompt('Informe o CNPJ ou CPF para faturamento (só números):')
    if (!cnpj) return
    setAssinando(true)
    try {
      const { data, error } = await supabase.functions.invoke('asaas-create-subscription', {
        body: { plano: planoForcado || planSel, cpfCnpj: cnpj },
      })
      if (error) {
        let detail = error.message
        try { const body = await error.context?.json(); detail = JSON.stringify(body) } catch {}
        throw new Error('Erro função: ' + detail)
      }
      if (!data?.paymentUrl) throw new Error('Sem link. Resposta: ' + JSON.stringify(data))
      window.open(data.paymentUrl, '_blank')
    } catch (e) {
      alert('Erro: ' + e.message)
    } finally {
      setAssinando(false)
    }
  }
  const [deleteUser, setDeleteUser] = useState(null)
  const [inviteCreds, setInviteCreds] = useState(null) // { email, senha }

  const addUser = useMutation({
    mutationFn: async (u) => {
      const { data: { session } } = await supabase.auth.getSession()
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000) // 20s timeout
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              nome: u.nome,
              email: u.email,
              perfil: u.perfil,
              custo_hora: u.custo_hora,
              empresa_id: empresa?.id,
            }),
          }
        )
        clearTimeout(timeout)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (data?.error) throw new Error(data.error)
        return data
      } catch (e) {
        clearTimeout(timeout)
        if (e.name === 'AbortError') throw new Error('Tempo esgotado. Verifique sua conexão e tente novamente.')
        throw e
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      setNovoUser({ nome:'', email:'', perfil:'operador', custo_hora:35, mensagem:'' })
      // Sempre mostra email+senha como backup — não depende só do email chegar
      if (data?.email && data?.senha) {
        setInviteCreds({ email: data.email, senha: data.senha, emailSent: !!data?.emailSent })
      } else {
        setShowNovoUser(false)
      }
    },
    onError: (err) => alert('Erro ao convidar usuário: ' + err.message),
  })

  const editarUser = useMutation({
    mutationFn: async (u) => {
      const { data, error } = await supabase.from('usuarios').update({ nome: u.nome, perfil: u.perfil, custo_hora: u.custo_hora, ativo: u.ativo }).eq('id', u.id).select()
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Não foi possível editar — sem permissão ou usuário não encontrado.')
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setEditUser(null) },
    onError: (err) => alert('Erro ao editar usuário: ' + err.message),
  })

  const excluirUser = useMutation({
    mutationFn: async (u) => {
      const { data, error } = await supabase.from('usuarios').delete().eq('id', u.id).select()
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Não foi possível excluir — sem permissão ou usuário não encontrado.')
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setDeleteUser(null) },
    onError: (err) => alert('Erro ao excluir usuário: ' + err.message),
  })

  const [reenvioStatus, setReenvioStatus] = useState({}) // { [userId]: 'sending' | 'ok' | 'err' }
  const [linkConvite, setLinkConvite] = useState(null) // { nome, link }
  const reenviarConvite = async (u) => {
    setReenvioStatus(s => ({ ...s, [u.id]: 'sending' }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            nome: u.nome,
            email: u.email,
            perfil: u.perfil,
            custo_hora: u.custo_hora,
            empresa_id: empresa?.id,
          }),
        }
      )
      const data = await res.json()
      if (data?.error) throw new Error(data.error)
      if (data?.email && data?.senha) {
        // Sempre mostra email+senha como backup — não depende só do email chegar
        setLinkConvite({ nome: u.nome, email: data.email, senha: data.senha, emailSent: !!data?.emailSent })
      }
      setReenvioStatus(s => ({ ...s, [u.id]: data?.emailSent ? 'ok' : 'link' }))
      setTimeout(() => setReenvioStatus(s => { const n={...s}; delete n[u.id]; return n }), data?.emailSent ? 3000 : 60000)
    } catch (e) {
      setReenvioStatus(s => ({ ...s, [u.id]: 'err' }))
      setTimeout(() => setReenvioStatus(s => { const n={...s}; delete n[u.id]; return n }), 5000)
    }
  }

  useEffect(() => {
    if (empresa) {
      setEmpForm({ nome: empresa.nome||'', email: empresa.email||'', telefone: empresa.telefone||'', cnpj: empresa.cnpj||'', site: empresa.site||'', slogan: empresa.slogan||'', cor_primaria: empresa.cor_primaria||'#6366F1', cor_secundaria: empresa.cor_secundaria||'#8B5CF6', fonte: empresa.fonte||'Inter', logo_url: empresa.logo_url||'', autentique_token: empresa.autentique_token||'', wa_phone_number_id: empresa.wa_phone_number_id||'', wa_access_token: empresa.wa_access_token||'', zapi_instance_id: empresa.zapi_instance_id||'', zapi_instance_token: empresa.zapi_instance_token||'', zapi_client_token: empresa.zapi_client_token||'' })
      setWaProviderTab(empresa.wa_provider === 'zapi' ? 'zapi' : 'meta')
      if (empresa.config) {
        try { setOpForm(o => ({ ...o, ...empresa.config })) } catch{}
        try { if (empresa.config.proposta) setPropForm(o => ({ ...o, ...empresa.config.proposta })) } catch{}
        try { if (empresa.config.custosOperacao) setCustosOp(o => ({ ...o, itens: empresa.config.custosOperacao.itens || [], clientesAtivos: empresa.config.custosOperacao.clientesAtivos || '' })) } catch{}
      }
    }
  }, [empresa])

  // Carrega o SDK do Facebook uma vez, sob demanda (só quando a aba
  // Integrações existe na página) — é ele que abre o popup de login pra
  // conectar o WhatsApp do cliente sem sair do Fluxe.
  useEffect(() => {
    const appId = import.meta.env.VITE_META_APP_ID
    if (!appId || window.FB) { if (window.FB) setFbReady(true); return }
    window.fbAsyncInit = function () {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' })
      setFbReady(true)
    }
    const s = document.createElement('script')
    s.src = 'https://connect.facebook.net/pt_BR/sdk.js'
    s.async = true
    s.defer = true
    document.body.appendChild(s)
  }, [])

  // Abre o popup de login do Facebook (Embedded Signup) — o cliente escolhe
  // ou cria o número dele, sem precisar copiar/colar nada técnico. No fim,
  // a Meta devolve um "code" que a Edge Function troca por um token.
  function conectarWhatsApp() {
    const configId = import.meta.env.VITE_META_WA_CONFIG_ID
    if (!window.FB || !configId) {
      return setWaStatus({ ok: false, msg: '❌ Conexão via Facebook ainda não configurada (falta VITE_META_APP_ID / VITE_META_WA_CONFIG_ID).' })
    }
    setWaConectando(true); setWaStatus(null)
    window.FB.login((response) => {
      const code = response?.authResponse?.code
      if (!code) { setWaConectando(false); return }
      ;(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-send`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'exchange_code', code, empresa_id: empresa.id }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          setWaStatus({ ok: true, msg: `✅ Conectado! Número: ${data.numero || '—'}${data.nome ? ` (${data.nome})` : ''}` })
          setEmpForm(f => ({ ...f, wa_phone_number_id: 'conectado', wa_access_token: 'conectado' }))
          updateEmpresa({})
        } catch (e) {
          setWaStatus({ ok: false, msg: '❌ ' + (e.message || 'Erro ao conectar') })
        } finally {
          setWaConectando(false)
        }
      })()
    }, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: { feature: 'whatsapp_embedded_signup', sessionInfoVersion: '3' },
    })
  }

  async function salvarEmpresa() {
    if (!empresa) return
    try {
      const payload = {
        nome: empForm.nome, email: empForm.email, cnpj: empForm.cnpj,
        telefone: empForm.telefone, site: empForm.site,
        slogan: empForm.slogan || null,
        cor_primaria: empForm.cor_primaria || '#6366F1',
        cor_secundaria: empForm.cor_secundaria || '#8B5CF6',
        fonte: empForm.fonte || 'Inter',
        logo_url: empForm.logo_url || null,
        autentique_token: empForm.autentique_token || null,
        wa_phone_number_id: empForm.wa_phone_number_id || null,
        wa_access_token: empForm.wa_access_token || null,
        zapi_instance_id: empForm.zapi_instance_id || null,
        zapi_instance_token: empForm.zapi_instance_token || null,
        zapi_client_token: empForm.zapi_client_token || null,
      }
      const { error } = await supabase.from('empresas').update(payload).eq('id', empresa.id)
      if (error) throw error
      updateEmpresa(payload)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setSaveError(e.message || 'Erro ao salvar'); setTimeout(() => setSaveError(''), 3000) }
  }

  // Salva Phone Number ID + Access Token e já valida direto na Meta, sem
  // precisar enviar mensagem nenhuma pra testar.
  async function testarWhatsapp() {
    if (!empForm.wa_phone_number_id?.trim() || !empForm.wa_access_token?.trim()) {
      return setWaStatus({ ok: false, msg: 'Preencha o Phone Number ID e o Access Token.' })
    }
    setWaTesting(true); setWaStatus(null)
    try {
      const { error: errSave } = await supabase.from('empresas')
        .update({ wa_phone_number_id: empForm.wa_phone_number_id.trim(), wa_access_token: empForm.wa_access_token.trim(), wa_provider: 'meta' })
        .eq('id', empresa.id)
      if (errSave) throw errSave
      updateEmpresa({ wa_phone_number_id: empForm.wa_phone_number_id.trim(), wa_access_token: empForm.wa_access_token.trim(), wa_provider: 'meta' })

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', empresa_id: empresa.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setWaStatus({ ok: true, msg: `✅ Conectado! Número: ${data.numero || '—'}${data.nome ? ` (${data.nome})` : ''}` })
    } catch (e) {
      setWaStatus({ ok: false, msg: '❌ ' + (e.message || 'Erro ao testar conexão') })
    } finally {
      setWaTesting(false)
    }
  }

  // Testa e salva a conexão Z-API (não-oficial) — exige a instância já
  // conectada (QR Code escaneado) no painel da Z-API antes de funcionar.
  async function testarZapi() {
    if (!empForm.zapi_instance_id?.trim() || !empForm.zapi_instance_token?.trim()) {
      return setZapiStatus({ ok: false, msg: 'Preencha o Instance ID e o Instance Token.' })
    }
    setZapiTesting(true); setZapiStatus(null)
    try {
      const payloadZapi = {
        zapi_instance_id: empForm.zapi_instance_id.trim(),
        zapi_instance_token: empForm.zapi_instance_token.trim(),
        zapi_client_token: empForm.zapi_client_token?.trim() || null,
        wa_provider: 'zapi',
      }
      const { error: errSave } = await supabase.from('empresas').update(payloadZapi).eq('id', empresa.id)
      if (errSave) throw errSave
      updateEmpresa(payloadZapi)

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapi-send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', empresa_id: empresa.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setZapiStatus({ ok: true, msg: '✅ Conectado! O WhatsApp já está ativo nessa instância.' })
    } catch (e) {
      setZapiStatus({ ok: false, msg: '❌ ' + (e.message || 'Erro ao testar conexão') })
    } finally {
      setZapiTesting(false)
    }
  }

  async function salvarOp() {
    if (!empresa) return
    try {
      const { error } = await supabase.from('empresas').update({ config: opForm }).eq('id', empresa.id)
      if (error) throw error
      updateEmpresa({ config: opForm })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setSaveError(e.message || 'Erro ao salvar'); setTimeout(() => setSaveError(''), 3000) }
  }

  async function salvarCustosOp() {
    if (!empresa) return
    try {
      const total = custosOp.itens.reduce((s, i) => s + (parseBRL(i.valor) || 0), 0)
      const nClientes = parseInt(custosOp.clientesAtivos) || 0
      const payload = {
        itens: custosOp.itens,
        clientesAtivos: custosOp.clientesAtivos,
        total,
        overheadPorCliente: nClientes > 0 ? total / nClientes : 0,
        atualizadoEm: new Date().toISOString(),
      }
      const novoConfig = { ...(empresa.config || {}), custosOperacao: payload }
      const { error } = await supabase.from('empresas').update({ config: novoConfig }).eq('id', empresa.id)
      if (error) throw error
      updateEmpresa({ config: novoConfig })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setSaveError(e.message || 'Erro ao salvar'); setTimeout(() => setSaveError(''), 3000) }
  }

  async function salvarProposta() {
    if (!empresa) return
    try {
      const configAtual = empresa.config || {}
      const novoConfig = { ...configAtual, proposta: propForm }
      const { error } = await supabase.from('empresas').update({ config: novoConfig }).eq('id', empresa.id)
      if (error) throw error
      updateEmpresa({ config: novoConfig })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setSaveError(e.message || 'Erro ao salvar'); setTimeout(() => setSaveError(''), 3000) }
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
      {saveError && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECDD3', borderRadius:10, padding:'10px 16px', marginBottom:14, color:'#991B1B', fontWeight:600, fontSize:12 }}>
          ✗ {saveError}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, borderBottom:'1px solid #E2E8F0', paddingBottom:0 }}>
        {[['empresa','🏢 Empresa'],['equipe','👥 Equipe'],['custoHora','💰 Custo/Hora'],['custosOp','📊 Custo da Operação'],['operacional','⚙️ Operacional'],...(profile?.perfil==='admin'?[['integracoes','🔗 Integrações'],['seguranca','🔐 Segurança'],['plano','💳 Meu Plano']]:[]  )].map(([id, label]) => (
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
            {[
              { label:'Nome do BPO *',  key:'nome',     placeholder:'Ex: Empreenda BPO' },
              { label:'E-mail',         key:'email',    placeholder:'contato@empresa.com', type:'email' },
              { label:'CNPJ',           key:'cnpj',     placeholder:'00.000.000/0001-00' },
              { label:'Telefone',       key:'telefone', placeholder:'(11) 99999-9999' },
              { label:'Site',           key:'site',     placeholder:'https://empresa.com.br' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key} style={key==='site'||key==='nome'?{gridColumn:'1/-1'}:{}}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</label>
                <input type={type||'text'} style={fi} value={empForm[key]||''} onChange={e=>setEmpForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} />
              </div>
            ))}
          </div>

          {/* BRAND KIT */}
          <div style={{ padding:'0 16px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#334155', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:12, paddingTop:12, borderTop:'1px solid #F1F5F9' }}>
              🎨 Identidade visual (Brand Kit)
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>URL da Logo</label>
                <input type="url" style={fi} value={empForm.logo_url||''} onChange={e=>setEmpForm(f=>({...f,logo_url:e.target.value}))} placeholder="https://seusite.com/logo.png" />
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>Cole o link direto da sua logo (PNG ou SVG). Use o Canva, Google Drive ou Dropbox com link público.</div>
                {empForm.logo_url && (
                  <img src={empForm.logo_url} alt="Preview logo" style={{ marginTop:8, height:48, objectFit:'contain', border:'1px solid #E2E8F0', borderRadius:8, padding:8, background:'#F8FAFC' }} onError={e => e.target.style.display='none'} />
                )}
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Slogan / Tagline</label>
                <input type="text" style={fi} value={empForm.slogan||''} onChange={e=>setEmpForm(f=>({...f,slogan:e.target.value}))} placeholder="Ex: Transformamos números em estratégia" />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cor primária</label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="color" value={empForm.cor_primaria||'#6366F1'} onChange={e=>setEmpForm(f=>({...f,cor_primaria:e.target.value}))} style={{ width:40, height:36, border:'1px solid #E2E8F0', borderRadius:8, cursor:'pointer', padding:2 }} />
                  <input type="text" style={{ ...fi, flex:1, fontFamily:'monospace' }} value={empForm.cor_primaria||''} onChange={e=>setEmpForm(f=>({...f,cor_primaria:e.target.value}))} placeholder="#6366F1" />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Cor secundária</label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="color" value={empForm.cor_secundaria||'#8B5CF6'} onChange={e=>setEmpForm(f=>({...f,cor_secundaria:e.target.value}))} style={{ width:40, height:36, border:'1px solid #E2E8F0', borderRadius:8, cursor:'pointer', padding:2 }} />
                  <input type="text" style={{ ...fi, flex:1, fontFamily:'monospace' }} value={empForm.cor_secundaria||''} onChange={e=>setEmpForm(f=>({...f,cor_secundaria:e.target.value}))} placeholder="#8B5CF6" />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>Fonte</label>
                <select style={fi} value={empForm.fonte||'Inter'} onChange={e=>setEmpForm(f=>({...f,fonte:e.target.value}))}>
                  {['Inter','Poppins','Montserrat','Lato','Open Sans','Raleway','Playfair Display','DM Sans'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <div style={{ padding:'10px 14px', borderRadius:8, background: empForm.cor_primaria||'#6366F1', color:'#fff', fontSize:12, fontWeight:600, fontFamily: empForm.fonte||'Inter' }}>
                  Preview: {empForm.nome||'Seu BPO'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="primary" onClick={salvarEmpresa}>Salvar dados</Btn>
          </div>
        </Card>
      )}

      {tab === 'empresa' && (
        <Card style={{ marginTop:16 }}>
          <CardHeader title="Integração com seu site" icon="🔗" />
          <div style={{ padding:16 }}>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:12, lineHeight:1.6 }}>
              Se você tem um site próprio com formulário de diagnóstico ou precificação, pode enviar esses dados direto pro CRM do Fluxe, o lead já cai automaticamente na etapa "Lead novo". Passe esse ID pra quem monta seu site.
            </div>
            <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em' }}>ID da sua empresa (pra integrações)</label>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <input readOnly value={empresa?.id || ''} style={{ ...fi, fontFamily:'monospace', background:'#F8FAFC' }} onFocus={e => e.target.select()} />
              <Btn variant="outline" onClick={() => { navigator.clipboard.writeText(empresa?.id || ''); alert('✓ ID copiado!') }}>Copiar</Btn>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'#334155', marginBottom:6 }}>Exemplo (JavaScript, no formulário do site):</div>
            <pre style={{ background:'#0F172A', color:'#E2E8F0', padding:12, borderRadius:8, fontSize:11, overflowX:'auto', lineHeight:1.6 }}>
{`fetch('https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/lead-site', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    empresa_id: '${empresa?.id || 'SEU_ID_AQUI'}',
    nome: 'Nome do prospect',
    email: 'email@prospect.com',
    whatsapp: '11999999999',
    segmento: 'Segmento informado no diagnóstico',
    origem: 'Site'
  })
})`}
            </pre>
            <div style={{ fontSize:10, color:'#94A3B8', marginTop:8 }}>Só "empresa_id" e "nome" são obrigatórios, os demais campos são opcionais.</div>
          </div>
        </Card>
      )}

      {/* ABA EQUIPE */}
      {tab === 'equipe' && (() => {
        const limiteUsuarios = empresa?.plano === 'essencial' ? 3 : null
        const ativos = usuarios.filter(u => u.ativo).length
        const noLimite = limiteUsuarios != null && ativos >= limiteUsuarios
        return (
        <div>
          <Card style={{ marginBottom:14 }}>
            <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#0F172A' }}>👥 Membros da equipe</div>
                {limiteUsuarios != null && (
                  <div style={{ fontSize:11, color: noLimite ? '#991B1B' : '#94A3B8', marginTop:2 }}>
                    {ativos} de {limiteUsuarios} usuários do plano Essencial
                  </div>
                )}
              </div>
              {noLimite ? (
                <Btn variant="primary" onClick={()=>setTab('plano')}>⭐ Fazer upgrade para adicionar mais</Btn>
              ) : (
                <Btn variant="primary" onClick={()=>setShowNovoUser(v=>!v)}>
                  {showNovoUser ? '✕ Cancelar' : '+ Convidar membro'}
                </Btn>
              )}
            </div>

            {noLimite && (
              <div style={{ margin:'0 16px 12px', padding:'10px 14px', background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, fontSize:12, color:'#92400E' }}>
                Você atingiu o limite de {limiteUsuarios} usuários do plano Essencial. Faça upgrade para o Completo para ter usuários ilimitados.
              </div>
            )}

            {showNovoUser && !noLimite && (
              <div style={{ padding:'0 16px 16px', borderTop:'1px solid #F1F5F9' }}>
                <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, marginTop:14 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#0F172A', marginBottom:12 }}>✉️ Novo convite por e-mail</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome *</label>
                      <input style={fi} value={novoUser.nome} onChange={e=>setNovoUser(f=>({...f,nome:e.target.value}))} placeholder="Nome completo" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>E-mail *</label>
                      <input type="email" style={fi} value={novoUser.email} onChange={e=>setNovoUser(f=>({...f,email:e.target.value}))} placeholder="email@empresa.com" />
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Perfil</label>
                      <select style={fi} value={novoUser.perfil} onChange={e=>setNovoUser(f=>({...f,perfil:e.target.value}))}>
                        {PERFIS.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Custo/hora (R$)</label>
                      <input type="number" style={fi} value={novoUser.custo_hora} onChange={e=>setNovoUser(f=>({...f,custo_hora:+e.target.value}))} min={0} />
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Mensagem de boas-vindas</label>
                      <textarea style={{ ...fi, height:70, resize:'vertical' }} value={novoUser.mensagem} onChange={e=>setNovoUser(f=>({...f,mensagem:e.target.value}))} placeholder={`Olá, ${novoUser.nome||'nome'}! Você foi convidado(a)...`} />
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
                    <Btn variant="primary" onClick={()=>{ setInviteCreds(null); addUser.mutate(novoUser) }} disabled={addUser.isPending||!novoUser.nome||!novoUser.email}>
                      {addUser.isPending ? 'Criando acesso...' : '📧 Enviar convite'}
                    </Btn>
                  </div>
                  {addUser.isError && <div style={{ color:'#991B1B', fontSize:11, marginTop:8 }}>✗ {addUser.error?.message}</div>}
                  {inviteCreds && (
                    <div style={{ marginTop:12, padding:'12px 14px', background: inviteCreds.emailSent ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${inviteCreds.emailSent ? '#BBF7D0' : '#FED7AA'}`, borderRadius:8 }}>
                      <div style={{ fontSize:11, fontWeight:700, color: inviteCreds.emailSent ? '#15803D' : '#92400E', marginBottom:6 }}>
                        {inviteCreds.emailSent ? '✓ Convite enviado por email! Se quiser, mande também por WhatsApp:' : '⚠️ Email não enviado — mande esses dados por WhatsApp:'}
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input readOnly value={`E-mail: ${inviteCreds.email} · Senha: ${inviteCreds.senha}`} style={{ flex:1, fontSize:10, padding:'5px 8px', border:'1px solid #FED7AA', borderRadius:6, background:'#fff', color:'#334155', fontFamily:'monospace' }} onClick={e=>e.target.select()} />
                        <Btn onClick={()=>{ navigator.clipboard.writeText(`Site: fluxebpo.com.br → Entrar\nE-mail: ${inviteCreds.email}\nSenha: ${inviteCreds.senha}`) }} style={{ fontSize:10, padding:'5px 10px', whiteSpace:'nowrap' }}>Copiar</Btn>
                      </div>
                      <div style={{ fontSize:10, color:'#92400E', marginTop:6 }}>O acesso já foi criado com essa senha — não é um link, então não expira nem "queima" sozinho.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {linkConvite && (
              <div style={{ margin:'0 16px 12px', padding:'12px 14px', background: linkConvite.emailSent ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${linkConvite.emailSent ? '#BBF7D0' : '#FED7AA'}`, borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color: linkConvite.emailSent ? '#15803D' : '#92400E', marginBottom:6 }}>
                  {linkConvite.emailSent ? `✓ Email reenviado para ${linkConvite.nome}. Se quiser, mande também por WhatsApp:` : `⚠️ Email não chegou para ${linkConvite.nome} — mande esses dados por WhatsApp:`}
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <input readOnly value={`E-mail: ${linkConvite.email} · Senha: ${linkConvite.senha}`} style={{ flex:1, fontSize:10, padding:'5px 8px', border:'1px solid #FED7AA', borderRadius:6, background:'#fff', color:'#334155', fontFamily:'monospace' }} onClick={e=>e.target.select()} />
                  <Btn onClick={()=>{ navigator.clipboard.writeText(`Site: fluxebpo.com.br → Entrar\nE-mail: ${linkConvite.email}\nSenha: ${linkConvite.senha}`) }} style={{ fontSize:10, padding:'5px 10px', whiteSpace:'nowrap' }}>Copiar</Btn>
                </div>
                <div style={{ fontSize:10, color:'#92400E', marginTop:6 }}>
                  A senha já foi redefinida — não é um link, então não expira nem "queima" sozinha.
                  <span style={{ marginLeft:8, cursor:'pointer', textDecoration:'underline' }} onClick={()=>setLinkConvite(null)}>Fechar</span>
                </div>
              </div>
            )}

            {uLoading ? <div style={{ padding:16, color:'#94A3B8', fontSize:12 }}>Carregando...</div> : (
              <div>
                {usuarios.map(u => (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderTop:'1px solid #F8FAFC' }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background: PERFIL_COLOR[u.perfil]||'#6366F1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {u.nome?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'U'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{u.nome}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background: (PERFIL_COLOR[u.perfil]||'#6366F1')+'18', color: PERFIL_COLOR[u.perfil]||'#6366F1', fontWeight:700, textTransform:'capitalize' }}>{u.perfil}</span>
                    <span style={{ fontSize:10, color:'#94A3B8', fontFamily:'monospace', minWidth:60, textAlign:'right' }}>R${(u.custo_hora||0).toFixed(0)}/h</span>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background: u.ativo?'#F0FDF4':'#FEF2F2', color: u.ativo?'#15803D':'#991B1B', fontWeight:600 }}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      {(() => {
                        const st = reenvioStatus[u.id]
                        return (
                          <button
                            onClick={() => reenviarConvite(u)}
                            disabled={st === 'sending'}
                            title="Reenviar convite por email"
                            style={{ padding:'5px 8px', borderRadius:6, fontSize:11, cursor: st==='sending'?'default':'pointer', border: st==='ok'?'1px solid #BBF7D0': st==='err'?'1px solid #FECDD3': st==='link'?'1px solid #FDE68A':'1px solid #E0E7FF', background: st==='ok'?'#F0FDF4': st==='err'?'#FEF2F2': st==='link'?'#FFFBEB':'#EEF2FF', color: st==='ok'?'#15803D': st==='err'?'#991B1B': st==='link'?'#92400E':'#4F46E5' }}
                          >
                            {st==='sending'?'⏳': st==='ok'?'✓ Enviado': st==='err'?'✗ Erro': st==='link'?'🔗 Ver link':'📧'}
                          </button>
                        )
                      })()}
                      <button onClick={()=>setEditUser({...u})} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:11 }}>✏</button>
                      <button onClick={()=>setDeleteUser(u)} style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #FECDD3', background:'#FEF2F2', color:'#991B1B', cursor:'pointer', fontSize:11 }}>🗑</button>
                    </div>
                  </div>
                ))}
                {usuarios.length === 0 && (
                  <div style={{ padding:'24px 16px', textAlign:'center', color:'#94A3B8', fontSize:12 }}>Nenhum usuário encontrado</div>
                )}
              </div>
            )}
          </Card>
        </div>
        )
      })()}

      {/* ABA CUSTO/HORA */}
      {tab === 'custoHora' && <CalculadoraCustoHora usuarios={usuarios} editarUser={editarUser} />}

      {/* ABA CUSTO DA OPERAÇÃO (OVERHEAD) */}
      {tab === 'custosOp' && (() => {
        const CATEGORIAS = [
          { v:'ferramentas',   l:'🖥️ Ferramentas e sistemas', ex:'ERP, Fluxe, Google Workspace, WhatsApp API' },
          { v:'contabilidade', l:'📑 Contabilidade e jurídico', ex:'Contador do seu BPO, advogado' },
          { v:'estrutura',     l:'🏠 Estrutura', ex:'Aluguel, energia, internet (ou % do home office)' },
          { v:'marketing',     l:'📣 Marketing e comercial', ex:'Tráfego, CRM, site, materiais' },
          { v:'financeiro',    l:'🏦 Financeiro', ex:'Tarifas bancárias, taxas de máquina' },
          { v:'outros',        l:'📦 Outros', ex:'Cursos, mentorias, associações' },
        ]
        const total = custosOp.itens.reduce((s, i) => s + (parseBRL(i.valor) || 0), 0)
        const nClientes = parseInt(custosOp.clientesAtivos) || 0
        const porCliente = nClientes > 0 ? total / nClientes : 0
        const fmtR = (v) => (v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })
        const setItem = (idx, k, v) => setCustosOp(c => ({ ...c, itens: c.itens.map((it, i) => i === idx ? { ...it, [k]: v } : it) }))
        const addItem = (cat) => setCustosOp(c => ({ ...c, itens: [...c.itens, { categoria: cat, descricao: '', valor: '' }] }))
        const rmItem = (idx) => setCustosOp(c => ({ ...c, itens: c.itens.filter((_, i) => i !== idx) }))
        const atualizadoEm = empresa?.config?.custosOperacao?.atualizadoEm

        return (
          <Card>
            <CardHeader title="Custo da Operação (Overhead mensal)" icon="📊" />
            <div style={{ padding:16 }}>
              <div style={{ fontSize:12, color:'#64748B', marginBottom:14, lineHeight:1.6 }}>
                Tudo que a sua operação paga para existir, independente de quantos clientes você tem.
                Esse valor entra automaticamente na <strong>Precificação</strong> como overhead por cliente.
                {atualizadoEm && <span style={{ display:'block', marginTop:4, fontSize:11, color:'#94A3B8' }}>Última atualização: {new Date(atualizadoEm).toLocaleDateString('pt-BR')} — revise a cada 3 a 6 meses.</span>}
              </div>

              {CATEGORIAS.map(cat => {
                const itensCat = custosOp.itens.map((it, idx) => ({ ...it, _idx: idx })).filter(it => it.categoria === cat.v)
                const subtotal = itensCat.reduce((s, i) => s + (parseBRL(i.valor) || 0), 0)
                return (
                  <div key={cat.v} style={{ marginBottom:14, border:'1px solid #F1F5F9', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div>
                        <span style={{ fontSize:12, fontWeight:700, color:'#334155' }}>{cat.l}</span>
                        <span style={{ fontSize:10, color:'#94A3B8', marginLeft:8 }}>{cat.ex}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {subtotal > 0 && <span style={{ fontSize:11, fontWeight:700, color:'#6366F1' }}>{fmtR(subtotal)}</span>}
                        <button onClick={() => addItem(cat.v)} style={{ border:'1px dashed #C7D2FE', background:'#EEF2FF', color:'#4338CA', borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ item</button>
                      </div>
                    </div>
                    {itensCat.map(it => (
                      <div key={it._idx} style={{ display:'grid', gridTemplateColumns:'1fr 130px 28px', gap:8, marginBottom:6 }}>
                        <input style={fi} value={it.descricao} onChange={e => setItem(it._idx, 'descricao', e.target.value)} placeholder="Descrição (ex: Conta Azul — 8 licenças)" />
                        <input style={fi} type="text" inputMode="decimal" value={it.valor} onChange={e => setItem(it._idx, 'valor', e.target.value)} placeholder="Ex: 1.500,00 /mês" />
                        <button onClick={() => rmItem(it._idx)} title="Remover" style={{ border:'none', background:'transparent', color:'#DC2626', cursor:'pointer', fontSize:14 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )
              })}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:16 }}>
                <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Overhead total /mês</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'#0F172A' }}>{fmtR(total)}</div>
                </div>
                <div style={{ background:'#F8FAFC', borderRadius:10, padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Clientes ativos</div>
                  <input style={{ ...fi, textAlign:'center', fontSize:18, fontWeight:700 }} type="number" min="0" value={custosOp.clientesAtivos} onChange={e => setCustosOp(c => ({ ...c, clientesAtivos: e.target.value }))} placeholder="0" />
                </div>
                <div style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius:10, padding:14, textAlign:'center', color:'#fff' }}>
                  <div style={{ fontSize:10, opacity:.85, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Overhead por cliente</div>
                  <div style={{ fontSize:22, fontWeight:800 }}>{fmtR(porCliente)}</div>
                </div>
              </div>

              {total > 0 && nClientes === 0 && (
                <div style={{ marginTop:10, fontSize:11, color:'#D97706', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 12px' }}>
                  ⚠ Informe o número de clientes ativos para calcular o overhead por cliente usado na precificação.
                </div>
              )}
              {total === 0 && (
                <div style={{ marginTop:10, fontSize:11, color:'#D97706', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 12px' }}>
                  ⚠ Overhead zerado = precificação subestimada. Toda operação tem custo fixo — comece pelas ferramentas e contabilidade.
                </div>
              )}
            </div>
            <div style={{ padding:'12px 16px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="primary" onClick={salvarCustosOp}>Salvar custos</Btn>
            </div>
          </Card>
        )
      })()}

      {/* ABA OPERACIONAL */}
      {tab === 'operacional' && (
        <Card>
          <CardHeader title="Configurações operacionais" icon="⚙️" />
          <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Custo hora padrão (R$)',           key:'custoHora',       type:'number', hint:'Usado no cálculo de capacidade' },
              { label:'Dia fechamento mensal',            key:'fechamentoDia',   type:'number', hint:'Dia do mês para fechar o período' },
              { label:'Dia emissão NF',                   key:'nfDia',           type:'number', hint:'Dia do mês para emitir notas fiscais' },
              { label:'Dia reunião estratégica',          key:'reuniaoDia',      type:'number', hint:'Dia do mês para reunião com clientes' },
            ].map(({ label, key, type, hint }) => (
              <div key={key}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</label>
                <input type={type} style={fi} value={opForm[key]||''} onChange={e=>setOpForm(f=>({...f,[key]:+e.target.value}))} min={0} />
                {hint && <div style={{ fontSize:9, color:'#94A3B8', marginTop:3 }}>{hint}</div>}
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="primary" onClick={salvarOp}>Salvar configurações</Btn>
          </div>
        </Card>
      )}

      {tab === 'operacional' && (
        <Card style={{ marginTop:16 }}>
          <CardHeader title="Radar do Cliente" icon="🩺" />
          <div style={{ padding:'8px 16px 16px' }}>
            <div style={{ fontSize:11, color:'#94A3B8', marginBottom:12, lineHeight:1.5 }}>
              O score de saúde de cada cliente é recalculado automaticamente todo dia às 06:00. Use o botão abaixo se quiser forçar um recálculo agora (ex: depois de atualizar responsáveis ou lançar horas em lote).
            </div>
            {radarLog ? (
              <div style={{ fontSize:11, color:'#475569', marginBottom:12 }}>
                Último cálculo: <strong>{new Date(radarLog.executado_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</strong>
                {' · '}{radarLog.clientes_processados} cliente{radarLog.clientes_processados === 1 ? '' : 's'} processado{radarLog.clientes_processados === 1 ? '' : 's'}
                {radarLog.alertas_gerados > 0 && <> · {radarLog.alertas_gerados} alerta{radarLog.alertas_gerados === 1 ? '' : 's'} novo{radarLog.alertas_gerados === 1 ? '' : 's'}</>}
                {radarLog.erros?.length > 0 && <span style={{ color:'#EF4444' }}> · {radarLog.erros.length} erro{radarLog.erros.length === 1 ? '' : 's'}</span>}
              </div>
            ) : (
              <div style={{ fontSize:11, color:'#94A3B8', marginBottom:12 }}>Ainda não rodou nenhum cálculo — as telas usam o cálculo na hora até o primeiro rodar.</div>
            )}
            <Btn variant="primary" disabled={recalcularRadar.isPending} onClick={() => recalcularRadar.mutate()}>
              {recalcularRadar.isPending ? 'Recalculando…' : '🔄 Recalcular agora'}
            </Btn>
            {recalcularRadar.isError && (
              <div style={{ fontSize:11, color:'#EF4444', marginTop:8 }}>Erro: {recalcularRadar.error?.message || 'falha ao chamar a função'}</div>
            )}
            {recalcularRadar.isSuccess && (
              <div style={{ fontSize:11, color:'#15803D', marginTop:8 }}>
                ✓ {recalcularRadar.data?.clientes_processados ?? 0} clientes recalculados.
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'operacional' && (
        <Card style={{ marginTop:16 }}>
          <CardHeader title="Calendário de feriados" icon="📅" />
          <div style={{ padding:'4px 16px 16px' }}>
            <div style={{ fontSize:11, color:'#94A3B8', marginBottom:12, lineHeight:1.5 }}>
              Tarefas com recorrência <strong>"dias úteis"</strong> não são geradas nessas datas. Já vieram cadastrados os feriados nacionais fixos do ano atual e do próximo — adicione aqui os móveis (Carnaval, Páscoa) e os municipais/estaduais dos seus clientes.
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              <input type="date" style={{ ...fi, flex:'0 0 160px' }} value={novoFeriado.data}
                onChange={e=>setNovoFeriado(f=>({...f,data:e.target.value}))} />
              <input style={{ ...fi, flex:1, minWidth:160 }} placeholder="Descrição (ex: Carnaval, Aniversário da cidade...)"
                value={novoFeriado.descricao} onChange={e=>setNovoFeriado(f=>({...f,descricao:e.target.value}))} />
              <Btn variant="primary" disabled={!novoFeriado.data || !novoFeriado.descricao.trim() || createFeriado.isPending}
                onClick={async () => {
                  try {
                    await createFeriado.mutateAsync(novoFeriado)
                    setNovoFeriado({ data:'', descricao:'' })
                  } catch (err) {
                    alert('Erro ao adicionar feriado: ' + (err?.message || 'já existe um feriado nessa data?'))
                  }
                }}>
                + Adicionar
              </Btn>
            </div>

            {feriados.length === 0 ? (
              <div style={{ fontSize:12, color:'#94A3B8', textAlign:'center', padding:'16px 0' }}>Nenhum feriado cadastrado ainda.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:280, overflowY:'auto' }}>
                {feriados.map(f => (
                  <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:8, background:'#F8FAFC' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#475569', width:80, flexShrink:0 }}>
                      {new Date(f.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span style={{ fontSize:12, color:'#334155', flex:1 }}>{f.descricao}</span>
                    <button onClick={() => { if(confirm('Remover este feriado?')) deleteFeriado.mutate(f.id) }}
                      style={{ border:'none', background:'none', cursor:'pointer', color:'#94A3B8', fontSize:16, lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ABA PROPOSTA */}
      {tab === 'seguranca' && (
        <Card>
          <CardHeader title="Verificação em duas etapas (2FA)" icon="🔐" />
          <div style={{ padding:'8px 16px 20px' }}>
            <div style={{ fontSize:12, color:'#64748B', marginBottom:16, lineHeight:1.6 }}>
              Com o 2FA ativo, além da senha você precisa informar um código gerado por um app autenticador (Google Authenticator, Authy, etc) toda vez que fizer login.
              Isso protege sua conta mesmo que sua senha seja descoberta.
            </div>

            {mfaMsg && (
              <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:14, fontSize:12, fontWeight:600,
                background: mfaMsg.includes('✅') ? '#F0FDF4' : '#FEF2F2',
                color: mfaMsg.includes('✅') ? '#15803D' : '#991B1B',
                border: `1px solid ${mfaMsg.includes('✅') ? '#BBF7D0' : '#FECDD3'}` }}>
                {mfaMsg}
              </div>
            )}

            {mfaEnrolling ? (
              <div style={{ maxWidth:400 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#0F172A', marginBottom:12 }}>
                  📱 Configure o app autenticador
                </div>
                <div style={{ fontSize:12, color:'#475569', marginBottom:12, lineHeight:1.6 }}>
                  1. Instale o <strong>Google Authenticator</strong> ou <strong>Authy</strong> no celular<br/>
                  2. Escaneie o QR code abaixo (ou digite a chave manualmente)<br/>
                  3. Digite o código de 6 dígitos que aparecer no app
                </div>
                <img src={mfaEnrolling.qrCode} alt="QR Code 2FA" style={{ width:180, height:180, border:'1px solid #E2E8F0', borderRadius:12, display:'block', marginBottom:12 }} />
                <div style={{ fontSize:10, color:'#94A3B8', fontFamily:'monospace', background:'#F8FAFC', padding:'6px 10px', borderRadius:6, marginBottom:14, wordBreak:'break-all' }}>
                  Chave manual: {mfaEnrolling.secret}
                </div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Código do app *</label>
                <input type="text" inputMode="numeric" maxLength={7} value={mfaCode}
                  onChange={e=>setMfaCode(e.target.value)} placeholder="000 000" autoFocus
                  style={{ ...fi, fontFamily:'monospace', fontSize:20, letterSpacing:'0.3em', textAlign:'center', marginBottom:12 }} />
                <div style={{ display:'flex', gap:8 }}>
                  <Btn variant="primary" disabled={mfaLoading || mfaCode.replace(/\s/g,'').length < 6} onClick={handleVerifyEnroll}>
                    {mfaLoading ? 'Verificando...' : '✓ Ativar 2FA'}
                  </Btn>
                  <Btn onClick={() => { setMfaEnrolling(null); setMfaCode('') }}>Cancelar</Btn>
                </div>
              </div>
            ) : mfaFactors.length > 0 ? (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>✅</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#15803D' }}>2FA ativo</div>
                    <div style={{ fontSize:11, color:'#16A34A' }}>Sua conta está protegida com verificação em duas etapas.</div>
                  </div>
                </div>
                <Btn disabled={mfaLoading} onClick={() => handleUnenroll(mfaFactors[0].id)}>
                  {mfaLoading ? 'Aguarde...' : '🗑 Desativar 2FA'}
                </Btn>
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, marginBottom:14 }}>
                  <span style={{ fontSize:20 }}>⚠️</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#92400E' }}>2FA desativado</div>
                    <div style={{ fontSize:11, color:'#B45309' }}>Recomendamos ativar para proteger o acesso ao cofre de senhas.</div>
                  </div>
                </div>
                <Btn variant="primary" disabled={mfaLoading} onClick={handleEnroll}>
                  {mfaLoading ? 'Aguarde...' : '🔐 Ativar verificação em duas etapas'}
                </Btn>
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'proposta' && (
        <Card>
          <CardHeader title="Configurações da proposta comercial" icon="📊" />
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'Representante legal',  key:'representante', placeholder:'Cláudia Bernardo' },
                { label:'Cargo',                key:'cargo',         placeholder:'Sócia-Diretora' },
                { label:'CPF do representante', key:'cpf_rep',       placeholder:'000.000.000-00' },
                { label:'Instagram',            key:'instagram',     placeholder:'@empreendabpo' },
                { label:'Endereço',             key:'endereco',      placeholder:'Rua...' },
                { label:'Cidade/UF',            key:'cidade',        placeholder:'Barueri/SP' },
                { label:'Foro contratual',      key:'foro',          placeholder:'Barueri/SP' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</label>
                  <input style={fi} value={propForm[key]||''} onChange={e=>setPropForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} />
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Quem somos (texto da proposta)</label>
              <textarea style={{ ...fi, height:80, resize:'vertical' }} value={propForm.quemSomos||''} onChange={e=>setPropForm(f=>({...f,quemSomos:e.target.value}))} placeholder="Descreva sua empresa..." />
            </div>
            <div style={{ fontWeight:700, fontSize:12, color:'#475569', paddingBottom:6, borderBottom:'1px solid #F1F5F9' }}>Números de impacto</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
              {[1,2,3,4].map(n => (
                <div key={n}>
                  <input style={{ ...fi, marginBottom:6, textAlign:'center', fontWeight:700 }} value={propForm[`num${n}_valor`]||''} onChange={e=>setPropForm(f=>({...f,[`num${n}_valor`]:e.target.value}))} placeholder="+100" />
                  <input style={{ ...fi, fontSize:11 }} value={propForm[`num${n}_label`]||''} onChange={e=>setPropForm(f=>({...f,[`num${n}_label`]:e.target.value}))} placeholder="Descrição" />
                </div>
              ))}
            </div>
            <div style={{ fontWeight:700, fontSize:12, color:'#475569', paddingBottom:6, borderBottom:'1px solid #F1F5F9' }}>Depoimentos (até 3)</div>
            {[1,2,3].map(n => (
              <div key={n} style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10 }}>
                <input style={fi} value={propForm[`dep${n}_nome`]||''} onChange={e=>setPropForm(f=>({...f,[`dep${n}_nome`]:e.target.value}))} placeholder={`Nome cliente ${n}`} />
                <input style={fi} value={propForm[`dep${n}_texto`]||''} onChange={e=>setPropForm(f=>({...f,[`dep${n}_texto`]:e.target.value}))} placeholder="Depoimento..." />
              </div>
            ))}
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end' }}>
            <Btn variant="primary" onClick={salvarProposta}>Salvar configurações da proposta</Btn>
          </div>
        </Card>
      )}

      {/* ABA MEU PLANO — só admin */}
      {tab === 'integracoes' && (
        <div style={{ maxWidth:600 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>🔗 Integrações</div>
          <div style={{ fontSize:12, color:'#64748B', marginBottom:20 }}>Conecte serviços externos ao Fluxe BPO.</div>

          {/* Autentique */}
          <div style={{ border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:20 }}>✍️</span>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>Autentique — Assinatura Digital</div>
                <div style={{ fontSize:11, color:'#64748B' }}>Envie contratos para assinatura eletrônica diretamente pelo Fluxe</div>
              </div>
              {empForm.autentique_token
                ? <span style={{ marginLeft:'auto', background:'#DCFCE7', color:'#16A34A', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>✓ Conectado</span>
                : <span style={{ marginLeft:'auto', background:'#FEF3C7', color:'#D97706', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>Não configurado</span>
              }
            </div>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:12, lineHeight:1.6, background:'#F8FAFC', borderRadius:8, padding:'10px 12px' }}>
              <strong>Como configurar:</strong><br/>
              1. Acesse <a href="https://autentique.com.br" target="_blank" rel="noopener noreferrer" style={{ color:'#6366F1' }}>autentique.com.br</a> e crie uma conta gratuita<br/>
              2. No painel do Autentique, vá em <strong>Configurações → Integrações → API</strong><br/>
              3. Copie o token e cole no campo abaixo<br/>
              4. Clique em <strong>Salvar dados</strong>
            </div>
            <label style={{ fontSize:11, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>Token da API</label>
            <input
              type="password"
              value={empForm.autentique_token||''}
              onChange={e => setEmpForm(f => ({ ...f, autentique_token: e.target.value }))}
              placeholder="Cole aqui o token do Autentique..."
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'monospace', background:'#fff', boxSizing:'border-box' }}
            />
          </div>

          {/* WhatsApp — dois caminhos possíveis */}
          <div style={{ border:'1px solid #E2E8F0', borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:20 }}>💬</span>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>WhatsApp</div>
                <div style={{ fontSize:11, color:'#64748B' }}>Envie e receba mensagens de clientes direto pelo Fluxe</div>
              </div>
              {((empForm.wa_phone_number_id && empForm.wa_access_token) || (empForm.zapi_instance_id && empForm.zapi_instance_token))
                ? <span style={{ marginLeft:'auto', background:'#DCFCE7', color:'#16A34A', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>✓ Conectado</span>
                : <span style={{ marginLeft:'auto', background:'#FEF3C7', color:'#D97706', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>Não configurado</span>
              }
            </div>

            <div style={{ display:'flex', gap:6, marginBottom:16, background:'#F1F5F9', padding:4, borderRadius:10 }}>
              <button onClick={() => setWaProviderTab('meta')}
                style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                  background: waProviderTab==='meta' ? '#fff' : 'transparent', color: waProviderTab==='meta' ? '#0F172A' : '#64748B',
                  boxShadow: waProviderTab==='meta' ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
                ✅ API oficial (Meta)
              </button>
              <button onClick={() => setWaProviderTab('zapi')}
                style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                  background: waProviderTab==='zapi' ? '#fff' : 'transparent', color: waProviderTab==='zapi' ? '#0F172A' : '#64748B',
                  boxShadow: waProviderTab==='zapi' ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
                ⚡ Conexão rápida (Z-API)
              </button>
            </div>

            {waProviderTab === 'meta' ? (
              <>
                <Btn variant="primary" onClick={conectarWhatsApp} disabled={waConectando}>
                  {waConectando ? 'Conectando...' : '📱 Conectar WhatsApp'}
                </Btn>
                <div style={{ fontSize:10, color:'#94A3B8', marginTop:6, marginBottom:16 }}>
                  Abre o login do Facebook — escolha ou crie o número de WhatsApp da sua empresa, sem precisar copiar/colar nada técnico. Sem risco de bloqueio.
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:'#64748B', marginBottom:8 }}>Ou configure manualmente (avançado)</div>
                <div style={{ fontSize:11, color:'#64748B', marginBottom:12, lineHeight:1.6, background:'#F8FAFC', borderRadius:8, padding:'10px 12px' }}>
                  <strong>Como configurar:</strong><br/>
                  1. No <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color:'#6366F1' }}>Meta Business Manager</a>, crie/abra um App com o produto <strong>WhatsApp</strong> adicionado<br/>
                  2. Em <strong>WhatsApp → Configuração da API</strong>, copie o <strong>Phone Number ID</strong> e gere um <strong>Token de acesso permanente</strong> (Token temporário expira em 24h)<br/>
                  3. Cole os dois campos abaixo e clique em <strong>Testar e salvar</strong><br/>
                  4. Em <strong>WhatsApp → Configuração → Webhooks</strong>, registre a URL <code style={{ fontSize:10 }}>{import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook</code> com o token de verificação combinado com o time técnico
                </div>
                <label style={{ fontSize:11, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>Phone Number ID</label>
                <input
                  type="text"
                  value={empForm.wa_phone_number_id||''}
                  onChange={e => setEmpForm(f => ({ ...f, wa_phone_number_id: e.target.value }))}
                  placeholder="Ex: 123456789012345"
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'monospace', background:'#fff', boxSizing:'border-box', marginBottom:10 }}
                />
                <label style={{ fontSize:11, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>Access Token</label>
                <input
                  type="password"
                  value={empForm.wa_access_token||''}
                  onChange={e => setEmpForm(f => ({ ...f, wa_access_token: e.target.value }))}
                  placeholder="Cole aqui o token de acesso da Meta..."
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'monospace', background:'#fff', boxSizing:'border-box' }}
                />
                {waStatus && (
                  <div style={{ fontSize:11, padding:'8px 10px', borderRadius:8, marginTop:10, background: waStatus.ok?'#F0FDF4':'#FEF2F2', color: waStatus.ok?'#15803D':'#991B1B', border:`1px solid ${waStatus.ok?'#BBF7D0':'#FECDD3'}` }}>
                    {waStatus.msg}
                  </div>
                )}
                <div style={{ marginTop:10 }}>
                  <Btn variant="primary" onClick={testarWhatsapp} disabled={waTesting}>
                    {waTesting ? 'Testando...' : 'Testar e salvar'}
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <div style={{ background:'#FEF2F2', border:'1px solid #FECDD3', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#991B1B', marginBottom:4 }}>⚠️ Conexão não-oficial — leia antes de usar</div>
                  <div style={{ fontSize:11, color:'#7F1D1D', lineHeight:1.6 }}>
                    Esse caminho conecta o número escaneando um QR Code (como o WhatsApp Web), sem passar pela aprovação da Meta.
                    É mais rápido de configurar, mas <strong>a Meta pode bloquear esse número a qualquer momento, sem aviso prévio</strong> —
                    incluindo perda de acesso ao histórico de conversas. Use só se você entende e aceita esse risco pro seu número.
                  </div>
                </div>

                {!zapiRiscoConfirmado ? (
                  <button onClick={() => setZapiRiscoConfirmado(true)}
                    style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #FECDD3', background:'#fff', color:'#991B1B', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    Entendi o risco, quero configurar mesmo assim
                  </button>
                ) : (
                  <>
                    <div style={{ fontSize:11, color:'#64748B', marginBottom:12, lineHeight:1.6, background:'#F8FAFC', borderRadius:8, padding:'10px 12px' }}>
                      <strong>Como configurar:</strong><br/>
                      1. Crie uma conta em <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" style={{ color:'#6366F1' }}>z-api.io</a> e crie uma instância<br/>
                      2. No painel da instância, escaneie o QR Code com o WhatsApp do número que vai usar<br/>
                      3. Copie o <strong>Instance ID</strong> e o <strong>Instance Token</strong> (e o Client-Token, se tiver ativado em Segurança) e cole abaixo<br/>
                      4. Clique em <strong>Testar e salvar</strong><br/>
                      5. No painel da instância, em <strong>Webhooks → Ao receber</strong>, cole a URL <code style={{ fontSize:10 }}>{import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapi-webhook</code>
                    </div>
                    <label style={{ fontSize:11, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>Instance ID</label>
                    <input
                      type="text"
                      value={empForm.zapi_instance_id||''}
                      onChange={e => setEmpForm(f => ({ ...f, zapi_instance_id: e.target.value }))}
                      placeholder="Ex: 3A1B2C3D4E5F..."
                      style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'monospace', background:'#fff', boxSizing:'border-box', marginBottom:10 }}
                    />
                    <label style={{ fontSize:11, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>Instance Token</label>
                    <input
                      type="password"
                      value={empForm.zapi_instance_token||''}
                      onChange={e => setEmpForm(f => ({ ...f, zapi_instance_token: e.target.value }))}
                      placeholder="Cole aqui o token da instância..."
                      style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'monospace', background:'#fff', boxSizing:'border-box', marginBottom:10 }}
                    />
                    <label style={{ fontSize:11, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>Client-Token (opcional, se ativou Segurança da conta)</label>
                    <input
                      type="password"
                      value={empForm.zapi_client_token||''}
                      onChange={e => setEmpForm(f => ({ ...f, zapi_client_token: e.target.value }))}
                      placeholder="Cole aqui o token de segurança da conta..."
                      style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:12, fontFamily:'monospace', background:'#fff', boxSizing:'border-box' }}
                    />
                    {zapiStatus && (
                      <div style={{ fontSize:11, padding:'8px 10px', borderRadius:8, marginTop:10, background: zapiStatus.ok?'#F0FDF4':'#FEF2F2', color: zapiStatus.ok?'#15803D':'#991B1B', border:`1px solid ${zapiStatus.ok?'#BBF7D0':'#FECDD3'}` }}>
                        {zapiStatus.msg}
                      </div>
                    )}
                    <div style={{ marginTop:10 }}>
                      <Btn variant="primary" onClick={testarZapi} disabled={zapiTesting}>
                        {zapiTesting ? 'Testando...' : 'Testar e salvar'}
                      </Btn>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <Btn variant="primary" onClick={salvarEmpresa}>Salvar dados</Btn>
        </div>
      )}

      {tab === 'plano' && profile?.perfil === 'admin' && (() => {
        const plano = empresa?.plano || 'trial'
        const expira = empresa?.trial_expira_em ? new Date(empresa.trial_expira_em) : null
        const diasRestantes = expira ? Math.max(0, Math.ceil((expira - new Date()) / (1000*60*60*24))) : 0
        const paymentUrl = empresa?.asaas_payment_url
        const PLANOS = [
          { id:'essencial', nome:'Essencial', preco:'R$ 97/mês',  desc:'Sistema completo (Radar, CRM, Capacidade, Meta de crescimento) · Usuários ilimitados · Sem WhatsApp integrado' },
        ]
        // Mentorado do BPO Lucrativo usando o Pro de cortesia (sem assinatura
        // real) — oferece a conversão pra assinante mensal, preço especial.
        const ofereceConversaoMentorado = plano === 'pro'
          && empresa?.mentorado_bpo_lucrativo
          && !empresa?.asaas_subscription_id
          && !empresa?.oferta_conversao_oculta
        return (
          <Card>
            <CardHeader title="Meu Plano" icon="💳" />
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:20 }}>

              {/* Status atual */}
              <div style={{ background: plano==='trial'?'#F0F9FF':'#F0FDF4', border:`1px solid ${plano==='trial'?'#BAE6FD':'#BBF7D0'}`, borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>Plano atual</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', textTransform:'capitalize' }}>
                    {plano === 'trial' ? 'Trial gratuito' : plano === 'pro' ? 'Completo' : plano === 'essencial' ? 'Essencial' : plano}
                  </div>
                  {plano === 'trial' && expira && (
                    <div style={{ fontSize:12, color: diasRestantes<=2?'#EF4444':'#0369A1', marginTop:2 }}>
                      {diasRestantes === 0 ? 'Expira hoje' : `${diasRestantes} dia${diasRestantes>1?'s':''} restante${diasRestantes>1?'s':''}`}
                    </div>
                  )}
                  {plano !== 'trial' && <div style={{ fontSize:12, color:'#16A34A', marginTop:2 }}>✓ Ativo</div>}
                </div>
                {plano === 'trial' && (
                  <div style={{ height:8, background:'#BAE6FD', borderRadius:99, width:120, overflow:'hidden', alignSelf:'center' }}>
                    <div style={{ height:'100%', borderRadius:99, background:'#0EA5E9', width:`${Math.round(((7-diasRestantes)/7)*100)}%` }} />
                  </div>
                )}
              </div>

              {/* Conversão de mentorado pra assinante mensal */}
              {ofereceConversaoMentorado && (
                <div style={{ border:'2px solid #6366F1', borderRadius:12, padding:16, background:'#F5F3FF' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:4 }}>Continuar usando o Fluxe</div>
                  <div style={{ fontSize:12, color:'#475569', marginBottom:12, lineHeight:1.5 }}>
                    Você está usando o Fluxe com o acesso liberado da mentoria BPO Lucrativo. Pra continuar usando depois, é só assinar:
                  </div>
                  <div style={{ fontSize:24, fontWeight:800, color:'#6366F1', marginBottom:12 }}>
                    R$ 97<span style={{ fontSize:14, fontWeight:400, color:'#94A3B8' }}>/mês</span>
                  </div>
                  <button
                    onClick={() => handleAssinar('essencial')}
                    disabled={assinando}
                    style={{ display:'block', width:'100%', textAlign:'center', background: assinando ? '#A5B4FC' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', padding:'13px', borderRadius:10, fontSize:14, fontWeight:700, border:'none', cursor: assinando ? 'not-allowed' : 'pointer' }}>
                    {assinando ? 'Gerando link...' : 'Assinar por R$ 97/mês →'}
                  </button>
                </div>
              )}

              {/* Planos */}
              {plano === 'trial' && (
                <>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>Escolha seu plano</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, maxWidth:320 }}>
                    {PLANOS.map(p => {
                      const sel = planSel === p.id
                      return (
                        <div key={p.id} onClick={()=>setPlanSel(p.id)} style={{ border:`2px solid ${sel?'#6366F1':'#E2E8F0'}`, borderRadius:12, padding:16, background: sel?'#F5F3FF':'#fff', position:'relative', cursor:'pointer', transition:'all .15s' }}>
                          {p.destaque && <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:'#6366F1', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 12px', borderRadius:99 }}>Mais popular</div>}
                          {sel && <div style={{ position:'absolute', top:10, right:10, width:18, height:18, borderRadius:99, background:'#6366F1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff' }}>✓</div>}
                          <div style={{ fontSize:14, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{p.nome}</div>
                          <div style={{ fontSize:20, fontWeight:800, color:'#6366F1', marginBottom:6 }}>{p.preco}</div>
                          <div style={{ fontSize:11, color:'#64748B', lineHeight:1.5 }}>{p.desc}</div>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => handleAssinar()}
                    disabled={assinando}
                    style={{ display:'block', width:'100%', textAlign:'center', background: assinando ? '#A5B4FC' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', padding:'13px', borderRadius:10, fontSize:14, fontWeight:700, border:'none', cursor: assinando ? 'not-allowed' : 'pointer' }}>
                    {assinando ? 'Gerando link...' : 'Assinar plano Essencial →'}
                  </button>
                </>
              )}

              {/* Cancelar */}
              <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:16 }}>
                <div style={{ fontSize:12, color:'#94A3B8', marginBottom:8 }}>Para cancelar sua assinatura, entre em contato com o suporte.</div>
                <a
                  href={`https://wa.me/5511917101173?text=Quero+cancelar+minha+assinatura+do+Fluxe+BPO+-+Empresa:+${encodeURIComponent(empresa?.nome||'')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:13, color:'#EF4444', textDecoration:'none', fontWeight:600 }}>
                  Solicitar cancelamento →
                </a>
              </div>

            </div>
          </Card>
        )
      })()}

      {/* MODAL EDITAR USUÁRIO */}
      {editUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:440, boxShadow:'0 25px 50px rgba(0,0,0,.15)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontWeight:700, fontSize:14 }}>✏️ Editar usuário</span>
              <button onClick={()=>setEditUser(null)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:20, color:'#94A3B8' }}>×</button>
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Nome</label>
                <input style={fi} value={editUser.nome||''} onChange={e=>setEditUser(f=>({...f,nome:e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Perfil</label>
                <select style={fi} value={editUser.perfil||'operador'} onChange={e=>setEditUser(f=>({...f,perfil:e.target.value}))}>
                  {PERFIS.map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em' }}>Custo/hora (R$)</label>
                <input type="number" style={fi} value={editUser.custo_hora||0} onChange={e=>setEditUser(f=>({...f,custo_hora:+e.target.value}))} min={0} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                <input type="checkbox" checked={!!editUser.ativo} onChange={e=>setEditUser(f=>({...f,ativo:e.target.checked}))} style={{ width:16, height:16, accentColor:'#6366F1' }} />
                Usuário ativo
              </label>
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <Btn onClick={()=>setEditUser(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={()=>editarUser.mutate(editUser)} disabled={editarUser.isPending}>
                {editarUser.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      {deleteUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:400, boxShadow:'0 25px 50px rgba(0,0,0,.15)' }}>
            <div style={{ padding:24, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🗑️</div>
              <div style={{ fontWeight:700, fontSize:16, color:'#0F172A', marginBottom:8 }}>Excluir usuário?</div>
              <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>
                <strong>{deleteUser.nome}</strong> será removido da equipe. Esta ação não pode ser desfeita.
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <Btn onClick={()=>setDeleteUser(null)}>Cancelar</Btn>
                <Btn variant="danger" onClick={()=>excluirUser.mutate(deleteUser)} disabled={excluirUser.isPending}>
                  {excluirUser.isPending ? 'Excluindo...' : 'Sim, excluir'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
