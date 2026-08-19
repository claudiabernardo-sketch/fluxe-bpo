import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const INDIGO = '#4F46E5'
const INDIGO_DARK = '#3730A3'
const AMBER = '#D97706'
const GREEN = '#16A34A'
const RED = '#DC2626'
const INK = '#0F172A'
const SLATE = '#475569'

const PASSOS = ['Prospecção', 'Abertura da conversa', 'Rapport e contexto', 'Investigação (SPIN)', 'Qualificação', 'Diagnóstico → Solução', 'Valor e preço', 'Objeções', 'Sinais de compra', 'Fechamento', 'Ativação no Fluxe', 'Follow-up']

const SPIN = [
  { letra: 'S', nome: 'Situação', cor: INDIGO, desc: 'Perguntas neutras de contexto, ainda não expõem problema, só mapeiam o cenário.', exemplos: ['Quem cuida do financeiro hoje?', 'Quantas contas bancárias vocês movimentam?', 'Como fazem a conciliação?'] },
  { letra: 'P', nome: 'Problema', cor: AMBER, desc: 'A partir do cenário, perguntas que procuram atrito ou insatisfação.', exemplos: ['O que mais dá trabalho nessa rotina?', 'Já aconteceu de o saldo não bater com o banco?', 'O que hoje depende exclusivamente de você?'] },
  { letra: 'I', nome: 'Implicação', cor: RED, desc: 'Mostram o custo em tempo, dinheiro e risco de continuar sem resolver.', exemplos: ['E quando isso acontece, o que impacta?', 'Quanto tempo vocês gastam tentando descobrir a diferença?', 'Quanto isso pode estar custando pra empresa?'] },
  { letra: 'N', nome: 'Necessidade de solução', cor: GREEN, desc: 'Fazem o próprio cliente descrever o benefício de resolver.', exemplos: ['Se tivesse o financeiro conciliado, o que mudaria na sua rotina?', 'Se recebesse uma visão clara de caixa, o que faria diferente?'] },
]

function SlideTitulo() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#A5B4FC', letterSpacing: 3, marginBottom: 16 }}>AULA DE VENDAS · BPO LUCRATIVO</div>
      <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Venda Consultiva de BPO Financeiro</div>
      <div style={{ fontSize: 20, color: '#C7D2FE' }}>Do primeiro diagnóstico ao cliente operando no Fluxe</div>
    </div>
  )
}

