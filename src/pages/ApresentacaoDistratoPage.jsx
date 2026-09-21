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
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 14</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Distrato: como encerrar um cliente profissionalmente</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Comunicação, checklist de saída, proteção do BPO, e transformar o fim de um contrato em aprendizado</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "Seu BPO sabe contratar. Mas sabe perder cliente?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Distrato também é processo, e é o momento em que o BPO mais se expõe se não tiver critério.
        Hoje é sobre encerrar com segurança, profissionalismo, e aprendizado pra próxima vez.
      </div>
    </div>
  )
}
function SlideEtapas() {
  const etapas = ['Comunicação do encerramento', 'Checklist de saída', 'Proteção do BPO', 'Aprendizado']
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A espinha dorsal da aula.">O caminho do distrato</Titulo>
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
function SlideComunicacao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Como comunicar importa tanto quanto o motivo do encerramento.">Motivos e comunicação do encerramento</Titulo>
      <ScriptQuote label="MODELO DE MENSAGEM">
        Encerramos a prestação de serviços em [data], conforme cláusula contratual de aviso prévio.
        Segue o checklist com os próximos passos até lá, pra garantir uma transição tranquila.
      </ScriptQuote>
      <Destaque>Comunicação clara e respeitosa é o que separa um encerramento profissional de um rompimento.</Destaque>
    </div>
  )
}
function SlideChecklist() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="As duas últimas semanas de um cliente que está saindo precisam de roteiro, não improviso.">Checklist de saída</Titulo>
      <Check itens={[
        'Entrega das informações: organização e devolução de dados ao cliente',
        'Encerramento de acessos: remoção de permissões e sistemas',
        'Pendências financeiras: acertos, notas fiscais e fechamento de contas',
        'Confirmação por escrito de que tudo foi entregue e recebido',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideProtecao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Encerramento malfeito vira problema jurídico meses depois.">Proteção do BPO</Titulo>
      <Check itens={[
        'Documente por escrito o motivo e a data do encerramento',
        'Guarde comprovante de entrega de dados e devolução de acessos',
        'Confira se não há pendência financeira em aberto antes de fechar de vez',
        'Consulte o contrato: multa rescisória, aviso prévio, prazo de transição',
      ]} cor="#A5B4FC" />
      <Destaque cor="#FCA5A5">Sem documentação, a palavra do cliente vale tanto quanto a sua numa disputa futura.</Destaque>
    </div>
  )
}
function SlideAprendizado() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Todo distrato ensina algo sobre como você vende, entrega ou cobra.">Transformar distrato em aprendizado</Titulo>
      <Check itens={[
        'Pergunte o motivo real, mesmo que o cliente não queira dizer de cara',
        'Identifique se o motivo se repete em outros distratos: é padrão, não coincidência',
        'Revise se o problema começou lá na venda (expectativa mal alinhada) ou na entrega',
        'Ajuste o processo que causou o problema, não só lamente a perda do cliente',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideErros() {
  const erros = [
    'Encerrar por mensagem informal, sem registro', 'Não seguir o checklist de saída, cada distrato vira improviso',
    'Deixar acesso do cliente ativo depois do encerramento', 'Não conferir pendência financeira antes de fechar',
    'Não guardar nenhuma documentação do processo', 'Não perguntar o motivo real do cancelamento',
    'Tratar todo distrato como caso isolado, nunca como padrão', 'Reagir com raiva ou desrespeito no encerramento',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns no distrato</Titulo>
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
      <Titulo sub="Onde o encerramento fica documentado, não só combinado verbalmente.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Checklist de Encerramento', 'Use o modelo da Biblioteca pra não esquecer nenhuma etapa da saída.', INDIGO],
        ['Modelo de Distrato', 'Formalize por escrito, com as cláusulas de acerto e devolução de acessos.', AMBER],
        ['Status do cliente', 'Marque como encerrado no Fluxe, mantendo o histórico pra consulta futura.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/materiais-apoio')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Biblioteca no Fluxe →</button>
      </div>
    </div>
  )
}
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A pergunta que essa aula existe pra responder.">Atividade prática: seu checklist de encerramento</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Escreva o que precisa acontecer nas 2 últimas semanas de um cliente que está saindo do seu BPO,
          usando o Checklist de Encerramento da Biblioteca como base e adaptando pra sua realidade.
        </div>
      </div>
      <Destaque>Traga esse checklist pronto, depois corrigimos juntos.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Como você encerra fala tanto sobre seu BPO quanto como você atende.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Comunicação', 'Checklist', 'Proteção', 'Aprendizado', 'Encerramento profissional'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        Cliente que sai bem tratado é cliente que indica outro, mesmo tendo ido embora.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideEtapas },
  { render: SlideComunicacao }, { render: SlideChecklist }, { render: SlideProtecao }, { render: SlideAprendizado },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoDistratoPage() {
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
