import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

const FEATURES = [
  { icon:'✅', title:'Gestão de tarefas', desc:'Organize toda a operação do BPO com tarefas recorrentes, checklists e histórico completo.' },
  { icon:'📅', title:'Controle de prazos', desc:'Agenda visual com visão mensal, semanal e diária. Nunca mais perca um vencimento.' },
  { icon:'🏢', title:'Jornada do cliente', desc:'Acompanhe cada cliente desde o onboarding até a operação mensal em uma única tela.' },
  { icon:'🔒', title:'Cofre de acessos', desc:'Gerencie senhas e credenciais dos clientes com segurança e controle de quem acessa.' },
]

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { signIn, signUp, resetPassword, error } = useAuthStore()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setMsg(error)
    } else if (mode === 'signup') {
      if (!nome || !nomeEmpresa) { setMsg('Preencha todos os campos'); setLoading(false); return }
      const { error } = await signUp(email, password, nome, nomeEmpresa)
      if (error) setMsg(error)
      else setMsg('Conta criada! Verifique seu e-mail para confirmar.')
    } else {
      const { error } = await resetPassword(email)
      if (error) setMsg(error)
      else setMsg('E-mail de recuperação enviado!')
    }
    setLoading(false)
  }

  const isSuccess = msg.includes('criada') || msg.includes('enviado')

  return (
    <div style={{
      minHeight:'100vh', display:'flex',
      fontFamily:"'Inter','Poppins',sans-serif",
    }}>
      {/* ── LADO ESQUERDO: Formulário ── */}
      <div style={{
        width:'100%', maxWidth:480, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'40px 48px',
        background:'#fff', position:'relative', zIndex:1,
        boxShadow:'4px 0 40px rgba(0,0,0,.08)'
      }}>
        {/* Logo */}
        <div style={{ width:'100%', maxWidth:360, marginBottom:40 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <svg viewBox="256 22 137 191" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lt2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b070ff"/><stop offset="100%" stopColor="#8855f5"/>
                </linearGradient>
                <linearGradient id="lb2" x1="0%" y1="0%" x2="30%" y2="100%">
                  <stop offset="0%" stopColor="#5585ff"/><stop offset="45%" stopColor="#38aaff"/>
                  <stop offset="100%" stopColor="#2dd4ff"/>
                </linearGradient>
              </defs>
              <path d="M 8 65 C 8 32 32 4 64 4 L 160 4 C 183 4 200 21 200 44 C 200 67 183 84 160 84 L 56 84 C 50 84 46 88 46 94 L 46 107 C 46 109.5 44 111 42 111 L 18 111 C 14.5 111 13 109 13 107 L 13 83 C 11 75 8 70 8 65 Z" fill="url(#lt2)"/>
              <path d="M 13 120 C 13 116 16 113 20 113 L 155 113 C 178 113 196 131 196 154 C 196 177 178 195 155 195 L 68 195 C 62 195 59 199 59 205 L 59 242 C 59 248 54 252 48 252 L 22 252 C 16 252 13 248 13 242 Z" fill="url(#lb2)"/>
            </svg>
            <div>
              <span style={{ fontSize:20, fontWeight:800, color:'#0F172A', letterSpacing:'-.5px' }}>Fluxe</span>
              <span style={{ fontSize:10, fontWeight:800, letterSpacing:'.2em', marginLeft:4,
                background:'linear-gradient(90deg,#A855F7,#6366F1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>BPO</span>
            </div>
          </div>
          <div style={{ fontSize:11, color:'#94A3B8' }}>Plataforma operacional para BPO Financeiro</div>
        </div>

        {/* Formulário */}
        <div style={{ width:'100%', maxWidth:360 }}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0F172A', margin:0, marginBottom:6 }}>
              {mode === 'login' ? 'Bem-vindo(a) de volta 👋' : mode === 'signup' ? 'Criar sua conta' : 'Recuperar senha'}
            </h1>
            <p style={{ fontSize:13, color:'#64748B', margin:0 }}>
              {mode === 'login' ? 'Entre com sua conta para acessar a plataforma' : mode === 'signup' ? 'Configure sua empresa em minutos' : 'Enviaremos um link para seu e-mail'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <Field label="Seu nome" value={nome} onChange={setNome} placeholder="Maria Silva" />
                <Field label="Nome da empresa (BPO)" value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: Empreenda BPO" />
              </>
            )}
            <Field label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" />
            {mode !== 'reset' && (
              <div style={{ marginBottom:20, position:'relative' }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Senha</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="••••••••" required
                    style={{ width:'100%', padding:'11px 40px 11px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#0F172A', fontSize:13, outline:'none', boxSizing:'border-box', transition:'border .15s' }}
                    onFocus={e=>e.target.style.borderColor='#6366F1'}
                    onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:14 }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
            )}

            {(msg || error) && (
              <div style={{ fontSize:12, padding:'10px 12px', borderRadius:8, marginBottom:16,
                background: isSuccess ? '#F0FDF4' : '#FEF2F2',
                color: isSuccess ? '#15803D' : '#991B1B',
                border: `1px solid ${isSuccess ? '#BBF7D0' : '#FECDD3'}`,
                fontWeight:500
              }}>
                {isSuccess ? '✅ ' : '⚠️ '}{msg || error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px', borderRadius:10, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color:'#fff', fontSize:14, fontWeight:700,
              opacity:loading?.7:1, transition:'all .2s',
              boxShadow:'0 4px 14px rgba(99,102,241,.4)',
              marginBottom:16
            }}>
              {loading ? '⏳ Aguarde...' : mode === 'login' ? 'Entrar no Fluxe BPO →' : mode === 'signup' ? 'Criar minha conta →' : 'Enviar e-mail de recuperação'}
            </button>
          </form>

          <div style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:8 }}>
            {mode === 'login' && (
              <>
                <button onClick={()=>setMode('reset')} style={{ background:'none', border:'none', color:'#94A3B8', cursor:'pointer', fontSize:12 }}>
                  Esqueci minha senha
                </button>
                <div style={{ fontSize:12, color:'#64748B' }}>
                  Não tem conta?{' '}
                  <button onClick={()=>setMode('signup')} style={{ background:'none', border:'none', color:'#6366F1', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                    Criar agora
                  </button>
                </div>
              </>
            )}
            {(mode === 'signup' || mode === 'reset') && (
              <button onClick={()=>setMode('login')} style={{ background:'none', border:'none', color:'#6366F1', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                ← Voltar para o login
              </button>
            )}
          </div>

          <div style={{ marginTop:32, paddingTop:20, borderTop:'1px solid #F1F5F9', textAlign:'center', fontSize:10, color:'#CBD5E1' }}>
            🔒 Seus dados são protegidos e isolados por empresa
          </div>
        </div>
      </div>

      {/* ── LADO DIREITO: Benefícios ── */}
      <div style={{
        flex:1, background:'linear-gradient(135deg,#0F0C29,#302B63,#24243E)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'60px 48px', position:'relative', overflow:'hidden',
      }}>
        {/* Orbs decorativos */}
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.25) 0%,transparent 70%)', top:-150, right:-150, pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,.2) 0%,transparent 70%)', bottom:-100, left:-100, pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,211,238,.15) 0%,transparent 70%)', top:'40%', right:'10%', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:480, width:'100%' }}>
          {/* Headline */}
          <div style={{ marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.15em', color:'#8B5CF6', textTransform:'uppercase', marginBottom:12 }}>
              Fluxe BPO Platform
            </div>
            <h2 style={{ fontSize:32, fontWeight:800, color:'#F1F5F9', lineHeight:1.2, margin:0, marginBottom:14 }}>
              Sua operação BPO<br />
              <span style={{ background:'linear-gradient(90deg,#A855F7,#6366F1,#22D3EE)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                no controle total
              </span>
            </h2>
            <p style={{ fontSize:14, color:'#94A3B8', margin:0, lineHeight:1.6 }}>
              Tudo que sua equipe precisa para gerenciar clientes, tarefas e prazos em um só lugar.
            </p>
          </div>

          {/* Features */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:48 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start',
                padding:'16px', borderRadius:12,
                background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)',
                backdropFilter:'blur(10px)' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(99,102,241,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', marginBottom:3 }}>{f.title}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', lineHeight:1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { v:'100%', l:'Dados isolados' },
              { v:'Multi', l:'Empresa' },
              { v:'24/7', l:'Disponível' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign:'center', padding:'14px 10px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize:18, fontWeight:800, color:'#F1F5F9', marginBottom:2 }}>{s.v}</div>
                <div style={{ fontSize:10, color:'#64748B', fontWeight:600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>
        {label}
      </label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} required
        style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#0F172A', fontSize:13, outline:'none', boxSizing:'border-box', transition:'border .15s' }}
        onFocus={e=>e.target.style.borderColor='#6366F1'}
        onBlur={e=>e.target.style.borderColor='#E2E8F0'} />
    </div>
  )
}