function SlideMapa() {
  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 28, textAlign: 'center' }}>O mapa da venda em 12 passos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {PASSOS.map((p, i) => (
          <div key={p} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '16px 18px' }}>
            <span style={{ color: '#818CF8', fontWeight: 800, fontSize: 18 }}>{i + 1}. </span>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CANAIS_PROSPECCAO = ['Instagram', 'Indicação', 'Networking presencial', 'Google Maps', 'LinkedIn', 'Parceiros (contadores)', 'Clientes atuais', 'Comunidades']

function SlideProspeccao() {
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Prospecção, onde encontrar clientes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {CANAIS_PROSPECCAO.map(c => (
          <div key={c} style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '8px 16px', color: '#C7D2FE', fontSize: 15, fontWeight: 600 }}>{c}</div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>EXEMPLO, WHATSAPP FRIO</div>
        <div style={{ color: '#fff', fontSize: 17, fontStyle: 'italic' }}>"Oi, {'{'}nome{'}'}! Sou a {'{'}seu nome{'}'}, cuido do financeiro de empresas de {'{'}segmento{'}'} aqui da região. Vi {'{'}motivo do contato{'}'} e fiquei curiosa, como vocês estão organizando o financeiro hoje?"</div>
      </div>
      <div style={{ textAlign: 'center', color: '#FCD34D', fontSize: 15, fontWeight: 600 }}>⭐ "Vou prospectar empresas" não é estratégia. Defina o perfil antes de sair procurando.</div>
    </div>
  )
}

function SlideQualificacao() {
  const criterios = [
    ['Dor', 'O quanto o problema realmente incomoda hoje'],
    ['Urgência', 'Resolver agora ou "algum dia"'],
    ['Autoridade', 'Quem está na conversa decide ou só influencia'],
    ['Capacidade', 'Tem estrutura e orçamento pra pagar'],
    ['Fit', 'Seu serviço resolve esse tipo de problema'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Qualificação, nem todo lead merece proposta</h2>
      <div style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 24 }}>5 critérios, dê uma nota de 0 (baixo) a 2 (alto) pro seu próximo lead</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {criterios.map(([nome, desc]) => (
          <div key={nome} style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '12px 18px' }}>
            <div style={{ color: '#818CF8', fontWeight: 800, fontSize: 17, width: 120, flexShrink: 0 }}>{nome}</div>
            <div style={{ color: '#E2E8F0', fontSize: 15 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideObjecaoExemplo() {
  const passos = [
    ['Acolher', '"Entendo."'],
    ['Investigar', '"O que exatamente ficou caro pra você?"'],
    ['Responder', 'Retome o problema, o escopo e o valor.'],
    ['Confirmar', '"Faz sentido pra você considerando esse escopo?"'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 700 }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 24, textAlign: 'center' }}>Exemplo real: "Está caro"</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {passos.map(([nome, fala], i) => (
          <div key={nome} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ background: INDIGO, color: '#fff', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
            <div>
              <div style={{ color: '#A5B4FC', fontWeight: 700, fontSize: 15 }}>{nome}</div>
              <div style={{ color: '#fff', fontSize: 17, fontStyle: 'italic' }}>{fala}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideFechamento() {
  const falas = [
    'Faz sentido essa estrutura pra você?',
    'O que falta pra conseguirmos começar?',
    'Se estiver de acordo, envio o contrato hoje. Você prefere começar na segunda ou na quarta?',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 24, textAlign: 'center' }}>Técnicas de fechamento</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {falas.map(f => (
          <div key={f} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '14px 20px', color: '#fff', fontSize: 17, fontStyle: 'italic' }}>"{f}"</div>
        ))}
      </div>
      <div style={{ background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.4)', borderRadius: 10, padding: '14px 20px', color: '#FCA5A5', fontSize: 14 }}>
        ⚠ Só use fechamento por alternativa quando houver sinais reais de compra. O objetivo é conduzir, não pressionar.
      </div>
    </div>
  )
}

function SlideVendedor() {
  const pares = [
    ['Fala demais', 'Faz perguntas'],
    ['Manda preço rápido', 'Entende o problema antes do preço'],
    ['Tenta convencer', 'Investiga e conecta'],
    ['Oferece desconto cedo', 'Defende valor'],
    ['Aceita qualquer cliente', 'Qualifica'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 800 }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 28, textAlign: 'center' }}>Vendedor desesperado × consultivo</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ background: RED, borderRadius: '10px 10px 0 0', padding: '10px 16px', fontWeight: 800, color: '#fff', textAlign: 'center' }}>❌ Desesperado</div>
        <div style={{ background: GREEN, borderRadius: '10px 10px 0 0', padding: '10px 16px', fontWeight: 800, color: '#fff', textAlign: 'center' }}>✅ Consultivo</div>
      </div>
      {pares.map(([a, b]) => (
        <div key={a} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '12px 16px', color: '#FCA5A5', fontSize: 18 }}>{a}</div>
          <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '12px 16px', color: '#86EFAC', fontSize: 18 }}>{b}</div>
        </div>
      ))}
    </div>
  )
}

function SlideRegraDeOuro() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 760 }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>⭐</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
        Quem pergunta, <span style={{ color: '#FCD34D' }}>conduz</span>.<br />
        Quem fala demais, <span style={{ color: '#FCA5A5' }}>perde o controle</span> da conversa.
      </div>
    </div>
  )
}

function SlideSpin(s) {
  return (
    <div style={{ width: '100%', maxWidth: 760, textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: s.cor, lineHeight: 1 }}>{s.letra}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 16 }}>{s.nome}</div>
      <div style={{ fontSize: 18, color: '#CBD5E1', marginBottom: 28 }}>{s.desc}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {s.exemplos.map(ex => (
          <div key={ex} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '12px 20px', color: '#fff', fontSize: 18, fontStyle: 'italic' }}>"{ex}"</div>
        ))}
      </div>
    </div>
  )
}

