import { useState } from 'react'

// Kit da Reunião Estratégica — material de uso, não de leitura. Complementa a
// aula "Conversa Estratégica": lá se ensina o raciocínio, aqui está o que a
// pessoa leva aberto na mesa. Feito pra imprimir (uma folha por bloco) e pra
// copiar a ata direto no WhatsApp no fim da reunião.

const AZUL = '#4338CA'
const AZUL_CLARO = '#EEF2FF'
const BORDA = '#E2E8F0'
const TINTA = '#0F172A'
const TINTA2 = '#475569'
const TINTA3 = '#94A3B8'

const PREPARACAO = [
  ['Fechar o mês e auditar', 'Conferir saldos, conciliação e lançamentos sem categoria. Número errado na reunião custa meses de confiança.'],
  ['Comparar com os 3 meses anteriores', 'Mês isolado não conta história. Você precisa da tendência, não da foto.'],
  ['Calcular os indicadores do mês', 'Margem de contribuição, ponto de equilíbrio, prazo médio de recebimento e inadimplência.'],
  ['Escolher os 3 pontos da reunião', 'Se tudo é importante, nada é. Três é o que cabe na cabeça de alguém.'],
  ['Escrever as recomendações ANTES', 'Se você não consegue escrever em uma frase, você ainda não entendeu o número.'],
  ['Revisar os combinados do mês passado', 'Cobrar o que ficou acordado é o que separa parceiro de fornecedor.'],
  ['Preparar a projeção de 30 a 60 dias', 'O empresário decide sobre o futuro, não sobre o mês que já acabou.'],
  ['Separar as 3 perguntas que você vai fazer', 'Você conduz perguntando, não apresentando.'],
]

const ROTEIRO = [
  { min: '0–2', bloco: 'Resultado do mês', fala: 'Lucro, caixa e comparação com o mês anterior. Três frases, sem detalhe.', cuidado: 'Não abra a planilha ainda.' },
  { min: '2–10', bloco: 'O que explica o resultado', fala: 'Os 2 ou 3 movimentos que mais pesaram, com valor em reais e causa provável.', cuidado: 'Traga hipótese, não veredito.' },
  { min: '10–15', bloco: 'Projeção', fala: 'O que acontece nos próximos 30 a 60 dias se nada mudar.', cuidado: 'Aqui a conversa vira decisão.' },
  { min: '15–25', bloco: 'Recomendações', fala: 'Três no máximo. O que fazer, quanto muda, quem faz até quando.', cuidado: 'Pergunte o que o impede de fazer.' },
  { min: '25–30', bloco: 'Combinados', fala: 'Repita em voz alta o que foi decidido e confirme prazos e responsáveis.', cuidado: 'Envie por escrito no mesmo dia.' },
]

const PERGUNTAS = [
  { quando: 'Para abrir', itens: ['Antes de eu mostrar os números, como você sentiu o mês?', 'Teve algo fora do normal na operação?'] },
  { quando: 'Depois do resultado', itens: ['Esse resultado te surpreendeu ou você já esperava?', 'Isso bate com a sua sensação do mês?'] },
  { quando: 'Para investigar', itens: ['O que mudou de um mês pro outro aqui?', 'Essa despesa foi pontual ou vira rotina?', 'Esse cliente costuma atrasar?'] },
  { quando: 'Para gerar decisão', itens: ['Se tivesse que escolher um problema pra resolver este mês, qual seria?', 'O que te impede de fazer isso hoje?', 'O que precisa acontecer pra isso sair do papel?'] },
  { quando: 'Para fechar', itens: ['Do que a gente falou, o que é prioridade pra você?', 'Posso considerar isso combinado até o dia X?'] },
]

const DIAGNOSTICO = [
  ['Faturou mais e sobrou menos', 'O que foi vendido mudou? Teve desconto?', 'Mix pior ou política de desconto solta'],
  ['Lucro positivo, caixa negativo', 'Você está recebendo em quantos dias?', 'Prazo descasado ou inadimplência'],
  ['Despesa fixa subindo', 'Entrou pessoa, sistema ou contrato novo?', 'Estrutura crescendo antes da receita'],
  ['Margem caindo todo mês', 'O preço acompanhou o aumento do custo?', 'Preço congelado há tempo demais'],
  ['Resultado oscilando muito', 'Quanto do faturamento vem dos 3 maiores?', 'Concentração de receita'],
  ['Estoque subindo e caixa caindo', 'Está comprando no ritmo que vende?', 'Compra desalinhada da saída'],
  ['Muita entrada e nada sobra', 'Quanto sai de pró-labore e retirada?', 'Retirada acima do que a empresa suporta'],
]

