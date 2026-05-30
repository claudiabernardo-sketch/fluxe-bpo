import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setMsg('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setMsg('Senhas não coincidem'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMsg(error.message)
    else { setMsg('✅ Senha alterada! Redirecionando...'); setTimeout(() => nav('/'), 2000) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0F0C29,#302B63)', padding:16 }}>
      <div style={{ width:'100%', maxWidth:380, background:'rgba(255,255,255,.07)', borderRadius:20, padding:32, border:'1px solid rgba(255,255,255,.1)' }}>
        <h2 style={{ color:'#F1F5F9', marginBottom:6, fontSize:20, fontWeight:800 }}>🔐 Nova senha</h2>
        <p style={{ color:'#94A3B8', fontSize:13, marginBottom:24 }}>Digite sua nova senha abaixo</p>
        {!ready ? (
          <div style={{ textAlign:'center', color:'#94A3B8', padding:'20px 0' }}>Verificando link...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:6, textTransform:'uppercase' }}>Nova senha</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres"
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid rgba(99,102,241,.3)', background:'rgba(255,255,255,.08)', color:'#F1F5F9', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:6, textTransform:'uppercase' }}>Confirmar senha</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Repita a senha"
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid rgba(99,102,241,.3)', background:'rgba(255,255,255,.08)', color:'#F1F5F9', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
            {msg && <div style={{ fontSize:12, padding:'10px', borderRadius:8, marginBottom:14, background: msg.startsWith('✅')?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)', color: msg.startsWith('✅')?'#4ade80':'#fca5a5' }}>{msg}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:12, borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {loading ? 'Salvando...' : 'Salvar nova senha →'}
            </button>
          </form>
        )}
        <div style={{ textAlign:'center', marginTop:14 }}>
          <button onClick={()=>nav('/login')} style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:12 }}>← Voltar para o login</button>
        </div>
      </div>
    </div>
  )
}
