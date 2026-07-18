import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import LOGO_SRC from '../assets/logo-fluxe-white.png'

// ── Conteúdo ───────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: 'fa-solid fa-calculator',    title: 'Saiba o custo real de cada analista.',        desc: 'Salário, encargos, benefícios, horas úteis reais. O Fluxe calcula o custo verdadeiro da sua hora — não a estimativa que todo mundo chuta.', color: '#818CF8' },
  { icon: 'fa-solid fa-gauge-high',    title: 'Descubra quantos clientes você aguenta.',     desc: 'Com base nas horas disponíveis da equipe, o Fluxe projeta sua capacidade máxima. Saiba antes de aceitar um cliente que vai travar a operação.', color: '#22D3EE' },
  { icon: 'fa-solid fa-chart-line',    title: 'Veja a margem real de cada cliente.',         desc: 'Horas gastas × custo da hora = custo real de atendimento. Compare com o que o cliente paga e descubra quem está te dando prejuízo.', color: '#34D399' },
  { icon: 'fa-solid fa-list-check',    title: 'Nunca mais perca um prazo de cliente.',       desc: 'Cada obrigação tem responsável, data e alerta automático. Sua equipe sabe exatamente o que fazer — sem precisar perguntar no WhatsApp.', color: '#A78BFA' },
  { icon: 'fa-solid fa-lock',          title: 'Fim da dependência de pessoas.',              desc: 'Senhas, logins e credenciais dos clientes centralizados com criptografia. Quando um analista sai, a operação não para.', color: '#FCD34D' },
  { icon: 'fa-solid fa-route',         title: 'Toda a carteira sob controle.',               desc: 'Do onboarding ao estratégico. Acompanhe cada etapa de cada cliente com histórico, etapa e evolução visíveis de um lugar só.', color: '#F472B6' },
  { icon: 'fa-brands fa-whatsapp',     title: 'Atenda pelo WhatsApp sem sair do Fluxe.',     desc: 'Conecte o WhatsApp oficial da sua empresa e responda clientes direto do sistema. A IA já lê boletos e notas fiscais recebidas e resume pra você.', color: '#22C55E' },
]

const PLANS = [
  {
    name: 'Essencial', price: 'R$ 97', period: '/mês', highlight: false, badge: null,
    idealPara: 'Ideal para: quem quer todo o sistema e ainda não precisa de WhatsApp integrado',
    features: [
      'Até 3 usuários',
      'Tarefas, checklists e modelos de processo (SOP)',
      'Agenda e Central operacional',
      'Cofre digital de senhas',
      'Cadastro de clientes com Esteiras operacionais',
      'Radar de saúde do cliente + Relatório 360° em PDF',
      'Precificação consultiva com aviso de capacidade',
      'CRM com pipeline comercial',
      'Executivo, Rentabilidade e Capacidade da equipe',
      'Previsão de contratação e simulação "e se"',
      'Meta de crescimento',
      'Suporte por e-mail',
    ],
    cta: 'Começar grátis',
  },
  {
    name: 'Completo', price: 'R$ 197', period: '/mês', highlight: true, badge: 'Mais popular',
    idealPara: 'Ideal para: quem quer atender o cliente pelo WhatsApp direto de dentro do Fluxe',
    features: [
      'Tudo do Essencial',
      'Usuários ilimitados',
      'WhatsApp integrado (API oficial da Meta ou conexão rápida)',
      'Leitura automática de boletos e notas fiscais recebidas, por IA',
      'Suporte prioritário via WhatsApp',
    ],
    cta: 'Assinar agora',
  },
  {
    name: 'Fluxe + Mentoria BPO Lucrativo', price: 'Sob consulta', period: '', highlight: false, badge: 'Cobrança anual',
    idealPara: 'Ideal para: quem quer o sistema e alguém guiando o crescimento junto',
    features: [
      'Tudo do Completo, por 1 ano',
      '12 encontros individuais de mentoria (1h/mês) com a fundadora',
      'Plano de crescimento acompanhado de perto, mês a mês',
    ],
    cta: 'Falar com vendas',
    href: 'https://wa.me/5511917101173?text=Quero+saber+sobre+o+plano+Fluxe+%2B+Mentoria+BPO+Lucrativo',
  },
]

