import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import LOGO_WHITE from '../assets/logo-fluxe-white.png'
import LOGO_ICON from '../assets/logo-icon.png'

/* ── Ícones SVG inline ─────────────────────────────────────── */
const EyeIcon = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
)

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const CircleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
  </svg>
)

/* ── Dados da coluna esquerda ──────────────────────────────── */
const features = [
  {
    icon: '📊',
    title: 'Rentabilidade real por cliente',
    desc: 'Saiba exatamente quanto cada contrato gera — sem planilha, sem achismo.',
  },
  {
    icon: '💰',
    title: 'Margem e custo sob controle',
    desc: 'Custo de hora da equipe cruzado com as horas apontadas. Decisão com dado.',
  },
  {
    icon: '🔐',
    title: 'Cofre de acessos dos clientes',
    desc: 'Credenciais organizadas por cliente, seguras e disponíveis para a equipe certa.',
  },
  {
    icon: '📋',
    title: 'Operação integrada em um painel',
    desc: 'Tarefas, modelos recorrentes e equipe — tudo conectado, nada se perde.',
  },
]

/* ── Componente principal ──────────────────────────────────── */
export default function ResetPasswordPage() {
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [msg, setMsg]               = useState('')
  const [ready, setReady]           = useState(false)
  const [erro, setErro]             = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focusPass, setFocusPass]   = useState(false)
  const [focusConf, setFocusConf]   = useState(false)
  const [success, setSuccess]       = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) { setErro(true); return }
        if (session) setReady(true)
        else setErro(true)
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setReady(true); setErro(false)
        }
      })
      return () => subscription.unsubscribe()
    } catch { setErro(true) }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setMsg('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setMsg('As senhas não coincidem.'); return }
    setLoading(true); setMsg('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setMsg(error.message); setLoading(false) }
      else {
        setSuccess(true)
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession()
          nav(session ? '/agenda' : '/login')
        }, 2000)
      }
    } catch { setMsg('Erro ao salvar. Tente novamente.'); setLoading(false) }
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthMeta = [
    { color: 'transparent', label: '' },
    { color: '#EF4444',     label: 'Fraca'  },
    { color: '#F59E0B',     label: 'Média'  },
    { color: '#22C55E',     label: 'Forte'  },
  ][strength]

  const rules = [
    { ok: password.length >= 6,   text: 'Mínimo 6 caracteres' },
    { ok: /[A-Z]/.test(password), text: 'Uma letra maiúscula' },
    { ok: /[0-9]/.test(password), text: 'Um número' },
  ]

  const confirmBorder = confirm
    ? confirm === password ? '#22C55E' : '#EF4444'
    : focusConf ? '#6366F1' : '#E2E8F0'

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes popIn  { 0% { transform:scale(.92); opacity:0 } 100% { transform:scale(1); opacity:1 } }
        @keyframes pulse  { 0%,100% { opacity:1 } 50% { opacity:.5 } }
        @keyframes check  { from { stroke-dashoffset:40 } to { stroke-dashoffset:0 } }

        .reset-btn {
          transition: transform .15s, box-shadow .15s, background .2s !important;
        }
        .reset-btn:hover:not(:disabled) {
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 24px rgba(99,102,241,.45) !important;
        }
        .reset-btn:active:not(:disabled) {
          transform: translateY(0) !important;
        }
        .feat-card {
          transition: background .2s, border-color .2s;
        }
        .feat-card:hover {
          background: rgba(99,102,241,.18) !important;
          border-color: rgba(99,102,241,.45) !important;
        }

        @media (max-width: 820px) {
          .reset-left  { display: none !important; }
          .reset-right { max-width: 100vw !important; padding: 40px 24px !important; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        zIndex: 9999,
      }}>

        {/* ════════════════════════════════════════
            COLUNA ESQUERDA — Branding
        ════════════════════════════════════════ */}
        <div className="reset-left" style={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #0D0B24 0%, #1A1740 45%, #2D2B6B 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Blobs */}
          <div style={{ position:'absolute', top:-120, right:-80,  width:400, height:400, borderRadius:'50%', background:'rgba(99,102,241,.13)', filter:'blur(80px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-80, left:-100, width:380, height:380, borderRadius:'50%', background:'rgba(139,92,246,.1)',  filter:'blur(80px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:'40%', left:'60%', width:200, height:200, borderRadius:'50%', background:'rgba(167,139,250,.07)', filter:'blur(50px)', pointerEvents:'none' }} />

          {/* Grid de pontinhos decorativos */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)',
            backgroundSize:'28px 28px',
          }} />

          {/* Logo */}
          <div style={{ position:'relative', zIndex:1 }}>
            <img src={LOGO_WHITE} alt="Fluxe BPO" style={{ height:32, objectFit:'contain', filter:'brightness(1.05)' }} />
          </div>

          {/* Conteúdo central */}
          <div style={{ position:'relative', zIndex:1 }}>
            {/* Badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(99,102,241,.2)', border:'1px solid rgba(99,102,241,.35)',
              borderRadius:20, padding:'5px 12px', marginBottom:20,
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#A5B4FC', animation:'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize:11, fontWeight:600, color:'#A5B4FC', letterSpacing:'1.5px', textTransform:'uppercase' }}>
                Gestão operacional de BPO
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize:36, fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:14, letterSpacing:'-1.5px' }}>
              Rentabilidade e operação<br />
              <span style={{
                backgroundImage:'linear-gradient(90deg, #A5B4FC 0%, #C4B5FD 50%, #F0ABFC 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>
                sob controle de verdade.
              </span>
            </h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.7, marginBottom:32, maxWidth:360 }}>
              A plataforma feita para quem gere BPO e precisa de números reais, equipe alinhada e clientes rentáveis.
            </p>

            {/* Features */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {features.map(f => (
                <div key={f.title} className="feat-card" style={{
                  display:'flex', alignItems:'center', gap:14,
                  background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)',
                  borderRadius:12, padding:'12px 16px', cursor:'default',
                }}>
                  <div style={{
                    width:36, height:36, borderRadius:10, flexShrink:0,
                    background:'rgba(99,102,241,.25)', border:'1px solid rgba(99,102,241,.3)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                  }}>{f.icon}</div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:'#E2E8F0', marginBottom:1 }}>{f.title}</p>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,.4)', lineHeight:1.4 }}>{f.desc}</p>
                  </div>
                  <div style={{ marginLeft:'auto', color:'rgba(255,255,255,.15)', fontSize:14 }}>›</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p style={{ fontSize:11, color:'rgba(255,255,255,.2)', position:'relative', zIndex:1 }}>
            © {new Date().getFullYear()} Fluxe BPO · fluxebpo.com.br
          </p>
        </div>

        {/* ════════════════════════════════════════
            COLUNA DIREITA — Formulário
        ════════════════════════════════════════ */}
        <div className="reset-right" style={{
          width: '100%',
          maxWidth: 500,
          minHeight: '100vh',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 52px',
          position: 'relative',
          overflowY: 'auto',
        }}>
          {/* Faixa de cor no topo */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:4,
            background:'linear-gradient(90deg, #6366F1, #8B5CF6, #A78BFA)',
          }} />

          {/* ── Tela de sucesso ── */}
          {success ? (
            <div style={{ textAlign:'center', animation:'popIn .4s ease' }}>
              <div style={{
                width:72, height:72, borderRadius:'50%', margin:'0 auto 24px',
                background:'linear-gradient(135deg,#22C55E,#16A34A)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 8px 24px rgba(34,197,94,.35)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" style={{ strokeDasharray:40, strokeDashoffset:0, animation:'check .5s ease .2s both' }} />
                </svg>
              </div>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#0F172A', marginBottom:8 }}>Senha criada!</h2>
              <p style={{ fontSize:14, color:'#64748B', lineHeight:1.6 }}>Você está sendo redirecionado(a) para o painel em instantes...</p>
              <div style={{ marginTop:24, display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#94A3B8', fontSize:12 }}>
                <div style={{ width:16, height:16, border:'2px solid #E2E8F0', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                Entrando no Fluxe BPO...
              </div>
            </div>

          ) : (
            <div style={{ animation:'fadeUp .35s ease' }}>

              {/* Topo do form */}
              <div style={{ marginBottom:36 }}>
                <img src={LOGO_ICON} alt="Fluxe BPO" style={{ height:44, objectFit:'contain', marginBottom:24 }} />
                <h2 style={{ fontSize:26, fontWeight:900, color:'#0F172A', letterSpacing:'-0.8px', marginBottom:8 }}>
                  {erro ? 'Link expirado' : 'Crie sua senha'}
                </h2>
                <p style={{ fontSize:14, color:'#64748B', lineHeight:1.6 }}>
                  {erro
                    ? 'Este link não é mais válido. Peça ao administrador um novo convite.'
                    : 'Defina uma senha segura para acessar o Fluxe BPO.'}
                </p>
              </div>

              {/* ── Estado de erro (link expirado) ── */}
              {erro ? (
                <div>
                  <div style={{
                    display:'flex', alignItems:'flex-start', gap:12,
                    padding:'14px 16px', borderRadius:12,
                    background:'#FEF2F2', border:'1px solid #FECACA', marginBottom:24,
                  }}>
                    <span style={{ fontSize:18, lineHeight:1 }}>⚠️</span>
                    <p style={{ fontSize:13, color:'#DC2626', lineHeight:1.6 }}>
                      O link de convite expirou ou já foi utilizado. Entre em contato com o administrador do sistema para receber um novo link.
                    </p>
                  </div>
                  <button
                    className="reset-btn"
                    onClick={() => nav('/login')}
                    style={{
                      width:'100%', padding:'14px', borderRadius:12, border:'none',
                      background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                      color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer',
                      boxShadow:'0 4px 14px rgba(99,102,241,.3)',
                    }}
                  >
                    Ir para o login →
                  </button>
                </div>

              ) : !ready ? (
                /* ── Verificando link ── */
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{
                    width:48, height:48, border:'3px solid #F1F5F9', borderTopColor:'#6366F1',
                    borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px',
                  }} />
                  <p style={{ fontSize:13, color:'#94A3B8' }}>Verificando link de acesso...</p>
                </div>

              ) : (
                /* ── Formulário ── */
                <form onSubmit={handleSubmit}>

                  {/* Campo: Nova senha */}
                  <div style={{ marginBottom:20 }}>
                    <label style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      fontSize:12, fontWeight:700, color:'#374151', marginBottom:8,
                      textTransform:'uppercase', letterSpacing:'0.6px',
                    }}>
                      Nova senha
                      {password.length > 0 && (
                        <span style={{ fontSize:11, fontWeight:600, color:strengthMeta.color, textTransform:'none', letterSpacing:0 }}>
                          {strengthMeta.label}
                        </span>
                      )}
                    </label>
                    <div style={{ position:'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setMsg('') }}
                        onFocus={() => setFocusPass(true)}
                        onBlur={()  => setFocusPass(false)}
                        required
                        autoComplete="new-password"
                        placeholder="Digite sua senha"
                        style={{
                          width:'100%', padding:'13px 46px 13px 16px',
                          borderRadius:12, fontSize:14, color:'#0F172A',
                          background: focusPass ? '#FAFBFF' : '#F8FAFC',
                          border: `2px solid ${focusPass ? '#6366F1' : '#E2E8F0'}`,
                          outline:'none', transition:'border-color .2s, background .2s',
                          boxSizing:'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        style={{
                          position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                          background:'none', border:'none', cursor:'pointer',
                          color: showPass ? '#6366F1' : '#94A3B8',
                          display:'flex', alignItems:'center', padding:0,
                          transition:'color .15s',
                        }}
                      >
                        <EyeIcon off={showPass} />
                      </button>
                    </div>

                    {/* Barra de força */}
                    {password.length > 0 && (
                      <div style={{ marginTop:8, display:'flex', gap:4 }}>
                        {[1,2,3].map(lvl => (
                          <div key={lvl} style={{
                            flex:1, height:3, borderRadius:4,
                            background: strength >= lvl ? strengthMeta.color : '#E2E8F0',
                            transition:'background .3s',
                          }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Campo: Confirmar senha */}
                  <div style={{ marginBottom:6 }}>
                    <label style={{
                      display:'block', fontSize:12, fontWeight:700, color:'#374151',
                      marginBottom:8, textTransform:'uppercase', letterSpacing:'0.6px',
                    }}>
                      Confirmar senha
                    </label>
                    <div style={{ position:'relative' }}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => { setConfirm(e.target.value); setMsg('') }}
                        onFocus={() => setFocusConf(true)}
                        onBlur={()  => setFocusConf(false)}
                        required
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        style={{
                          width:'100%', padding:'13px 46px 13px 16px',
                          borderRadius:12, fontSize:14, color:'#0F172A',
                          background: focusConf ? '#FAFBFF' : '#F8FAFC',
                          border: `2px solid ${confirmBorder}`,
                          outline:'none', transition:'border-color .2s, background .2s',
                          boxSizing:'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(p => !p)}
                        style={{
                          position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                          background:'none', border:'none', cursor:'pointer',
                          color: showConfirm ? '#6366F1' : '#94A3B8',
                          display:'flex', alignItems:'center', padding:0,
                          transition:'color .15s',
                        }}
                      >
                        <EyeIcon off={showConfirm} />
                      </button>
                    </div>
                    {confirm && confirm === password && (
                      <p style={{ marginTop:6, fontSize:12, color:'#22C55E', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                        <CheckIcon /> Senhas coincidem
                      </p>
                    )}
                    {confirm && confirm !== password && (
                      <p style={{ marginTop:6, fontSize:12, color:'#EF4444', fontWeight:500 }}>
                        As senhas não coincidem
                      </p>
                    )}
                  </div>

                  {/* Checklist de requisitos */}
                  <div style={{
                    display:'flex', gap:16, flexWrap:'wrap',
                    marginTop:14, marginBottom:22,
                    padding:'10px 14px', borderRadius:10,
                    background:'#F8FAFC', border:'1px solid #F1F5F9',
                  }}>
                    {rules.map(r => (
                      <span key={r.text} style={{
                        fontSize:11, fontWeight:r.ok ? 600 : 400,
                        color: r.ok ? '#22C55E' : '#94A3B8',
                        display:'flex', alignItems:'center', gap:4,
                        transition:'color .2s',
                      }}>
                        {r.ok ? <CheckIcon /> : <CircleIcon />}
                        {r.text}
                      </span>
                    ))}
                  </div>

                  {/* Mensagem de erro */}
                  {msg && (
                    <div style={{
                      padding:'11px 14px', borderRadius:10, marginBottom:16,
                      background:'#FEF2F2', border:'1px solid #FECACA',
                      color:'#DC2626', fontSize:13, fontWeight:500, lineHeight:1.4,
                      display:'flex', alignItems:'center', gap:8,
                    }}>
                      <span style={{ fontSize:15 }}>⚠️</span> {msg}
                    </div>
                  )}

                  {/* Botão principal */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="reset-btn"
                    style={{
                      width:'100%', padding:'14px', borderRadius:12, border:'none',
                      background: loading
                        ? 'linear-gradient(135deg,#A5B4FC,#C4B5FD)'
                        : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                      color:'#fff', fontSize:15, fontWeight:700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow:'0 4px 14px rgba(99,102,241,.3)',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                        Salvando...
                      </>
                    ) : 'Criar senha e entrar →'}
                  </button>

                </form>
              )}

              {/* Voltar */}
              <button
                onClick={() => nav('/login')}
                style={{
                  marginTop:28, background:'none', border:'none',
                  color:'#94A3B8', cursor:'pointer', fontSize:12,
                  padding:0, display:'flex', alignItems:'center', gap:4,
                  transition:'color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color='#6366F1'}
                onMouseLeave={e => e.currentTarget.style.color='#94A3B8'}
              >
                ← Voltar para o login
              </button>

            </div>
          )}
        </div>
      </div>
    </>
  )
}
