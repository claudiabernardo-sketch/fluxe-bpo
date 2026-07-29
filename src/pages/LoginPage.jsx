import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import LOGO_SRC from '../assets/logo-fluxe-white.png'
import CLAUDIA_SRC from '../assets/claudia-mentora.jpg'
import CLAUDIA_ECOSSISTEMA_SRC from '../assets/claudia-hero-ecosistema.jpg'

// ── Conteúdo ───────────────────────────────────────────────────────────────

const WHATSAPP_DIAGNOSTICO = 'https://wa.me/5511917101173?text=Quero+agendar+um+diagn%C3%B3stico+sobre+o+Fluxe'

const METODO_FLUXE = [
  { num: '01', nome: 'Comercial' },
  { num: '02', nome: 'Onboarding' },
  { num: '03', nome: 'Ativação' },
  { num: '04', nome: 'Implantação' },
  { num: '05', nome: 'Operacional' },
  { num: '06', nome: 'Estratégico' },
  { num: '07', nome: 'Acompanhamento' },
]

const TRANSFORMACAO = [
  { antes: 'Cobra no feeling', depois: 'Cobra usando dados' },
  { antes: 'Vive no WhatsApp', depois: 'Trabalha com processos' },
  { antes: 'Apaga incêndio', depois: 'Toma decisões com indicadores' },
  { antes: 'Cresce no improviso', depois: 'Cresce com previsibilidade' },
]

const FORMATOS = [
  {
    nome: 'Mentoria Individual',
    desc: 'Encontros comigo, só você, olhando de perto a sua operação — no seu ritmo, nas suas prioridades.',
  },
  {
    nome: 'Mentoria em Grupo',
    desc: 'Mesmo Método Fluxe, aplicado em turma — trocando experiência com outros donos de BPO Financeiro.',
  },
]

const RESULTADOS = [
  { quote: 'Antes eu precificava no feeling. Descobri que meu cliente mais exigente consumia 3× mais horas que eu cobrava. Reajustei e aumentei minha margem em quase 40%.', name: 'Graziela Araújo', role: 'Sócia-fundadora · FinanciproBPO', init: 'GA' },
  { quote: 'Minha equipe cresceu de 2 para 8 analistas e eu ainda sei exatamente o que cada um está fazendo, para qual cliente e em quanto tempo.', name: 'Ricardo Lemos', role: 'Diretor de Operações · ContaMaxBPO', init: 'RL' },
]

