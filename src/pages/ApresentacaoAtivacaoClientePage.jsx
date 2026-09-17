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

function ScriptQuote({ children, label = 'MODELO DE MENSAGEM' }) {
  return (
    <div style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 14, padding: '20px 26px' }}>
      <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 16, fontStyle: 'italic', lineHeight: 1.6 }}>{children}</div>
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
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 5</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Ativação: preparando o cliente para a operação</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>Configuração das ferramentas, cadastros, bancos, plano de contas e validação, antes do primeiro dia de rotina</div>
    </div>
  )
}

// ── 02 · Abertura ──────────────────────────────────────────────────────
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "Já recebi tudo do cliente. Posso começar a rotina?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Ainda não. Ter a informação em mãos não é o mesmo que ter o ambiente pronto pra operar.
        Hoje você vai aprender o que fazer entre "recebi os dados do onboarding" e "posso executar a primeira rotina com segurança".
      </div>
    </div>
  )
}

// ── 03 · Onboarding x Ativação ──────────────────────────────────────────
function SlideDiferenca() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="São etapas diferentes, com objetivos diferentes. Confundir as duas é uma das causas mais comuns de começar errado.">Onboarding não é ativação</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>ONBOARDING</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Coletar e organizar. Reunião, acessos, documentos, informações.</div>
        </div>
        <div style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>ATIVAÇÃO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Colocar o cliente em condição de operar. Configurar, cadastrar, parametrizar, validar.</div>
        </div>
      </div>
      <Destaque>Onboarding entrega informação. Ativação entrega um ambiente pronto pra operação começar sem improviso.</Destaque>
    </div>
  )
}

// ── 04 · As etapas da ativação ────────────────────────────────────────────
function SlideEtapas() {
  const etapas = ['Configuração das ferramentas', 'Notas fiscais', 'Cadastros', 'Bancos e contas', 'Plano de contas', 'Categorias', 'Centros de custo', 'Regras e particularidades', 'Validação']
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="A espinha dorsal da aula. Cada etapa é ensinada em detalhe a seguir.">O caminho da ativação</Titulo>
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

// ── 05 · Configuração das ferramentas ────────────────────────────────────
function SlideConfiguracao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Antes de cadastrar qualquer coisa, o ambiente de trabalho precisa existir.">Configuração das ferramentas</Titulo>
      <Check itens={[
        'O cliente já existe cadastrado no Fluxe (ou no sistema que você usa)?',
        'Os usuários da sua equipe que vão atender esse cliente têm acesso?',
        'O ERP ou sistema do próprio cliente está configurado pro seu time entrar?',
        'As integrações necessárias (banco, emissor de nota, conciliador) estão ativas?',
      ]} cor="#A5B4FC" />
      <Destaque>Sem isso resolvido primeiro, tudo o que vem depois vira gambiarra.</Destaque>
    </div>
  )
}

// ── 05b · Configuração de notas fiscais ──────────────────────────────────
function SlideNotasFiscais() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Também faz parte da ativação: sem nota configurada certo, a operação trava no primeiro mês.">Configuração de notas fiscais</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>SERVIÇO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Nota Fiscal de Serviço (NFS-e), emitida no sistema da prefeitura do município do cliente, ou por um ERP integrado a ela.</div>
        </div>
        <div style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>PRODUTO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Nota Fiscal Eletrônica (NF-e), emitida via SEFAZ do estado, normalmente pelo ERP do cliente.</div>
        </div>
      </div>
      <Check itens={[
        'Qual tipo de nota o cliente emite: serviço, produto, ou os dois?',
        'Onde é emitida hoje: direto na prefeitura, pelo ERP, ou outro sistema?',
        'Existe certificado digital válido, e quem tem acesso a ele?',
        'Qual o regime tributário e a alíquota aplicada em cada nota?',
        'Numeração e série configuradas certo, sem risco de duplicar ou pular número?',
        'Quem é o responsável por emitir: o cliente ou o BPO?',
      ]} cor="#A5B4FC" />
      <Destaque cor="#FCA5A5">Nota fiscal errada não é só risco fiscal, é dor de cabeça recorrente pro cliente e pro BPO.</Destaque>
    </div>
  )
}

