import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import LOGO_SRC from '../assets/logo-fluxe.png'

const INDIGO = '#4F46E5'
const AMBER = '#D97706'
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

function Codigo({ children }) {
  return (
    <pre style={{
      background: '#020617', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '14px 18px',
      color: '#A5F3FC', fontSize: 12.5, lineHeight: 1.6, fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
      whiteSpace: 'pre-wrap', margin: 0, textAlign: 'left',
    }}>{children}</pre>
  )
}

// ── 01 · Capa ──────────────────────────────────────────────────────────
function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ANÁLISES ESTRATÉGICAS COM IA</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Criando Skills próprias pro seu BPO</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>Ensine a Claude a analisar do seu jeito, sempre, sem reexplicar em toda conversa</div>
      <Callout label="O que a turma sai sabendo fazer">
        Entender o que é uma Skill da Claude e montar a própria, usando como modelo real a skill que o Fluxe já usa pra análise financeira estratégica.
      </Callout>
    </div>
  )
}

// ── 02 · Conceito ──────────────────────────────────────────────────────
function SlideConceito() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>O CONCEITO</Eyebrow>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 24 }}>
        Uma Skill é uma pasta de instruções que a Claude carrega quando o assunto é relevante.
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', marginBottom: 18 }}>
        Você escreve sua metodologia uma única vez. A Claude passa a segui-la sempre, no Claude.ai, no Claude Code ou na API, é o mesmo padrão nos três.
      </div>
      <div style={{ fontSize: 14, color: '#94A3B8', fontStyle: 'italic' }}>
        Não é reescrever o prompt toda vez. É ensinar uma vez só.
      </div>
    </div>
  )
}

// ── 03 · Por que importa pro BPO ──────────────────────────────────────
function SlidePorque() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Por que isso importa pro BPO Financeiro</h2>
      <Passos cols={2} itens={[
        'Padroniza como a IA analisa DRE, caixa e indicadores do seu jeito',
        'Evita misturar metodologia de um cliente com a de outro',
        'Reduz risco de a IA inventar benchmark ou causa sem base',
        'Funciona pra qualquer analista da equipe, não só quem escreveu o prompt',
      ]} />
    </div>
  )
}

// ── 04 · Carregamento progressivo ─────────────────────────────────────
function SlideProgressivo() {
  const passos = [
    ['1', 'Início da conversa', 'Só nome + descrição carregam (~50-100 tokens)'],
    ['2', 'Assunto bate com a descrição', 'Claude carrega o corpo inteiro da Skill'],
    ['3', 'Corpo cita outros arquivos', 'Claude busca e lê só o que precisar, na hora'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Como a Claude "lê" uma Skill</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {passos.map(([n, t, s]) => (
          <div key={n} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '16px 16px', textAlign: 'center' }}>
            <div style={{ background: INDIGO, color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, margin: '0 auto 10px' }}>{n}</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{t}</div>
            <div style={{ color: '#93C5FD', fontSize: 12 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <Callout label="Por que isso importa">Não pesa a conversa. Você pode ter dezenas de Skills, a Claude só "abre" a que for relevante naquele momento.</Callout>
      </div>
    </div>
  )
}

// ── 05 · Estrutura de pastas ───────────────────────────────────────────
function SlideEstrutura() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Estrutura de pastas</h2>
      <Codigo>{`minha-skill/
├── SKILL.md              (obrigatório)
├── references/           (opcional, aprofundamento)
│   ├── metodologia.md
│   └── exemplos-de-uso.md
├── assets/                (opcional, modelos prontos)
│   └── modelo-relatorio.md
└── scripts/               (opcional, código auxiliar)`}</Codigo>
      <div style={{ marginTop: 14 }}>
        <Callout label="Regra prática">Só o SKILL.md é obrigatório. O que for muito extenso ou usado só às vezes vai pra references/. Modelo pronto pra reaproveitar vai pra assets/.</Callout>
      </div>
    </div>
  )
}

// ── 06 · Anatomia do SKILL.md ──────────────────────────────────────────
function SlideAnatomia() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Anatomia do SKILL.md</h2>
      <Codigo>{`---
name: bpo-financeiro-estrategico
description: Analista senior de Controladoria e FP&A dentro
  de um BPO Financeiro, transforma dados em diagnostico,
  decisao e plano de acao.
---

# Corpo em markdown normal
Principios, fluxo obrigatorio, regras de confiabilidade,
padrao de comunicacao, e links pros arquivos de
references/ e assets/ quando fizer sentido.`}</Codigo>
      <div style={{ marginTop: 14 }}>
        <Callout label="⚠ A description é a parte mais importante" labelColor="#FCD34D" bg="rgba(217,119,6,.15)" border="rgba(217,119,6,.4)">
          É o único texto que a Claude vê antes de decidir se a skill é relevante. Escreva pensando em "quando isso deve entrar em ação", não só "o que ela faz".
        </Callout>
      </div>
    </div>
  )
}

