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
function Formula({ children }) {
  return (
    <div style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 14, padding: '18px 26px', textAlign: 'center', margin: '18px 0' }}>
      <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'monospace' }}>{children}</div>
    </div>
  )
}
// Exemplo numérico passo a passo — usado nas aulas de custo/margem, pra
// não ficar só na fórmula abstrata. "linhas" é [rótulo, valor, cor?].
function Exemplo({ titulo, linhas, resultado, resultadoCor = '#86EFAC' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '16px 20px', margin: '14px 0' }}>
      {titulo && <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{titulo}</div>}
      {linhas.map(([label, valor, cor]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, color: '#CBD5E1', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <span>{label}</span>
          <span style={{ fontWeight: 700, color: cor || '#fff', fontFamily: 'monospace' }}>{valor}</span>
        </div>
      ))}
      {resultado && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, marginTop: 10, paddingTop: 10 }}>
          <span style={{ fontWeight: 700, color: '#fff' }}>{resultado[0]}</span>
          <span style={{ fontWeight: 800, color: resultadoCor, fontFamily: 'monospace' }}>{resultado[1]}</span>
        </div>
      )}
    </div>
  )
}
// Slide de área da auditoria: pergunta central + sinais de gap, no formato
// usado ao vivo na aula (pergunta que a pessoa responde pra si mesma).
function SlideArea({ numero, icone, area, pergunta, sinais, fluxeDica }) {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Eyebrow>ÁREA {numero} DE 9</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 6 }}>{icone} {area}</div>
      <div style={{ fontSize: 16, color: '#C7D2FE', textAlign: 'center', fontStyle: 'italic', marginBottom: 20 }}>"{pergunta}"</div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Sinais de que tem gap aqui</div>
      <Check itens={sinais} cor="#FCA5A5" />
      {fluxeDica && (
        <div style={{ marginTop: 18, background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, color: '#C7D2FE' }}>
          💡 <strong>No Fluxe:</strong> {fluxeDica}
        </div>
      )}
    </div>
  )
}

