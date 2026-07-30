import { useState, useEffect, useRef } from 'react'
import { useTurmaAtualPublica } from '../hooks/useData'
import LOGO_SRC from '../assets/logo-fluxe-white.png'
import CLAUDIA_ECOSSISTEMA_SRC from '../assets/claudia-mentoria-grupo.jpg'
import CLAUDIA_SOBRE_MIM_SRC from '../assets/claudia-sobre-mim.jpg'

const WHATSAPP_MENTORIA_GRUPO = 'https://wa.me/5511917101173?text=Quero+construir+meu+BPO+com+o+Programa+BPO+Lucrativo'

const HERO_CHECKLIST = [
  'Início: 12 de agosto',
  '15 encontros ao vivo',
  'Exercícios práticos dentro do Fluxe',
  'Correções e acompanhamento',
]

const VIRADA_ITEMS = [
  'Posicionamento claro.',
  'Serviços bem definidos.',
  'Preços estratégicos.',
  'Processos documentados.',
  'Onboarding profissional.',
  'Entregas organizadas.',
  'Indicadores.',
  'Rotina.',
  'Planejamento.',
  'Crescimento.',
]

const NAO_E = ['Não é um curso gravado.', 'Não é uma sequência de aulas.', 'Não é um monte de PDFs.']

const LABORATORIO_ITEMS = [
  'seu posicionamento', 'sua oferta', 'sua precificação', 'seus processos',
  'seus clientes', 'seus indicadores', 'suas rotinas', 'seu plano de crescimento',
]

const CICLO = ['Aprendemos', 'Você recebe um exercício', 'Constrói dentro do Fluxe', 'Recebe feedback', 'Próximo encontro']

const MODULOS = [
  { titulo: 'Módulo 1', nome: 'Estrutura', itens: ['Diagnóstico do seu negócio', 'Posicionamento', 'Cliente ideal', 'Diferencial competitivo'] },
  { titulo: 'Módulo 2', nome: 'Comercial', itens: ['Oferta', 'Precificação', 'Proposta Comercial', 'Fechamento'] },
  { titulo: 'Módulo 3', nome: 'Operação', itens: ['Onboarding', 'Fluxo operacional', 'Processos', 'Padronização'] },
  { titulo: 'Módulo 4', nome: 'Gestão', itens: ['Indicadores', 'Planejamento', 'Organização', 'Crescimento'] },
  { titulo: 'Módulo 5', nome: 'Escala', itens: ['Estratégia', 'Próximos passos', 'Plano de expansão'] },
]

const PARA_QUEM = [
  'quer viver de BPO Financeiro', 'quer cobrar mais', 'quer organizar a operação',
  'quer conquistar clientes melhores', 'quer parar de improvisar', 'quer construir uma empresa de verdade',
]
const PARA_QUEM_NAO = ['Fórmulas mágicas.', 'Resultado sem executar.', 'Apenas assistir aulas.', 'Atalhos.']

const INCLUSO = ['15 encontros ao vivo', 'Acesso ao Fluxe', 'Exercícios semanais', 'Materiais exclusivos', 'Templates', 'Ferramentas', 'Comunidade', 'Certificado']

