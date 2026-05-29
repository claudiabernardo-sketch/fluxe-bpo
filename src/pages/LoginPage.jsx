import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // login | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0B1220 0%, #1E293B 50%, #0B1220 100%)',
      padding: '16px',
    }}>
      {/* Orbs */}
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 70%)',
        top:-100, right:-100, pointerEvents:'none' }} />
      <div style={{ position:'fixed', width:300, height:300, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(34,211,238,.15) 0%,transparent 70%)',
        bottom:-80, left:-60, pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <svg viewBox="256 22 137 191" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lt" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b070ff"/><stop offset="100%" stopColor="#8855f5"/>
                </linearGradient>
                <linearGradient id="lb" x1="0%" y1="0%" x2="30%" y2="100%">
                  <stop offset="0%" stopColor="#5585ff"/><stop offset="45%" stopColor="#38aaff"/>
                  <stop offset="100%" stopColor="#2dd4ff"/>
                </linearGradient>
              </defs>
              <path d="M 8 65 C 8 32 32 4 64 4 L 160 4 C 183 4 200 21 200 44 C 200 67 183 84 160 84 L 56 84 C 50 84 46 88 46 94 L 46 107 C 46 109.5 44 111 42 111 L 18 111 C 14.5 111 13 109 13 107 L 13 83 C 11 75 8 70 8 65 Z" fill="url(#lt)"/>
              <path d="M 13 120 C 13 116 16 113 20 113 L 155 113 C 178 113 196 131 196 154 C 196 177 178 195 155 195 L 68 195 C 62 195 59 199 59 205 L 59 242 C 59 248 54 252 48 252 L 22 252 C 16 252 13 248 13 242 Z" fill="url(#lb)"/>
            </svg>
            <div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:22, fontWeight:700, color:'#F1F5F9', letterSpacing:'-.5px' }}>Fluxe</div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:9, fontWeight:800, letterSpacing:'.2em', background:'linear-gradient(90deg,#A855F7,#6366F1,#22D3EE)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>BPO</div>
            </div>
          </div>
          <div style={{ fontFamily:"'Poppins',sans-serif", color:'#94A3B8', fontSize:12 }}>
            Plataforma operacional para BPO Financeiro
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:'#1E293B', borderRadius:20, padding:28,
          border:'1px solid rgba(99,102,241,.2)',
          boxShadow:'0 24px 60px rgba(0,0,0,.4)'
        }}>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:16, fontWeight:600, color:'#F1F5F9', marginBottom:4 }}>
            {mode === 'login' ? 'Bem-vindo(a) de volta' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}
          </div>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, color:'#64748B', marginBottom:24 }}>
            {mode === 'login' ? 'Entre com sua conta para continuar' : mode === 'signup' ? 'Configure sua empresa em minutos' : 'Enviaremos um link para seu e-mail'}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <Field label="Seu nome" value={nome} onChange={setNome} placeholder="Maria Silva" />
                <Field label="Nome da empresa (BPO)" value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Fluxe BPO" />
              </>
            )}
            <Field label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" />
            {mode !== 'reset' && (
              <Field label="Senha" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
            )}

            {(msg || error) && (
              <div style={{ fontSize:11, padding:'8px 10px', borderRadius:8, marginBottom:12,
                background: msg.includes('criada') || msg.includes('enviado') ? '#052e16' : '#2D1515',
                color: msg.includes('criada') || msg.includes('enviado') ? '#4ade80' : '#fca5a5',
                border: `1px solid ${msg.includes('criada') || msg.includes('enviado') ? '#166534' : '#7f1d1d'}`
              }}>
                {msg || error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:12, borderRadius:12, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#A855F7,#6366F1 50%,#22D3EE)',
              color:'#fff', fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700,
              opacity: loading ? .7 : 1, transition:'opacity .2s',
              boxShadow:'0 4px 20px rgba(99,102,241,.4)',
            }}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar no Fluxe BPO' : mode === 'signup' ? 'Criar conta' : 'Enviar e-mail'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:16, display:'flex', flexDirection:'column', gap:6 }}>
            {mode === 'login' && (
              <>
                <span style={{ fontSize:11, color:'#64748B' }}>
                  Não tem conta?{' '}
                  <button onClick={() => setMode('signup')} style={{ background:'none', border:'none', color:'#6366F1', cursor:'pointer', fontWeight:600, fontSize:11 }}>
                    Criar agora
                  </button>
                </span>
                <button onClick={() => setMode('reset')} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:11 }}>
                  Esqueci minha senha
                </button>
              </>
            )}
            {(mode === 'signup' || mode === 'reset') && (
              <button onClick={() => setMode('login')} style={{ background:'none', border:'none', color:'#6366F1', cursor:'pointer', fontWeight:600, fontSize:11 }}>
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontFamily:"'Poppins',sans-serif", fontSize:10, color:'#334155' }}>
          Seus dados são protegidos e isolados por empresa.
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontFamily:"'Poppins',sans-serif", fontSize:10, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required
        style={{
          width:'100%', padding:'10px 14px', borderRadius:10,
          border:'1px solid rgba(99,102,241,.3)', background:'#263548',
          color:'#F1F5F9', fontFamily:"'Poppins',sans-serif", fontSize:13,
          outline:'none', boxSizing:'border-box',
        }}
        onFocus={e => e.target.style.borderColor='#6366F1'}
        onBlur={e => e.target.style.borderColor='rgba(99,102,241,.3)'}
      />
    </div>
  )
}