function SlideObjecoes() {
  const passos = [
    ['1. Acolher', 'Validar o que o cliente sentiu, sem discordar.'],
    ['2. Investigar', 'Descobrir o motivo real, raramente é só o preço.'],
    ['3. Responder', 'Retomar o problema, o escopo e o valor já construídos.'],
    ['4. Confirmar', 'Checar se a resposta resolveu a dúvida.'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 28, textAlign: 'center' }}>Tratando uma objeção com o método A.I.R.C.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {passos.map(([nome, desc], i) => (
          <div key={nome} style={{ background: i % 2 === 0 ? 'rgba(99,102,241,.18)' : 'rgba(255,255,255,.08)', borderRadius: 12, padding: '18px 14px' }}>
            <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{nome}</div>
            <div style={{ color: '#E2E8F0', fontSize: 14 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlidePratica() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 700 }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🎭</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Agora é praticar</div>
      <div style={{ fontSize: 19, color: '#CBD5E1', lineHeight: 1.6 }}>
        Formem trios: cliente, vendedor e observador.<br />
        3 casos, 8 a 10 minutos cada, troquem os papéis a cada rodada.<br /><br />
        Abram o <strong style={{ color: '#fff' }}>Kit de Role-Play</strong> em Materiais de Apoio.
      </div>
    </div>
  )
}

const ROTEIRO_PERGUNTAS = [
  { bloco: 'Consciência', cor: INDIGO, perguntas: ['Hoje, você sabe quanto realmente sobra no seu caixa?', 'Como você toma decisões financeiras no seu negócio?', 'Você confia nos números que tem hoje?'] },
  { bloco: 'Amplificação', cor: AMBER, perguntas: ['Isso já te fez tomar alguma decisão errada?', 'Isso já te gerou prejuízo ou insegurança?', 'Até quando você pretende decidir sem essa clareza?'] },
  { bloco: 'Direcionamento', cor: GREEN, perguntas: ['Se você tivesse isso organizado hoje, o que mudaria no seu negócio?', 'É exatamente isso que um BPO financeiro resolve.'] },
]

function SlideRoteiroPerguntas() {
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Roteiro de Perguntas que Vendem BPO</h2>
      <div style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 24 }}>Uma versão curta do SPIN, pronta pra usar numa conversa</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ROTEIRO_PERGUNTAS.map(b => (
          <div key={b.bloco} style={{ background: 'rgba(255,255,255,.08)', borderLeft: `4px solid ${b.cor}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ color: b.cor, fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{b.bloco}</div>
            {b.perguntas.map(p => (
              <div key={p} style={{ color: '#E2E8F0', fontSize: 16, marginBottom: 4 }}>"{p}"</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideCitacaoConduzir() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 720 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 20 }}>
        Quem conduz bem a conversa não precisa convencer.
      </div>
      <div style={{ fontSize: 16, color: '#A5B4FC' }}>Salva esse roteiro pra usar na próxima reunião.</div>
    </div>
  )
}

const SLIDES = [
  { render: SlideTitulo },
  { render: SlideMapa },
  { render: SlideProspeccao },
  { render: SlideVendedor },
  { render: SlideRegraDeOuro },
  { render: () => SlideSpin(SPIN[0]) },
  { render: () => SlideSpin(SPIN[1]) },
  { render: () => SlideSpin(SPIN[2]) },
  { render: () => SlideSpin(SPIN[3]) },
  { render: SlideQualificacao },
  { render: SlideRoteiroPerguntas },
  { render: SlideCitacaoConduzir },
  { render: SlideObjecoes },
  { render: SlideObjecaoExemplo },
  { render: SlideFechamento },
  { render: SlidePratica },
]

export default function ApresentacaoVendasPage() {
  const navigate = useNavigate()
  const [i, setI] = useState(0)

  const proxima = useCallback(() => setI(n => Math.min(SLIDES.length - 1, n + 1)), [])
  const anterior = useCallback(() => setI(n => Math.max(0, n - 1)), [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); proxima() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); anterior() }
      if (e.key === 'Escape') navigate('/materiais-apoio')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [proxima, anterior, navigate])

  const Slide = SLIDES[i].render

  return (
    <div style={{
      position: 'fixed', inset: 0, background: `linear-gradient(135deg, ${INK}, #1E1B4B)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', zIndex: 1000,
    }}>
      <button onClick={() => navigate('/materiais-apoio')} style={{
        position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,.1)', border: 'none',
        color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
      }} title="Sair (Esc)">×</button>

      <div style={{ position: 'absolute', top: 24, left: 32, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: 2 }}>FLUXE BPO</div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Slide />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
        <button onClick={anterior} disabled={i === 0} style={{
          background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%',
          cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: 18,
        }}>←</button>
        <div style={{ display: 'flex', gap: 6 }}>
          {SLIDES.map((_, idx) => (
            <div key={idx} onClick={() => setI(idx)} style={{
              width: idx === i ? 20 : 7, height: 7, borderRadius: 99, cursor: 'pointer',
              background: idx === i ? '#818CF8' : 'rgba(255,255,255,.25)', transition: 'all .2s',
            }} />
          ))}
        </div>
        <button onClick={proxima} disabled={i === SLIDES.length - 1} style={{
          background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%',
          cursor: i === SLIDES.length - 1 ? 'default' : 'pointer', opacity: i === SLIDES.length - 1 ? 0.3 : 1, fontSize: 18,
        }}>→</button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 10 }}>{i + 1} / {SLIDES.length} · setas do teclado ou espaço pra avançar</div>
    </div>
  )
}
