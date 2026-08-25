import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const INDIGO = '#4F46E5'
const AMBER = '#D97706'
const GREEN = '#16A34A'
const RED = '#DC2626'
const INK = '#0F172A'

function Passos({ itens, cols = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
      {itens.map((p, i) => (
        <div key={p} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: INDIGO, color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{i + 1}</div>
          <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{p}</div>
        </div>
      ))}
    </div>
  )
}

function Callout({ label, labelColor = '#A5B4FC', children, bg = 'rgba(255,255,255,.08)', border }) {
  return (
    <div style={{ background: bg, border: border ? `1px solid ${border}` : 'none', borderRadius: 10, padding: '16px 20px' }}>
      {label && <div style={{ color: labelColor, fontWeight: 800, fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ color: '#fff', fontSize: 15, lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}

function Eyebrow({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#A5B4FC', letterSpacing: 3, marginBottom: 14, textAlign: 'center' }}>{children}</div>
}

// ── 01 · Capa ──────────────────────────────────────────────────────────
function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO</Eyebrow>
      <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Manual Operacional do BPO</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>Manual Operacional ≠ POP: arquitetura, controles e exceções de uma operação que escala</div>
      <Callout label="O que a turma sai sabendo fazer">
        Desenhar a operação de um cliente novo do zero, com macroprocessos, controles, matriz de exceções, alçadas de aprovação e indicadores.
      </Callout>
    </div>
  )
}

// ── 02 · Distinção central ────────────────────────────────────────────
function SlideDistincao() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>A DISTINÇÃO QUE MUDA TUDO</Eyebrow>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 24 }}>
        "O Manual Operacional é o sistema da operação. O POP é a instrução de uma atividade dentro desse sistema."
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', marginBottom: 10 }}>
        Um POP ensina como fazer uma tarefa. O manual ensina como a empresa inteira funciona, é ele que faz um POP isolado virar operação de verdade.
      </div>
      <div style={{ fontSize: 14, color: '#94A3B8', fontStyle: 'italic' }}>
        Sem o manual: uma pilha de instruções soltas, sem lógica entre elas, sem dono, sem controle e sem indicador.
      </div>
    </div>
  )
}

// ── 03 · As 8 perguntas ────────────────────────────────────────────────
function SlidePerguntas() {
  return (
    <div style={{ width: '100%', maxWidth: 920 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>O que o manual precisa responder</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 22 }}>Estas oito perguntas, em sequência, são o esqueleto do manual inteiro.</div>
      <Passos itens={['Como o cliente entra', 'Como a informação chega', 'Como o trabalho é distribuído', 'Como executamos', 'Como controlamos', 'Como tratamos erros', 'Como entregamos', 'Como medimos']} />
      <div style={{ marginTop: 18 }}>
        <Callout label="Na prática">Se um POP não consegue ser encaixado em uma dessas oito perguntas, ele provavelmente descreve um passo isolado, não um processo. Pergunte: essa atividade pertence a qual etapa da cadeia?</Callout>
      </div>
    </div>
  )
}

// ── 04 · Jornada do cliente ────────────────────────────────────────────
function SlideJornada() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>A jornada inteira do cliente</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 22 }}>Não começa em contas a pagar. Começa muito antes, e é aí que nasce boa parte do retrabalho.</div>
      <Passos cols={5} itens={['Comercial fechado', 'Contrato', 'Onboarding', 'Parametrização', 'Implantação', 'Operação recorrente', 'Fechamento', 'Reunião/entrega', 'Alteração de escopo', 'Offboarding']} />
      <div style={{ marginTop: 18 }}>
        <Callout label="Atenção" labelColor="#FCD34D">Um BPO pode ter um contas a pagar impecável e um onboarding completamente caótico. Cliente mal parametrizado gera erro recorrente, não erro pontual.</Callout>
      </div>
    </div>
  )
}

