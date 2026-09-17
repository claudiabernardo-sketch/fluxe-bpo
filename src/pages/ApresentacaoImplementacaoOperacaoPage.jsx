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
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 6</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Implementação: construindo a operação</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Mapeamento financeiro, construção da rotina e o exercício prático de montar as rotinas de um cliente real</div>
    </div>
  )
}

// ── 02 · Abertura ──────────────────────────────────────────────────────
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "O cliente está ativado. Por que ainda parece bagunça?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Porque ter bancos, plano de contas e categorias cadastrados não é a mesma coisa que ter um processo funcionando.
        Hoje você vai construir como o financeiro daquele cliente específico vai rodar, de verdade, toda semana.
      </div>
    </div>
  )
}

// ── 03 · Ativação x Implementação ────────────────────────────────────────
function SlideDiferenca() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="A ativação prepara o terreno. A implementação constrói a casa em cima dele.">Ativação não é implementação</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>ATIVAÇÃO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Configurar, cadastrar, parametrizar. O ambiente existe.</div>
        </div>
        <div style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>IMPLEMENTAÇÃO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Mapear, desenhar e rodar o processo. O ambiente funciona.</div>
        </div>
      </div>
      <Destaque>A etapa em que o BPO deixa de organizar informação e começa a construir uma operação financeira de verdade.</Destaque>
    </div>
  )
}

// ── 04 · As 3 etapas ──────────────────────────────────────────────────────
function SlideEtapas() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A espinha dorsal da aula. Cada passo é ensinado em detalhe a seguir.">O caminho da implementação</Titulo>
      <Cascata passos={[
        ['Passo 1 · Mapeamento financeiro', 'Levantamento completo dos processos, fluxos de aprovação e contas a pagar e receber do cliente.', INDIGO],
        ['Passo 2 · Construção da rotina', 'Organização da rotina operacional: conciliação bancária, emissão de documentos e controle de pendências.', AMBER],
        ['Passo 3 · Exercício prático', 'Criar as rotinas diária, semanal e mensal de um cliente real na aba Rotina do Fluxe.', GREEN],
      ]} />
    </div>
  )
}

// ── 05 · Mapeamento financeiro ────────────────────────────────────────────
function SlideMapeamento() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Antes de desenhar a rotina, entenda como o dinheiro realmente se move nesse cliente.">Mapeamento financeiro</Titulo>
      <Check itens={[
        'Quais processos existem hoje, mesmo que informais ou manuais',
        'Quem aprova cada tipo de pagamento, e em que faixa de valor',
        'Como as contas a pagar chegam até o BPO (e-mail, WhatsApp, portal do fornecedor)',
        'Como as contas a receber são geradas e cobradas',
        'Onde estão os gargalos que já causavam atraso antes do BPO entrar',
      ]} cor="#A5B4FC" />
      <Destaque>Mapear errado aqui significa desenhar uma rotina que não reflete a realidade do cliente.</Destaque>
    </div>
  )
}

// ── 06 · Contas a pagar ────────────────────────────────────────────────────
function SlideContasPagar() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Fluxo e controle, não só lançamento.">Contas a pagar: fluxos e controles</Titulo>
      <Check itens={[
        'Recebimento do boleto/nota até o lançamento no sistema',
        'Fluxo de aprovação, com prazo definido pra cada aprovador responder',
        'Data de corte pra pagamentos do dia, alinhada com o cliente',
        'O que fazer quando falta aprovação até o prazo (regra combinada, não improviso)',
      ]} cor="#A5B4FC" />
    </div>
  )
}

// ── 07 · Contas a receber ───────────────────────────────────────────────────
function SlideContasReceber() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Cobrar bem começa em emitir e comunicar bem.">Contas a receber: fluxos e controles</Titulo>
      <Check itens={[
        'Como e quando a cobrança é gerada (venda, contrato, recorrência)',
        'Canal de envio ao cliente final, e prazo de vencimento padrão',
        'Régua de cobrança pra inadimplência, com responsável por cada etapa',
        'Como registrar a baixa quando o pagamento efetivamente entra',
      ]} cor="#A5B4FC" />
    </div>
  )
}

// ── 08 · Conciliação bancária ───────────────────────────────────────────────
function SlideConciliacao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Processo e cadência: quando fazer, não só como fazer.">Conciliação bancária</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>PROCESSO</div>
          <Check itens={['Extrato x lançamentos do sistema', 'Identificar divergência antes de fechar o mês', 'Registrar o que ainda está pendente de explicação']} cor="#A5B4FC" />
        </div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>CADÊNCIA</div>
          <Check itens={['Diária: contas com muito volume', 'Semanal: a maioria dos clientes', 'Nunca só no fechamento do mês']} cor="#FCD34D" />
        </div>
      </div>
      <Destaque cor="#FCA5A5">Conciliar só no fechamento do mês é descobrir o problema tarde demais pra corrigir.</Destaque>
    </div>
  )
}