const DESTRAVA = [
  ['O cliente fica calado', '"Deixa eu te perguntar de outro jeito: isso faz sentido com o que você vê no dia a dia?"'],
  ['Ele se justifica / fica na defensiva', '"Não é cobrança, é diagnóstico. Eu só quero entender pra te ajudar a corrigir."'],
  ['Ele diz "já sei disso"', '"Perfeito. Então vamos direto pro que fazer: você prefere mexer no preço ou no custo?"'],
  ['Ele quer discutir cada lançamento', '"Posso te mandar o detalhe depois? Nesses 30 minutos eu queria decidir duas coisas com você."'],
  ['Ele não decide nada', '"Me ajuda a entender: falta informação, falta tempo ou você não concorda com a recomendação?"'],
  ['Ele culpa o mercado', '"Pode ser. Mas tem uma parte que está na nossa mão — quer ver qual é?"'],
]

const ATA = `Reunião estratégica — [CLIENTE] — [MÊS]

RESULTADO DO MÊS
- Faturamento: R$ ____  (mês anterior: R$ ____)
- Lucro líquido: R$ ____ (__%)
- Caixa no fim do mês: R$ ____

O QUE EXPLICOU O RESULTADO
1. ____
2. ____

PROJEÇÃO (30 a 60 dias)
- ____

COMBINADOS
1. [O QUÊ] — responsável: [QUEM] — até: [QUANDO]
2. [O QUÊ] — responsável: [QUEM] — até: [QUANDO]
3. [O QUÊ] — responsável: [QUEM] — até: [QUANDO]

PENDENTE DO MÊS ANTERIOR
- ____

PRÓXIMA REUNIÃO: __/__/____`

function Secao({ n, titulo, sub, children }) {
  return (
    <section style={{ marginBottom: 34, breakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: AZUL, letterSpacing: 1.5 }}>{n}</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: TINTA }}>{titulo}</h2>
      </div>
      {sub && <p style={{ margin: '0 0 14px', fontSize: 13, color: TINTA2, maxWidth: 700 }}>{sub}</p>}
      {children}
    </section>
  )
}

