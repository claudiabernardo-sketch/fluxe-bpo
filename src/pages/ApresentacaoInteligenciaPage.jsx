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
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 10</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Estratégico: o BPO que entrega inteligência</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>DRE gerencial, fluxo de caixa, margem, EBITDA e ponto de equilíbrio, na linguagem do dono</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "Eu entrego relatório todo mês. Por que o cliente não usa pra decidir nada?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Porque relatório e inteligência são coisas diferentes. Hoje é sobre transformar número em decisão,
        do jeito que o empresário de fato entende.
      </div>
    </div>
  )
}
function SlideDiferenca() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Um mostra o passado. O outro aponta o que fazer com ele.">Operacional entrega dado. Estratégico entrega decisão.</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>OPERACIONAL</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Executa a rotina, gera o número certo.</div>
        </div>
        <div style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>ESTRATÉGICO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Interpreta o número, aponta o que o dono deveria fazer com ele.</div>
        </div>
      </div>
    </div>
  )
}
function SlideDRE() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="DRE gerencial não é o mesmo que DRE contábil, o gerencial existe pra decisão, não pra fisco.">DRE Gerencial e Fluxo de Caixa</Titulo>
      <Check itens={[
        'Separe receita de entrada de caixa: são coisas diferentes',
        'DRE mostra resultado (competência), fluxo de caixa mostra dinheiro disponível',
        'Compare sempre com um período de referência: mês anterior, mesmo mês ano passado, ou orçamento',
        'Aponte o direcionador da variação, não só o número da variação',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideIndicadores() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Três números que todo dono de empresa deveria entender, e a maioria não entende.">Margem, EBITDA e Ponto de Equilíbrio</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>MARGEM</div>
          <div style={{ color: '#E2E8F0', fontSize: 12.5 }}>Quanto sobra depois dos custos diretos do que ele vende.</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>EBITDA</div>
          <div style={{ color: '#E2E8F0', fontSize: 12.5 }}>Geração de caixa operacional, antes de juros, impostos e depreciação.</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>PONTO DE EQUILÍBRIO</div>
          <div style={{ color: '#E2E8F0', fontSize: 12.5 }}>Quanto precisa faturar só pra não ter prejuízo.</div>
        </div>
      </div>
      <Destaque>Falar "sua margem caiu 3%" não muda decisão nenhuma. Mostrar o que causou muda.</Destaque>
    </div>
  )
}
function SlideApresentar() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="A linguagem do dono não é a linguagem do financeiro.">Como apresentar análise de resultados</Titulo>
      <Check itens={[
        'Traduza indicador pra decisão: não "margem de 22%", e sim "de cada R$ 100 que entra, sobram R$ 22"',
        'Mostre 3 números no máximo por reunião, não uma planilha inteira',
        'Sempre feche com uma recomendação prática, não só o diagnóstico',
        'Separe fato de hipótese: diga claramente o que é dado e o que é interpretação',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideErros() {
  const erros = [
    'Confundir DRE com fluxo de caixa na hora de explicar', 'Mostrar tabela inteira em vez de destacar o que importa',
    'Não comparar com nenhuma referência (mês anterior, meta)', 'Falar % de variação sem falar valor absoluto',
    'Não indicar o direcionador da variação, só o número', 'Terminar a análise sem nenhuma recomendação prática',
    'Misturar jargão técnico que o dono não entende', 'Inventar causa sem dado que sustente',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns na análise estratégica</Titulo>
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
      <Titulo sub="Onde a análise estratégica já sai pronta pra reunião.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Radar', 'Relatório 360 do cliente: DRE, indicadores e alertas, tudo num só lugar.', INDIGO],
        ['Executivo', 'Visão consolidada da carteira, pra comparar clientes entre si.', AMBER],
        ['Skill de IA', 'Use os prompts de análise estratégica da Biblioteca pra ir além do número.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/clientes')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Clientes no Fluxe →</button>
      </div>
    </div>
  )
}
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A pergunta que essa aula existe pra responder.">Atividade prática: o Relatório 360</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Gere o Relatório 360 do Radar de um cliente real seu no Fluxe. Escolha 3 números pra destacar
          numa reunião. Pra cada um, escreva a frase de contexto que você usaria com o dono, sem jargão.
        </div>
      </div>
      <Destaque>Traga isso pronto, depois corrigimos juntos.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Relatório informa. Análise estratégica decide.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['DRE', 'Indicadores', 'Tradução pro dono', 'Recomendação', 'Decisão'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        É essa entrega que separa um BPO que faz lançamento de um BPO que o dono não larga nunca mais.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideDiferenca },
  { render: SlideDRE }, { render: SlideIndicadores }, { render: SlideApresentar },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoInteligenciaPage() {
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
