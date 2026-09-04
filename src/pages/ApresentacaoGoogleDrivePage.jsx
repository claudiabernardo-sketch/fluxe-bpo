import { Passos, Callout, Eyebrow, Codigo, ApresentacaoShell } from '../components/modules/apresentacoes/ApresentacaoUI'

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ANÁLISES ESTRATÉGICAS COM IA</Eyebrow>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Claude e a organização do Google Drive</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>O que a IA realmente faz na sua pasta, e o que não faz</div>
      <Callout label="O que a turma sai sabendo fazer">
        Usar o conector de Google Drive da Claude do jeito certo, sem esperar dele o que ele não entrega.
      </Callout>
    </div>
  )
}

function SlideConectar() {
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18 }}>Como conectar</h2>
      <div style={{ fontSize: 15, color: '#CBD5E1' }}>Configurações → Conectores → Google Drive → Conectar. Faça login com sua conta Google e aprove as permissões. A Claude enxerga só o que a sua própria conta já acessa.</div>
    </div>
  )
}

function SlideFaz() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 20, textAlign: 'center' }}>O que o conector oficial faz</h2>
      <Passos cols={1} itens={['Encontrar arquivos por nome ou conteúdo', 'Ler, resumir e analisar o conteúdo', 'Cruzar informação entre vários arquivos', 'Usar arquivos como contexto de resposta', 'Salvar um arquivo NOVO numa pasta escolhida']} />
    </div>
  )
}

function SlideNaoFaz() {
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20 }}>O que o conector oficial NÃO faz</h2>
      <Callout label="⚠ Importante, pra não prometer o que não existe" labelColor="#FCA5A5" bg="rgba(220,38,38,.14)" border="rgba(220,38,38,.4)">
        O conector padrão não edita, não move, não renomeia e não reorganiza arquivos que já existem. Ele lê e cria novo, não mexe no que já está lá.
      </Callout>
    </div>
  )
}

function SlideNaPratica() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>O que dá pra fazer hoje, na prática</h2>
      <Codigo>{`Analise os arquivos dessa pasta do Drive e me diga:
1. Quais parecem duplicados (mesmo conteúdo, nomes diferentes);
2. Quais estão fora do padrão de nomenclatura que uso
   (Cliente_Competencia_TipoDocumento);
3. Uma lista "nome atual -> nome sugerido", pra eu revisar
   e aplicar manualmente.`}</Codigo>
    </div>
  )
}

function SlideAvancado() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18 }}>Se precisar de automação completa</h2>
      <div style={{ fontSize: 15, color: '#CBD5E1' }}>Renomear/mover/apagar em massa automaticamente exige Claude Code com um conector de Drive configurado com permissão de escrita, fora do padrão do chat. É passo avançado, não recomendado como primeiro passo.</div>
    </div>
  )
}

function SlideEstrutura() {
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18 }}>Estrutura de pastas recomendada</h2>
      <Callout label="Sugestão de padrão">Cliente / Ano / Mês / Tipo de documento (ex: "Empresa ABC / 2026 / 08-Agosto / DRE"). Nome de arquivo: Cliente_Competencia_TipoDocumento.</Callout>
    </div>
  )
}

function SlideChecklist() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Checklist</h2>
      <Passos cols={1} itens={['Sei que o conector lê e cria, mas não edita nem move o que já existe', 'Uso a Claude pra gerar a lista de duplicados, e reviso antes de agir', 'Tenho um padrão de pasta e nomenclatura definido', 'Só considero automação completa depois de dominar o básico']} />
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideConectar }, { render: SlideFaz }, { render: SlideNaoFaz },
  { render: SlideNaPratica }, { render: SlideAvancado }, { render: SlideEstrutura }, { render: SlideChecklist },
]

export default function ApresentacaoGoogleDrivePage() {
  return <ApresentacaoShell slides={SLIDES} />
}
