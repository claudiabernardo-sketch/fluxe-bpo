import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import LOGO_SRC from '../assets/logo-fluxe-white.png'

// ── Conteúdo ───────────────────────────────────────────────────────────────

const WHATSAPP_DIAGNOSTICO = 'https://wa.me/5511917101173?text=Quero+agendar+um+diagn%C3%B3stico+sobre+a+mentoria+BPO+Lucrativo'

const METODO = [
  { num: '01', semana: 'SEMANA 1', titulo: 'Diagnóstico', desc: 'Mapeamos sua operação real dentro do Laboratório BPO: custo de hora, capacidade da equipe, clientes que dão prejuízo sem você saber.' },
  { num: '02', semana: 'SEMANA 2', titulo: 'Precificação', desc: 'Você aprende a precificar com a Metodologia Fluxe — e já aplica no seu próximo orçamento.' },
  { num: '03', semana: 'SEMANA 3', titulo: 'Organização', desc: 'Rotinas, prazos e senhas de cliente saem da cabeça (e do WhatsApp) e entram no Laboratório, documentados.' },
  { num: '04', semana: 'SEMANA 4', titulo: 'Rentabilidade', desc: 'Você fecha a mentoria sabendo exatamente quem no seu book dá lucro — e com um plano pra crescer sem virar refém da operação.' },
]

const PARA_QUEM_SIM = [
  'Já fatura com o BPO mas precifica no feeling',
  'Tem equipe mas não sabe o custo real dela',
  'Cansou de descobrir tarde que um cliente dá prejuízo',
]

const PARA_QUEM_NAO = [
  'Procura só um software mais bonito, sem acompanhamento',
  'Quer terceirizar a decisão em vez de aprender o método',
]

const FAQS = [
  { q: 'Preciso saber mexer em sistema?', a: 'Não. A mentoria foi pensada pra quem opera BPO no dia a dia, não pra quem entende de tecnologia. O Laboratório BPO já vem configurado junto com o acompanhamento — você aprende usando, na prática.' },
  { q: 'Como funciona o acompanhamento?', a: 'Encontros individuais comigo, direto, olhando a operação real do seu BPO dentro do Laboratório BPO — precificação, rotina, rentabilidade por cliente. Não é um curso gravado.' },
  { q: 'Quanto custa?', a: 'Depende do formato e da duração combinados no diagnóstico — por isso não coloco tabela de preço aqui. Agenda uma conversa sem compromisso.' },
  { q: 'Já uso outro sistema pra gerir o BPO, dá pra participar?', a: 'Sim. A mentoria funciona em cima do que você já tem — o Laboratório BPO é o ambiente que uso pra dar clareza aos números, mas o foco é te ajudar a crescer, não trocar de sistema.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Cada BPO tem os dados completamente isolados dentro do Laboratório BPO, com criptografia em repouso e em trânsito.' },
  { q: 'Serve pra qualquer tamanho de BPO?', a: 'Sim — do BPO solo que está começando ao que já tem equipe e quer organizar a operação pra crescer com previsibilidade.' },
]

// ── Componente principal ───────────────────────────────────────────────────