const FAQS = [
  { q: 'Preciso instalar algo?', a: 'Não. O Fluxe BPO é 100% web — funciona direto no navegador, sem instalação. Acesse de qualquer computador, tablet ou celular.' },
  { q: 'Como funciona o período de teste?', a: 'Você cria a conta gratuitamente e tem 14 dias completos para explorar todas as funcionalidades, sem precisar de cartão de crédito.' },
  { q: 'Posso convidar minha equipe?', a: 'Sim. O administrador convida analistas, supervisores e gestores. Cada perfil tem permissões configuráveis de acordo com a hierarquia do seu BPO.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Cada empresa tem dados completamente isolados. Usamos criptografia em repouso e em trânsito, hospedado em infraestrutura Supabase/AWS.' },
  { q: 'Funciona para qualquer tamanho de BPO?', a: 'Sim, do BPO solo ao escritório com equipe maior. O Essencial atende até 3 usuários; a partir do Completo, os usuários são ilimitados. O Fluxe + Mentoria BPO Lucrativo soma acompanhamento individual pra quem quer escalar mais rápido.' },
  { q: 'Qual a diferença entre os planos?', a: 'O Essencial tem todo o sistema para até 3 usuários. O Completo libera usuários ilimitados e o WhatsApp integrado. O Fluxe + Mentoria BPO Lucrativo inclui tudo do Completo por 1 ano, mais 12 encontros individuais de mentoria com a fundadora.' },
]

// ── Componente principal ───────────────────────────────────────────────────

