import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const INDIGO = '#4F46E5'
const AMBER = '#D97706'
const GREEN = '#16A34A'
const RED = '#DC2626'
const INK = '#0F172A'

// ── Blocos reutilizáveis, cada um com uma composição diferente ────────
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

// erro à esquerda (vermelho) x certo à direita (verde), lado a lado
function ErradoCerto({ errado, certo }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.35)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>❌ O erro</div>
        <div style={{ color: '#fff', fontSize: 17, fontStyle: 'italic' }}>"{errado}"</div>
      </div>
      <div style={{ background: 'rgba(22,163,74,.14)', border: '1px solid rgba(22,163,74,.35)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>✅ O correto</div>
        <div style={{ color: '#fff', fontSize: 17, fontStyle: 'italic' }}>"{certo}"</div>
      </div>
    </div>
  )
}

// título + descrição de cada bloco, em coluna estreita (dor/impacto/consequência)
function Cascata({ passos }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {passos.map(([label, texto, cor], i) => (
        <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: cor, flexShrink: 0 }} />
            {i < passos.length - 1 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,.15)', minHeight: 28 }} />}
          </div>
          <div style={{ paddingBottom: 22 }}>
            <div style={{ color: cor, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ color: '#E2E8F0', fontSize: 15 }}>{texto}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScriptQuote({ children, label = 'SCRIPT' }) {
  return (
    <div style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 14, padding: '20px 26px', position: 'relative' }}>
      <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#fff', fontSize: 18, fontStyle: 'italic', lineHeight: 1.5 }}>"{children}"</div>
    </div>
  )
}

function Objecao({ q, r }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, padding: '14px 18px' }}>
      <div style={{ color: '#FCA5A5', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>"{q}"</div>
      <div style={{ color: '#86EFAC', fontSize: 13.5 }}>→ "{r}"</div>
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

// ── 01 · Capa ──────────────────────────────────────────────────────────
function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 820 }}>
      <Eyebrow>MENTORIA BPO LUCRATIVO</Eyebrow>
      <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Comercial e Precificação Consultiva</div>
      <div style={{ fontSize: 19, color: '#C7D2FE' }}>De lead a cliente, sem vender tarefinha, sem precificar no chute, sem virar refém de desconto</div>
    </div>
  )
}

// ── 02 · Abertura ──────────────────────────────────────────────────────
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        "Quem vende BPO sem diagnóstico, vende errado, cobra errado e depois sofre certo."
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        O comercial do BPO não é sobre convencer o cliente a contratar. É sobre entender se faz sentido atender aquele cliente,
        qual problema será resolvido, qual esforço será necessário e qual preço sustenta a entrega.
      </div>
    </div>
  )
}