function Tabela({ colunas, larguras, linhas }) {
  return (
    <div style={{ border: `1px solid ${BORDA}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: larguras, background: AZUL_CLARO }}>
        {colunas.map(c => (
          <div key={c} style={{ padding: '9px 12px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: AZUL, textTransform: 'uppercase' }}>{c}</div>
        ))}
      </div>
      {linhas.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: larguras, borderTop: `1px solid ${BORDA}`, breakInside: 'avoid' }}>
          {l.map((cel, j) => (
            <div key={j} style={{ padding: '10px 12px', fontSize: 13, color: j === 0 ? TINTA : TINTA2, fontWeight: j === 0 ? 600 : 400, lineHeight: 1.45 }}>{cel}</div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function KitReuniaoEstrategicaPage() {
  const [feitos, setFeitos] = useState(() => new Set())
  const [copiado, setCopiado] = useState(false)

  function alternar(i) {
    setFeitos(s => {
      const n = new Set(s)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  async function copiarAta() {
    try {
      await navigator.clipboard.writeText(ATA)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 4px 60px', color: TINTA }}>
      <style>{`@media print {
        .kit-interativo { display: none !important; }
        .kit-print-box { border: 1px solid #94A3B8 !important; }
      }`}</style>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: AZUL, marginBottom: 6 }}>CONEXÃO BPO · MATERIAL DE USO</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Kit da Reunião Estratégica</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: TINTA2, maxWidth: 640 }}>
            Isto não é material de leitura. É o que você deixa aberto na mesa durante a reunião com o cliente —
            preparação, roteiro com tempo, perguntas, diagnóstico de bolso e a ata pra enviar no mesmo dia.
          </p>
        </div>
        <button onClick={() => window.print()} className="no-print"
          style={{ padding: '9px 16px', borderRadius: 9, border: `1px solid ${BORDA}`, background: '#fff', color: TINTA, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          🖨 Imprimir o kit
        </button>
      </div>

      <div style={{ height: 1, background: BORDA, margin: '20px 0 28px' }} />

      {/* 1. PREPARAÇÃO */}
      <Secao n="01" titulo="Antes da reunião" sub="A regra é uma só: você chega sabendo o que vai recomendar. Quem descobre o número ao vivo reage, não conduz.">
        <div className="kit-interativo" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {PREPARACAO.map(([t, p], i) => {
            const ok = feitos.has(i)
            return (
              <label key={t} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 9, cursor: 'pointer', background: ok ? '#F0FDF4' : '#fff', border: `1px solid ${ok ? '#BBF7D0' : BORDA}` }}>
                <input type="checkbox" checked={ok} onChange={() => alternar(i)} style={{ marginTop: 3, cursor: 'pointer', flex: 'none' }} />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TINTA, textDecoration: ok ? 'line-through' : 'none' }}>{t}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: TINTA2, marginTop: 3, lineHeight: 1.45 }}>{p}</span>
                </span>
              </label>
            )
          })}
        </div>
        {/* versão em papel: quadradinhos vazios */}
        <div className="print-only" style={{ display: 'none' }}>
          {PREPARACAO.map(([t, p]) => (
            <div key={t} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${BORDA}` }}>
              <span style={{ flex: 'none', width: 13, height: 13, border: '1.5px solid #64748B', borderRadius: 3, marginTop: 3 }} />
              <span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: TINTA2 }}>{p}</span>
              </span>
            </div>
          ))}
        </div>
      </Secao>

      {/* 2. ROTEIRO */}
      <Secao n="02" titulo="O roteiro de 30 minutos" sub="Sempre do topo para o detalhe. Detalhe sem contexto parece problema; contexto primeiro transforma detalhe em explicação.">
        <div style={{ border: `1px solid ${BORDA}`, borderRadius: 10, overflow: 'hidden' }}>
          {ROTEIRO.map((r, i) => (
            <div key={r.bloco} style={{ display: 'grid', gridTemplateColumns: '68px 1fr', borderTop: i ? `1px solid ${BORDA}` : 'none', breakInside: 'avoid' }}>
              <div style={{ background: AZUL_CLARO, padding: '13px 8px', textAlign: 'center', fontSize: 13, fontWeight: 800, color: AZUL }}>{r.min}<div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, opacity: .75 }}>MIN</div></div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{r.bloco}</div>
                <div style={{ fontSize: 13, color: TINTA2, marginTop: 3, lineHeight: 1.45 }}>{r.fala}</div>
                <div style={{ fontSize: 12, color: AZUL, marginTop: 5, fontWeight: 600 }}>→ {r.cuidado}</div>
              </div>
            </div>
          ))}
        </div>
      </Secao>

      {/* 3. ABERTURA */}
      <Secao n="03" titulo="A folha de abertura" sub="Preencha antes de entrar. São os três números que abrem a reunião — e os únicos que você diz de cabeça, sem olhar planilha.">
        <div className="kit-print-box" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[['Faturamento do mês', 'vs. mês anterior'], ['Lucro líquido', 'em R$ e em %'], ['Caixa no fim do mês', 'e projeção de 30 dias']].map(([t, s]) => (
            <div key={t} style={{ border: `1px solid ${BORDA}`, borderRadius: 10, padding: '14px 14px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: AZUL, textTransform: 'uppercase' }}>{t}</div>
              <div style={{ fontSize: 11, color: TINTA3, marginTop: 2 }}>{s}</div>
              <div style={{ borderBottom: `1px solid ${BORDA}`, marginTop: 26 }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, border: `1px solid ${BORDA}`, borderRadius: 10, padding: '14px 14px 26px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: AZUL, textTransform: 'uppercase' }}>As 3 recomendações que eu vou levar</div>
          <div style={{ fontSize: 11, color: TINTA3, marginTop: 2 }}>escritas antes da reunião — o que fazer, quanto muda, quem faz até quando</div>
          {[1, 2, 3].map(n => <div key={n} style={{ borderBottom: `1px solid ${BORDA}`, marginTop: 24 }} />)}
        </div>
      </Secao>

      {/* 4. PERGUNTAS */}
      <Secao n="04" titulo="Banco de perguntas" sub="Você conduz perguntando. Pergunta boa faz o empresário chegar sozinho na conclusão — e quem chega sozinho executa.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {PERGUNTAS.map(g => (
            <div key={g.quando} style={{ border: `1px solid ${BORDA}`, borderRadius: 10, padding: '13px 15px', breakInside: 'avoid' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: AZUL, textTransform: 'uppercase', marginBottom: 8 }}>{g.quando}</div>
              {g.itens.map(p => (
                <div key={p} style={{ fontSize: 13, color: TINTA, lineHeight: 1.5, paddingLeft: 13, position: 'relative', marginBottom: 7 }}>
                  <span style={{ position: 'absolute', left: 0, color: AZUL }}>·</span>{p}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Secao>

      {/* 5. DIAGNÓSTICO */}
      <Secao n="05" titulo="Diagnóstico de bolso" sub="O número mostra onde dói. Só a conversa com quem vive o negócio revela por quê — então leve a hipótese, nunca o veredito.">
        <Tabela
          colunas={['O que você vê', 'Pergunte isso', 'Causa provável']}
          larguras="1fr 1.3fr 1.1fr"
          linhas={DIAGNOSTICO}
        />
      </Secao>

      {/* 6. DESTRAVA */}
      <Secao n="06" titulo="Quando a conversa trava" sub="Frases prontas pros momentos que mais derrubam reunião de BPO iniciante.">
        <Tabela
          colunas={['Situação', 'O que dizer']}
          larguras="0.8fr 1.6fr"
          linhas={DESTRAVA}
        />
      </Secao>

      {/* 7. ATA */}
      <Secao n="07" titulo="A ata que fecha a reunião" sub="Envie no mesmo dia, sempre. Combinado que não foi escrito não foi combinado — e é essa ata que você abre na reunião seguinte pra cobrar.">
        <div style={{ position: 'relative' }}>
          <button onClick={copiarAta} className="no-print"
            style={{ position: 'absolute', top: 10, right: 10, padding: '6px 12px', borderRadius: 8, border: `1px solid ${copiado ? '#BBF7D0' : BORDA}`, background: copiado ? '#F0FDF4' : '#fff', color: copiado ? '#15803D' : TINTA2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {copiado ? '✓ Copiado' : '📋 Copiar modelo'}
          </button>
          <pre style={{ margin: 0, border: `1px solid ${BORDA}`, borderRadius: 10, background: '#F8FAFC', padding: '16px 18px', fontSize: 12.5, lineHeight: 1.65, color: TINTA, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{ATA}</pre>
        </div>
        <div style={{ marginTop: 12, background: AZUL_CLARO, border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 15px', fontSize: 13, color: '#3730A3', lineHeight: 1.5 }}>
          <strong>Regra do combinado:</strong> toda linha precisa de responsável e data. Sem isso é opinião, não plano —
          e no mês seguinte ninguém lembra do que foi falado.
        </div>
      </Secao>

      {/* 8. DEPOIS */}
      <Secao n="08" titulo="Depois da reunião" sub="A oportunidade comercial nasce aqui, não no meio da conversa de resultado.">
        <Tabela
          colunas={['Dor que apareceu', 'Serviço que você pode propor na semana seguinte']}
          larguras="1fr 1.5fr"
          linhas={[
            ['Inadimplência alta', 'Gestão de cobrança com régua definida e relatório semanal'],
            ['Preço sem revisão há meses', 'Estudo de precificação e margem por produto ou serviço'],
            ['Caixa sempre apertado', 'Projeção de caixa 90 dias com revisão quinzenal'],
            ['Decisão no escuro', 'Reunião estratégica quinzenal em vez de mensal'],
            ['Sócios sem combinado', 'Política de pró-labore e distribuição de lucro'],
          ]}
        />
        <div style={{ marginTop: 12, fontSize: 13, color: TINTA2, lineHeight: 1.5 }}>
          Não venda no meio da reunião de resultado. Registre a dor, agradeça, e volte na semana seguinte com
          escopo e preço — proposta no susto desvaloriza o serviço e confunde o cliente.
        </div>
      </Secao>

      <div style={{ height: 1, background: BORDA, margin: '10px 0 16px' }} />
      <div style={{ fontSize: 12, color: TINTA3, lineHeight: 1.6 }}>
        Material complementar da aula <strong style={{ color: TINTA2 }}>Conversa Estratégica: Como Transformar Números em Decisão</strong>.
        Imprima e leve na reunião, ou deixe aberto numa aba durante a call.
      </div>
    </div>
  )
}
