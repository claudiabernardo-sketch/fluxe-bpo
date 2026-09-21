import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const INDIGO = '#4F46E5'
const AMBER = '#D97706'
const GREEN = '#16A34A'
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
function ScriptQuote({ children, label = 'MODELO DE MENSAGEM' }) {
  return (
    <div style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 14, padding: '20px 26px' }}>
      <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 16, fontStyle: 'italic', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 11</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>A reunião com o cliente</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Preparação, apresentação de resultados e como transformar análise em oportunidade</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "Tenho a análise pronta. Como eu conduzo essa conversa?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        A melhor análise do mundo não vale nada se a reunião for mal conduzida. Hoje é sobre preparar,
        apresentar e conduzir a reunião mensal de um jeito que o cliente sai com clareza, não confuso.
      </div>
    </div>
  )
}
function SlideEtapas() {
  const etapas = ['Preparação', 'Apresentação de resultados', 'Identificar problemas', 'Gerar recomendações', 'Condução estratégica']
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="A espinha dorsal da aula.">O caminho da reunião</Titulo>
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
function SlidePreparacao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="A reunião começa antes da reunião.">Preparação da reunião</Titulo>
      <Check itens={[
        'Revise os números com antecedência, nunca abra o relatório pela primeira vez na frente do cliente',
        'Escolha os 3 pontos mais importantes, não tente cobrir tudo',
        'Antecipe a pergunta difícil e já tenha uma resposta pensada',
        'Defina o objetivo da reunião: informar, alertar, ou propor algo novo?',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideApresentacao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Comece pelo resumo, não pela planilha.">Como explicar indicadores ao empresário</Titulo>
      <ScriptQuote label="ESTRUTURA SUGERIDA">
        Em 2 minutos: como fechou o mês. Depois: os 3 pontos de atenção. Por último: o que eu recomendo pro próximo mês.
      </ScriptQuote>
      <Destaque>Se o cliente sair da reunião sem saber o que fazer amanhã, a reunião não funcionou.</Destaque>
    </div>
  )
}
function SlideRecomendacoes() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Identificar problema é a metade do trabalho. A outra metade é dizer o que fazer com ele.">Identificar problemas e gerar recomendações</Titulo>
      <Check itens={[
        'Toda vez que apontar um problema, já traga uma sugestão de ação',
        'Separe recomendação urgente de recomendação de médio prazo',
        'Use o problema como abertura pra oportunidade: às vezes o mesmo dado revela os dois',
        'Termine com um combinado claro: o que fica acordado até a próxima reunião',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideErros() {
  const erros = [
    'Abrir o relatório na frente do cliente sem ter revisado antes', 'Mostrar planilha inteira em vez de destacar o essencial',
    'Apontar problema sem sugerir nenhuma ação', 'Sair da reunião sem nenhum combinado registrado',
    'Falar só de números, nunca de oportunidade', 'Deixar a reunião virar reclamação sem direção',
    'Não anotar o combinado em lugar nenhum do sistema', 'Repetir a mesma pauta todo mês sem evoluir a conversa',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns na reunião com o cliente</Titulo>
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
      <Titulo sub="Onde a reunião já sai roteirizada, com dado real do cliente.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Radar', 'Relatório 360 já traz os números organizados pra reunião.', INDIGO],
        ['Combinados', 'Registre o que foi acordado na reunião, pra cobrar no mês seguinte.', AMBER],
        ['Mensagens', 'Envie o resumo da reunião direto pelo WhatsApp do Fluxe.', GREEN],
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
      <Titulo sub="A pergunta que essa aula existe pra responder.">Atividade prática: o roteiro da próxima reunião</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Usando os dados reais do Radar de um cliente seu, escreva o roteiro da próxima reunião mensal:
          resumo, 3 pontos de atenção, e a recomendação que você vai levar.
        </div>
      </div>
      <Destaque>Traga esse roteiro pronto, depois corrigimos juntos.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        A reunião é onde a análise vira decisão do cliente.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Preparação', 'Apresentação', 'Problema', 'Recomendação', 'Combinado'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        Reunião bem conduzida é o momento em que o cliente lembra por que contratou você.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideEtapas },
  { render: SlidePreparacao }, { render: SlideApresentacao }, { render: SlideRecomendacoes },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoReuniaoClientePage() {
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