// ── 07 · Exemplo real: princípios ─────────────────────────────────────
function SlideExemploPrincipios() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6, textAlign: 'center' }}>Exemplo real: Skill "BPO Financeiro Estratégico"</h2>
      <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 18 }}>A que o Fluxe usa de verdade. Princípios de funcionamento:</div>
      <Passos cols={2} itens={[
        'Nunca misturar dados de clientes diferentes',
        'Exemplos nos materiais são ilustração, nunca dado real',
        'Priorizar definições formalizadas do próprio cliente',
        'Sinalizar conflitos entre plano de contas, DRE e origem',
        'Não inventar dados, causas, benchmarks ou justificativas',
      ]} />
    </div>
  )
}

// ── 08 · Exemplo real: arquivos ────────────────────────────────────────
function SlideExemploArquivos() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>O que fica em references/ e assets/</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase' }}>references/ (leitura sob demanda)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['metodologia-analise-estrategica.md', 'plano-contas-categorias.md', 'qualidade-dados-controles.md', 'estrutura-relatorios.md', 'exemplos-de-uso.md'].map(f => (
              <div key={f} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '8px 12px', color: '#E2E8F0', fontSize: 12.5, fontFamily: 'monospace' }}>{f}</div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase' }}>assets/ (modelos reutilizáveis)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['modelo-briefing-cliente.md', 'modelo-mapeamento-categorias.csv', 'modelo-relatorio-estrategico.md'].map(f => (
              <div key={f} style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.3)', borderRadius: 8, padding: '8px 12px', color: '#FDE68A', fontSize: 12.5, fontFamily: 'monospace' }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 09 · Exemplo real: fluxo obrigatório ──────────────────────────────
function SlideExemploFluxo() {
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>O fluxo obrigatório dentro da skill</h2>
      <Passos cols={4} itens={['Identificar cliente, período, objetivo', 'Checar se as bases cobrem o pedido', 'Rodar controles de qualidade', 'Separar competência x caixa', 'Comparar com uma referência', 'Priorizar por impacto e urgência', 'Plano de ação mensurável', 'Perguntas de validação']} />
      <div style={{ marginTop: 16 }}>
        <Callout label="O ponto central">A skill não deixa a Claude "pular direto pro número". Ela obriga um raciocínio na ordem certa, do jeito que um analista sênior faria.</Callout>
      </div>
    </div>
  )
}

// ── 10 · Como criar a sua ──────────────────────────────────────────────
function SlideComoCriar() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Como criar a sua</h2>
      <div style={{ fontSize: 13, color: '#A5B4FC', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Pedindo pra Claude montar com você</div>
      <Codigo>{`Quero criar uma Skill pra Claude sobre [assunto do seu BPO].
Ela deve: [3 a 5 regras inegociáveis do seu jeito de trabalhar].
Nunca deve: [coisas que a IA não pode fazer, tipo inventar
dado ou misturar cliente]. Me ajude a escrever o SKILL.md
com nome, descricao e o corpo em markdown.`}</Codigo>
      <div style={{ marginTop: 16 }}>
        <Callout label="Alternativa">Escrever à mão: pasta + SKILL.md com frontmatter (name + description) + corpo. Só use references/ se o conteúdo não couber direto no corpo, e assets/ pra modelo que você reaproveita toda hora.</Callout>
      </div>
    </div>
  )
}

// ── 11 · Onde usar ───────────────────────────────────────────────────
function SlideOndeUsar() {
  const linhas = [['Claude.ai', 'Nas configurações de um Project, como Skill do projeto'], ['Claude Code', 'Pasta .claude/skills/ do repositório, ou via plugin'], ['API', 'Referenciada na chamada, pro seu próprio produto usar']]
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Onde usar</h2>
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}>
        {linhas.map(([a, b], i) => (
          <div key={a} style={{ display: 'flex', padding: '12px 18px', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.04)' }}>
            <div style={{ width: 140, color: '#A5B4FC', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{a}</div>
            <div style={{ color: '#E2E8F0', fontSize: 13 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 12 · Checklist ──────────────────────────────────────────────────────
function SlideChecklist() {
  const itens = ['Nome e descrição deixam claro quando ela entra em ação', 'Regras inegociáveis do método estão explícitas', 'Tem "nunca invente X" ou "nunca misture Y" no corpo', 'Exemplos numéricos marcados como ilustração', 'Testada num caso real, comparado com o que você faria']
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Checklist antes de considerar pronta</h2>
      <Passos cols={1} itens={itens} />
    </div>
  )
}

// ── 13 · Encerramento ───────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>PROVOCAÇÃO FINAL</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 22 }}>
        Sem uma skill, cada analista da sua equipe pede pra IA de um jeito diferente, e recebe uma resposta diferente pro mesmo cliente.
      </div>
      <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>
        Uma Skill bem escrita é a sua metodologia virando padrão, pra qualquer pessoa da equipe, em qualquer conversa.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideConceito }, { render: SlidePorque }, { render: SlideProgressivo },
  { render: SlideEstrutura }, { render: SlideAnatomia }, { render: SlideExemploPrincipios }, { render: SlideExemploArquivos },
  { render: SlideExemploFluxo }, { render: SlideComoCriar }, { render: SlideOndeUsar }, { render: SlideChecklist },
  { render: SlideEncerramento },
]

export default function ApresentacaoSkillsPage() {
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

      <div style={{ position: 'absolute', top: 20, left: 32, background: '#fff', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
        <img src={LOGO_SRC} alt="Fluxe" style={{ height: 20, width: 'auto' }} />
      </div>

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
