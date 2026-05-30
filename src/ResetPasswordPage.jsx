import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [ready, setReady] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    // Supabase injeta o token na URL — precisamos aguardar a sessão ser estabelecida
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
      if (event === 'SIGNED_IN' && session) {
        setReady(true)
      }
    })
    // Verificar se já tem sessão ativa (token já processado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setMsg('A senha deve ter pelo menos 6 caracteres'); return }
    if (password !== confirm) { setMsg('As senhas não coincidem'); return }
    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMsg(error.message)
    } else {
      setMsg('✅ Senha redefinida com sucesso!')
      setTimeout(() => nav('/'), 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#0F0C29,#302B63,#24243E)',
      fontFamily:"'Inter','Poppins',sans-serif", padding:16
    }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <svg viewBox="256 22 137 191" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lt3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b070ff"/><stop offset="100%" stopColor="#8855f5"/>
                </linearGradient>
                <linearGradient id="lb3" x1="0%" y1="0%" x2="30%" y2="100%">
                  <stop offset="0%" stopColor="#5585ff"/><stop offset="45%" stopColor="#38aaff"/>
                  <stop offset="100%" stopColor="#2dd4ff"/>
                </linearGradient>
              </defs>
              <path d="M 8 65 C 8 32 32 4 64 4 L 160 4 C 183 4 200 21 200 44 C 200 67 183 84 160 84 L 56 84 C 50 84 46 88 46 94 L 46 107 C 46 109.5 44 111 42 111 L 18 111 C 14.5 111 13 109 13 107 L 13 83 C 11 75 8 70 8 65 Z" fill="url(#lt3)"/>
              <path d="M 13 120 C 13 116 16 113 20 113 L 155 113 C 178 113 196 131 196 154 C 196 177 178 195 155 195 L 68 195 C 62 195 59 199 59 205 L 59 242 C 59 248 54 252 48 252 L 22 252 C 16 252 13 248 13 242 Z" fill="url(#lb3)"/>
            </svg>
            <span style={{ fontSize:20, fontWeight:800, color:'#F1F5F9' }}>Fluxe <span style={{ fontSize:10, fontWeight:800, letterSpacing:'.2em', background:'linear-gradient(90deg,#A855F7,#6366F1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>BPO</span></span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,.05)', backdropFilter:'blur(20px)', borderRadius:20, padding:32, border:'1px solid rgba(255,255,255,.1)', boxShadow:'0 24px 60px rgba(0,0,0,.4)' }}>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#F1F5F9', marginBottom:6 }}>🔐 Nova senha</div>
            <div style={{ fontSize:13, color:'#94A3B8' }}>Digite sua nova senha para continuar acessando a plataforma</div>
          </div>

          {!ready ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'#94A3B8', fontSize:13 }}>
              <div style={{ width:20, height:20, border:'2px solid #6366F1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
              Verificando link de recuperação...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Nova senha</label>
                <div style={{ position:'relative' }}>
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" required
                    style={{ width:'100%', padding:'11px 40px 11px 14px', borderRadius:10, border:'1.5px solid rgba(99,102,241,.3)', background:'rgba(255,255,255,.08)', color:'#F1F5F9', fontSize:13, outline:'none', boxSizing:'border-box' }}
                    onFocus={e=>e.target.style.borderColor='#6366F1'}
                    onBlur={e=>e.target.style.borderColor='rgba(99,102,241,.3)'} />
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:14 }}>
                    {showPass?'🙈':'👁'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>Confirmar senha</label>
                <input type={showPass?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)}
                  placeholder="Repita a nova senha" required
                  style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${confirm && confirm !== password ? '#EF4444' : 'rgba(99,102,241,.3)'}`, background:'rgba(255,255,255,.08)', color:'#F1F5F9', fontSize:13, outline:'none', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor='#6366F1'}
                  onBlur={e=>e.target.style.borderColor= confirm && confirm !== password ? '#EF4444' : 'rgba(99,102,241,.3)'} />
                {confirm && confirm !== password && (
                  <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>As senhas não coincidem</div>
                )}
              </div>

              {msg && (
                <div style={{ fontSize:12, padding:'10px 12px', borderRadius:8, marginBottom:16,
                  background: msg.startsWith('✅') ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
                  color: msg.startsWith('✅') ? '#4ade80' : '#fca5a5',
                  border: `1px solid ${msg.startsWith('✅') ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
                  fontWeight:500 }}>
                  {msg}
                </div>
              )}

              <button type="submit" disabled={loading || (confirm && confirm !== password)}
                style={{ width:'100%', padding:12, borderRadius:10, border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:14, fontWeight:700,
                  opacity: loading ? .7 : 1, boxShadow:'0 4px 14px rgba(99,102,241,.4)' }}>
                {loading ? '⏳ Salvando...' : 'Salvar nova senha →'}
              </button>
            </form>
          )}

          <div style={{ textAlign:'center', marginTop:16 }}>
            <button onClick={()=>nav('/login')} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:12 }}>
              ← Voltar para o login
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
