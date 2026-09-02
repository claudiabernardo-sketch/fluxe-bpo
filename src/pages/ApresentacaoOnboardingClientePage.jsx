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
      <Eyebrow>MENTORIA BPO LUCRATIVO · ENCONTRO 4</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Onboarding: a entrada do cliente</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>O que fazer entre o contrato assinado e o primeiro dia de operação</div>
    </div>
  )
}

// ── 02 · Abertura ──────────────────────────────────────────────────────
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "O cliente disse SIM. E agora?"
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Hoje você vai aprender exatamente o que fazer primeiro, o que pedir, o que perguntar, o que organizar,
        o que combinar, quando começar e o que não aceitar, entre o contrato assinado e o primeiro dia de operação.
      </div>
    </div>
  )
}

// ── 03 · O que é onboarding ──────────────────────────────────────────────
function SlideOQueE() {
  const naoSabe = ['Quais bancos ela usa', 'Quem aprova pagamentos', 'Onde chegam as contas', 'Quem emite as notas',
    'Como recebe dos clientes', 'Quais cartões existem', 'Qual sistema utiliza', 'Quais pagamentos estão pendentes',
    'Quem é o contador', 'Como será a comunicação']
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Ele começa quando o cliente fecha o contrato e termina quando o BPO tem condições de executar a rotina financeira com segurança.">O que é onboarding?</Titulo>
      <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 14 }}>Imagine que hoje uma empresa contratou seu BPO. Você ainda não sabe:</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
        {naoSabe.map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#E2E8F0' }}>{i}</div>
        ))}
      </div>
      <Destaque>Você não tem um cliente pronto pra operar. Você tem um cliente contratado que precisa ser implantado.</Destaque>
    </div>
  )
}

// ── 04 · As 8 etapas ──────────────────────────────────────────────────────
function SlideEtapas() {
  const etapas = ['Venda concluída', 'Handoff', 'Boas-vindas', 'Reunião de onboarding', 'Coleta', 'Organização', 'Validação', 'Go-live']
  return (
    <div style={{ width: '100%', maxWidth: 960 }}>
      <Titulo sub="A espinha dorsal da aula. Cada etapa é ensinada em detalhe a seguir.">Do "sim" ao go-live</Titulo>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {etapas.map((e, i) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '8px 16px', color: '#C7D2FE', fontSize: 13.5, fontWeight: 600 }}>
              <span style={{ color: '#818CF8', fontWeight: 800, marginRight: 6 }}>{i + 1}</span>{e}
            </div>
            {i < etapas.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 05 · Handoff ──────────────────────────────────────────────────────────
function SlideHandoff() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Handoff = passagem do cliente de quem vendeu para quem vai operar.">Handoff: o comercial precisa entregar o cliente</Titulo>
      <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 14 }}>Antes de falar com o cliente, descubra:</div>
      <Check itens={['O que foi contratado?', 'O que NÃO foi contratado?', 'Quanto foi vendido?', 'Qual volume foi considerado?',
        'Quando foi prometido o início?', 'Quais dores o cliente relatou?', 'Houve alguma condição especial?']} cor="#A5B4FC" />
      <Destaque>O cliente não deve precisar comprar com uma pessoa e depois explicar tudo de novo para outra.</Destaque>
    </div>
  )
}

// ── 06 · Comunicação inicial ──────────────────────────────────────────────
function SlideComunicacao() {
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      <Titulo>Comunicação inicial: o que mandar pro cliente?</Titulo>
      <ScriptQuote>
        Agora começaremos sua implantação. Quem será o responsável, quais serão as etapas, o que será solicitado,
        quando acontecerá a reunião, o prazo estimado da implantação e quando a operação poderá começar.
      </ScriptQuote>
      <Destaque>Cliente informado = menos ansiedade e menos mensagens perguntando "já começou?"</Destaque>
    </div>
  )
}