// ── 09 · Emissão de documentos ──────────────────────────────────────────────
function SlideEmissao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Padrões e responsáveis: quem emite o quê, e quando.">Emissão de documentos</Titulo>
      <Check itens={[
        'Quem emite nota fiscal, boleto ou recibo: BPO ou cliente?',
        'Padrão de numeração e nomenclatura dos arquivos',
        'Prazo entre a geração do documento e o envio ao destinatário',
        'Onde o documento fica arquivado, pra consulta futura',
      ]} cor="#A5B4FC" />
      <Destaque>Sem padrão de emissão, cada mês vira um jeito diferente de fazer a mesma coisa.</Destaque>
    </div>
  )
}

// ── 10 · Construção da rotina ──────────────────────────────────────────────
function SlideRotina() {
  const cols = [
    ['Diária', GREEN, 'Contas com volume alto: conciliação, pagamentos do dia, cobranças urgentes.'],
    ['Semanal', INDIGO, 'Revisão de pendências, fluxo de caixa da semana, aprovações acumuladas.'],
    ['Mensal', AMBER, 'Fechamento, conferência final, relatório e reunião com o cliente.'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Toda rotina tem uma cadência certa. Colocar tudo no mesmo balaio gera atraso.">Construção da rotina: diária, semanal, mensal</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {cols.map(([t, c, d]) => (
          <div key={t} style={{ background: c + '1f', border: `1px solid ${c}55`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ color: c, fontWeight: 800, fontSize: 15, marginBottom: 8, textAlign: 'center' }}>{t}</div>
            <div style={{ color: '#E2E8F0', fontSize: 13 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 11 · Erros comuns ──────────────────────────────────────────────────────
function SlideErros() {
  const erros = [
    'Copiar a rotina de outro cliente sem mapear esse', 'Não definir data de corte pra aprovação de pagamento',
    'Conciliar só no fechamento do mês', 'Não documentar quem aprova cada faixa de valor',
    'Misturar cadência diária, semanal e mensal numa lista só', 'Não ter um padrão de emissão de documentos',
    'Achar que a rotina "vai se ajeitando sozinha" com o tempo', 'Não revisar a rotina depois dos primeiros 30 dias',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns na implementação</Titulo>
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

// ── 12 · Na prática, dentro do Fluxe ─────────────────────────────────────
function SlideFluxe() {
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Onde a rotina desenhada hoje vira execução de verdade.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Rotina', 'Cadastre cada serviço contratado na aba Rotina do cliente, com a cadência certa.', INDIGO],
        ['Modelos de tarefa', 'Vincule os Modelos correspondentes, isso ativa a geração automática das tarefas recorrentes.', AMBER],
        ['Central Operacional', 'A partir daí, a execução aparece sozinha, acompanhada pelo Radar.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/clientes')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Clientes no Fluxe →</button>
      </div>
    </div>
  )
}

// ── 13 · Atividade prática ──────────────────────────────────────────────
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="A Loja XPTO já foi ativada. Agora é construir a operação dela.">Atividade prática: implementando a Loja XPTO</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O CASO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          150 pagamentos/mês, aprovação do sócio A até R$ 2.000 e sócio B acima disso · 90 recebimentos/mês, cobrança hoje é manual por WhatsApp ·
          2 bancos, conciliação nunca foi feita de forma recorrente · nota fiscal emitida pelo próprio cliente, sem padrão de prazo de envio.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {['Mapear o fluxo de aprovação', 'Definir data de corte', 'Desenhar a régua de cobrança', 'Definir cadência de conciliação',
          'Padronizar emissão de documentos', 'Montar a rotina diária', 'Montar a rotina semanal', 'Montar a rotina mensal']
          .map(p => (
            <div key={p} style={{ background: 'rgba(99,102,241,.15)', borderRadius: 20, padding: '7px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{p}</div>
          ))}
      </div>
      <Destaque>Monte essa rotina dentro do Fluxe com um cliente real seu, depois corrigimos juntos.</Destaque>
    </div>
  )
}

// ── Encerramento ─────────────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Cliente ativado ≠ operação implementada.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Ativação', 'Mapeamento', 'Contas a pagar', 'Contas a receber', 'Conciliação', 'Rotina', 'Operação'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        A implementação é o que transforma um cliente configurado numa operação que roda sozinha, com cadência certa.<br />
        Rotina mal desenhada agora vira apagar incêndio depois.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideDiferenca }, { render: SlideEtapas },
  { render: SlideMapeamento }, { render: SlideContasPagar }, { render: SlideContasReceber }, { render: SlideConciliacao },
  { render: SlideEmissao }, { render: SlideRotina }, { render: SlideErros }, { render: SlideFluxe },
  { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoImplementacaoOperacaoPage() {
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
