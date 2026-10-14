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
function Conta({ linhas }) {
  // linhas: [rótulo, valor, tipo] — tipo 'sub' (subtotal), 'res' (resultado) ou vazio
  return (
    <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '12px 18px' }}>
      {linhas.map(([rot, val, tipo]) => (
        <div key={rot} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '5px 0', borderTop: tipo ? '1px solid rgba(255,255,255,.15)' : 'none', fontSize: 13.5, fontWeight: tipo ? 800 : 500, color: tipo === 'res' ? '#86EFAC' : tipo === 'sub' ? '#fff' : '#CBD5E1' }}>
          <span>{rot}</span><span style={{ whiteSpace: 'nowrap' }}>{val}</span>
        </div>
      ))}
    </div>
  )
}
function SlideCustoDireto() {
  const tipos = [
    ['COMÉRCIO', 'CMV', 'Custo da Mercadoria Vendida', 'Compra pronto e revende. O custo é o que a mercadoria vendida custou.', '#A5B4FC'],
    ['INDÚSTRIA', 'CPV', 'Custo do Produto Vendido', 'Transforma. Matéria-prima + mão de obra da produção + custos da fábrica.', '#FCD34D'],
    ['SERVIÇOS', 'CSP', 'Custo do Serviço Prestado', 'Vende tempo e conhecimento. Equipe que executa, terceiros, insumos do serviço.', '#86EFAC'],
    ['TRANSPORTADORA', 'CSP', 'Não tem CMV!', 'Não vende mercadoria, vende o frete. Combustível, pedágio, motorista, manutenção.', '#FCA5A5'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo sub="Na DRE, logo abaixo da receita, vem o custo direto. Mas ele muda de nome e de conteúdo conforme o negócio.">Cada negócio tem um custo direto diferente</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {tipos.map(([seg, sigla, nome, txt, cor]) => (
          <div key={seg} style={{ background: 'rgba(255,255,255,.07)', borderTop: `3px solid ${cor}`, borderRadius: 10, padding: '14px 14px' }}>
            <div style={{ color: '#94A3B8', fontWeight: 800, fontSize: 11, letterSpacing: 1 }}>{seg}</div>
            <div style={{ color: cor, fontWeight: 800, fontSize: 26, marginTop: 4 }}>{sigla}</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>{nome}</div>
            <div style={{ color: '#CBD5E1', fontSize: 12.5, lineHeight: 1.5 }}>{txt}</div>
          </div>
        ))}
      </div>
      <Destaque>Receita − custo direto = lucro bruto. Errou o custo direto, errou a margem inteira.</Destaque>
    </div>
  )
}
function SlideCMV() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Exemplo: loja de calçados. Compra não é custo, compra vira estoque. Custo é o que saiu vendido.">CMV na prática</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>A CONTA DO CMV</div>
          <Conta linhas={[
            ['Estoque no início do mês', 'R$ 40.000'],
            ['(+) Compras do mês', 'R$ 60.000'],
            ['(−) Estoque no fim do mês', 'R$ 35.000'],
            ['(=) CMV', 'R$ 65.000', 'sub'],
          ]} />
        </div>
        <div>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>NA DRE</div>
          <Conta linhas={[
            ['Receita líquida', 'R$ 110.000'],
            ['(−) CMV', 'R$ 65.000'],
            ['(=) Lucro bruto', 'R$ 45.000', 'res'],
            ['Margem bruta', '41%', 'sub'],
          ]} />
        </div>
      </div>
      <div style={{ marginTop: 14, background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 10, padding: '10px 14px', color: '#FECACA', fontSize: 13 }}>
        <strong>Erro clássico:</strong> lançar as compras (R$ 60.000) como custo. A DRE mostraria lucro bruto de R$ 50.000 e esconderia que o estoque caiu R$ 5.000. Sem contagem de estoque, não existe CMV confiável.
      </div>
    </div>
  )
}
function SlideTransportadora() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Ela não compra pra revender, então não existe mercadoria vendida. O custo direto é o custo de rodar.">Transportadora: por que não tem CMV</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <Conta linhas={[
          ['Receita de fretes', 'R$ 150.000'],
          ['(−) Combustível', 'R$ 45.000'],
          ['(−) Pedágios', 'R$ 9.000'],
          ['(−) Motoristas e ajudantes', 'R$ 30.000'],
          ['(−) Manutenção e pneus', 'R$ 12.000'],
          ['(=) CSP', 'R$ 96.000', 'sub'],
          ['(=) Lucro bruto', 'R$ 54.000 (36%)', 'res'],
        ]} />
        <div>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O NÚMERO QUE MANDA: CUSTO POR KM</div>
          <Conta linhas={[
            ['Km rodados no mês', '60.000 km'],
            ['Custo direto por km', 'R$ 1,60'],
            ['Receita por km', 'R$ 2,50', 'sub'],
          ]} />
          <div style={{ color: '#CBD5E1', fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
            Depreciação dos caminhões não entra no CSP do EBITDA: fica abaixo dele. Mas entra na conversa sobre renovar a frota.
          </div>
        </div>
      </div>
    </div>
  )
}
function SlidePorSetor() {
  const itens = [
    ['Comércio', 'Margem bruta e giro de estoque', '"Seu estoque leva 90 dias pra virar dinheiro."'],
    ['Indústria', 'Custo unitário e % de matéria-prima', '"Cada pote custa R$ 3,30 pra produzir. Se a farinha subir 10%, sobe pra R$ 3,49."'],
    ['Serviços', 'Margem por cliente e horas faturáveis', '"O cliente X consome 30% das horas e paga 12% da receita."'],
    ['Transportadora', 'Custo por km e ocupação da frota', '"Caminhão que volta vazio gasta quase o mesmo diesel e não traz receita nenhuma."'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo sub="Um indicador-chave por setor, e a frase que você leva pra reunião.">O número que cada dono precisa ver</Titulo>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {itens.map(([seg, ind, frase]) => (
          <div key={seg} style={{ display: 'grid', gridTemplateColumns: '150px 240px 1fr', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '11px 16px' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{seg}</div>
            <div style={{ color: '#A5B4FC', fontWeight: 700, fontSize: 13 }}>{ind}</div>
            <div style={{ color: '#E2E8F0', fontSize: 13, fontStyle: 'italic' }}>{frase}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
function SlideExercicios() {
  const casos = [
    ['1. Comércio', 'Loja de roupas', 'Calcule o CMV, o lucro bruto, a margem bruta e o EBITDA. Depois responda: se as compras fossem lançadas como custo, quanto o lucro bruto ficaria errado?', '#A5B4FC'],
    ['2. Indústria', 'Fábrica de doces', 'Calcule o custo de produção, o custo por unidade, o CPV do que foi vendido e quanto ficou parado em estoque.', '#FCD34D'],
    ['3. Serviços', 'Agência de marketing', 'Monte a DRE até o EBITDA e calcule o custo e a receita por hora faturável.', '#86EFAC'],
    ['4. Transportadora', 'Frota de 8 caminhões', 'Monte a DRE sem CMV, calcule o custo por km e o frete mínimo por km pra não ter prejuízo.', '#FCA5A5'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo sub="Os números estão no material de apoio. Em duplas, 10 minutos por caso.">Exercícios práticos</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {casos.map(([n, emp, txt, cor]) => (
          <div key={n} style={{ background: 'rgba(255,255,255,.07)', borderLeft: `3px solid ${cor}`, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ color: cor, fontWeight: 800, fontSize: 13 }}>{n} · <span style={{ color: '#fff' }}>{emp}</span></div>
            <div style={{ color: '#E2E8F0', fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>{txt}</div>
          </div>
        ))}
      </div>
      <Destaque>Em cada caso, feche com uma frase pro dono: o que o número significa e o que ele deveria fazer.</Destaque>
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
      <Titulo sub="A pergunta que essa aula existe pra responder.">Pra próxima aula: o Relatório 360</Titulo>
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
  { render: SlideDRE }, { render: SlideCustoDireto }, { render: SlideCMV }, { render: SlideTransportadora },
  { render: SlideIndicadores }, { render: SlidePorSetor }, { render: SlideApresentar },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideExercicios }, { render: SlideAtividade }, { render: SlideEncerramento },
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
