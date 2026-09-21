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
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 12</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Follow-up: o cliente não pode sumir da sua gestão</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Identificação de risco de churn, pesquisa de satisfação, e como transformar acompanhamento em upsell</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "O cliente cancelou. E eu nem vi vindo."
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Churn quase nunca é surpresa de verdade, quase sempre tem sinal antes. Hoje é sobre enxergar
        esse sinal a tempo, e usar o mesmo acompanhamento pra crescer com quem está satisfeito.
      </div>
    </div>
  )
}
function SlideEtapas() {
  const etapas = ['Rotina de acompanhamento', 'Risco de churn', 'Pesquisa de satisfação', 'Upsell e expansão']
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A espinha dorsal da aula.">O caminho do follow-up</Titulo>
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
function SlideChurn() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Sinal de alerta precoce quase sempre aparece antes do cancelamento.">Identificação de risco de churn</Titulo>
      <Check itens={[
        'Cliente que para de responder mensagem ou atrasa envio de documento',
        'Reclamação repetida sobre o mesmo assunto, sem resolver de verdade',
        'Queda no engajamento com a reunião mensal (falta, cancela, remarca sempre)',
        'Pergunta sobre valor ou "será que vale a pena continuar" nas entrelinhas',
      ]} cor="#A5B4FC" />
      <Destaque cor="#FCA5A5">Sinal ignorado uma vez é falta de atenção. Ignorado sempre é política de perder cliente.</Destaque>
    </div>
  )
}
function SlideAcaoPreventiva() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Agir antes da insatisfação virar decisão de saída.">Ações preventivas e pesquisa de satisfação</Titulo>
      <Check itens={[
        'Ligue ou marque reunião assim que perceber o sinal, não espere o cliente reclamar formalmente',
        'Pergunte diretamente: "como você avalia nosso trabalho esse mês?"',
        'Registre a resposta, não deixe só na memória de quem atende',
        'Trate reclamação como oportunidade de reter, não como ameaça a evitar',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideUpsell() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="O mesmo acompanhamento que evita churn identifica oportunidade de crescer com quem já confia em você.">Upsell e expansão</Titulo>
      <Check itens={[
        'Cliente satisfeito que cresceu de tamanho pode precisar de mais escopo',
        'Serviço que você já presta informalmente pode virar item cobrado à parte',
        'Pergunte no follow-up: "tem alguma outra dor financeira que a gente ainda não cobre?"',
        'Nunca ofereça upsell na mesma conversa que uma reclamação não resolvida',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideErros() {
  const erros = [
    'Só falar com o cliente quando ele reclama primeiro', 'Não registrar sinal de insatisfação em lugar nenhum',
    'Deixar combinado em aberto por mais de 30 dias sem ação', 'Tratar pesquisa de satisfação como formalidade, não como dado',
    'Oferecer upsell na hora errada, com cliente insatisfeito', 'Não ter uma rotina fixa de acompanhamento, só reagir',
    'Achar que "cliente quieto" é cliente satisfeito', 'Não comemorar nem registrar quando o cliente está satisfeito de verdade',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns no follow-up</Titulo>
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
      <Titulo sub="Onde o follow-up vira lista de ação, não lembrete solto.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['CRM', 'O alerta de follow-up vencido vira lista de ação num clique.', INDIGO],
        ['Combinados', 'Todo combinado com o cliente fica registrado, com prazo.', AMBER],
        ['Central Operacional', 'Acompanhe pendência aberta há mais de 30 dias antes que vire problema.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/crm')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir CRM no Fluxe →</button>
      </div>
    </div>
  )
}
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A pergunta que essa aula existe pra responder.">Atividade prática: combinados esquecidos</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Liste os Combinados em aberto no Fluxe com mais de 30 dias. Pra cada um, decida uma ação:
          resolver agora, renegociar prazo com o cliente, ou reconhecer que não vai acontecer.
        </div>
      </div>
      <Destaque>Feche essa lista hoje, depois corrigimos juntos.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Cliente satisfeito não pede pra ser lembrado. Ele precisa ser acompanhado mesmo assim.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Acompanhamento', 'Sinal de risco', 'Ação preventiva', 'Satisfação', 'Expansão'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        O cliente que sente que alguém está de olho é o cliente que fica, e o que mais cresce com você.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideEtapas },
  { render: SlideChurn }, { render: SlideAcaoPreventiva }, { render: SlideUpsell },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoFollowUpPage() {
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
