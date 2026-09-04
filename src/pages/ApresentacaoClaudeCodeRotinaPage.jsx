import { Passos, Callout, Eyebrow, Codigo, ApresentacaoShell } from '../components/modules/apresentacoes/ApresentacaoUI'

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO · ANÁLISES ESTRATÉGICAS COM IA</Eyebrow>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Claude Code pra automatizar a rotina do BPO</div>
      <div style={{ fontSize: 19, color: '#C7D2FE', marginBottom: 28 }}>Além da integração com sistemas, outros usos práticos</div>
      <Callout label="O que a turma sai sabendo fazer">
        Reconhecer outros usos do Claude Code no dia a dia de um BPO Financeiro, sempre com a mesma régua de segurança já vista na integração com API.
      </Callout>
    </div>
  )
}

function SlideRecap() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>RECAP RÁPIDO</Eyebrow>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
        Já vimos como conectar a API da Conta Azul com segurança, e como empacotar sua metodologia numa Skill. Este material mostra outros usos práticos.
      </div>
    </div>
  )
}

function SlidePlanilhas() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Caso: gerar planilhas em lote</h2>
      <Codigo>{`Tenho uma pasta com exports de extrato bancário de vários
clientes, cada um em um formato ligeiramente diferente.
Crie um script que:
1. Leia todos os arquivos da pasta;
2. Normalize pra um formato único (data, descrição, valor, tipo);
3. Gere uma planilha consolidada, uma aba por cliente;
4. Aponte quais arquivos não conseguiu processar, sem travar
   os outros.`}</Codigo>
    </div>
  )
}

function SlideConciliacao() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Caso: conciliação automatizada</h2>
      <Codigo>{`Crie um script que compare o extrato bancário (CSV) com os
lançamentos do sistema (CSV), e gere um relatório apontando
lançamentos só no banco, só no sistema, e diferenças de valor.
Não altere nenhum dos arquivos de origem, só gere o relatório.`}</Codigo>
    </div>
  )
}

function SlideRelatorio() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 16, textAlign: 'center' }}>Caso: relatório mensal automático</h2>
      <Codigo>{`Todo dia [X] do mês, gerar um relatório em PDF pra cada
cliente ativo, com DRE resumido, variação vs mês anterior e os
3 pontos de atenção mais relevantes. Primeiro monte o script,
teste com 1 cliente, só depois rode pra todos.`}</Codigo>
    </div>
  )
}

function SlideSeguranca() {
  return (
    <div style={{ width: '100%', maxWidth: 780, textAlign: 'center' }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Regra de segurança, sempre</h2>
      <Callout label="Mesma régua da integração com API" labelColor="#FCA5A5" bg="rgba(220,38,38,.14)" border="rgba(220,38,38,.4)">
        Comece só de leitura. Automação que só lê e gera relatório é segura. Automação que edita, envia ou apaga algo sozinha precisa de revisão humana antes de rodar de verdade.
      </Callout>
    </div>
  )
}

function SlideOnde() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18 }}>Onde isso roda</h2>
      <div style={{ fontSize: 15, color: '#CBD5E1' }}>Claude Code roda no seu computador, não expõe dado do cliente a um serviço externo além do necessário. Nunca coloque CPF, CNPJ ou dado sensível direto no prompt sem necessidade, prefira sempre trabalhar com os arquivos.</div>
    </div>
  )
}

function SlideChecklist() {
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <h2 style={{ fontSize: 27, fontWeight: 800, color: '#fff', marginBottom: 18, textAlign: 'center' }}>Checklist antes de automatizar de verdade</h2>
      <Passos cols={1} itens={['Testou com 1 cliente antes de rodar em lote', 'Automação começa só de leitura', 'Humano revisa a primeira geração de cada relatório novo', 'Nenhum dado sensível desnecessário exposto no prompt/logs']} />
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideRecap }, { render: SlidePlanilhas }, { render: SlideConciliacao },
  { render: SlideRelatorio }, { render: SlideSeguranca }, { render: SlideOnde }, { render: SlideChecklist },
]

export default function ApresentacaoClaudeCodeRotinaPage() {
  return <ApresentacaoShell slides={SLIDES} />
}