export default function LoginPage() {
  const [formMode, setFormMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [openFaq, setOpenFaq] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const formRef = useRef(null)

  const { signIn, resetPassword, mfaChallenge, mfaVerifyLogin, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()
  const [mfaStep, setMfaStep] = useState(null) // { factorId, challengeId }
  const [mfaCode, setMfaCode] = useState('')

  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      height: document.body.style.height,
      bg: document.body.style.background,
    }
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.background = '#060A14'
    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.height = prev.height
      document.body.style.background = prev.bg
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20)
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    if (showLogin) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showLogin])

  const toStr = (v) => {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (v.message) return v.message
    return 'Erro desconhecido'
  }
  const isSuccess = toStr(msg).includes('criada') || toStr(msg).includes('enviado')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    if (formMode === 'login') {
      const { error } = await signIn(email, password)
      if (error) { setMsg(toStr(error)); setLoading(false); return }
      // Verifica se o usuário tem 2FA ativo
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
        // Tem 2FA — inicia o desafio e pede o código
        const { factorId, challengeId, error: mfaErr } = await mfaChallenge()
        if (mfaErr) { setMsg('Erro ao iniciar verificação 2FA: ' + mfaErr.message); setLoading(false); return }
        setMfaStep({ factorId, challengeId })
        setLoading(false)
      } else {
        navigate('/')
      }
    } else if (formMode === 'login_mfa') {
      const { error } = await mfaVerifyLogin(mfaStep.factorId, mfaStep.challengeId, mfaCode.replace(/\s/g, ''))
      if (error) { setMsg('Código incorreto ou expirado. Tente novamente.'); setLoading(false); return }
      navigate('/')
    } else {
      const { error } = await resetPassword(email)
      if (error) setMsg(toStr(error))
      else setMsg('E-mail de recuperação enviado!')
      setLoading(false)
    }
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  function abrirDiagnostico() {
    window.open(WHATSAPP_DIAGNOSTICO, '_blank', 'noopener')
  }

  function goLogin() {
    setFormMode('login')
    setMsg('')
    setShowLogin(true)
  }

  const NAV_ITEMS = [['metodo', 'Método'], ['para-quem', 'Para quem é'], ['precos', 'Mentoria'], ['faq', 'FAQ']]

  return (
    <div style={{ fontFamily: "'Inter','system-ui',sans-serif", background: '#060A14', color: '#F1F5F9', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 48px', height: 68,
        background: navScrolled || menuOpen ? 'rgba(6,10,20,0.97)' : 'transparent',
        backdropFilter: navScrolled || menuOpen ? 'blur(20px)' : 'none',
        borderBottom: navScrolled || menuOpen ? '1px solid rgba(255,255,255,.06)' : 'none',
        transition: 'all .3s',
      }}>
        <Logo />
        {!isMobile && (
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {NAV_ITEMS.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: 0, transition: 'color .2s' }}
                onMouseOver={e => e.target.style.color = '#F1F5F9'} onMouseOut={e => e.target.style.color = '#94A3B8'}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={goLogin}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,.14)', color: '#F1F5F9', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'none' }}>
            Entrar
          </button>
          <button onClick={abrirDiagnostico}
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,.35)', transition: 'all .2s' }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,.55)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,.35)'}>
            {isMobile ? 'Agendar →' : 'Agendar diagnóstico →'}
          </button>
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 20, padding: '4px 2px', lineHeight: 1 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* ── MENU MOBILE ─────────────────────────────────────────── */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 190, background: 'rgba(6,10,20,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '12px 20px 20px' }}>
          {NAV_ITEMS.map(([id, label]) => (
            <button key={id} onClick={() => { scrollTo(id); setMenuOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 15, fontWeight: 500, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              {label}
            </button>
          ))}
          <button onClick={() => { abrirDiagnostico(); setMenuOpen(false) }}
            style={{ display: 'block', width: '100%', marginTop: 16, padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Agendar diagnóstico →
          </button>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section id="hero" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', padding: isMobile ? '100px 20px 60px' : '120px 48px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,.05) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,.18) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)', borderRadius: 99, padding: '6px 14px', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E80' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', letterSpacing: '.12em', textTransform: 'uppercase' }}>Mentoria BPO Lucrativo</span>
          </div>

          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 34 : 56, fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px', color: '#F8FAFC', letterSpacing: '-.03em' }}>
            Sua precificação está<br />
            <span style={{ fontStyle: 'italic', fontWeight: 600, background: 'linear-gradient(90deg,#818CF8,#A855F7,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              te dando prejuízo?
            </span>
          </h1>

          <p style={{ fontSize: isMobile ? 16 : 18, color: '#94A3B8', lineHeight: 1.75, margin: '0 auto 36px', maxWidth: 580 }}>
            Mentoria individual pra donos de BPO financeiro que querem aprender, na prática, a precificar certo, organizar a operação e vender com lucro real — dentro do Laboratório BPO, o ambiente exclusivo onde você aplica cada etapa do método comigo.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <button onClick={abrirDiagnostico}
              style={{ padding: '15px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,.45)', transition: 'all .2s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(99,102,241,.55)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,.45)' }}>
              Agendar diagnóstico →
            </button>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[['Acompanhamento', 'individual, direto comigo'], ['Laboratório incluso', 'ambiente de aplicação faz parte da mentoria'], ['Sem letra miúda', 'diagnóstico sem compromisso']].map(([t, s], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#22C55E', fontSize: 10, fontWeight: 800 }}>✓</span>
                </div>
                <span style={{ fontSize: 12, color: '#94A3B8' }}><strong style={{ color: '#CBD5E1' }}>{t}</strong> {s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTRAR (compacto, só aparece quando clicado) ────────── */}
      {showLogin && (
        <section ref={formRef} style={{ padding: isMobile ? '0 20px 60px' : '0 48px 72px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)', position: 'relative' }}>

            <button onClick={() => setShowLogin(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, padding: 4 }}>
              ✕
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
                {mfaStep ? '🔐 Verificação em duas etapas' : formMode === 'login' ? 'Já é aluno(a) da mentoria?' : 'Recuperar senha'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {mfaStep ? 'Abra o app autenticador e digite o código de 6 dígitos' : formMode === 'login' ? 'Entre no Laboratório BPO' : 'Enviaremos um link para seu e-mail'}
              </div>
            </div>

            {formMode === 'login' && !mfaStep && (
              <div style={{ marginBottom:16 }}>
                <button type="button" onClick={signInWithGoogle}
                  style={{ width:'100%', padding:'11px', borderRadius:10, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', cursor:'pointer', fontSize:13, fontWeight:600, color:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
                    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                  </svg>
                  Entrar com Google
                </button>
                <div style={{ display:'flex', alignItems:'center', gap:8, margin:'14px 0' }}>
                  <div style={{ flex:1, height:1, background:'rgba(255,255,255,.1)' }} />
                  <span style={{ fontSize:11, color:'#94A3B8' }}>ou com e-mail</span>
                  <div style={{ flex:1, height:1, background:'rgba(255,255,255,.1)' }} />
                </div>
              </div>
            )}
            {mfaStep ? (
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>Código do autenticador</label>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9 ]*" maxLength={7}
                    value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                    placeholder="000 000" autoFocus autoComplete="one-time-code"
                    style={{ width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid rgba(99,102,241,.3)', background: 'rgba(255,255,255,.08)', color: '#F1F5F9', fontSize: 24, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.3em' }}
                  />
                </div>
                {msg && <div style={{ fontSize: 12, color: '#F87171', marginBottom: 12 }}>{msg}</div>}
                <button type="submit" disabled={loading || mfaCode.replace(/\s/g,'').length < 6}
                  style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: mfaCode.replace(/\s/g,'').length >= 6 ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#334155', color: '#fff', fontWeight: 700, fontSize: 14, cursor: mfaCode.replace(/\s/g,'').length >= 6 ? 'pointer' : 'not-allowed' }}>
                  {loading ? 'Verificando...' : 'Verificar e entrar →'}
                </button>
                <button type="button" onClick={() => { setMfaStep(null); setMfaCode(''); setMsg('') }}
                  style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
                  ← Voltar ao login
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit}>
              <DarkField label="E-mail" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" />
              {formMode !== 'reset' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ ...S.input, paddingRight: 40 }}
                      onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,.6)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.08)'}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: 14, padding: 0 }}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              )}

              {msg && (
                <div style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 14, fontSize: 12, fontWeight: 600,
                  background: isSuccess ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.12)',
                  border: `1px solid ${isSuccess ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}`,
                  color: isSuccess ? '#86EFAC' : '#FCA5A5' }}>
                  {toStr(msg)}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, color: '#fff',
                  background: loading ? 'rgba(99,102,241,.35)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,.4)', transition: 'all .2s', marginTop: 4 }}>
                {loading ? 'Aguarde...' : formMode === 'login' ? 'Entrar →' : 'Enviar link de recuperação'}
              </button>
            </form>
            )}

            {!mfaStep && (
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12 }}>
              {formMode === 'login' ? (
                <button onClick={() => { setFormMode('reset'); setMsg('') }}
                  style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                  Esqueci minha senha
                </button>
              ) : (
                <button onClick={() => { setFormMode('login'); setMsg('') }}
                  style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                  ← Voltar ao login
                </button>
              )}
            </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.05)' }}>
              <span style={{ fontSize: 10, color: '#334155' }}>🔒 Dados protegidos e isolados por empresa</span>
            </div>
          </div>
        </section>
      )}

      {/* ── PROBLEMA ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>O PROBLEMA</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-.02em' }}>Reconhece alguma dessas situações?</h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>A maioria dos BPOs cresce rápido, mas sem uma operação estruturada o crescimento vira caos.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, maxWidth: 1000, margin: '0 auto 44px' }}>
            {[
              {
                time: 'Na hora de precificar um novo cliente',
                icon: '💸',
                desc: 'Você não sabe o custo real da sua equipe. Chuta um valor, fecha abaixo do necessário, e passa meses atendendo esse cliente de graça sem perceber.',
              },
              {
                time: 'No fechamento do mês',
                icon: '📊',
                desc: 'Você descobre que um cliente consome 40h da equipe e paga R$ 900. Estava perdendo dinheiro com ele há meses — sem saber.',
              },
              {
                time: 'Quando um lead pergunta seu preço',
                icon: '🤷',
                desc: 'Você não sabe quanto esse perfil de cliente vai custar para atender. Responde qualquer coisa. Ou perde o cliente por cobrar errado.',
              },
            ].map((p, i) => (
              <div key={i} style={{ padding: '22px 24px', background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.1)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#F87171', letterSpacing: '.05em', textTransform: 'uppercase' }}>{p.time}</span>
                </div>
                <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Ponte para a solução */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, rgba(239,68,68,.3), rgba(99,102,241,.5))' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', letterSpacing: '.1em', textTransform: 'uppercase', padding: '6px 14px', background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.18)', borderRadius: 99 }}>
                Se você reconheceu mais de uma — é disso que a mentoria trata
              </div>
              <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, rgba(99,102,241,.5), transparent)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── O MÉTODO ────────────────────────────────────────────── */}
      <section id="metodo" style={{ padding: isMobile ? '60px 20px' : '96px 48px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>O MÉTODO</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 12px', letterSpacing: '-.02em' }}>Quatro semanas pra sair do feeling e entrar nos dados.</h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#64748B' }}>Um passo de cada vez, com acompanhamento individual em cada etapa.</p>
          </div>

          <div style={{ position: 'relative' }}>
            {!isMobile && (
              <div style={{ position: 'absolute', top: 28, bottom: 28, left: 27, width: 1, background: 'linear-gradient(to bottom, rgba(99,102,241,.4), rgba(139,92,246,.4))' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 8 }}>
              {METODO.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: isMobile ? '18px' : '20px 8px', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0D1424', border: '1px solid rgba(99,102,241,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: '#A5B4FC' }}>{m.num}</span>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>{m.semana}</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>{m.titulo}</div>
                    <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, maxWidth: 540 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LABORATÓRIO BPO ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '0 20px 72px' : '0 48px 96px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>O AMBIENTE DA MENTORIA</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 24 : 32, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Onde você aplica cada etapa, com acompanhamento comigo do lado.</h2>
          </div>

          {/* Janela do browser */}
          <div style={{ background: '#0D1424', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 48px 100px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.04)' }}>
            {/* Chrome bar */}
            <div style={{ background: '#1A2235', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#FF5F57','#FFBD2E','#28C940'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                <span style={{ fontSize: 11, color: '#475569' }}>fluxebpo.com.br</span>
              </div>
            </div>

            {/* App shell */}
            <div style={{ display: 'flex', height: isMobile ? 320 : 430 }}>
              {/* Sidebar */}
              {!isMobile && (
                <div style={{ width: 176, background: '#F8FAFC', borderRight: '1px solid #E2E8F0', flexShrink: 0, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ padding: '8px 10px 12px', marginBottom: 4, borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', letterSpacing: '-.3px' }}>Fluxe <span style={{ color: '#6366F1' }}>BPO</span></div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>Empreenda BPO Ltda</div>
                  </div>
                  {[
                    { icon: 'fa-solid fa-house',       label: 'Dashboard',   active: true },
                    { icon: 'fa-solid fa-list-check',  label: 'Tarefas' },
                    { icon: 'fa-solid fa-building',    label: 'Clientes' },
                    { icon: 'fa-solid fa-calendar',    label: 'Agenda' },
                    { icon: 'fa-solid fa-filter',      label: 'CRM' },
                    { icon: 'fa-solid fa-lock',        label: 'Cofre' },
                    { icon: 'fa-solid fa-chart-line',  label: 'Relatórios' },
                  ].map((item, i) => (
                    <div key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7,
                        background: item.active ? '#EEF2FF' : 'transparent',
                        boxShadow: item.active ? 'inset 3px 0 0 #6366F1' : 'none',
                        color: item.active ? '#6366F1' : '#64748B', fontSize: 11, fontWeight: item.active ? 600 : 500 }}>
                      <i className={item.icon} style={{ fontSize: 10, width: 12, textAlign: 'center' }} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conteúdo principal */}
              <div style={{ flex: 1, background: '#F1F5F9', padding: isMobile ? 12 : 18, overflow: 'hidden' }}>
                <div>
                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Central Operacional</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>Sexta, 12 de junho de 2026</div>
                    </div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>MA</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
                    {[{v:'R$18,4k',l:'Valor/mês',c:'#6366F1'},{v:'23',l:'Clientes',c:'#10B981'},{v:'12',l:'Tarefas hoje',c:'#F59E0B'},{v:'3',l:'Em atraso',c:'#EF4444'}].map((k,i)=>(
                      <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.c }} />
                        <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: k.c, marginBottom: 2 }}>{k.v}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '9px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>Tarefas de Hoje</span>
                      <span style={{ fontSize: 9, background: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>12</span>
                    </div>
                    {[['Conciliação bancária — ABC Contabilidade','Em andamento','#3B82F6'],['DRE junho — Consultoria XYZ','A fazer','#94A3B8'],['Folha de pagamento — Tech Start','Concluída','#10B981']].map(([t,s,c],i)=>(
                      <div key={i} style={{ padding: '8px 12px', borderBottom: i < 2 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 11, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: s==='Concluída'?'line-through':'none', opacity: s==='Concluída'?.5:1 }}>{t}</div>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: s==='Concluída'?'#ECFDF5':s==='Em andamento'?'#EFF6FF':'#F8FAFC', color: c, whiteSpace: 'nowrap' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>Ambiente também chamado de Fluxe.</span>
          </div>

          {/* Callouts abaixo do mockup */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 24 }}>
              {[
                { icon: '⚡', title: 'Visão em tempo real', desc: 'Painel atualizado a cada ação da equipe' },
                { icon: '🔒', title: 'Multi-empresa seguro', desc: 'Cada BPO tem seus dados completamente isolados' },
                { icon: '📱', title: 'Qualquer dispositivo', desc: 'Acesse do computador, tablet ou celular' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── PARA QUEM É ─────────────────────────────────────────── */}
      <section id="para-quem" style={{ padding: isMobile ? '60px 20px' : '96px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>PARA QUEM É</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 24 : 34, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Pra quem é (e pra quem não é) a mentoria</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 16 }}>
            <div style={{ padding: '26px 28px', background: 'rgba(34,197,94,.05)', border: '1px solid rgba(34,197,94,.18)', borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>É pra você se</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {PARA_QUEM_SIM.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ color: '#22C55E', fontSize: 10, fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '26px 28px', background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.14)', borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F87171', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 16 }}>Não é pra você se</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {PARA_QUEM_NAO.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ color: '#F87171', fontSize: 10, fontWeight: 800 }}>✕</span>
                    </div>
                    <span style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTADOS ──────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>RESULTADOS</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#F8FAFC', margin: '0 0 12px', letterSpacing: '-.02em' }}>Donos de BPO que pararam de adivinhar</h2>
            <p style={{ fontSize: isMobile ? 14 : 15, color: '#64748B' }}>e começaram a gerir com dados reais</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 16 : 24 }}>
            {[
              { quote: 'Antes eu precificava no feeling. Com o Fluxe, descobri que meu cliente mais exigente consumia 3× mais horas que eu cobrava. Reajustei e aumentei minha margem em quase 40%.', name: 'Graziela Araújo', role: 'Sócia-fundadora · FinanciproBPO', local: 'São Paulo – SP', init: 'GA' },
              { quote: 'Minha equipe cresceu de 2 para 8 analistas e eu ainda sei exatamente o que cada um está fazendo, para qual cliente e em quanto tempo. Impossível sem o Fluxe.', name: 'Ricardo Lemos', role: 'Diretor de Operações · ContaMaxBPO', local: 'Belo Horizonte – MG', init: 'RL' },
              { quote: 'Quando um analista saiu levando todos os acessos de cliente, percebi que precisava de um cofre centralizado. O Fluxe resolveu isso no mesmo dia que fiz o cadastro.', name: 'Camila Souza', role: 'CEO · PrimeirosBPO Financeiro', local: 'Recife – PE', init: 'CS' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '28px 24px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 40, color: '#8B5CF6', lineHeight: .6, opacity: .6 }}>"</div>
                <p style={{ fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontWeight: 500, fontSize: 16, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.init}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }}>{t.role}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{t.local}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MENTORIA EM DETALHE ─────────────────────────────────── */}
      <section id="precos" style={{ padding: isMobile ? '60px 20px' : '96px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>MENTORIA BPO LUCRATIVO</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-.02em' }}>Acompanhamento individual, não um curso gravado.</h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>Cada mentoria é única — formato, duração e investimento dependem do que você precisa. Sem tabela de preço fixa: a gente conversa primeiro.</p>
          </div>

          <div style={{ background: 'linear-gradient(160deg,rgba(99,102,241,.17),rgba(139,92,246,.12))', border: '1px solid rgba(99,102,241,.42)', borderRadius: 16, padding: isMobile ? '28px 24px' : '36px 40px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>O que está incluso</div>
            <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Encontros individuais comigo, aplicando cada etapa dentro do Laboratório BPO',
                'O Laboratório BPO incluso — o ambiente que uso pra dar clareza aos seus números',
                'Precificação, rotina e rentabilidade organizadas junto com você',
                'Plano estratégico pra sair do feeling e crescer com previsibilidade',
              ].map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(34,197,94,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ color: '#22C55E', fontSize: 9, fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={abrirDiagnostico}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,.4)' }}>
              Agendar diagnóstico →
            </button>
          </div>

          {/* Garantia */}
          <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 24 }}>
            {[
              { icon: '🗣️', text: 'Diagnóstico sem compromisso' },
              { icon: '🎯', text: 'Acompanhamento individual, não em grupo' },
              { icon: '🧮', text: 'Laboratório BPO incluso durante a mentoria' },
            ].map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
                <span>{g.icon}</span>
                <span>{g.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: isMobile ? '60px 20px' : '96px 48px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Perguntas frequentes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${openFaq === i ? 'rgba(99,102,241,.25)' : 'rgba(255,255,255,.07)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', lineHeight: 1.4 }}>{faq.q}</span>
                  <span style={{ fontSize: 18, color: '#6366F1', transition: 'transform .25s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)', flexShrink: 0, lineHeight: 1 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', fontSize: 13, color: '#94A3B8', lineHeight: 1.75 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '96px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.09))', border: '1px solid rgba(99,102,241,.22)', borderRadius: 24, padding: isMobile ? '44px 24px' : '64px 52px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 16 }}>COMECE HOJE</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 40, fontWeight: 900, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-.03em', lineHeight: 1.12 }}>
                Pare de crescer sem saber<br />se está lucrando.
              </h2>
              <p style={{ fontSize: isMobile ? 14 : 16, color: '#94A3B8', marginBottom: 12 }}>Diagnóstico individual, sem compromisso.</p>
              <p style={{ fontSize: isMobile ? 12 : 13, color: '#475569', marginBottom: 32 }}>A gente conversa primeiro pra ver se faz sentido pros dois lados.</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={abrirDiagnostico}
                  style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,.5)', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,.65)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,.5)' }}>
                  Agendar diagnóstico →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ padding: isMobile ? '28px 20px' : '36px 48px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <Logo />
          <div style={{ display: 'flex', gap: 24 }}>
            {[['Termos', '/termos'], ['Privacidade', '/privacidade'], ['WhatsApp', 'https://wa.me/5511917101173']].map(([l, h]) => (
              <a key={l} href={h} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#475569', textDecoration: 'none', transition: 'color .2s' }}
                onMouseOver={e => e.target.style.color = '#94A3B8'} onMouseOut={e => e.target.style.color = '#475569'}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#334155' }}>© {new Date().getFullYear()} Fluxe BPO. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────────────────

function Logo() {
  return (
    <a href="/" style={{ display: 'inline-block', lineHeight: 0 }}>
      <img src={LOGO_SRC} alt="Fluxe BPO" style={{ height: 44, width: 'auto', maxWidth: 220, objectFit: 'contain', objectPosition: 'left' }} />
    </a>
  )
}

function DarkField({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={S.input}
        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,.6)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.08)'}
      />
    </div>
  )
}

const S = {
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.05)', color: '#F1F5F9', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' },
}