export default function LoginPage() {
  const [formMode, setFormMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [openFaq, setOpenFaq] = useState(null)
  const [mockupTab, setMockupTab] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const formRef = useRef(null)

  const { signIn, signUp, resetPassword, mfaChallenge, mfaVerifyLogin, signInWithGoogle } = useAuthStore()
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
    } else if (formMode === 'signup') {
      if (!nome || !nomeEmpresa) { setMsg('Preencha todos os campos'); setLoading(false); return }
      if (!aceitouTermos) { setMsg('Aceite os termos de uso para continuar'); setLoading(false); return }
      const { error } = await signUp(email, password, nome, nomeEmpresa)
      if (error) setMsg(toStr(error))
      else setMsg('Conta criada! Verifique seu e-mail para confirmar.')
      setLoading(false)
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

  function goSignup() {
    setFormMode('signup')
    setMsg('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function goLogin() {
    setFormMode('login')
    setMsg('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

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
            {[['funcionalidades','Funcionalidades'],['como-funciona','Como funciona'],['precos','Planos'],['faq','FAQ']].map(([id, label]) => (
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
          <button onClick={goSignup}
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,.35)', transition: 'all .2s' }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,.55)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,.35)'}>
            {isMobile ? 'Grátis →' : 'Teste grátis →'}
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
          {[['funcionalidades','Funcionalidades'],['como-funciona','Como funciona'],['precos','Planos'],['faq','FAQ']].map(([id, label]) => (
            <button key={id} onClick={() => { scrollTo(id); setMenuOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 15, fontWeight: 500, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              {label}
            </button>
          ))}
          <button onClick={() => { goSignup(); setMenuOpen(false) }}
            style={{ display: 'block', width: '100%', marginTop: 16, padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Começar 14 dias grátis →
          </button>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '100px 20px 60px' : '100px 48px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,.05) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,.18) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px', gap: isMobile ? 48 : 72, width: '100%', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1, alignItems: 'center' }}>

          {/* Esquerda: copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)', borderRadius: 99, padding: '6px 14px', marginBottom: 24, width: 'fit-content' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 8px #22C55E80' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', letterSpacing: '.12em', textTransform: 'uppercase' }}>Novo — 14 dias grátis, sem cartão de crédito</span>
            </div>

            <h1 style={{ fontSize: isMobile ? 34 : 54, fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px', color: '#F8FAFC', letterSpacing: '-.03em' }}>
              Você sabe qual cliente<br />
              <span style={{ background: 'linear-gradient(90deg,#818CF8,#A855F7,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                está te dando prejuízo?
              </span>
            </h1>

            <p style={{ fontSize: isMobile ? 16 : 18, color: '#94A3B8', lineHeight: 1.75, margin: '0 0 32px', maxWidth: 520 }}>
              Quanto custa atender cada cliente? Qual analista está no limite? Quem está consumindo mais horas do que paga? O Fluxe responde essas perguntas em tempo real — para você parar de crescer no escuro.
            </p>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 40 }}>
              <button onClick={goSignup}
                style={{ padding: '14px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,.45)', textAlign: 'center', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(99,102,241,.55)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,.45)' }}>
                Começar 14 dias grátis →
              </button>
              <button onClick={() => scrollTo('como-funciona')}
                style={{ padding: '14px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'transparent', color: '#CBD5E1', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.10)' }}>
                Como funciona
              </button>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['14 dias grátis', 'sem cartão'], ['Preço fixo', 'não cobra por cliente'], ['Configuração', 'em menos de 30 min']].map(([t, s], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#22C55E', fontSize: 10, fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}><strong style={{ color: '#CBD5E1' }}>{t}</strong> {s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direita: formulário */}
          <div ref={formRef}>
            <div style={{ background: 'rgba(255,255,255,.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 32, boxShadow: '0 32px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)' }}>

              {formMode !== 'reset' && (
                <div style={{ display: 'flex', background: 'rgba(0,0,0,.3)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
                  {[['login', 'Entrar'], ['signup', 'Criar conta']].map(([m, l]) => (
                    <button key={m} onClick={() => { setFormMode(m); setMsg('') }}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .2s',
                        background: formMode === m ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
                        color: formMode === m ? '#fff' : '#475569',
                        boxShadow: formMode === m ? '0 2px 10px rgba(99,102,241,.35)' : 'none' }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
                  {mfaStep ? '🔐 Verificação em duas etapas' : formMode === 'login' ? 'Bem-vindo(a) de volta' : formMode === 'signup' ? 'Crie sua conta grátis' : 'Recuperar senha'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {mfaStep ? 'Abra o app autenticador e digite o código de 6 dígitos' : formMode === 'login' ? 'Acesse sua plataforma Fluxe BPO' : formMode === 'signup' ? '14 dias grátis, sem cartão de crédito' : 'Enviaremos um link para seu e-mail'}
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
              <form onSubmit={handleMfa}>
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
                {formMode === 'signup' && (
                  <>
                    <DarkField label="Seu nome" value={nome} onChange={setNome} placeholder="Maria Silva" />
                    <DarkField label="Nome do BPO" value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: Empreenda BPO" />
                  </>
                )}
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

                {formMode === 'signup' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)}
                        style={{ width: 14, height: 14, marginTop: 2, accentColor: '#6366F1', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
                        Concordo com os{' '}
                        <a href="/termos" target="_blank" style={{ color: '#A5B4FC', textDecoration: 'none' }}>Termos de Uso</a>{' '}e{' '}
                        <a href="/privacidade" target="_blank" style={{ color: '#A5B4FC', textDecoration: 'none' }}>Política de Privacidade</a>
                      </span>
                    </label>
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
                  {loading ? 'Aguarde...' : formMode === 'login' ? 'Entrar no Fluxe BPO →' : formMode === 'signup' ? 'Criar conta grátis →' : 'Enviar link de recuperação'}
                </button>
              </form>
              )} {/* fim do ternário mfaStep */}

              {!mfaStep && (
                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12 }}>
                {formMode === 'login' ? (
                  <>
                    <button onClick={() => { setFormMode('reset'); setMsg('') }}
                      style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                      Esqueci minha senha
                    </button>
                    <span style={{ margin: '0 8px', color: '#2D3748' }}>·</span>
                    <button onClick={() => { setFormMode('signup'); setMsg('') }}
                      style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                      Criar conta grátis
                    </button>
                  </>
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
          </div>
        </div>
      </section>

      {/* ── PRODUTO (mockup do app) ───────────────────────────── */}
      <section style={{ padding: isMobile ? '0 20px 72px' : '0 48px 96px', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '.15em', textTransform: 'uppercase' }}>VEJA O FLUXE BPO EM AÇÃO</span>
          </div>

          {/* Abas do mockup */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['dashboard','Central Operacional'],['agenda','Agenda'],['crm','Pipeline CRM'],['rent','Rentabilidade']].map(([tab, label]) => (
              <button key={tab} onClick={() => setMockupTab(tab)}
                style={{ padding: '7px 16px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .2s',
                  borderColor: mockupTab === tab ? '#6366F1' : 'rgba(255,255,255,.1)',
                  background: mockupTab === tab ? 'rgba(99,102,241,.15)' : 'transparent',
                  color: mockupTab === tab ? '#A5B4FC' : '#475569' }}>
                {label}
              </button>
            ))}
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
                    { icon: 'fa-solid fa-house',       label: 'Dashboard',   tab: 'dashboard' },
                    { icon: 'fa-solid fa-list-check',  label: 'Tarefas',     tab: null },
                    { icon: 'fa-solid fa-building',    label: 'Clientes',    tab: null },
                    { icon: 'fa-solid fa-calendar',    label: 'Agenda',      tab: 'agenda' },
                    { icon: 'fa-solid fa-filter',      label: 'CRM',         tab: 'crm' },
                    { icon: 'fa-solid fa-lock',        label: 'Cofre',       tab: null },
                    { icon: 'fa-solid fa-chart-line',  label: 'Relatórios',  tab: 'rent' },
                  ].map((item, i) => {
                    const active = item.tab === mockupTab
                    return (
                      <div key={i} onClick={() => item.tab && setMockupTab(item.tab)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: item.tab ? 'pointer' : 'default',
                          background: active ? '#EEF2FF' : 'transparent',
                          boxShadow: active ? 'inset 3px 0 0 #6366F1' : 'none',
                          color: active ? '#6366F1' : '#64748B', fontSize: 11, fontWeight: active ? 600 : 500 }}>
                        <i className={item.icon} style={{ fontSize: 10, width: 12, textAlign: 'center' }} />
                        <span>{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Conteúdo principal */}
              <div style={{ flex: 1, background: '#F1F5F9', padding: isMobile ? 12 : 18, overflow: 'hidden' }}>

                {mockupTab === 'dashboard' && (
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
                )}

                {mockupTab === 'agenda' && (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>Agenda — Junho 2026</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>12 compromissos este mês</div>
                    </div>
                    {/* Mini calendário */}
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 8 }}>
                        {['D','S','T','Q','Q','S','S'].map((d,i)=>(
                          <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#94A3B8' }}>{d}</div>
                        ))}
                        {Array.from({length:30},(_,i)=>i+1).map(d=>(
                          <div key={d} style={{ textAlign: 'center', fontSize: 10, padding: '3px 2px', borderRadius: 4,
                            background: d===12?'#6366F1':d===18||d===25?'#EEF2FF':'transparent',
                            color: d===12?'#fff':d===18||d===25?'#6366F1':'#475569',
                            fontWeight: d===12?700:'normal' }}>
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>Próximos vencimentos</span>
                      </div>
                      {[['Hoje','IRPJ trimestral — Start Tech','#EF4444'],['18/06','Folha de pagamento — 3 clientes','#F59E0B'],['25/06','Conciliação mensal — ABC BPO','#6366F1']].map(([d,l,c],i)=>(
                        <div key={i} style={{ padding: '8px 12px', borderBottom: i<2?'1px solid #F8FAFC':'none', display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: c, background: c+'20', padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' }}>{d}</div>
                          <div style={{ fontSize: 11, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mockupTab === 'crm' && (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>Pipeline CRM</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>6 leads · R$ 5.200 em negociação</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 8, height: isMobile ? 240 : 310, overflowY: 'hidden' }}>
                      {[
                        { col: 'Prospecção', cor: '#64748B', leads: ['Empresa Alpha','Beta Serviços'] },
                        { col: 'Qualificação', cor: '#F59E0B', leads: ['Gama Comércio'] },
                        { col: 'Proposta', cor: '#6366F1', leads: ['Delta & Cia','Omega Group'] },
                        { col: 'Fechado', cor: '#10B981', leads: ['Zeta Soluções'] },
                      ].map((col, i) => (
                        <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                          <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9', background: col.cor+'12', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.cor }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: col.cor }}>{col.col}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 9, background: col.cor+'20', color: col.cor, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{col.leads.length}</span>
                          </div>
                          <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {col.leads.map((l,j)=>(
                              <div key={j} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 5, padding: '6px 8px', fontSize: 10, color: '#334155', fontWeight: 500 }}>{l}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mockupTab === 'rent' && (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>Rentabilidade</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Análise por cliente · Junho 2026</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
                      {[{v:'R$18,4k',l:'Receita mensal',c:'#6366F1'},{v:'68,3%',l:'Margem Global',c:'#10B981'},{v:'R$35',l:'Custo/hora',c:'#F59E0B'}].map((k,i)=>(
                        <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: k.c }}>{k.v}</div>
                          <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{k.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px 8px', borderBottom: '1px solid #F1F5F9', fontSize: 10, fontWeight: 700, color: '#94A3B8', display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px' }}>
                        <span>CLIENTE</span><span>Valor/mês</span><span>HORAS</span><span>MARGEM</span>
                      </div>
                      {[['ABC Contabilidade','R$2.200','18h','81%','#15803D'],['Gama Comércio','R$1.800','22h','54%','#92400E'],['Beta Serviços','R$900','28h','-12%','#991B1B']].map(([n,m,h,mg,c],i)=>(
                        <div key={i} style={{ padding: '8px 12px', borderBottom: i<2?'1px solid #F8FAFC':'none', display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#334155' }}>{m}</span>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B' }}>{h}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: c }}>{mg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Callouts abaixo do mockup */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 24 }}>
              {[
                { icon: '⚡', title: 'Visão em tempo real', desc: 'Dashboard atualizado a cada ação da equipe' },
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

      {/* ── PROBLEMA ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>O PROBLEMA</div>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-.02em' }}>Reconhece alguma dessas situações?</h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>A maioria dos BPOs cresce rápido, mas sem uma operação estruturada o crescimento vira caos.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 14, maxWidth: 860, margin: '0 auto 44px' }}>
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
              {
                time: 'Quando um analista sai',
                icon: '🔑',
                desc: 'Junto com ele vai o login do sistema do cliente, a senha do contador e o conhecimento de como aquela obrigação específica funciona.',
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
                Se você reconheceu mais de uma — o Fluxe foi criado para você
              </div>
              <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, rgba(99,102,241,.5), transparent)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────── */}
      <section id="como-funciona" style={{ padding: isMobile ? '60px 20px' : '96px 48px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>COMO FUNCIONA</div>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 12px', letterSpacing: '-.02em' }}>Da operação ao lucro, em um lugar só</h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#64748B' }}>Sem implantação complexa. Sem consultores. Configure em menos de 30 minutos.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 20 : 28, position: 'relative' }}>
            {!isMobile && (
              <div style={{ position: 'absolute', top: 36, left: 'calc(16.66% + 20px)', right: 'calc(16.66% + 20px)', height: 1, background: 'linear-gradient(90deg,rgba(99,102,241,.35),rgba(139,92,246,.35))', zIndex: 0 }} />
            )}
            {[
              { num: '01', emoji: '🧮', title: 'Cadastre sua equipe e calcule o custo real', desc: 'Informe salários, encargos e carga horária. O Fluxe calcula o custo real da sua hora — e projeta quantos clientes sua operação consegue atender.' },
              { num: '02', emoji: '✅', title: 'Organize a operação por cliente', desc: 'Tarefas, prazos, checklists e cofre de senhas. Cada analista sabe exatamente o que fazer — sem perguntar no WhatsApp.' },
              { num: '03', emoji: '📈', title: 'Veja a margem real e decida com dados', desc: 'MRR, horas gastas e rentabilidade por cliente. Você sabe quem está lucrando, quem está no limite — e qual o próximo passo para crescer.' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '32px 24px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(99,102,241,.18),rgba(139,92,246,.14))', border: '1px solid rgba(99,102,241,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 22 }}>
                  {step.emoji}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>PASSO {step.num}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVA SOCIAL ────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>QUEM USA O FLUXE</div>
            <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#F8FAFC', margin: '0 0 12px', letterSpacing: '-.02em' }}>BPOs que pararam de adivinhar</h2>
            <p style={{ fontSize: isMobile ? 14 : 15, color: '#64748B' }}>e começaram a gerir com dados reais</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 16 : 24 }}>
            {[
              { quote: 'Antes eu precificava no feeling. Com o Fluxe, descobri que meu cliente mais exigente consumia 3× mais horas que eu cobrava. Reajustei e aumentei minha margem em quase 40%.', name: 'Graziela Araújo', role: 'Sócia-fundadora · FinanciproBPO', local: 'São Paulo – SP', init: 'GA' },
              { quote: 'Minha equipe cresceu de 2 para 8 analistas e eu ainda sei exatamente o que cada um está fazendo, para qual cliente e em quanto tempo. Impossível sem o Fluxe.', name: 'Ricardo Lemos', role: 'Diretor de Operações · ContaMaxBPO', local: 'Belo Horizonte – MG', init: 'RL' },
              { quote: 'Quando um analista saiu levando todos os acessos de cliente, percebi que precisava de um cofre centralizado. O Fluxe resolveu isso no mesmo dia que fiz o cadastro.', name: 'Camila Souza', role: 'CEO · PrimeirosBPO Financeiro', local: 'Recife – PE', init: 'CS' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '28px 24px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ fontSize: 32, color: '#6366F1', lineHeight: 1, opacity: .5 }}>"</div>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75, margin: 0 }}>{t.quote}</p>
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

      {/* ── FUNCIONALIDADES ─────────────────────────────────────── */}
      <section id="funcionalidades" style={{ padding: isMobile ? '60px 20px' : '96px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>FUNCIONALIDADES</div>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-.02em' }}>Feito para quem opera BPO no Brasil</h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#64748B', maxWidth: 560, margin: '0 auto' }}>Não é um software genérico adaptado. Cada funcionalidade resolve um problema real de quem atende múltiplos clientes ao mesmo tempo.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 14 : 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i}
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '24px', transition: 'all .25s', cursor: 'default' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,.28)'; e.currentTarget.style.background = 'rgba(99,102,241,.05)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <i className={f.icon} style={{ color: f.color, fontSize: 15 }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARAÇÃO ──────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>POR QUE O FLUXE</div>
            <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#F8FAFC', margin: '0 0 12px', letterSpacing: '-.02em' }}>Antes e depois do Fluxe</h2>
            <p style={{ fontSize: isMobile ? 13 : 15, color: '#64748B' }}>O que muda na prática quando você para de improvisar</p>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(99,102,241,.08)' }}>
              <div style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.1em', borderRight: '1px solid rgba(255,255,255,.06)' }}>Situação</div>
              <div style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.1em', borderRight: '1px solid rgba(255,255,255,.06)' }}>❌ Sem sistema</div>
              <div style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '.1em' }}>✓ Com o Fluxe</div>
            </div>
            {[
              ['Precificar novo cliente',       'Chuta, torce para não dar prejuízo', 'Calcula com base no custo real da equipe'],
              ['Rentabilidade por cliente',     'Só descobre quando o problema é grande', 'Acompanha em tempo real todo mês'],
              ['Prazos e obrigações',           'WhatsApp, post-it e memorização', 'Agenda inteligente com alertas automáticos'],
              ['Senhas e acessos dos clientes', 'Planilha, e-mail ou dependente de um analista', 'Cofre criptografado centralizado'],
              ['Capacidade da equipe',          'Aceita cliente sem saber se aguenta',   'Sabe exatamente quantos novos clientes cabem'],
              ['Relatório de produtividade',    'Não existe ou demora horas para gerar', 'Um clique, exportação em Excel com branding'],
            ].map(([s, sem, com], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,.05)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                <div style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#CBD5E1', borderRight: '1px solid rgba(255,255,255,.05)' }}>{s}</div>
                <div style={{ padding: '14px 20px', fontSize: 13, color: '#64748B', borderRight: '1px solid rgba(255,255,255,.05)' }}>{sem}</div>
                <div style={{ padding: '14px 20px', fontSize: 13, color: '#86EFAC' }}>{com}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────── */}
      <section id="precos" style={{ padding: isMobile ? '60px 20px' : '96px 48px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>PLANOS</div>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-.02em' }}>Preço fixo. Sem cobrar por cliente.</h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#64748B', maxWidth: 500, margin: '0 auto' }}>Você paga um valor fixo mensal — independente de quantos clientes sua carteira tiver. Comece grátis por 14 dias, sem cartão.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 16 : 20, maxWidth: 920, margin: '0 auto' }}>
            {PLANS.map((p, i) => (
              <div key={i}
                style={{ background: p.highlight ? 'linear-gradient(160deg,rgba(99,102,241,.17),rgba(139,92,246,.12))' : 'rgba(255,255,255,.03)', border: `1px solid ${p.highlight ? 'rgba(99,102,241,.42)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: '28px 24px', position: 'relative', transition: 'transform .2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(99,102,241,.45)' }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>{p.name}</div>
                {p.idealPara && <div style={{ fontSize: 11, color: '#475569', marginBottom: 8, lineHeight: 1.5 }}>{p.idealPara}</div>}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: '#F8FAFC', letterSpacing: '-.03em' }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>{p.period}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,.07)', marginBottom: 20 }} />
                <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(34,197,94,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <span style={{ color: '#22C55E', fontSize: 9, fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noreferrer"
                    style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', background: 'rgba(255,255,255,.07)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,.1)', transition: 'all .2s' }}>
                    {p.cta}
                  </a>
                ) : (
                  <button onClick={goSignup}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .2s', background: p.highlight ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,.07)', color: p.highlight ? '#fff' : '#CBD5E1', boxShadow: p.highlight ? '0 4px 16px rgba(99,102,241,.4)' : 'none' }}>
                    {p.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Garantia */}
          <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 24 }}>
            {[
              { icon: '🔓', text: 'Cancele quando quiser, sem multa' },
              { icon: '💳', text: 'Sem cartão nos primeiros 14 dias' },
              { icon: '⚡', text: 'Configure em menos de 30 minutos' },
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
      <section id="faq" style={{ padding: isMobile ? '60px 20px' : '96px 48px', background: 'rgba(255,255,255,.015)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Perguntas frequentes</h2>
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
      <section style={{ padding: isMobile ? '60px 20px' : '96px 48px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.09))', border: '1px solid rgba(99,102,241,.22)', borderRadius: 24, padding: isMobile ? '44px 24px' : '64px 52px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 16 }}>COMECE HOJE</div>
              <h2 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 900, color: '#F8FAFC', margin: '0 0 16px', letterSpacing: '-.03em', lineHeight: 1.12 }}>
                Pare de crescer sem saber<br />se está lucrando.
              </h2>
              <p style={{ fontSize: isMobile ? 14 : 16, color: '#94A3B8', marginBottom: 12 }}>14 dias grátis. Sem cartão. Configure em menos de 30 minutos.</p>
              <p style={{ fontSize: isMobile ? 12 : 13, color: '#475569', marginBottom: 32 }}>Cancele quando quiser, sem multa, sem burocracia.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={goSignup}
                  style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,.5)', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,.65)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,.5)' }}>
                  Começar 14 dias grátis →
                </button>
                <a href="https://wa.me/5511917101173?text=Quero+saber+mais+sobre+o+Fluxe+BPO" target="_blank" rel="noreferrer"
                  style={{ padding: '14px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#CBD5E1', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  💬 Falar no WhatsApp
                </a>
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
