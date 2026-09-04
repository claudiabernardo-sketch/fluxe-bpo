import { Passos, Callout, Eyebrow, ApresentacaoShell } from '../components/modules/apresentacoes/ApresentacaoUI'

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ANÁLISES ESTRATÉGICAS COM IA</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Erros comuns usando IA no financeiro</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>Os deslizes que custam credibilidade</div>
      <Callout label="O que a turma sai sabendo fazer">
        Reconhecer os erros mais caros ao usar IA em análise financeira, e sair com uma rotina de revisão antes de qualquer entrega ao cliente.
      </Callout>
    </div>
  )
}

function SlideErro({ n, titulo, texto, protecao }) {
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>Erro {n}</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>{titulo}</h2>
      <div style={{ fontSize: 15, color: '#CBD5E1', marginBottom: 16, textAlign: 'center' }}>{texto}</div>
      {protecao && <Callout label="Como se proteger">{protecao}</Callout>}
    </div>
  )
}

function Slide1() {
  return <SlideErro n="1" titulo="Confiar em número sem conferir a fonte"
    texto="A Claude pode errar, somar coluna errada, ler valor trocado. Todo número que vai pro cliente precisa ser conferível até a linha de origem."
    protecao='Peça sempre: "pra cada número, diga de qual linha/aba ele veio". Sem fonte apontada, o número não está pronto pra sair.' />
}
function Slide2() {
  return <SlideErro n="2" titulo="Misturar dados de clientes diferentes"
    texto='Numa conversa genérica "financeiro geral", é fácil colar dado de um cliente com o contexto de outro ainda ativo.'
    protecao="Tenha um Project por cliente (veja o material de Projects e Artifacts)." />
}
function Slide3() {
  return <SlideErro n="3" titulo="Deixar a IA decidir classificação contábil sozinha"
    texto="Uma transação ambígua não deve ser classificada automaticamente."
    protecao='Instrução fixa: "nunca reclassifique uma transação ambígua sozinho, sempre apresente a dúvida pra eu decidir".' />
}
function Slide4() {
  return <SlideErro n="4" titulo="Não separar competência e caixa"
    texto="Resultado (competência) e caixa (movimentação) são coisas diferentes. Lucro no DRE não significa caixa sobrando, e vice-versa." />
}
function Slide5() {
  return <SlideErro n="5" titulo="Usar % com denominador zero ou enganoso"
    texto='"Cresceu 400%" pode ser assustador ou irrelevante, depende da base.'
    protecao="Nunca aceite variação percentual sozinha quando a base for pequena, zero, ou distorcer a leitura real. Peça sempre o valor absoluto junto." />
}
function Slide6() {
  return <SlideErro n="6" titulo="Achar que resposta bonita é resposta certa"
    texto="Formatação com tabela e tom confiante passa segurança, mas não é validação. O único jeito de confiar é conferir contra a fonte, sempre." />
}

function SlideCategorias() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>Como se proteger, na prática</h2>
      <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20 }}>Separe cada afirmação da IA nessas categorias antes de repassar ao cliente</div>
      <Passos cols={5} itens={['Fato', 'Cálculo', 'Hipótese', 'Recomendação', 'Pendência']} />
      <div style={{ marginTop: 18 }}>
        <Callout label="Sinal de alerta">Uma resposta que mistura essas categorias sem avisar qual é qual é uma resposta de risco.</Callout>
      </div>
    </div>
  )
}

function SlideChecklist() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Checklist de revisão antes de enviar</h2>
      <Passos cols={1} itens={['Todo número crítico tem fonte conferida', 'Nenhum dado de outro cliente misturado', 'Nenhuma classificação ambígua decidida sem sua validação', 'Variação % vem com o valor absoluto junto', 'Fato, cálculo, hipótese e recomendação estão distintos']} />
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: Slide1 }, { render: Slide2 }, { render: Slide3 },
  { render: Slide4 }, { render: Slide5 }, { render: Slide6 }, { render: SlideCategorias }, { render: SlideChecklist },
]

export default function ApresentacaoErrosIAPage() {
  return <ApresentacaoShell slides={SLIDES} />
}
