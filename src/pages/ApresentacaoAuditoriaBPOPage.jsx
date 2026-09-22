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
function Formula({ children }) {
  return (
    <div style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 14, padding: '18px 26px', textAlign: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{children}</div>
    </div>
  )
}

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · MATERIAL EXTRA</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Como auditar o seu BPO Financeiro</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Um checklist pra você aplicar no seu próprio negócio, não no do cliente</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "Você fecha o mês de cada cliente. Quando foi a última vez que fechou o seu próprio?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Todo BPO Financeiro sabe apontar o que está errado na operação do cliente. Poucos aplicam
        a mesma régua no próprio negócio. Esse material é o checklist pra você fazer essa auditoria
        em si mesmo, com números, não com sensação.
      </div>
    </div>
  )
}
function SlideEtapas() {
  const etapas = ['Dados', 'Custo por cliente', 'Margem', 'Inadimplência', 'Precificação', 'Ponto de equilíbrio']
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Seis passos, na ordem certa, pra não pular direto pra conclusão.">O caminho da auditoria</Titulo>
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
function SlideDados() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Sem essa base, qualquer conclusão depois é achismo.">Passo 1 — Levantamento de dados</Titulo>
      <Check itens={[
        'Lista de todos os clientes ativos hoje, com o valor mensal cobrado de cada um',
        'Quantas horas da equipe cada cliente consome por mês (real, não o combinado no contrato)',
        'Custo/hora da sua equipe (some salários + encargos + ferramentas, divida pelas horas disponíveis)',
        'Situação de pagamento de cada cliente: em dia, atrasado, ou negociando',
      ]} cor="#A5B4FC" />
      <Destaque>No Fluxe: a aba Equipe (Cap) já mostra o custo/hora, e Apontamentos mostra as horas reais por cliente.</Destaque>
    </div>
  )
}
function SlideCusto() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="O número que a maioria dos donos de BPO nunca calculou.">Passo 2 — Custo por cliente</Titulo>
      <Formula>Custo do cliente = Horas dedicadas × Custo/hora da equipe</Formula>
      <Destaque cor="#FCA5A5">Se você não sabe quanto custa atender um cliente, também não sabe se o preço dele cobre o custo.</Destaque>
    </div>
  )
}
function SlideMargem() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="A régua que separa cliente bom de cliente que dá prejuízo.">Passo 3 — Margem de contribuição por cliente</Titulo>
      <Formula>Margem = Valor cobrado do cliente − Custo do cliente</Formula>
      <Check itens={[
        'Margem positiva e saudável: cliente sustenta a operação e ainda sobra',
        'Margem positiva mas apertada: cliente cobre o custo, mas não deixa muita gordura',
        'Margem negativa: você paga pra trabalhar pra esse cliente',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlideInadimplencia() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Cliente bom no papel, mas que não paga em dia, também é um risco pro seu caixa.">Passo 4 — Inadimplência dos seus clientes</Titulo>
      <Check itens={[
        'Quanto está em atraso hoje, somando todos os clientes',
        'Há quanto tempo cada atraso existe, atraso recorrente pesa mais que atraso pontual',
        'Se esse valor em atraso fosse recebido agora, mudaria sua decisão sobre esse cliente?',
      ]} cor="#A5B4FC" />
    </div>
  )
}
function SlidePrecificacao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Muito cliente antigo ficou pra trás porque o preço nunca foi revisado.">Passo 5 — Revisão da precificação</Titulo>
      <Check itens={[
        'Compare o preço cobrado hoje com o preço mínimo viável pro escopo atual do cliente',
        'Identifique clientes que cresceram em volume de trabalho sem reajuste de preço',
        'Separe reajuste (correção do que já existe) de reprecificação (mudança de tabela)',
      ]} cor="#A5B4FC" />
      <Destaque>No Fluxe: a Precificação já calcula o preço mínimo viável pelo escopo, tempo e margem desejada.</Destaque>
    </div>
  )
}
function SlidePontoEquilibrio() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="O número que diz se o seu BPO, como negócio, está de pé.">Passo 6 — Ponto de equilíbrio do seu BPO</Titulo>
      <Formula>Ponto de equilíbrio = Custos fixos ÷ Margem de contribuição média</Formula>
      <Destaque cor="#FCA5A5">Se a soma das margens dos seus clientes não cobre o seu custo fixo, o problema não é um cliente, é a carteira inteira.</Destaque>
    </div>
  )
}
function SlideErros() {
  const erros = [
    'Nunca calcular quanto cada cliente realmente custa', 'Confundir faturamento alto com lucro alto',
    'Manter cliente deficitário só por medo de perder faturamento', 'Não reajustar preço de cliente antigo há anos',
    'Ignorar inadimplência recorrente achando que "sempre paga depois"', 'Olhar só o extrato bancário, não a margem por cliente',
    'Fazer essa auditoria só uma vez, e nunca mais repetir', 'Auditar o negócio do cliente com mais rigor do que o próprio',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Erros comuns nessa auditoria</Titulo>
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
      <Titulo sub="Cada passo dessa auditoria já tem uma tela correspondente no Fluxe.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Equipe (Cap)', 'Custo/hora da equipe e capacidade disponível.', INDIGO],
        ['Rentabilidade', 'Margem de contribuição por cliente, já calculada.', AMBER],
        ['Precificação', 'Preço mínimo viável por escopo, pra comparar com o que cobra hoje.', GREEN],
        ['Clientes', 'Situação de pagamento e histórico de cada cliente.', '#EC4899'],
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
      <Titulo sub="O passo a passo com exercícios pra preencher está na Biblioteca, junto com esta apresentação.">Atividade prática: sua própria auditoria</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Baixe o "Passo a Passo: Auditoria do seu BPO Financeiro" na Biblioteca e preencha com os
          dados reais do seu negócio: seus 5 maiores clientes, a margem de cada um, sua inadimplência
          total e seu ponto de equilíbrio. Traga pronto pra mentoria.
        </div>
      </div>
      <Destaque>Números do seu próprio negócio, não de exemplo.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Você não gerencia o que não audita, nem no cliente, nem no próprio negócio.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Dados', 'Custo', 'Margem', 'Inadimplência', 'Preço', 'Ponto de equilíbrio'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        Repita essa auditoria a cada trimestre, o seu BPO muda, sua carteira de clientes muda junto.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideEtapas },
  { render: SlideDados }, { render: SlideCusto }, { render: SlideMargem }, { render: SlideInadimplencia },
  { render: SlidePrecificacao }, { render: SlidePontoEquilibrio },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoAuditoriaBPOPage() {
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