// ── Bloco 1 · O que o BPO realmente vende ─────────────────────────────
function SlideOQueVende() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo>O que o BPO realmente vende</Titulo>
      <ErradoCerto
        errado="Eu vendo contas a pagar, contas a receber e conciliação."
        certo="Eu vendo organização financeira, previsibilidade de caixa, controle operacional e informação para tomada de decisão."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
        {[
          ['Contas a pagar', 'previsibilidade e segurança'],
          ['Contas a receber', 'controle de entrada e inadimplência'],
          ['Conciliação', 'confiança nos números'],
          ['DRE gerencial', 'clareza de lucro'],
          ['Fluxo de caixa', 'antecipação de problemas'],
          ['Relatórios', 'decisão com dados'],
        ].map(([a, b]) => (
          <div key={a} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: '#A5B4FC', fontWeight: 700, fontSize: 12.5 }}>{a}</div>
            <div style={{ color: '#94A3B8', fontSize: 12 }}>= {b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bloco 2 · Cliente ideal ────────────────────────────────────────────
function SlideClienteIdeal() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Nem todo cliente que paga bem é bom cliente.">Cliente ideal</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'rgba(22,163,74,.1)', border: '1px solid rgba(22,163,74,.3)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>✅ Cliente bom</div>
          <Check itens={['Demanda clara', 'Processo minimamente acessível', 'Disposição para organizar', 'Respeito ao escopo', 'Capacidade de pagamento', 'Rotina de aprovação', 'Comunicação saudável']} cor="#86EFAC" />
        </div>
        <div style={{ background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>❌ Cliente ruim</div>
          <Check itens={['Quer tudo para ontem', 'Não entrega documento', 'Mistura PF e PJ', 'Não respeita processo', 'Pede desconto antes de entender valor', 'Quer terceirizar o caos sem participar']} cor="#FCA5A5" />
        </div>
      </div>
    </div>
  )
}

// ── Bloco 3 · Jornada comercial (funil) ────────────────────────────────
function SlideJornada() {
  const etapas = ['Lead', 'Qualificação', 'Reunião', 'Diagnóstico', 'Proposta', 'Apresentação', 'Negociação', 'Fechamento', 'Onboarding']
  return (
    <div style={{ width: '100%', maxWidth: 960 }}>
      <Titulo>A jornada comercial</Titulo>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
        {etapas.map((e, i) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '8px 16px', color: '#C7D2FE', fontSize: 14, fontWeight: 600 }}>{e}</div>
            {i < etapas.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', color: '#FCD34D', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        Lead não é cliente. Reunião não é proposta. Proposta não é venda. Venda não é operação iniciada.
      </div>
      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Parece óbvio, mas no BPO o povo pula etapa igual pula aviso de atualização do Windows.</div>
    </div>
  )
}

// ── Bloco 4 · Qualificação do lead ─────────────────────────────────────
function SlideQualificacao() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Antes da reunião completa, validar:">Qualificação do lead</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <Check itens={['Segmento', 'Faturamento', 'Cidade/estado', 'Regime tributário', 'Sistema atual', 'Número de contas', 'Volume de pagamentos', 'Volume de recebimentos', 'Principal dor', 'Urgência', 'Quem decide', 'Orçamento aproximado']} cor="#A5B4FC" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Hoje quem cuida do financeiro?', 'O que fez vocês buscarem um BPO agora?', 'Existe sistema financeiro em uso?', 'Qual o volume médio de movimentações?', 'A decisão será tomada por quem?', 'Vocês buscam operação, gestão ou os dois?'].map(p => (
            <div key={p} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13.5, fontStyle: 'italic' }}>"{p}"</div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', color: '#FCD34D', fontSize: 14, fontWeight: 600, marginTop: 16 }}>Se o lead não tem fit, não aprofunda.</div>
    </div>
  )
}