function SlideCapa() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 850 }}>
      <Eyebrow>COMUNIDADE CONEXÃO BPO</Eyebrow>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Auditoria do BPO</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#C7D2FE', marginBottom: 18 }}>Como identificar os gaps e resolver o problema</div>
      <div style={{ fontSize: 15, color: '#94A3B8' }}>O raio-X completo da sua operação, de ponta a ponta</div>
    </div>
  )
}
function SlideAbertura() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 26 }}>
        Toda operação tem gap. A diferença entre quem cresce e quem trava é saber onde está o seu.
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Hoje a gente não vai só falar sobre auditoria, vamos fazer uma juntos: passar pela sua
        operação de ponta a ponta, área por área, e sair daqui sabendo exatamente onde o seu BPO
        está perdendo eficiência, dinheiro e capacidade de crescer.
      </div>
    </div>
  )
}
function SlideObjetivo() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 760 }}>
      <Eyebrow>O OBJETIVO DE HOJE</Eyebrow>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 20 }}>
        Terminar essa aula sabendo responder:
      </div>
      <div style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 14, padding: '22px 28px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.6 }}>
          "Onde meu BPO está perdendo eficiência, dinheiro e capacidade de crescer, e o que eu preciso corrigir primeiro?"
        </div>
      </div>
      <Destaque>Essa não é uma aula pra assistir e esquecer. É pra sair com o raio-X do seu BPO na mão.</Destaque>
    </div>
  )
}
function SlideEtapas() {
  const areas = [
    'Comercial e contratação', 'Onboarding e implantação', 'Rotina operacional', 'Processos e responsabilidades',
    'Comunicação com o cliente', 'Escopo e serviços extras', 'Prazos e controles', 'Entregas estratégicas',
    'Rentabilidade e capacidade',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 920 }}>
      <Titulo sub="A ordem importa: começa na venda e termina no resultado financeiro da operação.">As 9 áreas da auditoria</Titulo>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {areas.map((a, i) => (
          <div key={a} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ color: '#818CF8', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
            <span style={{ color: '#E2E8F0', fontSize: 12.5, fontWeight: 600 }}>{a}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const AREAS = [
  {
    icone: '🤝', area: 'Comercial e contratação',
    pergunta: 'O que eu vendi é exatamente o que eu entrego, pelo preço que cobre meu custo?',
    sinais: [
      'Escopo vendido não bate com o que a equipe realmente entrega no dia a dia',
      'Preço foi definido no feeling, nunca revisado com o custo real da operação',
      'Contrato desatualizado, ou nem existe pra alguns clientes',
      'Processo de venda depende só de você, ninguém mais sabe vender',
    ],
    fluxeDica: 'Precificação calcula o preço mínimo viável, e a Biblioteca tem o modelo de contrato pronto.',
  },
  {
    icone: '🚀', area: 'Onboarding e implantação',
    pergunta: 'Todo cliente novo passa pelo mesmo processo, ou cada implantação é uma aventura diferente?',
    sinais: [
      'Não existe checklist padrão de onboarding, cada implantação começa do zero',
      'Tempo de implantação varia demais de cliente pra cliente, sem motivo claro',
      'Cliente termina o onboarding sem saber o que esperar da rotina',
      'Acessos e dados do cliente anterior nunca foram formalmente recebidos',
    ],
    fluxeDica: 'Esteiras tem o playbook de Onboarding pronto pra aplicar e gerar o checklist de uma vez.',
  },
  {
    icone: '🔁', area: 'Rotina operacional',
    pergunta: 'A rotina de cada cliente roda sozinha, ou depende de alguém lembrar?',
    sinais: [
      'Rotina existe só na cabeça de quem executa, não está registrada em nenhum sistema',
      'Tarefa recorrente não gera sozinha, alguém precisa lembrar de criar toda vez',
      'Você não sabe, sem perguntar pra ninguém, quantas tarefas estão atrasadas hoje',
      'Dois clientes com a mesma rotina são tratados de um jeito diferente',
    ],
    fluxeDica: 'Modelos gera a tarefa recorrente sozinho, e a Central Operacional mostra tudo atrasado hoje.',
  },
  {
    icone: '🧩', area: 'Processos e responsabilidades',
    pergunta: 'Se a pessoa que faz esse processo sair amanhã, a operação para?',
    sinais: [
      'Processo crítico existe só na cabeça de uma pessoa, sem nada escrito',
      'Não está claro quem é o responsável por cada etapa de cada processo',
      'Erro de execução se repete, porque ninguém documentou a causa da última vez',
      'Treinar alguém novo depende de "andar do lado" de quem já sabe',
    ],
    fluxeDica: 'Modelos de tarefa tem checklist embutido, o passo a passo fica registrado ali, não na cabeça de alguém.',
  },
  {
    icone: '💬', area: 'Comunicação com o cliente',
    pergunta: 'O cliente sabe quem é o responsável por ele, e quando vai ouvir de você de novo?',
    sinais: [
      'Não existe cadência definida de contato, cliente só ouve de você quando cobra',
      'Reclamação é resolvida no calor da hora, sem ficar registrada em lugar nenhum',
      'Cliente não sabe pra quem mandar mensagem quando tem dúvida',
      'Reunião de resultado, quando acontece, não segue nenhuma pauta',
    ],
    fluxeDica: 'CRM registra todo histórico de contato, e a apresentação de Reunião com o Cliente ensina a pauta.',
  },
  {
    icone: '📋', area: 'Escopo e serviços extras',
    pergunta: 'Eu sei quanto de trabalho fora do escopo estou entregando de graça?',
    sinais: [
      'Cliente pede "só uma coisinha a mais" com frequência, e vira rotina não cobrada',
      'Ninguém audita periodicamente contratado x entregue',
      'Escopo do contrato é vago demais pra servir de régua em uma discussão',
      'Serviço extra vira precedente, o próximo cliente já espera de graça também',
    ],
    fluxeDica: 'Vale revisar o Manual Operacional do BPO pra deixar o escopo por escrito, claro pro time e pro cliente.',
  },
  {
    icone: '⏱', area: 'Prazos e controles',
    pergunta: 'Toda entrega tem prazo claro, e atraso é medido ou só sentido?',
    sinais: [
      'Nem toda tarefa tem data de vencimento definida',
      'Atraso só é percebido quando o cliente reclama, não antes',
      'Não existe nenhum indicador de pontualidade da operação',
      'Prioridade do dia é decidida no improviso, não por regra',
    ],
    fluxeDica: 'A Central Operacional mostra atrasadas, vencendo hoje e impedimentos, tudo em tempo real.',
  },
  {
    icone: '📈', area: 'Entregas estratégicas',
    pergunta: 'Meu cliente me vê como quem só lança dados, ou como quem entrega inteligência?',
    sinais: [
      'Entrega é só operacional (lançamento, conciliação), nunca indicador ou análise',
      'Cliente nunca recebeu um DRE ou relatório gerencial de verdade',
      'Reunião com cliente fala só de pendência, nunca de resultado ou direção',
      'Cliente não enxerga motivo nenhum pra pagar mais do que paga hoje',
    ],
    fluxeDica: 'A apresentação Estratégico, o BPO que Entrega Inteligência, mostra exatamente essa virada.',
  },
  {
    icone: '💰', area: 'Rentabilidade e capacidade',
    pergunta: 'Eu sei a margem de cada cliente, e sei quantos clientes cabem na minha equipe hoje?',
    sinais: [
      'Nunca calculou o custo real de atender cada cliente',
      'Não sabe se a carteira atual cobre o ponto de equilíbrio do próprio BPO',
      'Aceita cliente novo sem saber se a equipe tem capacidade sobrando',
      'Cliente antigo nunca teve o preço revisado, mesmo crescendo em volume',
    ],
    fluxeDica: 'A apresentação Como Auditar o seu BPO Financeiro, na Biblioteca, aprofunda só essa parte.',
  },
]

// ── Aula aprofundada: custo por cliente e margem (área 9) ──────────────
// A área "Rentabilidade" é onde mais gente trava, então em vez de só listar
// sinais de gap, ensina o passo a passo completo de como chegar no custo
// real de cada cliente e no que é margem de verdade, com exemplo numérico
// em cada passo.
function SlideCustoIntro() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 780 }}>
      <Eyebrow>APROFUNDANDO A ÁREA 9</Eyebrow>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 22 }}>
        "Nunca calculei o custo real de um cliente" é o gap mais comum de todos.
      </div>
      <div style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.7 }}>
        Então antes de seguir pro raio-X, vamos fazer essa conta juntos, passo a passo, com números
        reais. Não é fórmula pra decorar, é o cálculo que separa cliente bom de cliente que dá prejuízo.
      </div>
    </div>
  )
}
function SlideCustoPasso1() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Eyebrow>PASSO 1 DE 4</Eyebrow>
      <Titulo sub="Não é o que o contrato prevê, é o que a equipe realmente gasta.">Meça as horas reais dedicadas a cada cliente</Titulo>
      <Check itens={[
        'Registre o tempo de cada tarefa, por cliente, durante pelo menos 30 dias antes de confiar no número',
        'Inclua TUDO: execução, e-mail, WhatsApp do cliente, reunião, retrabalho por erro',
        'Cliente "tranquilo" no papel pode consumir o dobro de horas na prática, isso só aparece medindo',
        'Sem medir, você está precificando e decidindo com base em achismo, não em dado',
      ]} cor="#A5B4FC" />
      <Destaque>No Fluxe: o apontamento de horas em cada tarefa já soma automaticamente por cliente.</Destaque>
    </div>
  )
}
function SlideCustoPasso2() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Eyebrow>PASSO 2 DE 4</Eyebrow>
      <Titulo sub="O quanto custa 1 hora de trabalho da sua operação, de verdade, com tudo incluso.">Calcule o custo-hora real da sua equipe</Titulo>
      <Formula>Custo-hora = (Salário + Encargos + Benefícios) ÷ Horas produtivas do mês</Formula>
      <Exemplo
        titulo="Exemplo: um analista com salário de R$ 3.000"
        linhas={[
          ['Salário bruto', 'R$ 3.000'],
          ['Encargos (≈ 59% no CLT)', '+ R$ 1.770'],
          ['Benefícios (VR + VT)', '+ R$ 800'],
          ['Horas produtivas no mês', '160h'],
        ]}
        resultado={['Custo-hora', 'R$ 34,80/h']}
      />
      <Destaque cor="#FCA5A5">Erro clássico: tirar a média entre o seu custo (dono) e o da equipe operacional. Dona a R$300/h + analista a R$35/h vira uma média de R$167/h que não representa ninguém, e infla o preço de todo cliente pequeno.</Destaque>
    </div>
  )
}
function SlideCustoPasso3() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Eyebrow>PASSO 3 DE 4</Eyebrow>
      <Titulo sub="Agora é só multiplicar o passo 1 pelo passo 2.">O custo do cliente</Titulo>
      <Formula>Custo do cliente = Horas dedicadas × Custo-hora da equipe</Formula>
      <Exemplo
        titulo="Exemplo: cliente que consome 12h por mês"
        linhas={[
          ['Horas medidas no mês', '12h'],
          ['Custo-hora da equipe', '× R$ 34,80'],
        ]}
        resultado={['Custo do cliente', 'R$ 417,60/mês']}
      />
      <Destaque>Não esqueça o overhead rateado (ferramentas, internet, parte da estrutura) somado a esse valor.</Destaque>
    </div>
  )
}
function SlideMargemExplicada() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <Eyebrow>PASSO 4 DE 4</Eyebrow>
      <Titulo sub="Margem de contribuição é receita menos o custo direto de atender aquele cliente específico.">O que é margem, na prática</Titulo>
      <Formula>Margem = Valor cobrado do cliente − Custo do cliente</Formula>
      <Exemplo
        titulo="Voltando ao exemplo: esse mesmo cliente paga R$ 800/mês"
        linhas={[
          ['Valor cobrado', 'R$ 800,00'],
          ['Custo do cliente (passo 3)', '− R$ 417,60'],
        ]}
        resultado={['Margem de contribuição', 'R$ 382,40 (48%)']}
        resultadoCor="#86EFAC"
      />
      <Destaque cor="#FCA5A5">
        Margem não é markup. Markup é o % que você soma em cima do custo; margem é o % que sobra em cima do preço, são contas diferentes.
        Aplicar 50% de markup em R$ 417,60 dá R$ 626,40, mas a margem real desse preço é só 33%, bem abaixo do que parecia.
      </Destaque>
    </div>
  )
}
function SlideCustoErros() {
  const erros = [
    'Usar a média entre o custo do dono e o da equipe operacional',
    'Estimar as horas "de cabeça" em vez de medir de verdade',
    'Esquecer o overhead (ferramentas, estrutura) no custo do cliente',
    'Confundir markup com margem, e cobrar menos do que precisa',
    'Calcular uma vez e nunca mais revisar, mesmo o cliente crescendo',
    'Olhar só o faturamento total, sem saber qual cliente puxa a média pra baixo',
  ]
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo>Erros comuns nesse cálculo</Titulo>
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
function SlideCustoFluxe() {
  const navigate = useNavigate()
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="Cada passo dessa conta já tem uma tela correspondente, pra você não fazer isso na planilha.">Na prática, dentro do Fluxe</Titulo>
      <Cascata passos={[
        ['Apontamentos', 'Horas reais por tarefa, somadas automaticamente por cliente.', '#4F46E5'],
        ['Equipe (Cap)', 'Calculadora de custo-hora real, com encargos e benefícios inclusos.', '#D97706'],
        ['Rentabilidade', 'Margem de contribuição já calculada, cliente por cliente.', '#16A34A'],
      ]} />
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => navigate('/materiais-apoio')} style={{
          background: '#4F46E5', border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
        }}>Ver "Como Auditar o seu BPO Financeiro" na Biblioteca →</button>
      </div>
    </div>
  )
}

