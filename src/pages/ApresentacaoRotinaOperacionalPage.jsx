import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const INDIGO = '#4F46E5'
const AMBER = '#D97706'
const GREEN = '#16A34A'
const RED = '#DC2626'
const INK = '#0F172A'

// ── Blocos reutilizáveis ────────────────────────────────────────────────
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

// ── 01 · Capa ──────────────────────────────────────────────────────────
function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 8</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Operacional: a rotina do BPO</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Fechamento financeiro, controle de pendências, produtividade e SLA, sem virar refém da própria operação</div>
    </div>
  )
}

// ── 02 · Abertura ──────────────────────────────────────────────────────
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "A implementação tá pronta. Por que ainda apaga incêndio todo dia?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Porque desenhar a rotina é uma coisa, executar ela com controle é outra. Hoje é sobre rodar a operação
        de verdade, sem deixar pendência acumular e sem virar refém da tarefa do dia.
      </div>
    </div>
  )
}

// ── 03 · Implementação x Operacional ─────────────────────────────────────
function SlideDiferenca() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Uma desenha o processo. A outra executa ele, todo dia, com controle.">Implementação não é operacional</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>IMPLEMENTAÇÃO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Mapear e desenhar como o financeiro do cliente vai funcionar.</div>
        </div>
        <div style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>OPERACIONAL</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Executar a rotina desenhada, todo dia, com controle de pendência e prazo.</div>
        </div>
      </div>
      <Destaque>É aqui que o BPO trabalha de verdade. Mas não deveria ser só isso.</Destaque>
    </div>
  )
}

// ── 04 · O que sustenta a rotina ──────────────────────────────────────────
function SlideEtapas() {
  const etapas = ['Fechamento financeiro', 'Controle de pendências', 'Gestão de produtividade', 'Controle de SLA']
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A espinha dorsal da aula. Cada bloco é ensinado em detalhe a seguir.">O que sustenta a rotina operacional</Titulo>
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

// ── 05 · Fechamento financeiro: processo completo ────────────────────────
function SlideFechamento() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Fechar o mês não é só conferir saldo, é validar que tudo o que foi rotina virou informação confiável.">Fechamento financeiro: processo completo</Titulo>
      <Check itens={[
        'Todas as contas bancárias e cartões conciliados até a última movimentação',
        'Contas a pagar e a receber do mês baixadas e sem pendência de lançamento',
        'Divergências da conciliação explicadas, não só listadas',
        'Categorização revisada, sem lançamento em categoria genérica',
        'Relatório final gerado e conferido antes de enviar ao cliente',
      ]} cor="#A5B4FC" />
      <Destaque>Fechamento não é o último dia do mês. É a soma de toda a rotina bem feita ao longo dele.</Destaque>
    </div>
  )
}

// ── 06 · Controle de pendências ────────────────────────────────────────────
function SlidePendencias() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Pendência que não tem dono e prazo vira pendência esquecida.">Controle de pendências: gestão sistemática</Titulo>
      <ErradoCerto
        errado="Pendência anotada num bloco de notas, ou só na cabeça de quem está executando."
        certo="Toda pendência registrada no sistema, com responsável, prazo e motivo, visível pra equipe inteira."
      />
      <Destaque>No Fluxe, toda tarefa marcada como pendente pede o motivo, isso é o que vira gestão, não desculpa.</Destaque>
    </div>
  )
}

// ── 07 · Gestão de produtividade ──────────────────────────────────────────
function SlideProdutividade() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Sem medir, você só acha que sabe quem está sobrecarregado.">Gestão de produtividade</Titulo>
      <Check itens={[
        'Quantas tarefas cada pessoa da equipe está executando por dia',
        'Quantas ficam atrasadas de forma recorrente, e por quê',
        'Se a distribuição de clientes por pessoa está equilibrada',
        'Se o tempo estimado da tarefa bate com o tempo real de execução',
      ]} cor="#A5B4FC" />
    </div>
  )
}