// ── Bloco 5 · Diagnóstico consultivo ───────────────────────────────────
function SlideDiagnostico() {
  const areas = [
    ['1', 'Empresa', ['Atividade', 'Faturamento', 'CNPJs e unidades', 'Sócios e equipe', 'Regime tributário', 'Contabilidade e sistemas']],
    ['2', 'Contas a pagar', ['Quantidade e origem', 'Quem lança, aprova, agenda', 'Comprovantes', 'Recorrências, reembolsos, cartões']],
    ['3', 'Contas a receber', ['Quantidade de clientes', 'Boleto, PIX, cartão, recorrência', 'Inadimplência e cobrança', 'Baixa manual ou automática']],
    ['4', 'Conciliação', ['Bancos, cartões, gateways', 'Marketplaces, maquininhas, split', 'Antecipações e taxas', 'Estornos e chargeback']],
    ['5', 'Relatórios e gestão', ['Fluxo de caixa e DRE', 'Centro de custo/resultado', 'Indicadores e dashboard', 'Orçado x realizado, margem']],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo sub="O coração da aula. Cinco áreas, cinco lentes diferentes.">Diagnóstico consultivo</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {areas.map(([n, t, itens]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '12px 10px' }}>
            <div style={{ color: INDIGO === '#4F46E5' ? '#A5B4FC' : '#A5B4FC', fontWeight: 800, fontSize: 11 }}>{n}</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>{t}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {itens.map(i => <div key={i} style={{ color: '#94A3B8', fontSize: 10.5, lineHeight: 1.4 }}>{i}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bloco 6 · Perguntas que vendem ─────────────────────────────────────
function SlidePerguntas() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo>Perguntas que vendem</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div style={{ color: '#FCA5A5', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase' }}>Perguntas fracas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Você quer BPO?', 'Quer contas a pagar?', 'Quer relatório?'].map(p => (
              <div key={p} style={{ background: 'rgba(220,38,38,.1)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, fontStyle: 'italic' }}>"{p}"</div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ color: '#86EFAC', fontWeight: 800, fontSize: 12, marginBottom: 10, textTransform: 'uppercase' }}>Perguntas boas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Hoje você sabe quanto tem pra pagar nos próximos 30 dias?', 'Você confia no saldo financeiro da empresa?', 'Sabe qual produto ou área dá mais lucro?', 'Quanto tempo perde por semana com o financeiro?'].map(p => (
              <div key={p} style={{ background: 'rgba(22,163,74,.12)', borderRadius: 8, padding: '10px 14px', color: '#bbf7d0', fontSize: 13, fontStyle: 'italic' }}>"{p}"</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 16 }}>Essas perguntas fazem o cliente perceber a dor.</div>
    </div>
  )
}

// ── Bloco 7 · Dor, impacto, consequência ───────────────────────────────
function SlideDorImpacto() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <Titulo>Dor, impacto e consequência</Titulo>
      <Cascata passos={[
        ['Dor', 'Não tem fluxo de caixa.', RED],
        ['Impacto', 'Toma decisão sem previsibilidade.', AMBER],
        ['Consequência', 'Pode faltar dinheiro mesmo vendendo bem.', GREEN],
      ]} />
    </div>
  )
}

// ── Bloco 8 · Escopo ────────────────────────────────────────────────────
function SlideEscopo() {
  const cols = [
    ['✅ Incluso', GREEN, ['Contas a pagar', 'Contas a receber', 'Conciliação', 'Cobrança', 'Relatórios e DRE', 'Fluxo de caixa', 'Reunião mensal', 'Dashboard']],
    ['❌ Não incluso', RED, ['Contabilidade e fiscal', 'Jurídico e RH', 'Compras', 'Atendimento ao cliente', 'Emissão de nota, se não contratado', 'Auditoria retroativa', 'Organização de períodos anteriores']],
    ['📌 Premissas', INDIGO, ['Cliente envia documentos no prazo', 'Cliente aprova pagamentos', 'Banco permite acesso', 'Sistema será usado corretamente', 'Escopo será respeitado']],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 980 }}>
      <Titulo>Escopo, com clareza</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {cols.map(([t, c, itens]) => (
          <div key={t} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: c, fontWeight: 800, fontSize: 13, marginBottom: 10 }}>{t}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {itens.map(i => <div key={i} style={{ color: '#E2E8F0', fontSize: 11.5 }}>{i}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bloco 9 · Matriz de complexidade ───────────────────────────────────
function SlideComplexidade() {
  const faixas = [
    ['Até 15 pontos', 'Baixa complexidade', GREEN],
    ['16 a 25', 'Média', INDIGO],
    ['26 a 35', 'Alta', AMBER],
    ['Acima de 35', 'Projeto especial', RED],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Pontue de 1 a 3 cada item.">Matriz de complexidade</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        {['Faturamento', 'Volume de pagamentos', 'Volume de recebimentos', 'Qtd. bancos', 'Qtd. cartões', 'Qtd. CNPJs', 'Qtd. sistemas', 'Volume conciliação', 'Inadimplência', 'Relatórios', 'Reuniões', 'Bagunça inicial'].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, color: '#E2E8F0', textAlign: 'center' }}>{i}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {faixas.map(([a, b, c]) => (
          <div key={a} style={{ background: c + '22', border: `1px solid ${c}55`, borderRadius: 10, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ color: c, fontWeight: 800, fontSize: 15 }}>{a}</div>
            <div style={{ color: '#E2E8F0', fontSize: 12 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bloco 10 · Precificação (cascata de custo) ─────────────────────────
function SlidePrecificacao() {
  const linhas = [
    ['Custo operacional (18h × R$45)', 'R$ 810'],
    ['Tecnologia/rateio', 'R$ 150'],
    ['Gestão', 'R$ 300'],
    ['Impostos', 'R$ 180'],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <Titulo sub="Preço = custo operacional + tecnologia + impostos + gestão + risco + margem">Precificação</Titulo>
      <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
        {linhas.map(([a, b], i) => (
          <div key={a} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', fontSize: 13.5, color: '#E2E8F0', background: i % 2 ? 'rgba(255,255,255,.04)' : 'transparent' }}>
            <span>{a}</span><span style={{ fontFamily: 'monospace' }}>{b}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', fontSize: 13.5, fontWeight: 700, color: '#fff', background: 'rgba(99,102,241,.2)' }}>
          <span>Subtotal</span><span style={{ fontFamily: 'monospace' }}>R$ 1.440</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'rgba(217,119,6,.15)', border: '1px solid rgba(217,119,6,.4)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ color: '#FCD34D', fontSize: 11, fontWeight: 700 }}>PREÇO MÍNIMO (margem 50%)</div>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>R$ 2.880</div>
        </div>
        <div style={{ background: 'rgba(22,163,74,.15)', border: '1px solid rgba(22,163,74,.4)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ color: '#86EFAC', fontSize: 11, fontWeight: 700 }}>PREÇO COMERCIAL</div>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>R$ 3.200 a 3.500</div>
        </div>
      </div>
    </div>
  )
}

// ── Bloco 11 · Modelos de plano ────────────────────────────────────────
function SlidePlanos() {
  const planos = [
    ['Essencial', 'Operação simples', ['Contas a pagar', 'Contas a receber', 'Conciliação bancária', 'Relatório básico'], INDIGO],
    ['Gestão', 'Precisa de acompanhamento', ['Tudo do essencial', 'Fluxo de caixa', 'DRE gerencial', 'Indicadores', 'Reunião mensal'], AMBER],
    ['Estratégico', 'Gestão financeira próxima', ['Tudo do gestão', 'Análise de margem', 'Orçamento', 'Dashboard', 'Plano de ação'], GREEN],
  ]
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo>Modelos de plano</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        {planos.map(([nome, sub, itens, cor]) => (
          <div key={nome} style={{ background: 'rgba(255,255,255,.07)', border: `1px solid ${cor}55`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ color: cor, fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{nome}</div>
            <div style={{ color: '#94A3B8', fontSize: 11.5, marginBottom: 10, fontStyle: 'italic' }}>{sub}</div>
            <Check itens={itens} cor={cor} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', color: '#FCD34D', fontSize: 13.5, fontWeight: 600 }}>⚠ Plano não pode virar cardápio engessado. Ele orienta, mas o diagnóstico manda.</div>
    </div>
  )
}

// ── Bloco 12 · Proposta comercial ──────────────────────────────────────
function SlideProposta() {
  const partes = ['Capa', 'Contexto', 'Cenário identificado', 'Dores encontradas', 'Objetivos da solução', 'Escopo', 'Responsabilidades', 'Rotina de trabalho', 'Entregáveis', 'Implantação', 'Investimento', 'Condições comerciais', 'Próximos passos']
  return (
    <div style={{ width: '100%', maxWidth: 940 }}>
      <Titulo sub="A proposta precisa parecer personalizada.">Proposta comercial</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
        {partes.map((p, i) => (
          <div key={p} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, color: '#E2E8F0' }}>
            <span style={{ color: '#A5B4FC', fontWeight: 700 }}>{i + 1}. </span>{p}
          </div>
        ))}
      </div>
      <ErradoCerto
        errado="Segue proposta de BPO Financeiro."
        certo="Estruturamos esta proposta considerando a necessidade de organizar a rotina financeira, reduzir a dependência dos sócios e criar previsibilidade de caixa."
      />
    </div>
  )
}

// ── Bloco 13 · Apresentação da proposta ────────────────────────────────
function SlideApresentacaoProposta() {
  const ordem = ['Retomar diagnóstico', 'Reforçar dores', 'Mostrar solução', 'Explicar escopo', 'Apresentar rotina', 'Mostrar entregáveis', 'Falar investimento', 'Conduzir próximos passos']
  return (
    <div style={{ width: '100%', maxWidth: 780 }}>
      <Titulo sub="Nunca começar pelo preço.">Apresentação da proposta</Titulo>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {ordem.map((o, i) => (
          <div key={o} style={{ background: 'rgba(99,102,241,.15)', borderRadius: 20, padding: '7px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{i + 1}. {o}</div>
        ))}
      </div>
      <ScriptQuote>
        Pelo que levantamos, hoje o principal desafio está em organizar a operação financeira, ter previsibilidade de caixa e tirar essa rotina da mão dos sócios. Por isso, estruturamos uma proposta com foco em rotina, controle e informação gerencial.
      </ScriptQuote>
      <div style={{ textAlign: 'center', color: '#FCD34D', fontSize: 15, fontWeight: 700, marginTop: 16 }}>Depois apresenta o preço. E fica quieta. Silêncio também vende.</div>
    </div>
  )
}

// ── Bloco 14 · Objeções ─────────────────────────────────────────────────
function SlideObjecoes() {
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      <Titulo>Objeções</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Objecao q="Está caro" r="Entendo. Quando você diz caro, está comparando com qual referência?" />
        <Objecao q="Outro cobrou menos" r="Vamos comparar escopo, volume, entregas, frequência e nível de gestão." />
        <Objecao q="Preciso pensar" r="Claro. O que exatamente você precisa avaliar pra tomar a decisão?" />
        <Objecao q="Consegue desconto?" r="Consigo ajustar o investimento se ajustarmos o escopo." />
      </div>
      <div style={{ textAlign: 'center', color: '#FCD34D', fontSize: 16, fontWeight: 700 }}>Desconto sem contrapartida é doação com CNPJ.</div>
    </div>
  )
}

// ── Bloco 15 · Fechamento ────────────────────────────────────────────────
function SlideFechamento() {
  return (
    <div style={{ width: '100%', maxWidth: 700 }}>
      <Titulo>Fechamento</Titulo>
      <Check itens={['Aprovação da proposta', 'Assinatura do contrato', 'Pagamento inicial', 'Reunião de onboarding', 'Envio de acessos', 'Coleta de documentos', 'Implantação', 'Início da operação']} cor="#A5B4FC" />
      <div style={{ textAlign: 'center', color: '#FCD34D', fontSize: 14, fontWeight: 600, marginTop: 18 }}>Venda fechada sem onboarding vira promessa solta.</div>
    </div>
  )
}

// ── Atividade prática (feita ao vivo dentro do Fluxe) ──────────────────
function SlideAtividade() {
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Vamos fazer juntos, ao vivo, dentro do Fluxe.">Atividade prática</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O CASO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Empresa de serviços · Faturamento R$ 420 mil/mês · 2 CNPJs · 3 bancos · 4 cartões · 120 pagamentos/mês · 180 recebimentos/mês ·
          PIX, boleto e cartão · inadimplência de 12% · não tem DRE · sócio aprova tudo no WhatsApp · usa Conta Azul parcialmente · quer relatório mensal e reunião
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        {['Identificar dores', 'Perguntas complementares', 'Definir escopo', 'Pontuar complexidade', 'Estimar horas', 'Calcular preço', 'Montar proposta'].map(p => (
          <div key={p} style={{ background: 'rgba(99,102,241,.15)', borderRadius: 20, padding: '7px 14px', color: '#C7D2FE', fontSize: 12.5, fontWeight: 600 }}>{p}</div>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <button onClick={() => navigate('/precificacao')} style={{
          background: INDIGO, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
        }}>Abrir Precificação no Fluxe →</button>
        <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 10 }}>Digite os números do caso enquanto a turma toda participa junto.</div>
      </div>
    </div>
  )
}

// ── Encerramento ─────────────────────────────────────────────────────────
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5 }}>
        No BPO, vender bem não é falar bonito.<br />É diagnosticar certo, escopar com clareza,<br />precificar com margem e sustentar o valor sem medo.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideOQueVende }, { render: SlideClienteIdeal },
  { render: SlideJornada }, { render: SlideQualificacao }, { render: SlideDiagnostico }, { render: SlidePerguntas },
  { render: SlideDorImpacto }, { render: SlideEscopo }, { render: SlideComplexidade }, { render: SlidePrecificacao },
  { render: SlidePlanos }, { render: SlideProposta }, { render: SlideApresentacaoProposta }, { render: SlideObjecoes },
  { render: SlideFechamento }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoVendaConsultivaPage() {
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
