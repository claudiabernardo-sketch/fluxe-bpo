import { useState, useEffect } from 'react'
import { usePlanoNegocio, useSalvarPlanoNegocio } from '../hooks/useData'
import { Card, CardHeader, Btn, Loader } from '../components/ui'

const ETAPAS = [
  {
    key: 'cliente_ideal',
    numero: 1,
    titulo: 'Cliente Ideal',
    pergunta: 'Para quem eu vendo? Quem eu quero atender?',
    texto: 'Antes de tudo, defina para quem você existe. Cliente ideal não é "qualquer empresa": é quem sente a dor, tem dinheiro pra pagar e você consegue atender bem.',
    exemplo: 'Clínicas, agências e escritórios faturando R$ 30k a R$ 200k/mês, sem financeiro estruturado, onde o próprio dono ainda faz tudo na correria.',
  },
  {
    key: 'dor',
    numero: 2,
    titulo: 'Dor / Problema',
    pergunta: 'Que caos eu resolvo?',
    texto: 'O cliente não compra o serviço — compra a saída do problema. Nomeie o caos com as palavras dele. Quanto mais específica a dor, mais fácil vender.',
    exemplo: 'Contas pagas em atraso, fluxo de caixa no escuro, dono sem saber se dá lucro, nota fiscal esquecida e conciliação bancária que ninguém faz.',
  },
  {
    key: 'entregaveis',
    numero: 3,
    titulo: 'Entregáveis',
    pergunta: 'O que eu entrego de verdade?',
    texto: 'Transforme a promessa em coisas concretas e recorrentes — o que chega na mão do cliente todo mês. É isso que ele percebe como valor.',
    exemplo: 'Contas a pagar e receber organizadas, fluxo de caixa atualizado, relatório mensal (DRE simples), conciliação bancária e alertas de vencimento.',
  },
  {
    key: 'processo',
    numero: 4,
    titulo: 'Processo / Rotina',
    pergunta: 'Como eu entrego sem enlouquecer?',
    texto: 'O que faz o BPO escalar não é esforço — é rotina padronizada. Com processo, você atende mais clientes sem virar refém da operação.',
    exemplo: 'Onboarding em 7 dias, checklist diário, lançamentos até o dia 5, fechamento até o dia 10 e reunião mensal — tudo dentro de um ERP padrão.',
  },
  {
    key: 'custo_existir',
    numero: 5,
    titulo: 'Custo de Existir',
    pergunta: 'Quanto custa operar esse BPO?',
    texto: 'Todo negócio tem um custo mínimo pra existir mesmo parado. Some tudo antes de precificar — senão você trabalha e não sobra nada.',
    exemplo: 'ERP e ferramentas, pró-labore, assistente, contador e impostos. No começo, um custo fixo de R$ 6k a R$ 12k por mês.',
  },
  {
    key: 'meta_faturamento',
    numero: 6,
    titulo: 'Meta de Faturamento',
    pergunta: 'Quanto preciso faturar pra valer a pena?',
    texto: 'Junte custo + lucro desejado e traduza em número de clientes. É isso que vira meta real — e não um chute otimista.',
    exemplo: 'Ticket de R$ 1.500/cliente. Custo R$ 10k + lucro R$ 10k = R$ 20k, cerca de 14 clientes. Meta clara e alcançável.',
  },
]

export default function PlanoNegocioPage() {
  const { data: plano, isLoading, isError } = usePlanoNegocio()
  const salvar = useSalvarPlanoNegocio()
  const [passo, setPasso] = useState(0)
  const [form, setForm] = useState({})
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    if (plano) {
      const f = {}
      ETAPAS.forEach(e => {
        f[e.key] = plano[e.key] || ''
        f[`${e.key}_dificuldade`] = !!plano[`${e.key}_dificuldade`]
        f[`${e.key}_obs`] = plano[`${e.key}_obs`] || ''
      })
      setForm(f)
    }
  }, [plano])

  if (isLoading) return <Loader />

  if (isError) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>🚧</div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Essa área ainda não foi ativada</div>
        <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Fale com o suporte para liberar o Plano de Negócios.</div>
      </div>
    )
  }

  const etapa = ETAPAS[passo]
  const dificuldade = !!form[`${etapa.key}_dificuldade`]

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function salvarTudo(irPara) {
    await salvar.mutateAsync(form)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
    if (irPara != null) setPasso(irPara)
  }

  const ti = { padding: '10px 12px', border: '1px solid var(--bo)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 16 }}>
        Plano de Negócios em 6 Etapas — pensado pra você organizar as ideias do seu BPO. Marque onde estiver travando: isso ajuda quem te acompanha a te dar a ajuda certa.
      </div>

      {/* Trilha de passos */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {ETAPAS.map((e, i) => {
          const preenchida = !!form[e.key]?.trim?.()
          const dif = !!form[`${e.key}_dificuldade`]
          return (
            <button
              key={e.key}
              onClick={() => setPasso(i)}
              style={{
                flex: '1 1 auto', minWidth: 90, padding: '8px 6px', borderRadius: 8, cursor: 'pointer',
                border: i === passo ? '2px solid #6366F1' : '1px solid var(--bo)',
                background: i === passo ? 'rgba(99,102,241,.08)' : 'var(--s2, transparent)',
                fontSize: 11, textAlign: 'center', fontWeight: i === passo ? 700 : 500,
                color: 'var(--tx)',
              }}
            >
              <div>{e.numero}. {e.titulo}</div>
              <div style={{ marginTop: 3 }}>
                {dif ? '🤔' : preenchida ? '✅' : '—'}
              </div>
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader
          title={`Etapa ${etapa.numero} de 6 — ${etapa.titulo}`}
          icon="fa-solid fa-flag"
        />
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{etapa.pergunta}</div>
          <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 14, lineHeight: 1.5 }}>{etapa.texto}</div>

          <div style={{ background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', marginBottom: 4 }}>💡 NO MODELO BPO</div>
            <div style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.5 }}>{etapa.exemplo}</div>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>A sua resposta:</label>
          <textarea
            style={{ ...ti, minHeight: 100, resize: 'vertical', marginBottom: 14 }}
            placeholder="Escreva aqui como isso funciona (ou vai funcionar) no seu BPO..."
            value={form[etapa.key] || ''}
            onChange={e => set(etapa.key, e.target.value)}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: dificuldade ? 8 : 0 }}>
            <input
              type="checkbox"
              checked={dificuldade}
              onChange={e => set(`${etapa.key}_dificuldade`, e.target.checked)}
            />
            🤔 Estou com dificuldade nessa etapa
          </label>

          {dificuldade && (
            <textarea
              style={{ ...ti, minHeight: 60, resize: 'vertical' }}
              placeholder="Conta o que está travando aqui — isso fica visível pra quem te acompanha."
              value={form[`${etapa.key}_obs`] || ''}
              onChange={e => set(`${etapa.key}_obs`, e.target.value)}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="outline" disabled={passo === 0} onClick={() => salvarTudo(Math.max(0, passo - 1))}>
              ← Etapa anterior
            </Btn>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {savedMsg && <span style={{ fontSize: 12, color: 'var(--grt, #22C55E)' }}>Salvo!</span>}
              <Btn variant="primary" disabled={salvar.isPending} onClick={() => salvarTudo(passo < ETAPAS.length - 1 ? passo + 1 : null)}>
                {salvar.isPending ? 'Salvando...' : passo < ETAPAS.length - 1 ? 'Salvar e avançar →' : 'Salvar'}
              </Btn>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
