import { Passos, Callout, Eyebrow, Codigo, ApresentacaoShell } from '../components/modules/apresentacoes/ApresentacaoUI'

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ANÁLISES ESTRATÉGICAS COM IA</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Projects e Artifacts na prática</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>Contexto que persiste, e documentos que nascem prontos pra usar</div>
      <Callout label="O que a turma sai sabendo fazer">
        Organizar um Project por cliente sem misturar dados, e usar Artifacts pra gerar relatório e planilha direto, editável, ao lado da conversa.
      </Callout>
    </div>
  )
}

function SlideProject() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>O CONCEITO</Eyebrow>
      <div style={{ fontSize: 27, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>
        Um Project é uma pasta de contexto que persiste entre conversas.
      </div>
      <div style={{ fontSize: 15, color: '#CBD5E1' }}>Arquivo que você sobe ali, instrução que você define ali, fica disponível em qualquer conversa nova dentro daquele Project, sem reanexar ou reexplicar.</div>
    </div>
  )
}

function SlidePorqueUm() {
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18 }}>Por que 1 Project por cliente</h2>
      <div style={{ fontSize: 15, color: '#CBD5E1', marginBottom: 20 }}>Sem isso, é fácil um dado de um cliente vazar pro raciocínio de outro numa conversa genérica "financeiro geral".</div>
      <Callout label="Regra prática">Nome do Project = nome do cliente. Nunca "Financeiro Geral" pra mais de um cliente ao mesmo tempo.</Callout>
    </div>
  )
}

function SlideOQueColocar() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>O que colocar dentro de um Project</h2>
      <Passos cols={2} itens={['Plano de contas e categorias do cliente', 'Regime tributário e particularidades já validadas', 'Últimos DREs/balancetes pra histórico', 'A Skill do seu método, se já tiver']} />
    </div>
  )
}

function SlideArtifact() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>O CONCEITO</Eyebrow>
      <div style={{ fontSize: 27, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>
        Um Artifact é um documento que fica editável ao lado da conversa.
      </div>
      <div style={{ fontSize: 15, color: '#CBD5E1' }}>Não é texto perdido no meio do chat. Você pede ajuste específico nele sem reescrever tudo.</div>
    </div>
  )
}

function SlideArtifactsUteis() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Artifacts úteis pro financeiro</h2>
      <Passos cols={1} itens={['Relatório executivo pronto pra enviar ao cliente', 'Planilha de apoio (memória de cálculo)', 'Dashboard simples pra visualizar indicadores']} />
    </div>
  )
}

function SlideFluxo() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Fluxo prático, dentro do Project do cliente</h2>
      <Codigo>{`1. Suba o DRE do mês.
2. Peça a análise (prompt de DRE do material de Prompts).
3. Peça: "monte isso como um relatório executivo, em Artifact,
   pronto pra eu enviar ao cliente".
4. Ajuste o Artifact direto, sem regenerar tudo do zero.`}</Codigo>
    </div>
  )
}

function SlideCuidado() {
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Cuidado: Artifact não é a fonte</h2>
      <Callout label="⚠ Atenção" labelColor="#FCD34D" bg="rgba(217,119,6,.15)" border="rgba(217,119,6,.4)">
        Um Artifact é derivado dos dados que você deu. Se a base mudar, o Artifact antigo não se atualiza sozinho. Sempre confira a data/versão antes de reenviar um Artifact antigo.
      </Callout>
    </div>
  )
}

function SlideOrganizacao() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Organização recomendada</h2>
      <Passos cols={1} itens={['Nome do Project = nome do cliente, padronizado', 'Arquive (não delete) Project de cliente encerrado', 'Revise de tempos em tempos se os arquivos-base seguem atuais']} />
    </div>
  )
}

function SlideChecklist() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Checklist</h2>
      <Passos cols={1} itens={['Cada cliente ativo tem seu próprio Project', 'Regras fixas do cliente estão no Project, não repetidas em cada prompt', 'Relatório pro cliente sai como Artifact', 'Você confere a data da base antes de reenviar um Artifact antigo']} />
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideProject }, { render: SlidePorqueUm }, { render: SlideOQueColocar },
  { render: SlideArtifact }, { render: SlideArtifactsUteis }, { render: SlideFluxo }, { render: SlideCuidado },
  { render: SlideOrganizacao }, { render: SlideChecklist },
]

export default function ApresentacaoProjectsPage() {
  return <ApresentacaoShell slides={SLIDES} />
}
