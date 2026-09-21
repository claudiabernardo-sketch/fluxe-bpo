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
function ErradoCerto({ errado, certo, labelErrado = '❌ O erro', labelCerto = '✅ O certo' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{labelErrado}</div>
        <div style={{ color: '#fff', fontSize: 16, fontStyle: 'italic' }}>{errado}</div>
      </div>
      <div style={{ background: 'rgba(22,163,74,.14)', border: '1px solid rgba(22,163,74,.35)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{labelCerto}</div>
        <div style={{ color: '#fff', fontSize: 16, fontStyle: 'italic' }}>{certo}</div>
      </div>
    </div>
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
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 9</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Operacional: qualidade e gestão da equipe</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Distribuição de tarefas, controle de erros e retrabalho, e indicadores pra manter a operação eficiente</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "A operação roda. Mas por que o retrabalho não para?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Rotina rodando não significa qualidade garantida. Hoje é sobre distribuir tarefa com critério,
        pegar erro antes do cliente, e ter indicador de verdade sobre como a equipe está trabalhando.
      </div>
    </div>
  )
}
function SlideEtapas() {
  const etapas = ['Distribuição de tarefas', 'Capacidade da equipe', 'Controle de erros e retrabalho', 'Indicadores operacionais']
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A espinha dorsal da aula. Cada bloco é ensinado em detalhe a seguir.">O que garante qualidade na operação</Titulo>
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
function SlideDistribuicao() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Distribuir por quem está livre no momento não é critério, é sorte.">Distribuição de tarefas e capacidade</Titulo>
      <Check itens={[
        'Quantos clientes e quantas tarefas cada pessoa da equipe carrega hoje',
        'Complexidade do cliente pesa tanto quanto quantidade de tarefa',
        'Reveja a distribuição quando entra cliente novo, não só quando alguém reclama',
        'Tenha um plano pra ausência: quem cobre quem quando falta gente',
      ]} cor="#A5B4FC" />
      <Destaque>Equipe sobrecarregada não erra por incompetência, erra por volume mal distribuído.</Destaque>
    </div>
  )
}
function SlideErrosRetrabalho() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Erro que ninguém audita, ninguém aprende com ele, só se repete.">Controle de erros e retrabalho</Titulo>
      <ErradoCerto
        errado="Corrigir o erro na hora e seguir em frente, sem registrar o que aconteceu."
        certo="Registrar o erro, a causa e a correção — vira padrão de qualidade pra equipe inteira não repetir."
      />
      <Destaque>Retrabalho não corrigido na causa vira custo escondido, pago em hora de trabalho, todo mês.</Destaque>
    </div>
  )
}
function SlideIndicadores() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub='Sem número, "está tudo bem" é opinião, não gestão.'>Indicadores operacionais</Titulo>
      <Check itens={[
        'Taxa de tarefa entregue no prazo, por pessoa e por cliente',
        'Quantidade de retrabalho por mês, e em qual tipo de tarefa concentra',
        'Tempo médio de execução de cada tipo de tarefa',
        'Gargalo: onde a fila de tarefa pendente mais cresce',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideErros() {
  const erros = [
    'Distribuir cliente novo sem checar capacidade de quem recebe', 'Corrigir erro sem registrar a causa',
    'Medir só quantidade de tarefa feita, nunca qualidade', 'Não ter plano de cobertura pra ausência',
    'Deixar sempre a mesma pessoa resolver o cliente mais difícil', 'Não revisar indicador nenhum além de "tá rodando"',
    'Achar que retrabalho é normal, não é custo', 'Não dar feedback de erro até virar reclamação de cliente',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns em qualidade e gestão de equipe</Titulo>
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
      <Titulo sub="Onde a capacidade e a produtividade da equipe ficam visíveis.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Capacidade da Equipe', 'Veja quantas tarefas e clientes cada pessoa carrega, num só lugar.', INDIGO],
        ['Custo/Hora', 'Saiba quanto custa a hora de cada pessoa, pra decisão de escala fazer sentido financeiro.', AMBER],
        ['Central Operacional', 'Acompanhe atraso recorrente por pessoa, não só por cliente.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/cap')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Capacidade da Equipe →</button>
      </div>
    </div>
  )
}
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A pergunta que essa aula existe pra responder.">Atividade prática: quem está sobrecarregado?</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Abra a Capacidade da Equipe no Fluxe. Identifique quem está com mais tarefa/cliente do que os outros,
          e quem tem folga. Decida: precisa redistribuir cliente, ou é hora de contratar?
        </div>
      </div>
      <Destaque>Faça essa revisão hoje mesmo, depois corrigimos juntos.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Operação rodando não é o mesmo que operação com qualidade.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Distribuição', 'Capacidade', 'Controle de erro', 'Indicadores', 'Qualidade real'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        Uma equipe bem distribuída erra menos. Um erro registrado não se repete.<br />
        Isso é o que separa "está rodando" de "está rodando bem".
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideEtapas },
  { render: SlideDistribuicao }, { render: SlideErrosRetrabalho }, { render: SlideIndicadores },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoQualidadeEquipePage() {
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