// ── 08 · Controle de SLA ───────────────────────────────────────────────────
function SlideSLA() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="SLA não é sobre trabalhar mais rápido. É sobre prometer um prazo que dá pra cumprir sempre.">Controle de SLA: não virar refém da tarefa</Titulo>
      <Check itens={[
        'Defina o prazo de resposta pra cada tipo de solicitação do cliente',
        'Separe o que é urgente de verdade do que é urgência inventada',
        'Meça o SLA cumprido, não só o prometido',
        'Revise o SLA quando ele estiver sendo furado com frequência, o problema pode ser o prazo, não a equipe',
      ]} cor="#A5B4FC" />
      <Destaque cor="#FCA5A5">Um SLA impossível de cumprir não é um padrão de qualidade, é uma fábrica de estresse.</Destaque>
    </div>
  )
}

// ── 09 · Erros comuns ──────────────────────────────────────────────────────
function SlideErros() {
  const erros = [
    'Deixar pendência sem dono nem prazo', 'Não revisar categoria antes do fechamento',
    'Medir produtividade só por "quantidade de tarefa feita"', 'Prometer SLA que a equipe não consegue cumprir',
    'Fechar o mês sem checar divergência da conciliação', 'Não revisar tarefa atrasada recorrente, só reagendar de novo',
    'Achar que "está tudo bem" sem nenhum número que prove isso', 'Sobrecarregar sempre a mesma pessoa da equipe',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns na rotina operacional</Titulo>
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

// ── 10 · Na prática, dentro do Fluxe ─────────────────────────────────────
function SlideFluxe() {
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Onde a rotina operacional é executada e medida de verdade.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Central Operacional', 'Visão do dia inteiro: o que está atrasado, o que vence hoje, o que já foi feito.', INDIGO],
        ['Motivo de pendência', 'Toda tarefa pendente pede o motivo, isso vira dado, não desculpa solta.', AMBER],
        ['Capacidade da equipe', 'Quantas tarefas por pessoa, pra identificar quem está sobrecarregado antes de virar problema.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/agenda')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Central Operacional no Fluxe →</button>
      </div>
    </div>
  )
}

// ── 11 · Atividade prática ──────────────────────────────────────────────
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A pergunta que essa aula existe pra responder.">Atividade prática: sua Central Operacional</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Abra a Central Operacional do Fluxe agora e revise a última semana. Liste 3 tarefas atrasadas recorrentes,
          não uma vez só, recorrente. Pra cada uma, responda: o que está causando esse atraso?
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {['É falta de informação do cliente?', 'É sobrecarga de quem executa?', 'É prazo mal calculado?', 'É prioridade errada?', 'É falta de padrão?']
          .map(p => (
            <div key={p} style={{ background: 'rgba(99,102,241,.15)', borderRadius: 20, padding: '7px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{p}</div>
          ))}
      </div>
      <Destaque>Tarefa atrasada uma vez é exceção. Atrasada toda vez é sintoma. Ache a causa, depois corrigimos juntos.</Destaque>
    </div>
  )
}

// ── Encerramento ─────────────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Rotina sem controle não é operação, é sorte se repetindo.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Implementação', 'Fechamento', 'Pendências', 'Produtividade', 'SLA', 'Operação sob controle'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        A rotina operacional é onde o BPO ganha ou perde credibilidade todo santo dia.<br />
        Controle de pendência, produtividade e SLA não são burocracia, são o que separa apagar incêndio de gerir.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideDiferenca }, { render: SlideEtapas },
  { render: SlideFechamento }, { render: SlidePendencias }, { render: SlideProdutividade }, { render: SlideSLA },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoRotinaOperacionalPage() {
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
      padding: '60px 80px', zIndex: 1000, overflow: 'auto',
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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 400, justifyContent: 'center' }}>
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