// ── 06 · Cadastros ────────────────────────────────────────────────────────
function SlideCadastros() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="O cadastro é a base de tudo o que o Fluxe (ou qualquer sistema) vai calcular depois.">Cadastros: a base de tudo</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>DADOS DO CLIENTE</div>
          <Check itens={['Razão social e CNPJ', 'Responsáveis e aprovadores', 'Contador e escritório contábil', 'Serviços contratados e escopo']} cor="#A5B4FC" />
        </div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>USUÁRIOS E PERMISSÕES</div>
          <Check itens={['Quem da sua equipe atende esse cliente', 'Nível de acesso de cada pessoa', 'Quem pode aprovar o quê', 'Substituto em caso de ausência']} cor="#A5B4FC" />
        </div>
      </div>
      <Destaque>Cadastro incompleto hoje é retrabalho garantido daqui a 30 dias.</Destaque>
    </div>
  )
}

// ── 07 · Bancos e contas ──────────────────────────────────────────────────
function SlideBancos() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Cada conta bancária, cartão e carteira digital do cliente precisa existir dentro do sistema, com saldo inicial correto.">Bancos e contas</Titulo>
      <Check itens={[
        'Cadastrar todas as contas bancárias, não só a principal',
        'Cadastrar todos os cartões e quem é o responsável por cada um',
        'Registrar o saldo inicial de cada conta na data de corte combinada',
        'Confirmar se existe conexão automática (open finance) ou se a conciliação vai ser manual',
      ]} cor="#A5B4FC" />
      <ErradoCerto
        errado="Cadastrar só a conta que o cliente lembrou de mencionar na reunião."
        certo="Conferir no extrato ou com o contador se não existe conta ou cartão esquecido."
      />
    </div>
  )
}

// ── 08 · Plano de contas ──────────────────────────────────────────────────
function SlidePlanoContas() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="O plano de contas é o esqueleto de todo relatório que você vai entregar depois. Errar aqui contamina tudo.">Plano de contas</Titulo>
      <Check itens={[
        'Usar uma estrutura gerencial, não a estrutura contábil/fiscal do cliente',
        'Separar receita de entrada, despesa de saída patrimonial',
        'Adaptar a profundidade ao tamanho do cliente, sem exagerar em contas que nunca serão usadas',
        'Validar a estrutura com quem vai operar o cliente no dia a dia, antes de travar',
      ]} cor="#A5B4FC" />
      <ScriptQuote label="MATERIAL DE APOIO">
        Use o Guia de Plano de Contas e Categorias da Biblioteca pra montar, revisar ou auditar essa estrutura sem confundir receita com entrada.
      </ScriptQuote>
    </div>
  )
}

// ── 09 · Categorias ────────────────────────────────────────────────────────
function SlideCategorias() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Categoria fraca vira relatório sem sentido lá na frente.">Categorias: traduzir o cliente pro padrão gerencial</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>CATEGORIA FRACA</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>"Diversos", "Outros", "Despesas gerais" — não geram nenhuma decisão.</div>
        </div>
        <div style={{ background: 'rgba(22,163,74,.14)', border: '1px solid rgba(22,163,74,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>CLASSIFICAÇÃO DE VERDADE</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>"Marketing digital", "Folha operacional", "Insumos de produção" — geram análise.</div>
        </div>
      </div>
      <Destaque>Toda categoria precisa apontar pra uma linha do DRE. Se não aponta, ela não deveria existir.</Destaque>
    </div>
  )
}

// ── 10 · Centros de custo ──────────────────────────────────────────────────
function SlideCentrosCusto() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Nem todo cliente precisa. Usar sem necessidade só cria trabalho manual sem retorno de análise.">Centros de custo: quando usar</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>VALE A PENA QUANDO</div>
          <Check itens={['Mais de uma unidade, loja ou filial', 'Mais de uma linha de produto ou serviço relevante', 'O cliente decide investimento por área/projeto']} cor="#A5B4FC" />
        </div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>NÃO VALE A PENA QUANDO</div>
          <Check itens={['Operação pequena, uma unidade só', 'Ninguém vai olhar o relatório por centro de custo', 'Vira trabalho manual sem nenhuma decisão em cima']} cor="#FCA5A5" />
        </div>
      </div>
    </div>
  )
}

// ── 11 · Regras e particularidades ───────────────────────────────────────
function SlideRegras() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo sub="Todo cliente tem alguma particularidade. O problema é descobrir isso só depois que já deu errado.">Regras e particularidades do cliente</Titulo>
      <Check itens={[
        'Data de corte do mês (nem todo cliente fecha no dia 1º ou no último dia)',
        'Regra de aprovação: valor mínimo que precisa de aprovação, quem aprova em cada faixa',
        'Fornecedor ou cliente com condição especial de pagamento/recebimento',
        'Sazonalidade do negócio (impacta previsão de caixa e leitura de indicadores)',
        'Restrição de sistema ou de acesso que o cliente já avisou de antemão',
      ]} cor="#A5B4FC" />
      <Destaque>Documente cada particularidade no cadastro do cliente. "Eu lembro" não escala pra equipe.</Destaque>
    </div>
  )
}