export default function MentoriaGrupoPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const { data, isLoading } = useTurmaAtualPublica()
  const turma = data?.turma
  const aulas = data?.aulas ?? []
  const checkoutUrl = turma?.checkout_url || WHATSAPP_MENTORIA_GRUPO
  const dataInicioLabel = turma?.data_inicio
    ? new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : '12 de agosto'

  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      height: document.body.style.height,
      bg: document.body.style.background,
      title: document.title,
    }
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.background = '#05070E'
    document.title = 'Programa BPO Lucrativo™ | Mentoria em Grupo Fluxe'

    let meta = document.querySelector('meta[name="description"]')
    const metaCreated = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    const prevContent = meta.getAttribute('content')
    meta.setAttribute('content', 'Construa um BPO Financeiro que vende, entrega e dá lucro. 15 encontros ao vivo com Cláudia Bernardo, aplicando o Método Fluxe na prática dentro do Fluxe. Turma com vagas limitadas.')

    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.height = prev.height
      document.body.style.background = prev.bg
      document.title = prev.title
      if (metaCreated) meta.remove()
      else if (prevContent != null) meta.setAttribute('content', prevContent)
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

  const eyebrow = { fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }
  const h2 = { fontFamily: "'Fraunces',serif", fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-.02em' }

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
          {isMobile ? 'Quero construir →' : 'Quero construir meu BPO →'}
        </button>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '96px 20px 48px' : '108px 0 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,.05) 1px, transparent 1px)', backgroundSize: '34px 34px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '14%', left: '6%', width: 560, height: 560, background: 'radial-gradient(ellipse, rgba(139,92,246,.22) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '4%', right: '8%', width: 640, height: 640, background: 'radial-gradient(ellipse, rgba(59,130,246,.18) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(70px)' }} />

        <div style={{ width: '100%', maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '5fr 7fr', gap: isMobile ? 8 : 24, alignItems: 'center', padding: isMobile ? 0 : '0 40px' }}>

          {isMobile && (
            <Reveal>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <img src={CLAUDIA_ECOSSISTEMA_SRC} alt="Cláudia Bernardo" style={{ width: '100%', display: 'block', objectFit: 'contain', borderRadius: 12 }} />
              </div>
            </Reveal>
          )}

          <Reveal>
            <div style={{ textAlign: isMobile ? 'center' : 'left', padding: isMobile ? '0 4px' : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 26 }}>Programa BPO Lucrativo™</div>

              <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 30 : 'clamp(34px, 4vw, 54px)', fontWeight: 900, lineHeight: 1.12, margin: '0 0 20px', color: '#F8FAFC', letterSpacing: '-.03em' }}>
                Construa um BPO Financeiro que <span style={{ fontStyle: 'italic', fontWeight: 600, background: 'linear-gradient(90deg,#818CF8,#A855F7,#22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>vende, entrega e dá lucro.</span>
              </h1>

              <p style={{ fontSize: isMobile ? 15 : 17, color: '#94A3B8', lineHeight: 1.7, margin: isMobile ? '0 auto 24px' : '0 0 28px', maxWidth: 480 }}>
                Chega de consumir cursos sem conseguir transformar conhecimento em clientes, processos e faturamento. Durante 15 encontros ao vivo, você vai construir seu BPO dentro do Fluxe, aplicando cada etapa comigo e saindo com uma empresa muito mais estruturada.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32, alignItems: isMobile ? 'center' : 'flex-start' }}>
                {HERO_CHECKLIST.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#CBD5E1', fontWeight: 500 }}>
                    <span style={{ color: '#4ADE80' }}>✅</span> {item}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <button onClick={abrirCheckout}
                  style={{ padding: '16px 34px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(99,102,241,.45)', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 38px rgba(99,102,241,.6)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,.45)' }}>
                  Quero construir meu BPO →
                </button>
              </div>
            </div>
          </Reveal>

          {!isMobile && (
            <div style={{ position: 'relative', height: '90vh', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.5)' }}>
              <img src={CLAUDIA_ECOSSISTEMA_SRC} alt="Cláudia Bernardo" style={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center', display: 'block',
              }} />
            </div>
          )}
        </div>
      </section>

      {/* ── DEPOIS DO HERO: DOR ─────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ ...h2, fontSize: isMobile ? 24 : 32, lineHeight: 1.35, marginBottom: 8 }}>Você não precisa de mais informação.</h2>
            <h2 style={{ ...h2, fontSize: isMobile ? 24 : 32, lineHeight: 1.35, color: '#A855F7', fontStyle: 'italic', marginBottom: 40 }}>Você precisa de execução.</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ fontSize: 16, color: '#94A3B8', lineHeight: 2.1 }}>
              <p style={{ margin: '0 0 4px' }}>Talvez você já tenha feito cursos. Assistiu aulas. Baixou planilhas. Comprou templates. Salvou dezenas de vídeos.</p>
              <p style={{ margin: '28px 0 4px' }}>Mas quando chega a hora de vender... <strong style={{ color: '#F1F5F9' }}>Você trava.</strong></p>
              <p style={{ margin: '4px 0' }}>Quando fecha um cliente... <strong style={{ color: '#F1F5F9' }}>Improvisa.</strong></p>
              <p style={{ margin: '4px 0' }}>Quando precisa cobrar... <strong style={{ color: '#F1F5F9' }}>Fica inseguro.</strong></p>
              <p style={{ margin: '4px 0 28px' }}>Quando cresce... <strong style={{ color: '#F1F5F9' }}>Tudo vira bagunça.</strong></p>
              <p style={{ margin: '0 0 8px' }}>O problema nunca foi falta de conteúdo.</p>
              <p style={{ margin: 0, color: '#E2E8F0', fontWeight: 600 }}>O problema é que ninguém mostrou como transformar conhecimento em um negócio. É exatamente isso que faremos juntos.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── A VIRADA ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={eyebrow}>A VIRADA</div>
              <h2 style={{ ...h2, fontSize: isMobile ? 24 : 34, maxWidth: 640, margin: '0 auto' }}>Imagine olhar para o seu BPO daqui a alguns meses e perceber que ele deixou de ser uma prestação de serviço improvisada.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(1,1fr)' : 'repeat(2,1fr)', gap: '10px 24px', marginBottom: 32 }}>
              {VIRADA_ITEMS.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, fontSize: 14, color: '#E2E8F0', fontWeight: 600 }}>
                  <span style={{ color: '#4ADE80' }}>✔</span> {item}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p style={{ textAlign: 'center', fontSize: 17, color: '#F1F5F9', fontWeight: 600, maxWidth: 560, margin: '0 auto' }}>
              Você deixa de ser apenas um operador financeiro. Passa a ser <span style={{ color: '#A855F7' }}>dono de um negócio.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── O QUE É ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={eyebrow}>O QUE É O PROGRAMA BPO LUCRATIVO™</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {NAO_E.map(t => <span key={t} style={{ fontSize: 15, color: '#64748B' }}>{t}</span>)}
            </div>
            <h2 style={{ ...h2, fontSize: isMobile ? 26 : 36, marginBottom: 24 }}>É uma construção guiada.</h2>
            <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.8, margin: 0 }}>
              Durante 15 semanas vamos montar, juntos, o seu BPO. Cada encontro gera uma entrega. Cada entrega gera um exercício. Cada exercício aproxima você de uma empresa mais organizada, lucrativa e preparada para crescer. Ao final do programa, você terá construído algo que continuará usando todos os dias.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── O FLUXE SERÁ SEU LABORATÓRIO ────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={eyebrow}>O FLUXE SERÁ SEU LABORATÓRIO</div>
              <h2 style={{ ...h2, fontSize: isMobile ? 24 : 34, maxWidth: 620, margin: '0 auto' }}>Enquanto outras mentorias entregam vídeos, você terá um ambiente onde cada decisão é registrada.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)', gap: 10 }}>
              {LABORATORIO_ITEMS.map(item => (
                <div key={item} style={{ padding: '14px 16px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, fontSize: 13, color: '#CBD5E1', fontWeight: 600, textAlign: 'center' }}>
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 28 }}>O Fluxe será o seu caderno de construção, tudo organizado em um único lugar.</p>
          </Reveal>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={eyebrow}>COMO FUNCIONA</div>
              <h2 style={{ ...h2, fontSize: isMobile ? 24 : 34 }}>Encontro 1</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 10 : 6, flexWrap: 'wrap' }}>
              {CICLO.map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 6 }}>
                  <div style={{ padding: '12px 18px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, fontSize: 13, fontWeight: 600, color: '#E2E8F0', whiteSpace: 'nowrap' }}>{step}</div>
                  {i < CICLO.length - 1 && <span style={{ color: '#6366F1', fontSize: 16, transform: isMobile ? 'rotate(90deg)' : 'none' }}>→</span>}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p style={{ textAlign: 'center', fontSize: 15, color: '#94A3B8', marginTop: 32, lineHeight: 1.7 }}>
              Durante 15 semanas esse ciclo se repete. É impossível terminar o programa sem ter colocado a mão na massa.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CRONOGRAMA ──────────────────────────────────────────── */}
      <section id="cronograma" style={{ padding: isMobile ? '56px 20px 72px' : '48px 48px 120px', background: '#05070E' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={eyebrow}>CRONOGRAMA</div>
              <h2 style={{ ...h2, fontSize: isMobile ? 24 : 32 }}>{turma?.nome || 'Próxima turma'}</h2>
              <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 12 }}>Início em {dataInicioLabel} · vagas limitadas por turma</p>
            </div>
          </Reveal>

          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: 13, padding: 40 }}>Carregando...</div>
          ) : !turma || aulas.length === 0 ? (
            <Reveal delay={0.1}>
              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 14, padding: '40px 20px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 16 }}>
                Cronograma detalhado em breve. Garanta sua vaga e receba tudo em primeira mão.
              </div>
            </Reveal>
          ) : (
            <Reveal delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {aulas.map(a => (
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

      {/* ── O QUE VOCÊ VAI CONSTRUIR ─────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={eyebrow}>O QUE VOCÊ VAI CONSTRUIR</div>
              <h2 style={{ ...h2, fontSize: isMobile ? 24 : 34 }}>Cinco módulos, um BPO estruturado</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {MODULOS.map(m => (
                <div key={m.titulo} style={{ padding: '24px 20px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{m.titulo}</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>{m.nome}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.itens.map(item => (
                      <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#94A3B8' }}>
                        <span style={{ color: '#4ADE80', flexShrink: 0 }}>✔</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PARA QUEM É / NÃO É ─────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#05070E' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 24 }}>
          <Reveal>
            <div style={{ padding: '28px 26px', background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 16, height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Para quem é</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PARA_QUEM.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#E2E8F0' }}>
                    <span style={{ color: '#4ADE80', flexShrink: 0 }}>✔</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ padding: '28px 26px', background: 'rgba(248,113,113,.05)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 16, height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F87171', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>Para quem NÃO é</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {PARA_QUEM_NAO.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#E2E8F0' }}>
                    <span style={{ color: '#F87171', flexShrink: 0 }}>❌</span> {item}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>Aqui você vai trabalhar.</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── O QUE ESTÁ INCLUSO ──────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '120px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={eyebrow}>O QUE ESTÁ INCLUSO</div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10 }}>
              {INCLUSO.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>
                  <span style={{ color: '#4ADE80', flexShrink: 0 }}>✅</span> {item}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SOBRE MIM ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '130px 48px', background: '#05070E', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: isMobile ? 32 : 64, alignItems: 'center' }}>
          <Reveal>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 340, height: 340, background: 'radial-gradient(ellipse, rgba(139,92,246,.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              <img src={CLAUDIA_SOBRE_MIM_SRC} alt="Cláudia Bernardo" style={{ width: '100%', display: 'block', objectFit: 'cover', position: 'relative', borderRadius: 12 }} />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div style={eyebrow}>SOBRE MIM</div>
              <h2 style={{ ...h2, fontSize: isMobile ? 24 : 32, marginBottom: 20 }}>Prazer, eu sou Cláudia Bernardo.</h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, margin: '0 0 16px' }}>
                Sou especialista em BPO Financeiro e há anos ajudo profissionais a transformarem conhecimento técnico em empresas organizadas, lucrativas e sustentáveis.
              </p>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, margin: '0 0 20px' }}>
                Ao longo da minha trajetória acompanhei centenas de operações de BPO, identifiquei os erros que impedem o crescimento e desenvolvi um método baseado em execução prática.
              </p>
              <p style={{ fontSize: 15, color: '#F1F5F9', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
                Minha missão não é ensinar teoria. É fazer você construir um negócio que funcione.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PREÇO ───────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '130px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 2, marginBottom: 32 }}>
              <p style={{ margin: '0 0 4px' }}>Quanto vale construir seu negócio?</p>
              <p style={{ margin: '0 0 4px' }}>Quanto vale parar de cobrar barato?</p>
              <p style={{ margin: '0 0 4px' }}>Quanto vale conseguir fechar clientes com segurança?</p>
              <p style={{ margin: '0 0 4px' }}>Quanto vale organizar uma operação que funciona mesmo quando você cresce?</p>
              <p style={{ margin: 0 }}>Quanto vale finalmente enxergar lucro no seu BPO?</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.16),rgba(59,130,246,.1))', border: '1px solid rgba(99,102,241,.3)', borderRadius: 24, padding: isMobile ? '36px 24px' : '48px 44px' }}>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 4px' }}>Essa transformação poderia custar milhares de reais.</p>
              <p style={{ fontSize: 14, color: '#CBD5E1', margin: '0 0 24px' }}>Mas a primeira turma do Programa BPO Lucrativo™ terá um investimento especial de lançamento.</p>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 44 : 56, fontWeight: 900, color: '#F8FAFC', letterSpacing: '-.02em', marginBottom: 4 }}>R$ 797</div>
              <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28 }}>ou em até 12x no cartão</div>
              <button onClick={abrirCheckout}
                style={{ padding: '16px 40px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 36px rgba(99,102,241,.5)' }}>
                Quero construir meu BPO →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── GARANTIA ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '48px 20px' : '80px 48px', background: '#05070E' }}>
        <Reveal>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '28px 24px', background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🛡️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#4ADE80', marginBottom: 8 }}>Garantia de 7 dias</div>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.7, margin: 0 }}>
              Entre, participe, conheça a metodologia e, se perceber que não faz sentido para você, basta solicitar o reembolso dentro do prazo. Sem burocracia.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── CHAMADA FINAL ───────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 20px' : '130px 48px', background: '#080B14' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.16),rgba(59,130,246,.1))', border: '1px solid rgba(99,102,241,.24)', borderRadius: 24, padding: isMobile ? '44px 24px' : '64px 56px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 8px' }}>Daqui a alguns meses você continuará exatamente onde está...</p>
                <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 28px' }}>...ou poderá olhar para trás e perceber que foi nesta turma que seu BPO deixou de ser um trabalho e começou a se tornar uma empresa.</p>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#F8FAFC', margin: '0 0 12px', letterSpacing: '-.02em' }}>A decisão é sua.</h2>
                <p style={{ fontSize: 13, color: '#CBD5E1', margin: '0 0 32px' }}>As vagas são limitadas para garantir acompanhamento durante os encontros.<br />Início: {dataInicioLabel}.</p>
                <button onClick={abrirCheckout}
                  style={{ padding: '16px 36px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 36px rgba(99,102,241,.5)' }}>
                  Quero construir meu BPO →
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
