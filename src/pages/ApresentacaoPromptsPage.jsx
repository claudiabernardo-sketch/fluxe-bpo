import { Passos, Callout, Eyebrow, Codigo, ApresentacaoShell } from '../components/modules/apresentacoes/ApresentacaoUI'

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ANÁLISES ESTRATÉGICAS COM IA</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Prompts prontos pra análise financeira</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>Pare de reescrever o pedido do zero toda vez</div>
      <Callout label="O que a turma sai sabendo fazer">
        Usar prompts testados pra DRE, fluxo de caixa, conciliação e cobrança, e entender por que um pedido genérico raramente entrega uma análise confiável.
      </Callout>
    </div>
  )
}

function SlideAnatomia() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Anatomia de um bom prompt financeiro</h2>
      <Passos cols={1} itens={['Papel: quem a Claude deve "ser" nessa análise', 'Contexto: cliente, período, o que já foi conferido', 'Dado: qual arquivo, qual aba, o que significa cada coluna', 'Regra: o que não pode fazer (inventar causa, % com base zero)', 'Formato: como a resposta deve chegar, com fonte de cada número']} />
    </div>
  )
}

function SlidePromptDRE() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Prompt pronto: Análise de DRE</h2>
      <Codigo>{`Você é um analista de Controladoria de um BPO Financeiro.
Aqui está o DRE de [cliente], competência [mês/ano], comparado
com [mês anterior / mesmo mês ano passado / orçamento].
1. Confira se os totais batem antes de calcular variação.
2. Separe variação de receita, custo e despesa.
3. Para cada variação relevante, aponte o direcionador provável
   e diga se é fato, cálculo ou hipótese.
Não invente causa se não houver dado que sustente.`}</Codigo>
    </div>
  )
}

function SlidePromptCaixa() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Prompt pronto: Fluxo de caixa</h2>
      <Codigo>{`Aqui está o fluxo de caixa realizado e projetado de [cliente]
pros próximos [30/60/90] dias. Aponte:
1. Datas em que o saldo projetado fica negativo, se houver;
2. Concentração de recebíveis em poucos clientes/dias;
3. Contas a pagar sem contrapartida de recebimento visível.
Se algum dado estiver incompleto, diga isso antes de concluir.`}</Codigo>
    </div>
  )
}

function SlidePromptConciliacao() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Prompt pronto: Conciliação bancária</h2>
      <Codigo>{`Compare o extrato bancário de [conta/período] com os
lançamentos do sistema. Liste:
1. Lançamentos no banco sem correspondência no sistema;
2. Lançamentos no sistema sem correspondência no banco;
3. Diferenças de valor no mesmo lançamento.
Não reclassifique nada sozinho, só aponte a divergência.`}</Codigo>
    </div>
  )
}

function SlidePromptCobranca() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Prompt pronto: Cobrança e inadimplência</h2>
      <Codigo>{`Classifique as contas a receber por faixa de atraso
(a vencer, 1-15, 16-30, 31-60, 60+ dias). Aponte:
1. Concentração de inadimplência por cliente;
2. Casos que já passaram por régua de cobrança sem retorno.
Sugira ordem de priorização por valor e risco, mas não sugira
ação jurídica sem eu pedir.`}</Codigo>
    </div>
  )
}

function SlideAntesDepois() {
  const linhas = [
    ['"Olha esse DRE aí"', 'Papel + período + regra + formato de saída'],
    ['"Por que caiu o lucro?"', 'Separa variação de receita/custo/despesa antes de concluir'],
    ['"Concilia isso"', 'Define divergência e proíbe reclassificar sozinho'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Antes x depois, mesmo pedido</h2>
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}>
        {linhas.map(([a, b], i) => (
          <div key={a} style={{ display: 'flex', padding: '12px 18px', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.04)', gap: 16 }}>
            <div style={{ flex: 1, color: '#FCA5A5', fontSize: 13 }}>{a}</div>
            <div style={{ flex: 1.4, color: '#86EFAC', fontSize: 13 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideErros() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Erros que fazem o prompt falhar</h2>
      <Passos cols={2} itens={['Não dizer o período de referência', 'Pedir conclusão com base incompleta sem avisar', 'Não sinalizar dado faltante', 'Pedir % sem checar se o denominador é zero']} />
    </div>
  )
}

function SlideOnde() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Onde guardar seus prompts</h2>
      <Callout label="Regra prática">Prompt que você usa toda semana não devia viver num bloco de notas solto. Regra fixa do seu método vira parte de uma Skill. O que muda por cliente vive no Project daquele cliente.</Callout>
    </div>
  )
}

function SlideChecklist() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Checklist de um bom prompt</h2>
      <Passos cols={1} itens={['Definiu o papel da Claude nessa análise', 'Informou período e o que já foi conferido', 'Proibiu inventar causa/dado', 'Pediu a fonte de cada número', 'Definiu o formato de saída']} />
    </div>
  )
}

function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>PROVOCAÇÃO FINAL</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 22 }}>
        Um prompt vago é uma licença pra IA inventar. Um prompt bem feito é uma régua de qualidade.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAnatomia }, { render: SlidePromptDRE }, { render: SlidePromptCaixa },
  { render: SlidePromptConciliacao }, { render: SlidePromptCobranca }, { render: SlideAntesDepois }, { render: SlideErros },
  { render: SlideOnde }, { render: SlideChecklist }, { render: SlideEncerramento },
]

export default function ApresentacaoPromptsPage() {
  return <ApresentacaoShell slides={SLIDES} />
}