// ── 12 · Validação das informações ───────────────────────────────────────
function SlideValidacao() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Antes de rodar a primeira rotina de verdade, confira. Sem improviso.">Validação: a última checagem antes de operar</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Check itens={['Todas as contas e cartões estão cadastrados?', 'O saldo inicial bate com o extrato?', 'O plano de contas foi validado com quem vai operar?']} cor="#86EFAC" />
        <Check itens={['As categorias cobrem os lançamentos reais do cliente?', 'As regras e aprovadores estão registrados?', 'A equipe sabe executar esse cliente específico?']} cor="#86EFAC" />
      </div>
      <Destaque cor="#FCA5A5">Se a resposta for NÃO pra algo crítico, a ativação não terminou.</Destaque>
    </div>
  )
}

// ── 13 · Erros comuns ──────────────────────────────────────────────────────
function SlideErros() {
  const erros = [
    'Copiar o plano de contas de outro cliente sem adaptar', 'Cadastrar só as contas que o cliente citou de cabeça',
    'Deixar categoria genérica "pra resolver depois"', 'Não confirmar o saldo inicial com o extrato real',
    'Não perguntar sobre particularidades, e descobrir na marra', 'Usar centro de custo em cliente que não precisa',
    'Começar a rotina sem validar com quem vai operar', 'Não documentar as regras combinadas em lugar nenhum',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Os erros mais comuns na ativação</Titulo>
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

// ── 14 · Na prática, dentro do Fluxe ─────────────────────────────────────
function SlideFluxe() {
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Onde cada peça da ativação mora dentro do Fluxe.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Cliente', 'Cadastre a empresa, responsáveis, aprovadores e particularidades na ficha do cliente.', INDIGO],
        ['Bancos e contas', 'Cadastre cada conta e cartão, com saldo inicial na data de corte.', INDIGO],
        ['Plano de contas e categorias', 'Configure a estrutura gerencial e mapeie as categorias do cliente.', INDIGO],
        ['Centros de custo', 'Ative só se o cliente realmente precisar.', AMBER],
        ['Validação', 'Confira tudo com quem vai operar antes de vincular os Modelos de tarefa e liberar a rotina.', GREEN],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/clientes')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Clientes no Fluxe →</button>
      </div>
    </div>
  )
}

// ── 15 · Atividade prática ──────────────────────────────────────────────
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="O onboarding da Loja XPTO terminou. Agora é ativar.">Atividade prática: ativando a Loja XPTO</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O CASO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          2 bancos, 4 cartões, Conta Azul · fecha o mês no dia 20 · sócio A aprova até R$ 2.000, sócio B aprova acima disso ·
          vende em 2 unidades físicas e 1 loja online · nunca teve plano de contas gerencial, só o da contabilidade.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {['Cadastrar os bancos e cartões', 'Definir o saldo inicial', 'Montar o plano de contas', 'Mapear as categorias',
          'Decidir se usa centro de custo', 'Registrar as regras de aprovação', 'Definir a data de corte', 'Validar antes de liberar']
          .map(p => (
            <div key={p} style={{ background: 'rgba(99,102,241,.15)', borderRadius: 20, padding: '7px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{p}</div>
          ))}
      </div>
      <Destaque>Faça essa ativação dentro do Fluxe com um cliente real seu, depois corrigimos juntos.</Destaque>
    </div>
  )
}

// ── Encerramento ─────────────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Ter a informação ≠ estar pronto pra operar.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Onboarding', 'Configuração', 'Cadastros', 'Bancos', 'Plano de contas', 'Validação', 'Operação'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        A ativação é o que separa um BPO que improvisa de um BPO que executa com segurança desde o primeiro dia.<br />
        Tudo o que você não configura ou não valida agora, vira retrabalho na operação.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideDiferenca }, { render: SlideEtapas },
  { render: SlideConfiguracao }, { render: SlideNotasFiscais }, { render: SlideCadastros }, { render: SlideBancos }, { render: SlidePlanoContas },
  { render: SlideCategorias }, { render: SlideCentrosCusto }, { render: SlideRegras }, { render: SlideValidacao },
  { render: SlideErros }, { render: SlideFluxe }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoAtivacaoClientePage() {
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
