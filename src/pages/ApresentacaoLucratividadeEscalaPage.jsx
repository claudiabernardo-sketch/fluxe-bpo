import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const INDIGO = '#4F46E5'
const AMBER = '#D97706'
const GREEN = '#16A34A'
const RED = '#DC2626'
const INK = '#0F172A'

function Eyebrow({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#A5B4FC', letterSpacing: 3, marginBottom: 14, textAlign: 'center' }}>{children}</div>
}
function Titulo({ children, sub }) {
  return (
    <>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: sub ? 8 : 22, textAlign: 'center' }}>{children}</h2>
      {sub && <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 22 }}>{sub}</div>}
    </>
  )
}
function Cascata({ passos }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {passos.map(([label, texto, cor], i) => (
        <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: cor, flexShrink: 0 }} />
            {i < passos.length - 1 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,.15)', minHeight: 22 }} />}
          </div>
          <div style={{ paddingBottom: 18 }}>
            <div style={{ color: cor, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ color: '#E2E8F0', fontSize: 14.5 }}>{texto}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
function Check({ itens, cor = '#86EFAC' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {itens.map(t => (
        <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#E2E8F0', fontSize: 14 }}>
          <span style={{ color: cor, flexShrink: 0 }}>✓</span>{t}
        </div>
      ))}
    </div>
  )
}
function Destaque({ children, cor = '#FCD34D' }) {
  return <div style={{ textAlign: 'center', color: cor, fontSize: 15, fontWeight: 700, marginTop: 18 }}>{children}</div>
}

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 13</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Gestão do BPO: lucratividade e escala</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Receita e custo por cliente, margem de contribuição, e como escalar sem destruir a margem</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "Faturo mais todo mês. Por que sobra menos?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Faturamento não paga boleto, margem paga. Hoje é sobre olhar pra dentro do próprio BPO com o
        mesmo rigor que você usa pra analisar o cliente.
      </div>
    </div>
  )
}
function SlideEtapas() {
  const etapas = ['Receita e custo por cliente', 'Margem de contribuição', 'Precificação e reajustes', 'Como escalar sem destruir margem']
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="A espinha dorsal da aula.">O caminho da lucratividade</Titulo>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {etapas.map((e, i) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '8px 16px', color: '#C7D2FE', fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: '#818CF8', fontWeight: 800, marginRight: 6 }}>{i + 1}</span>{e}
            </div>
            {i < etapas.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
function SlideCustoPorCliente() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Sem isso, você não sabe se um cliente é lucro ou é prejuízo disfarçado de faturamento.">Receita e custo por cliente</Titulo>
      <Check itens={[
        'Quanto esse cliente paga por mês, exatamente',
        'Quantas horas da equipe esse cliente consome, na prática, não no contrato',
        'Custo da hora da equipe × horas consumidas = custo real do cliente',
        'Receita menos custo real = o que esse cliente de fato deixa de lucro',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideMargem() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Nem todo cliente que fatura bem é um bom cliente.">Margem de contribuição por carteira</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(22,163,74,.14)', border: '1px solid rgba(22,163,74,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>CLIENTE QUE DÁ LUCRO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Paga bem pelo tanto que consome de tempo e complexidade.</div>
        </div>
        <div style={{ background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>CLIENTE QUE CONSOME OPERAÇÃO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Paga pouco, exige muito, e some com a margem da carteira inteira.</div>
        </div>
      </div>
      <Destaque>Identifique os dois tipos na sua carteira antes de decidir contratar mais gente pra crescer.</Destaque>
    </div>
  )
}
function SlidePrecificacao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Reajuste não é ganância, é sobrevivência da margem.">Precificação, reajustes e capacidade</Titulo>
      <Check itens={[
        'Reajuste anual não é opcional, é o que mantém a margem real com a inflação de custo',
        'Escopo que cresceu sem reajuste é desconto disfarçado',
        'Antes de aceitar cliente novo, confira se a equipe tem capacidade real, não só vontade',
        'Cliente com margem ruim: reprecificar, ajustar escopo, ou encerrar, mas nunca ignorar',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideErros() {
  const erros = [
    'Aceitar cliente novo sem saber a capacidade real da equipe', 'Nunca calcular quanto cada cliente realmente custa',
    'Não reajustar contrato antigo há anos', 'Medir sucesso só por faturamento total, nunca por margem',
    'Manter cliente que consome operação por medo de perder receita', 'Contratar equipe nova sem saber se a margem sustenta',
    'Não separar custo fixo de custo variável na conta', 'Escalar quantidade de cliente sem escalar processo',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns em gestão e escala</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {erros.map((e, i) => (
          <div key={e} style={{ display: 'flex', gap: 10, background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 8, padding: '9px 12px' }}>
            <span style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ color: '#E2E8F0', fontSize: 12.5 }}>{e}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
function SlideFluxe() {
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Onde a margem real de cada cliente fica visível, sem planilha paralela.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Rentabilidade', 'Veja a margem real de cada cliente, cruzando receita com custo de hora da equipe.', INDIGO],
        ['Precificação', 'Rode o simulador antes de fechar um cliente novo ou reajustar um antigo.', AMBER],
        ['Capacidade da Equipe', 'Confira se dá pra crescer antes de vender mais.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/rent')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Rentabilidade no Fluxe →</button>
      </div>
    </div>
  )
}
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A pergunta que essa aula existe pra responder.">Atividade prática: o cliente com pior margem</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Rode a Rentabilidade no Fluxe, ache o cliente com pior margem da sua carteira. Decida: reprecificar,
          ajustar escopo, ou encerrar. Escreva por escrito qual das três e por quê.
        </div>
      </div>
      <Destaque>Traga essa decisão pronta, depois corrigimos juntos.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Faturamento é vaidade. Margem é saúde do negócio.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Custo por cliente', 'Margem', 'Precificação', 'Capacidade', 'Escala sustentável'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        Escalar sem saber a margem é crescer o tamanho do problema, não do negócio.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideEtapas },
  { render: SlideCustoPorCliente }, { render: SlideMargem }, { render: SlidePrecificacao },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoLucratividadeEscalaPage() {
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
    <div style={{ position: 'fixed', inset: 0, background: `linear-gradient(135deg, ${INK}, #1E1B4B)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 80px', zIndex: 1000, overflow: 'auto' }}>
      <button onClick={() => navigate('/materiais-apoio')} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: 8, cursor: 'pointer' }} title="Sair (Esc)">×</button>
      <div style={{ position: 'absolute', top: 24, left: 32, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: 2 }}>FLUXE BPO</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}><Slide /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
        <button onClick={anterior} disabled={i === 0} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: 18 }}>←</button>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 400, justifyContent: 'center' }}>
          {SLIDES.map((_, idx) => (
            <div key={idx} onClick={() => setI(idx)} style={{ width: idx === i ? 20 : 7, height: 7, borderRadius: 99, cursor: 'pointer', background: idx === i ? '#818CF8' : 'rgba(255,255,255,.25)', transition: 'all .2s' }} />
          ))}
        </div>
        <button onClick={proxima} disabled={i === SLIDES.length - 1} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: i === SLIDES.length - 1 ? 'default' : 'pointer', opacity: i === SLIDES.length - 1 ? 0.3 : 1, fontSize: 18 }}>→</button>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 10 }}>{i + 1} / {SLIDES.length} · setas do teclado ou espaço pra avançar</div>
    </div>
  )
}