// ── 07 · Reunião de onboarding, parte 1 ────────────────────────────────────
function SlideReuniao1() {
  const grupos = [
    ['Empresa', ['CNPJ?', 'Outras empresas?', 'Sócios?', 'Contato principal?', 'Quem é o contador?']],
    ['Contas a pagar', ['Como as contas chegam hoje?', 'Quem aprova?', 'Quem autoriza pagamento?', 'Pagamentos recorrentes?', 'Horário limite de envio?']],
    ['Contas a receber', ['Como a empresa cobra?', 'Quem emite cobrança?', 'Existe inadimplência?', 'Quem realiza cobrança?']],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="Separe por assunto. Essa parte precisa ser muito completa.">Reunião de onboarding: o que perguntar (1/2)</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {grupos.map(([t, itens]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 14px' }}>
            <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12.5, marginBottom: 10, textTransform: 'uppercase' }}>{t}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {itens.map(i => <div key={i} style={{ color: '#E2E8F0', fontSize: 12 }}>{i}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 08 · Reunião de onboarding, parte 2 ────────────────────────────────────
function SlideReuniao2() {
  const grupos = [
    ['Faturamento', ['Quem solicita a nota?', 'Onde estão os dados?', 'Procedimento específico?']],
    ['Bancos e cartões', ['Quais bancos? Quantas contas?', 'Quem tem acesso e quem aprova?', 'Quantos cartões, quem usa?']],
    ['Sistemas', ['Qual sistema financeiro?', 'Existe ERP?', 'Outras plataformas com movimentação?']],
    ['Contabilidade e relatórios', ['Quem é o contador e como troca documento?', 'O cliente já recebe algum relatório?', 'Quando é o fechamento financeiro?']],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="Continuação. Quanto mais completo aqui, menos surpresa depois.">Reunião de onboarding: o que perguntar (2/2)</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {grupos.map(([t, itens]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12.5, marginBottom: 10, textTransform: 'uppercase' }}>{t}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {itens.map(i => <div key={i} style={{ color: '#E2E8F0', fontSize: 12.5 }}>{i}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 09 · Coleta de acessos ──────────────────────────────────────────────
function SlideAcessos() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Segurança + controle + rastreabilidade + facilidade pra retirar o acesso depois.">Coleta de acessos</Titulo>
      <ErradoCerto
        errado="Sair coletando senha em conversa de WhatsApp sem critério."
        certo="Sempre que o sistema permitir, criar um usuário específico pro BPO."
      />
      <Destaque>No Fluxe, guarde cada acesso já criptografado no Cofre, vinculado ao cliente.</Destaque>
    </div>
  )
}

// ── 10 · Coleta de documentos ──────────────────────────────────────────────
function SlideDocumentos() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub='A pergunta certa é sempre: "para executar exatamente o que vendi, quais informações preciso ter?"'>Acesso não é documento</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>ACESSO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Permite entrar em algum sistema. Exemplo: banco, ERP, plataforma.</div>
        </div>
        <div style={{ background: 'rgba(217,119,6,.12)', border: '1px solid rgba(217,119,6,.35)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>DOCUMENTO</div>
          <div style={{ color: '#E2E8F0', fontSize: 13.5 }}>Uma informação que você precisa receber. Exemplo: extrato, contrato, contas em aberto, faturas de cartão.</div>
        </div>
      </div>
      <Destaque>Não existe uma lista universal de documentos.</Destaque>
    </div>
  )
}

// ── 11 · Responsabilidades ──────────────────────────────────────────────
function SlideResponsabilidades() {
  const linhas = [
    ['Registrar informações', 'Enviar informações'],
    ['Programar pagamentos', 'Aprovar pagamentos'],
    ['Fazer conciliações', 'Informar movimentações'],
    ['Emitir relatórios', 'Participar das análises'],
    ['Sinalizar pendências', 'Responder pendências'],
    ['Cumprir prazos', 'Cumprir prazos'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      <Titulo sub="Isso precisa ser combinado antes do problema acontecer, não depois.">Quem faz o quê?</Titulo>
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 18px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
          <span>BPO</span><span>Cliente</span>
        </div>
        {linhas.map(([a, b], i) => (
          <div key={a} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 18px', fontSize: 13, color: '#E2E8F0', background: i % 2 ? 'rgba(255,255,255,.04)' : 'transparent' }}>
            <span>{a}</span><span>{b}</span>
          </div>
        ))}
      </div>
      <Destaque>Terceirizar o financeiro não significa terceirizar decisões. O BPO executa e controla, o empresário decide.</Destaque>
    </div>
  )
}

// ── 12 · Cronograma ──────────────────────────────────────────────────────
function SlideCronograma() {
  const dias = [
    ['02/09', 'Contrato assinado'], ['03/09', 'Boas-vindas + checklist'], ['04/09', 'Reunião de onboarding'],
    ['04 a 08/09', 'Coleta'], ['09 a 11/09', 'Configuração'], ['12/09', 'Validação'], ['14/09', 'Início da operação'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Data da venda ≠ data de início da operação.">Cronograma: quando começamos?</Titulo>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
        {dias.map(([d, t]) => (
          <div key={d} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '8px 14px' }}>
            <div style={{ color: '#818CF8', fontWeight: 800, fontSize: 12, width: 90, flexShrink: 0, fontFamily: 'monospace' }}>{d}</div>
            <div style={{ color: '#E2E8F0', fontSize: 13 }}>{t}</div>
          </div>
        ))}
      </div>
      <ScriptQuote label="RESPOSTA PRONTA PRO CLIENTE">
        A data de início está condicionada ao recebimento das informações e acessos necessários.
      </ScriptQuote>
    </div>
  )
}

// ── 13 · Organização das informações ──────────────────────────────────────
function SlideOrganizacao() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Titulo>Organização das informações</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>CADASTRO DO CLIENTE</div>
          <Check itens={['Dados da empresa', 'Responsáveis e contatos', 'Contador', 'Serviços contratados', 'Bancos, cartões, sistemas', 'Aprovadores', 'Datas importantes']} cor="#A5B4FC" />
        </div>
        <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 12.5, marginBottom: 8 }}>NÃO PODE SER ASSIM</div>
          <Check itens={['Uma coisa no WhatsApp da Clau', 'Outra no e-mail da funcionária', 'Outra numa pasta qualquer', 'Achismo sobre onde o cliente mandou']} cor="#FCA5A5" />
        </div>
      </div>
      <Destaque>Sem um local oficial pra tudo isso, não é processo, é caça ao tesouro.</Destaque>
    </div>
  )
}

// ── 14 · Rotina x Implantação x Saneamento ─────────────────────────────────
function SlideTresConceitos() {
  const cols = [
    ['Rotina', GREEN, 'Trabalho recorrente contratado.'],
    ['Implantação', INDIGO, 'Preparação da estrutura pra começar.'],
    ['Saneamento', AMBER, 'Correção do passado, do que já estava bagunçado antes do BPO entrar.'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Se o financeiro do cliente estiver uma bagunça, pergunte: isso é operação mensal ou organização do passado?">São três coisas diferentes</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {cols.map(([t, c, d]) => (
          <div key={t} style={{ background: c + '1f', border: `1px solid ${c}55`, borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ color: c, fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{t}</div>
            <div style={{ color: '#E2E8F0', fontSize: 13 }}>{d}</div>
          </div>
        ))}
      </div>
      <Destaque>Essa distinção evita muito prejuízo. Saneamento não é rotina, e precisa ser tratado (e cobrado) separadamente.</Destaque>
    </div>
  )
}

// ── 15 · Quando o cliente está pronto ──────────────────────────────────────
function SlidePronto() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Antes do go-live, responda:">Quando posso dizer "esse cliente está pronto"?</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Check itens={['Tenho os acessos necessários?', 'Tenho as informações necessárias?', 'Sei exatamente o que foi contratado?', 'Sei quem aprova?', 'Sei os prazos?']} cor="#86EFAC" />
        <Check itens={['Sei como receber documentos?', 'O cliente sabe as responsabilidades dele?', 'O BPO sabe as responsabilidades dele?', 'As pendências anteriores foram identificadas?', 'Minha equipe sabe executar esse cliente?']} cor="#86EFAC" />
      </div>
      <Destaque cor="#FCA5A5">Se a resposta for NÃO pra algo crítico, não está pronto.</Destaque>
    </div>
  )
}

// ── 16 · Checklist master ──────────────────────────────────────────────────
function SlideChecklistMaster() {
  const fases = [
    ['1. Venda', ['Contrato', 'Escopo', 'Valores', 'Volumes', 'Data prevista']],
    ['2. Boas-vindas', ['Responsável apresentado', 'Cronograma enviado', 'Checklist enviado', 'Reunião agendada']],
    ['3. Diagnóstico', ['Contas a pagar/receber', 'Bancos e cartões', 'Sistemas', 'Pendências anteriores']],
    ['4. Coleta', ['Acessos', 'Documentos', 'Cadastros', 'Aprovadores']],
    ['5. Configuração', ['ERP', 'Pastas', 'Cadastros', 'Rotinas no Fluxe']],
    ['6. Validação', ['Responsabilidades', 'Prazos', 'Equipe orientada']],
    ['7. Go-live', ['Cliente aprovado', 'Data confirmada', 'Operação iniciada']],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <Titulo sub="A ferramenta que fica com eles depois da aula.">O checklist master</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {fases.map(([t, itens]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 8, padding: '10px 8px' }}>
            <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 10.5, marginBottom: 8 }}>{t}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {itens.map(i => <div key={i} style={{ color: '#CBD5E1', fontSize: 9.5, lineHeight: 1.35 }}>☐ {i}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 17 · Os 10 erros ──────────────────────────────────────────────────────
function SlideErros() {
  const erros = [
    'Começar antes de receber tudo ("depois ele manda")', 'Não documentar o que foi combinado ("eu lembro")',
    'Não definir responsabilidades', 'Não definir prazos ("me manda quando puder")',
    'Aceitar tudo pelo WhatsApp', 'Não identificar o passivo anterior',
    'Não separar implantação de rotina', 'Não fazer handoff',
    'Não definir uma data de go-live', 'Não ter checklist',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Os 10 erros do onboarding</Titulo>
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

// ── 18 · Encerrar o onboarding (adição da Claudia) ─────────────────────────
function SlideEncerrarOnboarding() {
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Iniciante aprende a entrar. Precisa aprender também quando a implantação termina.">Como encerrar oficialmente o onboarding</Titulo>
      <ErradoCerto
        labelErrado="❌ Sem critério"
        labelCerto="✅ Com critério"
        errado="A implantação vai ficando pra trás, ninguém decide quando terminou, e o cliente meio que 'vira rotina' sem ninguém perceber."
        certo="Você bate o checklist master inteiro, confirma o go-live com data, e só então transforma a implantação em rotina recorrente de verdade."
      />
      <div style={{ marginTop: 16, background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 18px' }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: 'uppercase' }}>Na prática, dentro do Fluxe</div>
        <Check itens={[
          'Termine as 5 tarefas do checklist de onboarding do cliente (aba Onboarding)',
          'Cadastre a Rotina do cliente com cada serviço contratado',
          'Vincule os Modelos correspondentes, isso ativa a geração automática das tarefas recorrentes',
          'A partir daí, o cliente sai do onboarding e entra na operação normal, acompanhada pelo Radar',
        ]} cor="#A5B4FC" />
      </div>
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/clientes')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Clientes no Fluxe →</button>
      </div>
    </div>
  )
}

// ── 19 · Atividade prática ──────────────────────────────────────────────
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="O cliente assinou. E agora?">Atividade prática: Loja XPTO</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O CASO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Contratou contas a pagar, contas a receber, conciliação e faturamento · 2 bancos · 4 cartões · Conta Azul ·
          150 pagamentos/mês · 90 recebimentos/mês · 2 sócios. Problemas encontrados: 60 dias sem conciliação, contas vencidas,
          ERP desatualizado, documentos por WhatsApp, ninguém sabe quem aprova pagamento.
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {['O que perguntar', 'O que solicitar', 'Quais acessos pedir', 'Quais documentos pedir', 'O que organizar',
          'Quais responsabilidades definir', 'O que é rotina', 'O que é saneamento', 'Qual cronograma propor', 'Quando liberar o go-live']
          .map(p => (
            <div key={p} style={{ background: 'rgba(99,102,241,.15)', borderRadius: 20, padding: '7px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{p}</div>
          ))}
      </div>
      <Destaque>Monte a resposta pra cada item, depois corrigimos juntos.</Destaque>
    </div>
  )
}

// ── Encerramento ─────────────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Cliente assinou ≠ cliente começou.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Assinatura', 'Onboarding', 'Organização', 'Validação', 'Go-live', 'Operação'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        O objetivo de um bom onboarding não é começar rápido. É começar certo.<br />
        Tudo o que você não combina na entrada vira problema na operação.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideOQueE }, { render: SlideEtapas },
  { render: SlideHandoff }, { render: SlideComunicacao }, { render: SlideReuniao1 }, { render: SlideReuniao2 },
  { render: SlideAcessos }, { render: SlideDocumentos }, { render: SlideResponsabilidades }, { render: SlideCronograma },
  { render: SlideOrganizacao }, { render: SlideTresConceitos }, { render: SlidePronto }, { render: SlideChecklistMaster },
  { render: SlideErros }, { render: SlideEncerrarOnboarding }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoOnboardingClientePage() {
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
