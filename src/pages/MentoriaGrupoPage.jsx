import { useState, useEffect, useRef } from 'react'
import { useTurmaAtualPublica } from '../hooks/useData'
import LOGO_SRC from '../assets/logo-fluxe-white.png'

const WHATSAPP_MENTORIA_GRUPO = 'https://wa.me/5511917101173?text=Quero+saber+mais+sobre+a+Mentoria+em+Grupo+do+Fluxe'

const METODO_FLUXE = [
  { num: '01', nome: 'Comercial' },
  { num: '02', nome: 'Onboarding' },
  { num: '03', nome: 'Ativação' },
  { num: '04', nome: 'Implantação' },
  { num: '05', nome: 'Operacional' },
  { num: '06', nome: 'Estratégico' },
  { num: '07', nome: 'Acompanhamento' },
]

const FAQS = [
  { q: 'Como funcionam as aulas?', a: 'Encontros ao vivo comigo, em turma, aplicando o Método Fluxe direto na sua operação. Cada encontro vem com um exercício prático pra você aplicar no Fluxe antes do próximo. Tudo fica gravado.' },
  { q: 'E se eu não conseguir assistir ao vivo?', a: 'Sem problema. Toda aula fica gravada e disponível dentro do Fluxe, junto com o exercício da semana.' },
  { q: 'Preciso já ser cliente do Fluxe?', a: 'Não. Ao confirmar sua inscrição na Mentoria em Grupo, seu acesso ao Fluxe é liberado automaticamente — o Fluxe é o seu caderno de exercícios durante a turma.' },
  { q: 'Serve pra qualquer tamanho de BPO?', a: 'Sim, do BPO solo que está começando ao que já tem equipe e quer organizar a operação pra crescer com previsibilidade.' },
]

export default function MentoriaGrupoPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [openFaq, setOpenFaq] = useState(null)
  const { data, isLoading } = useTurmaAtualPublica()
  const turma = data?.turma
  const aulas = data?.aulas ?? []
  const checkoutUrl = turma?.checkout_url || WHATSAPP_MENTORIA_GRUPO

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
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  function abrirCheckout() {
    window.open(checkoutUrl, '_blank', 'noopener')
  }

  return (
    <div style={{ fontFamily: "'Inter','system-ui',sans-serif", background: '#05070E', color: '#F1F5F9', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 48px', height: 68,
        background: 'rgba(5,7,14,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <Logo />
        <button onClick={abrirCheckout}
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
          {isMobile ? 'Garantir vaga →' : 'Garantir minha vaga →'}
        </button>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ minHeight: '72vh', display: 'flex', alignItems: 'center', padding: isMobile ? '108px 20px 56px' : '128px 48px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,.05) 1px, transparent 1px)', backgroundSize: '34px 34px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 560, height: 560, background: 'radial-gradient(ellipse, rgba(139,92,246,.20) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />

        <div style={{ width: '100%', maxWidth: 780, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 24 }}>Mentoria em Grupo · Fluxe</div>

            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 32 : 'clamp(38px, 4.4vw, 58px)', fontWeight: 900, lineHeight: 1.08, margin: '0 0 22px', color: '#F8FAFC', letterSpacing: '-.03em' }}>
              Pare de operar no feeling.<br />
              <span style={{ fontStyle: 'italic', fontWeight: 600, background: 'linear-gradient(90deg,#818CF8,#A855F7,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Aprenda em turma, com acompanhamento comigo.
              </span>
            </h1>

            <p style={{ fontSize: isMobile ? 15 : 18, color: '#94A3B8', lineHeight: 1.7, margin: '0 auto 36px', maxWidth: 560 }}>
              15 aulas ao vivo aplicando o Método Fluxe na prática: desenho da operação, precificação e plano de negócio do seu BPO Financeiro, usando o Fluxe como seu caderno de exercícios.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={abrirCheckout}
                style={{ padding: '16px 34px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(99,102,241,.45)' }}>
                Garantir minha vaga →
              </button>
              <button onClick={() => scrollTo('cronograma')}
                style={{ padding: '16px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'none', color: '#F1F5F9', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Ver cronograma
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CRONOGRAMA ──────────────────────────────────────────── */}
      <section id="cronograma" style={{ padding: isMobile ? '56px 20px 72px' : '64px 48px 120px', background: '#080B14' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>CRONOGRAMA</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>
                {turma?.nome || 'Próxima turma'}
              </h2>
              {turma?.data_inicio && (
                <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 12 }}>
                  Início em {new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </Reveal>

          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: 13, padding: 40 }}>Carregando...</div>
          ) : !turma ? (
            <Reveal delay={0.1}>
              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 14, padding: '40px 20px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16 }}>
                Novas turmas em breve. Fale comigo no WhatsApp pra saber a próxima data.
              </div>
            </Reveal>
          ) : (
            <Reveal delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {aulas.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: 13, padding: 20 }}>Cronograma detalhado em breve.</div>
                ) : aulas.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 18px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0D1424', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>{a.numero}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{a.titulo}</div>
                      {a.exercicio && <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{a.exercicio}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {a.data ? new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A combinar'}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── O MÉTODO FLUXE® ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 20px' : '130px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>O MÉTODO FLUXE®</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }}>Sete etapas. Uma metodologia própria.</h2>
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
                    <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1424', border: '1px solid rgba(255,255,255,.12)' }}>
                      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: '#94A3B8' }}>{m.num}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', whiteSpace: 'nowrap' }}>{m.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 20px' : '130px 48px', background: '#080B14' }}>
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
      <section style={{ padding: isMobile ? '72px 20px' : '130px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.16),rgba(59,130,246,.1))', border: '1px solid rgba(99,102,241,.24)', borderRadius: 24, padding: isMobile ? '44px 24px' : '64px 56px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#F8FAFC', margin: '0 0 32px', letterSpacing: '-.02em', lineHeight: 1.3 }}>
                  Vagas limitadas por turma.
                </h2>
                <button onClick={abrirCheckout}
                  style={{ padding: '16px 36px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 36px rgba(99,102,241,.5)' }}>
                  Garantir minha vaga →
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
                style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>
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