function SlideRaioX() {
  return (
    <div style={{ width: '100%', maxWidth: 860 }}>
      <Titulo sub="Depois de passar pelas 9 áreas, monte o seu.">O raio-X do seu BPO</Titulo>
      <Check itens={[
        'Marque cada uma das 9 áreas como 🟢 sob controle, 🟡 atenção, ou 🔴 gap crítico',
        'Escolha só 1 área vermelha pra atacar primeiro, não tente resolver tudo de uma vez',
        'Pra essa área, escreva a causa raiz do gap, não só o sintoma',
        'Defina uma ação concreta, com prazo, pra essa área nos próximos 30 dias',
      ]} cor="#A5B4FC" />
      <Destaque cor="#FCA5A5">Um BPO com uma área vermelha bem resolvida cresce mais do que um com nove áreas amarelas.</Destaque>
    </div>
  )
}
function SlideAtividade() {
  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <Titulo sub="O material completo com as perguntas de cada área e o espaço pra escrever está na Biblioteca do Fluxe.">Atividade prática: seu raio-X</Titulo>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: '#A5B4FC', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>O EXERCÍCIO</div>
        <div style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 1.8 }}>
          Baixe o "Checklist de Auditoria do BPO, Raio-X Completo" e responda as 9 áreas com dados
          reais da sua operação. No final, escolha a área mais crítica e escreva o plano de ação
          dos próximos 30 dias.
        </div>
      </div>
      <Destaque>Traga seu raio-X pronto pra próxima aula, vamos revisar juntos.</Destaque>
    </div>
  )
}
function SlideEncerramento() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 800 }}>
      <Eyebrow>PRA FECHAR</Eyebrow>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
        Você não corrige o que não audita. E não cresce no que não corrige.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
        {['Comercial', 'Onboarding', 'Rotina', 'Processos', 'Comunicação', 'Escopo', 'Prazos', 'Estratégico', 'Rentabilidade'].map((e, i, arr) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)', borderRadius: 20, padding: '6px 14px', color: '#C7D2FE', fontSize: 12, fontWeight: 600 }}>{e}</div>
            {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
        Nove áreas, uma operação só. O raio-X é seu, o plano de ação também.
      </div>
    </div>
  )
}

const SLIDES = [
  { render: SlideCapa }, { render: SlideAbertura }, { render: SlideObjetivo }, { render: SlideEtapas },
  ...AREAS.map((a, i) => ({ render: () => <SlideArea numero={i + 1} {...a} /> })),
  { render: SlideCustoIntro }, { render: SlideCustoPasso1 }, { render: SlideCustoPasso2 },
  { render: SlideCustoPasso3 }, { render: SlideMargemExplicada }, { render: SlideCustoErros }, { render: SlideCustoFluxe },
  { render: SlideRaioX }, { render: SlideAtividade }, { render: SlideEncerramento },
]

export default function ApresentacaoAuditoriaGapsPage() {
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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 420, justifyContent: 'center' }}>
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