const FAQS = [
  { q: 'Preciso saber mexer em sistema?', a: 'Não. O Fluxe foi pensado pra quem opera BPO no dia a dia, não pra quem entende de tecnologia. O Laboratório Fluxe já vem configurado dentro do acompanhamento — você aprende usando, na prática.' },
  { q: 'Como funciona o acompanhamento?', a: 'Encontros comigo (individuais ou em grupo, você escolhe), direto na sua operação real dentro do Laboratório Fluxe — precificação, rotina, rentabilidade por cliente. Não é um curso gravado.' },
  { q: 'Quanto custa?', a: 'Depende do formato e da duração combinados no diagnóstico — por isso não coloco tabela de preço aqui. Agenda uma conversa sem compromisso.' },
  { q: 'Já uso outro sistema pra gerir o BPO, dá pra participar?', a: 'Sim. O Fluxe funciona em cima do que você já tem — o Laboratório é o ambiente que uso pra dar clareza aos números, mas o foco é te ajudar a crescer, não trocar de sistema.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Cada BPO tem os dados completamente isolados dentro do Laboratório Fluxe, com criptografia em repouso e em trânsito.' },
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
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 })
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
    document.body.style.background = '#05070E'
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

  function handleHeroMouse(e) {
    if (isMobile) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setHeroTilt({ x: px * 16, y: py * 12 })
  }

  const NAV_ITEMS = [['metodo', 'Método'], ['laboratorio', 'Laboratório'], ['formatos', 'Formatos'], ['faq', 'FAQ']]

  return (
    <div style={{ fontFamily: "'Inter','system-ui',sans-serif", background: '#05070E', color: '#F1F5F9', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 48px', height: 68,
        background: navScrolled || menuOpen ? 'rgba(5,7,14,0.85)' : 'transparent',
        backdropFilter: navScrolled || menuOpen ? 'blur(20px)' : 'none',
        borderBottom: navScrolled || menuOpen ? '1px solid rgba(255,255,255,.06)' : 'none',
        transition: 'all .3s',
      }}>
        <Logo />
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
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
            {isMobile ? 'Diagnóstico →' : 'Agendar diagnóstico →'}
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
        <div style={{ position: 'fixed', top: 68, left: 0, right: 0, zIndex: 190, background: 'rgba(5,7,14,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '12px 20px 20px' }}>
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
      <section id="hero" onMouseMove={handleHeroMouse} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '96px 20px 56px' : '108px 0 0', position: 'relative', overflow: 'hidden' }}>
        {/* Grid sutil de fundo */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,.05) 1px, transparent 1px)', backgroundSize: '34px 34px', pointerEvents: 'none' }} />
        {/* Glows: roxo + azul, mais profundidade */}
        <div style={{ position: 'absolute', top: '18%', left: '8%', width: 560, height: 560, background: 'radial-gradient(ellipse, rgba(139,92,246,.20) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: 640, height: 640, background: 'radial-gradient(ellipse, rgba(59,130,246,.16) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(70px)' }} />

        <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '5fr 7fr', gap: isMobile ? 8 : 24, alignItems: 'center', padding: isMobile ? 0 : '0 40px' }}>

          {isMobile && (
            <Reveal>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <img src={CLAUDIA_ECOSSISTEMA_SRC} alt="Cláudia Bernardo — Fluxe" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
              </div>
            </Reveal>
          )}

          <Reveal>
            <div style={{ textAlign: isMobile ? 'center' : 'left', padding: isMobile ? '0 4px' : 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)', borderRadius: 99, padding: '6px 14px', marginBottom: 26 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E80' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', letterSpacing: '.12em', textTransform: 'uppercase' }}>O ecossistema Fluxe</span>
              </div>

              <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 32 : 'clamp(40px, 4.6vw, 68px)', fontWeight: 900, lineHeight: 1.06, margin: '0 0 22px', color: '#F8FAFC', letterSpacing: '-.03em' }}>
                Pare de operar no feeling.<br />
                <span style={{ fontStyle: 'italic', fontWeight: 600, background: 'linear-gradient(90deg,#818CF8,#A855F7,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Administre seu BPO como uma empresa.
                </span>
              </h1>

              <p style={{ fontSize: isMobile ? 15 : 18, color: '#94A3B8', lineHeight: 1.7, margin: isMobile ? '0 auto 32px' : '0 0 36px', maxWidth: 480 }}>
                Dentro do Fluxe você estrutura, organiza, precifica, implanta e escala seu BPO Financeiro com o Método Fluxe® — na prática, dentro do Laboratório Fluxe.
              </p>

              <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <button onClick={abrirDiagnostico}
                  style={{ padding: '16px 34px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(99,102,241,.45)', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 38px rgba(99,102,241,.6)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,.45)' }}>
                  Agendar diagnóstico →
                </button>
              </div>
            </div>
          </Reveal>

          {!isMobile && (
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '86vh' }}>
              <img src={CLAUDIA_ECOSSISTEMA_SRC} alt="Cláudia Bernardo — Fluxe" style={{
                maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block',
                transform: `translate(${heroTilt.x}px, ${heroTilt.y}px)`, transition: 'transform .3s ease-out',
              }} />
            </div>
          )}
        </div>
      </section>

      {/* ── FAIXA DE AUTORIDADE ─────────────────────────────────── */}
      <div style={{ padding: '16px 0', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', overflow: 'hidden', whiteSpace: 'nowrap', background: '#080B14' }}>
        <div className="fluxe-marquee-track" style={{ display: 'inline-block' }}>
          {/* Espaço reservado pra números reais (ex.: "+NN BPOs estruturados") quando a Claudia tiver — não invento estatística aqui */}
          {[0, 1].map(rep => (
            <span key={rep} style={{ display: 'inline-block' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.15em', color: '#64748B', margin: '0 18px' }}>
                  ESPECIALISTA EM BPO FINANCEIRO <span style={{ color: '#8B5CF6' }}>·</span> CONTROLADORIA <span style={{ color: '#8B5CF6' }}>·</span> FP&A <span style={{ color: '#8B5CF6' }}>·</span> ESTRUTURAÇÃO DE OPERAÇÕES <span style={{ color: '#8B5CF6' }}>·</span> GESTÃO FINANCEIRA <span style={{ color: '#8B5CF6' }}>·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes fluxe-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .fluxe-marquee-track { animation: fluxe-marquee 38s linear infinite; }
        `}</style>
      </div>

      {/* ── ENTRAR (compacto, só aparece quando clicado) ────────── */}
      {showLogin && (
        <section ref={formRef} style={{ padding: isMobile ? '0 20px 60px' : '0 48px 72px', display: 'flex', justifyContent: 'center', marginTop: 56 }}>
          <div style={{ width: '100%', maxWidth: 380, background: 'rgba(255,255,255,.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)', position: 'relative' }}>

            <button onClick={() => setShowLogin(false)}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, padding: 4 }}>
              ✕
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
                {mfaStep ? '🔐 Verificação em duas etapas' : formMode === 'login' ? 'Já faz parte do Fluxe?' : 'Recuperar senha'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {mfaStep ? 'Abra o app autenticador e digite o código de 6 dígitos' : formMode === 'login' ? 'Entre no Laboratório Fluxe' : 'Enviaremos um link para seu e-mail'}
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

      {/* ── QUEM É A CLÁUDIA ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#080B14', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 36 : 72, alignItems: 'center' }}>
          <Reveal>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 420, height: 420, background: 'radial-gradient(ellipse, rgba(139,92,246,.22) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              <img src={CLAUDIA_SRC} alt="Cláudia Bernardo" style={{
                width: '100%', display: 'block', objectFit: 'cover', position: 'relative', borderRadius: 8,
                WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
              }} />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 16 }}>QUEM É A CLÁUDIA</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 22px', letterSpacing: '-.02em', lineHeight: 1.15 }}>
                Passei anos estruturando operações financeiras. Criei o Método Fluxe pra ninguém mais precisar aprender do jeito difícil.
              </h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, margin: '0 0 16px' }}>
                Vi dono de BPO competente na entrega, mas perdido na própria operação — sem saber o custo real da equipe, cobrando no feeling, apagando incêndio todo mês.
              </p>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, margin: '0 0 24px' }}>
                O Fluxe nasceu pra fechar essa distância: um método próprio, aplicado dentro de um ambiente que eu mesma uso — não teoria solta, prática guiada.
              </p>
              <div style={{ fontSize: 12, color: '#64748B' }}>Pós-graduada em Finanças (FGV) · Direito e Administração (Comércio Exterior)</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── O MÉTODO FLUXE® ─────────────────────────────────────── */}
      <section id="metodo" style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 44 : 72 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>O MÉTODO FLUXE®</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 28 : 44, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Sete etapas. Uma metodologia própria.</h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ position: 'relative', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 8 : 0 }}>
              {!isMobile && (
                <div style={{ position: 'absolute', top: 27, left: '7%', right: '7%', height: 1, background: 'linear-gradient(90deg,rgba(99,102,241,.1),rgba(139,92,246,.5),rgba(99,102,241,.1))' }} />
              )}
              <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'space-between', gap: isMobile ? 28 : 8, minWidth: isMobile ? 620 : 'auto' }}>
                {METODO_FLUXE.map((m, i) => (
                  <div key={m.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1, flex: isMobile ? '0 0 auto' : 1 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i === 3 ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#0D1424',
                      border: i === 3 ? 'none' : '1px solid rgba(255,255,255,.12)',
                      boxShadow: i === 3 ? '0 0 0 6px rgba(99,102,241,.14)' : 'none',
                    }}>
                      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: i === 3 ? '#fff' : '#94A3B8' }}>{m.num}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: i === 3 ? '#F1F5F9' : '#94A3B8', whiteSpace: 'nowrap' }}>{m.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', maxWidth: 560, margin: isMobile ? '40px auto 0' : '56px auto 0', lineHeight: 1.7 }}>
              Uma metodologia proprietária criada para transformar operadores em donos de BPO Financeiro altamente organizados e lucrativos.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── O LABORATÓRIO FLUXE ──────────────────────────────────── */}
      <section id="laboratorio" style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#080B14', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>O LABORATÓRIO FLUXE</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>O ambiente onde você aplica o método — não assiste, executa.</h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
          <div style={{ background: '#0D1424', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)' }}>
            {/* Chrome bar */}
            <div style={{ background: '#1A2235', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#FF5F57','#FFBD2E','#28C940'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                <span style={{ fontSize: 11, color: '#475569' }}>fluxebpo.com.br</span>
              </div>
            </div>

            <div style={{ display: 'flex', height: isMobile ? 320 : 430 }}>
              {!isMobile && (
                <div style={{ width: 176, background: '#F8FAFC', borderRight: '1px solid #E2E8F0', flexShrink: 0, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ padding: '8px 10px 12px', marginBottom: 4, borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', letterSpacing: '-.3px' }}>Fluxe</div>
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
          </Reveal>

          <Reveal delay={0.2}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16, marginTop: 28 }}>
              {[
                { icon: '🧩', title: 'Templates prontos', desc: 'Proposta, contrato, checklist de onboarding, planilha de precificação' },
                { icon: '✅', title: 'Checklists guiados', desc: 'Cada etapa do Método Fluxe com seu próprio checklist de execução' },
                { icon: '🤖', title: 'IA aplicada', desc: 'Lê boletos e notas fiscais recebidas e resume pra você, automaticamente' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 16px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FORMATOS ────────────────────────────────────────────── */}
      <section id="formatos" style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>FORMATOS</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>O mesmo Método Fluxe, dois jeitos de aplicar.</h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 20 }}>
              {FORMATOS.map((f, i) => (
                <div key={i} style={{ padding: '32px 28px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 18, backdropFilter: 'blur(12px)' }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 12 }}>{f.nome}</div>
                  <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Nos dois formatos: Método Fluxe completo + Laboratório Fluxe incluso.</p>
              <button onClick={abrirDiagnostico}
                style={{ padding: '15px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,.4)' }}>
                Agendar diagnóstico →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TRANSFORMAÇÃO ───────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>TRANSFORMAÇÃO</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Antes × Depois</h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {TRANSFORMACAO.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between',
                  gap: isMobile ? 8 : 24, padding: '26px 8px', borderTop: i > 0 ? '1px solid rgba(255,255,255,.06)' : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#F87171', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Antes</div>
                    <div style={{ fontSize: isMobile ? 16 : 19, color: '#64748B', fontWeight: 500 }}>{t.antes}</div>
                  </div>
                  <div style={{ fontSize: 18, color: '#475569', flexShrink: 0 }}>→</div>
                  <div style={{ flex: 1, textAlign: isMobile ? 'left' : 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4ADE80', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Depois</div>
                    <div style={{ fontSize: isMobile ? 16 : 19, color: '#F1F5F9', fontWeight: 700 }}>{t.depois}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── RESULTADOS ──────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>RESULTADOS</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 24 : 34, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Donos de BPO que pararam de adivinhar</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 16 : 24 }}>
              {RESULTADOS.map((t, i) => (
                <div key={i} style={{ padding: '30px 28px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16 }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 40, color: '#8B5CF6', lineHeight: .6, opacity: .6, marginBottom: 16 }}>"</div>
                  <p style={{ fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontWeight: 500, fontSize: 17, color: '#CBD5E1', lineHeight: 1.65, margin: '0 0 20px' }}>{t.quote}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.init}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>FAQ</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 24 : 34, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Perguntas frequentes</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.025)', border: `1px solid ${openFaq === i ? 'rgba(99,102,241,.25)' : 'rgba(255,255,255,.06)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}>
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
          </Reveal>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 20px' : '150px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.16),rgba(59,130,246,.1))', border: '1px solid rgba(99,102,241,.24)', borderRadius: 24, padding: isMobile ? '48px 26px' : '76px 60px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 24 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 36px', letterSpacing: '-.02em', lineHeight: 1.35, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                  Seu próximo cliente não precisa aumentar seu trabalho.<br />Ele precisa aumentar seu lucro.
                </h2>
                <button onClick={abrirDiagnostico}
                  style={{ padding: '16px 36px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 36px rgba(99,102,241,.5)', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
                  Agendar diagnóstico →
                </button>
              </div>
            </div>
          </Reveal>
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
          <div style={{ fontSize: 11, color: '#334155' }}>© {new Date().getFullYear()} Fluxe. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────────────────

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

function Logo() {
  return (
    <a href="/" style={{ display: 'inline-block', lineHeight: 0 }}>
      <img src={LOGO_SRC} alt="Fluxe" style={{ height: 44, width: 'auto', maxWidth: 220, objectFit: 'contain', objectPosition: 'left' }} />
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