// ── 05 · Arquitetura operacional ──────────────────────────────────────
function SlideArquitetura() {
  const linhas = [
    ['Macroprocesso', 'Financeiro'], ['Processo', 'Contas a pagar'], ['Procedimento', 'Agendamento bancário'],
    ['Checklist', 'Validações antes do agendamento'], ['Evidência', 'Comprovante + registro da aprovação'],
    ['Indicador', 'Pagamentos no prazo / erros / retrabalho'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Arquitetura operacional</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 22 }}>A cadeia completa, do mais geral ao mais específico.</div>
      <Passos cols={6} itens={['Macroprocesso', 'Processo', 'Procedimento', 'Checklist', 'Evidência', 'Indicador']} />
      <div style={{ marginTop: 18, background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}>
        {linhas.map(([a, b], i) => (
          <div key={a} style={{ display: 'flex', padding: '10px 18px', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.04)' }}>
            <div style={{ width: 180, color: '#A5B4FC', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{a}</div>
            <div style={{ color: '#E2E8F0', fontSize: 13 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 06 · Controles ─────────────────────────────────────────────────────
function SlideControles() {
  const cols = [
    ['Risco', 'O que pode dar errado', RED],
    ['Controle', 'O que evita ou detecta o erro', INDIGO],
    ['Evidência', 'Como comprovamos que o controle foi aplicado', GREEN],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6, textAlign: 'center' }}>Controles: a maior ausência</h2>
      <div style={{ fontSize: 19, color: '#FCD34D', textAlign: 'center', marginBottom: 22, fontWeight: 700 }}>Como sabemos que ninguém fez besteira?</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        {cols.map(([t, d, c]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ color: c, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{t}</div>
            <div style={{ color: '#E2E8F0', fontSize: 13 }}>{d}</div>
          </div>
        ))}
      </div>
      <Callout label="Exemplo">
        Atividade: cadastrar fornecedor.<br />Risco: alteração fraudulenta de dados bancários.<br />
        Controle: validação por canal independente, ligar pro fornecedor, não confiar só no e-mail.<br />Evidência: registro da confirmação.
      </Callout>
    </div>
  )
}

// ── 07 · Matriz de exceções ────────────────────────────────────────────
function SlideExcecoes() {
  const casos = [
    ['Boleto sem nota fiscal', 'Solicitar o documento, não agendar o pagamento, escalar se não chegar no prazo.'],
    ['Pagamento urgente fora do fluxo', 'Verificar a regra de urgência, obter aprovação de quem tem alçada, registrar a exceção.'],
    ['Divergência bancária', 'Bloquear o processo, validar os dados na origem, documentar a resolução.'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4, textAlign: 'center' }}>Matriz de exceções</h2>
      <div style={{ fontSize: 17, color: '#FCD34D', textAlign: 'center', marginBottom: 6, fontWeight: 700, fontStyle: 'italic' }}>"Lançamento não identificado não vira diversos."</div>
      <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 18 }}>Operação não quebra no fluxo normal. Ela quebra quando aparece o "Clau, só hoje faz assim".</div>
      <Passos cols={6} itens={['Evento', 'Responsável', 'Ação', 'Prazo', 'Escalonamento', 'Evidência']} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        {casos.map(([t, d]) => (
          <div key={t} style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.35)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#FBBF24', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{t}</div>
            <div style={{ color: '#E2E8F0', fontSize: 12.5, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 08 · RACI + Alçadas ────────────────────────────────────────────────
function SlideRaci() {
  const linhas = [
    ['Lançar conta', 'Executa', '-', '-'],
    ['Agendar', 'Executa', '-', '-'],
    ['Aprovar até R$ 5 mil', '-', 'Aprova', '-'],
    ['Acima de R$ 5 mil', '-', '-', 'Aprova'],
    ['Alterar fornecedor', 'Valida', 'Aprova', '-'],
    ['Pagamento fora do fluxo', 'Solicita autorização', 'Aprova', '-'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>RACI + Alçadas</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 20 }}>Responsabilidade + autonomia + alçada, não basta saber quem faz, é preciso saber até onde decide sozinho.</div>
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: 'rgba(99,102,241,.25)', padding: '10px 18px', fontWeight: 800, fontSize: 12, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: 1 }}>
          <div style={{ flex: 2 }}>Situação</div><div style={{ flex: 1 }}>BPO</div><div style={{ flex: 1 }}>Gestor</div><div style={{ flex: 1 }}>Sócio</div>
        </div>
        {linhas.map((l, i) => (
          <div key={l[0]} style={{ display: 'flex', padding: '10px 18px', fontSize: 13, color: '#E2E8F0', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.04)' }}>
            <div style={{ flex: 2, fontWeight: 600 }}>{l[0]}</div><div style={{ flex: 1 }}>{l[1]}</div><div style={{ flex: 1 }}>{l[2]}</div><div style={{ flex: 1 }}>{l[3]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 09 · Capacidade e escala ───────────────────────────────────────────
function SlideCapacidade() {
  return (
    <div style={{ width: '100%', maxWidth: 900, textAlign: 'center' }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Capacidade e escala</h2>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#FCD34D', marginBottom: 24 }}>Quantos clientes uma pessoa consegue atender?</div>
      <div style={{ marginBottom: 20 }}>
        <Passos itens={['Volume de tarefas', 'Frequência', 'Tempo padrão', 'Complexidade', 'Responsável', 'Backup', 'Capacidade', 'Gargalos']} />
      </div>
      <Callout label="O verdadeiro teste do manual">
        Não é "está bem escrito?". É "consigo contratar alguém e colocar essa pessoa pra operar sem reinventar minha empresa?".
      </Callout>
    </div>
  )
}

// ── 10 · Acessos e segurança ───────────────────────────────────────────
function SlideAcessos() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Gestão de acessos e segurança</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 22 }}>Em BPO financeiro isso não é rodapé, conecta direto com RACI e alçadas.</div>
      <Passos cols={5} itens={['Acesso bancário', 'Usuário individual', 'Perfil de acesso', 'Segregação', 'Aprovação', 'MFA', 'Revogação', 'Troca de colaborador', 'Registro']} />
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {['Visualizar', 'Lançar', 'Agendar', 'Aprovar / pagar'].map(p => (
          <div key={p} style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 10, padding: '10px 12px', textAlign: 'center', color: '#C7D2FE', fontWeight: 700, fontSize: 12.5 }}>Quem pode {p.toLowerCase()}?</div>
        ))}
      </div>
    </div>
  )
}

// ── 11 · KPIs em 3 níveis ──────────────────────────────────────────────
function SlideKpis() {
  const niveis = [
    ['Eficiência', 'Tempo por atividade, SLA, produtividade, fechamento no prazo.', INDIGO],
    ['Qualidade', 'Erros, retrabalho, duplicidades, pendências, conciliações em aberto.', AMBER],
    ['Gestão do BPO', 'Horas por cliente, custo de atendimento, capacidade por operador, margem por cliente, chamados e exceções.', GREEN],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 22, textAlign: 'center' }}>KPIs em três níveis</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        {niveis.map(([t, d, c]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ color: c, fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{t}</div>
            <div style={{ color: '#E2E8F0', fontSize: 12.5, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
      <Callout label="Na prática">O nível "Gestão do BPO" é o que ensina o operador a gerenciar a própria operação, não só o financeiro do cliente. É a diferença entre alguém que executa bem e alguém pronto pra ser dono de uma empresa de BPO.</Callout>
    </div>
  )
}

// ── 12 · Exercício final ───────────────────────────────────────────────
function SlideExercicio() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Exercício final: caso de implantação</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 20 }}>Em vez de "crie o POP de contas a pagar", um caso completo de implantação.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <Callout label="O cliente">
          Empresa de serviços, 50 pagamentos por mês. 3 contas bancárias. 2 aprovadores. Notas chegam por WhatsApp e e-mail.
          Fornecedor manda boleto em cima da hora. Sócio pede pagamentos urgentes pelo WhatsApp. O BPO tem 3 operadores.
        </Callout>
        <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>A missão</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Desenhem como essa operação deverá funcionar.</div>
          </div>
        </div>
      </div>
      <Passos cols={5} itens={['Entrada', 'Responsável', 'SLA', 'Execução', 'Aprovação', 'Exceções', 'Controles', 'Evidências', 'Indicador', 'Backup']} />
    </div>
  )
}

// ── 13 · Encerramento ──────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>PROVOCAÇÃO FINAL</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 22 }}>
        Se você sair da sua empresa por 30 dias, o manual sustenta a operação ou a operação começa a procurar você no WhatsApp?
      </div>
      <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>
        Essa é a régua. Um manual que não passa nesse teste não é um manual operacional, é uma coleção de instruções que só funciona enquanto o dono está por perto.
      </div>
    </div>
  )
}

// ── 14 · Material entregue ─────────────────────────────────────────────
function SlideKit() {
  const itens = ['Mapa de macroprocessos', 'Template de POP', 'Matriz RACI e alçadas', 'Matriz de exceções', 'Matriz de riscos e controles', 'SLA por processo', 'Indicadores em três níveis', 'Checklist de revisão do manual']
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6, textAlign: 'center' }}>Kit Manual Operacional do BPO</h2>
      <div style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 20 }}>Entregue junto com esta aula, na Biblioteca do Fluxe.</div>
      <div style={{ marginBottom: 20 }}><Passos itens={itens} /></div>
      <Callout>Vocês não estão criando um documento. Estão construindo uma operação que consegue crescer sem depender da memória de alguém.</Callout>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideDistincao }, { render: SlidePerguntas }, { render: SlideJornada },
  { render: SlideArquitetura }, { render: SlideControles }, { render: SlideExcecoes }, { render: SlideRaci },
  { render: SlideCapacidade }, { render: SlideAcessos }, { render: SlideKpis }, { render: SlideExercicio },
  { render: SlideEncerramento }, { render: SlideKit },
]

export default function ApresentacaoManualOperacionalPage() {
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
