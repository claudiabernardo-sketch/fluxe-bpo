import ApresentacaoConexao from '../components/apresentacao/ApresentacaoConexao'

// Aula "Conversa Estratégica: como transformar números em decisão" (Conexão
// BPO), irmã das aulas de DRE e Fluxo de Caixa. Aquelas duas ensinam a montar
// o relatório; esta ensina o que fazer com ele na frente do empresário —
// preparação, apresentação, leitura de indicadores, diagnóstico,
// recomendação, condução da conversa e a virada pra oportunidade.
const SLIDES = [
  { tipo: 'capa', titulo: 'Conversa Estratégica', tituloTamanho: 72, sub: 'Como transformar números\nem decisão do empresário', foto: '/apresentacoes/claudia-laptop.jpg' },

  { tipo: 'frase', texto: 'Você fecha o mês, monta a DRE, manda no dia 5. O cliente responde "obrigada, recebi". E no mês seguinte os mesmos problemas aparecem de novo. O relatório foi entregue,', destaque: 'mas nada foi decidido.' },

  { tipo: 'lista', titulo: 'Por que a reunião', italico: 'não muda nada', itens: [
    'O BPO chega sem preparo e descobre os números junto com o cliente, ao vivo.',
    'A conversa vira leitura de planilha: linha por linha, sem hierarquia, sem foco.',
    'Termina sem ninguém saber o que fazer na segunda-feira de manhã.',
  ], virada: 'reunião não é prestação de contas. É o momento em que o número vira decisão.',
    rodape: 'O empresário não contratou um relatório. Ele contratou alguém que olha os números por ele e diz o que precisa ser feito.' },

  { tipo: 'frase', texto: 'A reunião estratégica é o produto do BPO. Todo o resto — conciliação, pagamento, lançamento — é', destaque: 'o que você faz para poder ter essa conversa.' },

  // ── 1. PREPARAÇÃO ──────────────────────────────────────────────────────
  { tipo: 'tabela', titulo: 'Preparação', italico: 'o trabalho que ninguém vê', colunas: ['O que fazer antes', 'Por que isso importa'], larguras: '1fr 1.3fr', linhas: [
    ['Fechar e auditar o mês', 'Número errado na reunião custa a confiança de meses de trabalho.'],
    ['Comparar com os 3 meses anteriores', 'Um mês isolado não diz nada. A tendência é que conta a história.'],
    ['Escolher os 3 pontos da reunião', 'Se tudo é importante, nada é. Três pontos é o que cabe na cabeça de alguém.'],
    ['Escrever a recomendação antes', 'Se você não consegue escrever, você ainda não entendeu o número.'],
    ['Revisar o combinado do mês passado', 'Cobrar o que ficou acordado é o que separa parceiro de fornecedor.'],
  ], rodape: 'Regra: você chega na reunião sabendo o que vai recomendar. A conversa serve para validar e ajustar, não para descobrir.' },

  { tipo: 'dica', texto: 'Nunca entre numa reunião para ver o número junto com o cliente. Quem descobre ao vivo não conduz, só reage.' },

  // ── 2. APRESENTAR RESULTADOS ───────────────────────────────────────────
  { tipo: 'perguntas', antes: 'Toda reunião boa responde quatro perguntas, nesta ordem:', titulo: 'O roteiro que', italico: 'o empresário espera', perguntas: [
    'O que aconteceu no mês?',
    'Por que aconteceu?',
    'O que isso significa daqui pra frente?',
    'O que a gente vai fazer a respeito?',
  ] },

  { tipo: 'tabela', titulo: 'A sequência da reunião', italico: 'do topo para o detalhe', colunas: ['Momento', 'Tempo', 'O que você faz'], larguras: '1fr 0.5fr 1.6fr', linhas: [
    ['Resultado do mês', '2 min', 'Lucro, caixa e a comparação com o mês anterior. Só isso.'],
    ['O que explica o resultado', '8 min', 'Os 2 ou 3 movimentos que mais pesaram, com valor e causa.'],
    ['Projeção', '5 min', 'O que acontece nos próximos 30 a 60 dias se nada mudar.'],
    ['Recomendações', '10 min', 'O que fazer, quem faz, até quando.'],
    ['Combinados', '5 min', 'Registrar decisões e prazos. Enviar por escrito no mesmo dia.'],
  ], rodape: 'Comece sempre pelo resultado, nunca pelo detalhe. Detalhe sem contexto parece problema; contexto primeiro transforma detalhe em explicação.' },

  { tipo: 'frase', texto: 'O empresário não precisa ver todas as linhas. Ele precisa saber se o mês foi bom, por quê, e o que fazer agora. O resto', destaque: 'é o seu trabalho, não o dele.' },

  // ── 3. EXPLICAR INDICADORES ────────────────────────────────────────────
  { tipo: 'indicadores', itens: [
    { nome: 'Margem de Contribuição', desc: 'Explique assim: de cada R$ 100 que entram, quanto sobra depois de pagar o que só existe porque você vendeu.', formula: 'Fale em reais, não só em percentual: "sobraram R$ 38 de cada R$ 100"', faixasTitulo: 'O QUE A QUEDA SIGNIFICA', faixas: ['Preço corroído por desconto', 'Custo de insumo ou taxa subiu', 'Mix mudou para produto pior'], baixo: 'cada venda nova ajuda menos a pagar a estrutura.', alto: 'espaço real para crescer sem aumentar o risco.' },
    { nome: 'Ponto de Equilíbrio', desc: 'Explique assim: o faturamento mínimo para a empresa não dar prejuízo no mês.', formula: 'Traduza em meta diária: "você precisa vender R$ 4.800 por dia útil"', faixasTitulo: 'COMO USAR NA CONVERSA', faixas: ['Compare com o faturamento real', 'Mostre a folga (ou a falta dela)', 'Transforme em meta de equipe'], baixo: 'estrutura enxuta, margem de manobra.', alto: 'a empresa trabalha muito só para se pagar.' },
  ] },

  { tipo: 'indicadores', itens: [
    { nome: 'Prazo Médio de Recebimento', desc: 'Explique assim: quantos dias o dinheiro da venda demora a entrar de verdade.', formula: 'Conecte com o pagamento: "você recebe em 47 dias e paga em 21"', faixasTitulo: 'O QUE REVELA', faixas: ['Descasamento de caixa', 'Política de prazo mal feita', 'Cobrança frouxa'], baixo: 'caixa gira rápido, menos necessidade de capital.', alto: 'a empresa financia o cliente com o próprio caixa.' },
    { nome: 'Inadimplência', desc: 'Explique assim: quanto do que você já vendeu e já trabalhou pode nunca entrar.', formula: 'Traduza em esforço: "isso equivale a 11 dias de faturamento"', faixasTitulo: 'COMO USAR NA CONVERSA', faixas: ['Separe por faixa de atraso', 'Mostre os 5 maiores devedores', 'Proponha régua de cobrança'], baixo: 'carteira saudável e processo de cobrança ativo.', alto: 'lucro no papel que não vira dinheiro.' },
  ] },

  { tipo: 'dois', kicker: 'COMO EXPLICAR UM INDICADOR', titulo: 'O que funciona', italico: 'e o que trava a conversa', lados: [
    { icone: '✅', titulo: 'Funciona', texto: 'Linguagem de dono, não de contador.', exemplos: ['Traduzir em reais e em dias', 'Comparar com o próprio histórico', 'Dizer o que o número provoca', 'Uma ideia por vez', 'Parar e perguntar se ficou claro'] },
    { icone: '🚫', titulo: 'Trava', texto: 'Vocabulário técnico vira barreira.', exemplos: ['Sigla sem tradução', 'Só percentual, sem valor', 'Cinco indicadores de uma vez', 'Comparar com "média de mercado"', 'Explicar a fórmula, não o significado'] },
  ], rodape: 'Teste honesto: se o empresário não consegue repetir o indicador com as palavras dele, você ainda não explicou.' },

  // ── 4. IDENTIFICAR PROBLEMAS ───────────────────────────────────────────
  { tipo: 'tabela', titulo: 'Do sintoma à causa', italico: 'o número é pista, não diagnóstico', colunas: ['O que você vê', 'Pergunta que investiga', 'Causa provável'], larguras: '1fr 1.4fr 1.2fr', linhas: [
    ['Faturou mais e sobrou menos', 'O que foi vendido mudou?', 'Mix pior ou desconto demais'],
    ['Lucro positivo, caixa negativo', 'Está recebendo quando?', 'Prazo descasado ou inadimplência'],
    ['Despesa fixa subindo', 'Entrou gente ou sistema novo?', 'Estrutura crescendo antes da receita'],
    ['Margem caindo todo mês', 'O preço acompanhou o custo?', 'Preço congelado há tempo demais'],
    ['Resultado oscilando muito', 'Depende de poucos clientes?', 'Concentração de receita'],
  ], rodape: 'Nunca leve o sintoma como conclusão. Leve a hipótese e os dados que a sustentam — e deixe o empresário confirmar com o que só ele sabe.' },

  { tipo: 'dica', texto: 'O número mostra onde doer. Só a conversa com quem vive o negócio revela por quê.' },

  // ── 5. GERAR RECOMENDAÇÕES ─────────────────────────────────────────────
  { tipo: 'lista', titulo: 'Anatomia de uma', italico: 'recomendação que vira ação', itens: [
    'O que fazer, numa frase que cabe num WhatsApp.',
    'Quanto isso muda, em reais e em prazo.',
    'Quem faz e até quando, com nome e data.',
  ], virada: 'recomendação sem responsável e sem prazo é opinião, não plano.',
    rodape: 'Três recomendações por reunião. Mais do que isso ninguém executa, e você perde a autoridade da próxima.' },

  { tipo: 'tabela', titulo: 'A mesma análise', italico: 'dita de dois jeitos', colunas: ['Como quase todo BPO fala', 'Como o BPO estratégico fala'], larguras: '1fr 1.25fr', linhas: [
    ['"A margem caiu."', '"A margem caiu 4 pontos e isso custou R$ 12 mil no mês. Foi desconto no produto A."'],
    ['"A inadimplência aumentou."', '"R$ 38 mil estão vencidos há mais de 30 dias. Proponho régua de cobrança a partir de segunda."'],
    ['"As despesas subiram."', '"Subiram R$ 9 mil, R$ 7 mil são as duas contratações de março. É previsto ou saiu do plano?"'],
    ['"O caixa está apertado."', '"Em 22 dias o caixa fica negativo se nada mudar. Duas saídas: antecipar recebível ou adiar o investimento."'],
  ], rodape: 'A diferença não é o dado. É o valor, a causa e o próximo passo colados nele.' },

  // ── 6. CONDUZIR A CONVERSA ─────────────────────────────────────────────
  { tipo: 'perguntas', antes: 'Perguntas que fazem o empresário pensar junto com você:', titulo: 'Como conduzir', italico: 'sem entregar pronto', perguntas: [
    'Esse resultado te surpreendeu ou você já esperava?',
    'O que mudou na operação neste mês?',
    'Se tivesse que escolher um problema para resolver, qual seria?',
    'O que te impede de fazer isso hoje?',
  ] },

  { tipo: 'dois', kicker: 'A POSTURA NA REUNIÃO', titulo: 'Conduzir', italico: 'não é dominar a conversa', lados: [
    { icone: '🎯', titulo: 'Faça', texto: 'Você guia, ele decide.', exemplos: ['Fale 40%, escuta 60%', 'Pergunte antes de concluir', 'Registre a decisão na hora', 'Dê o próximo passo sempre', 'Envie a ata no mesmo dia'] },
    { icone: '⚠️', titulo: 'Evite', texto: 'Erros que custam autoridade.', exemplos: ['Pedir desculpa por número ruim', 'Culpar o cliente pelo resultado', 'Prometer o que não controla', 'Deixar a reunião sem combinado', 'Reabrir assunto já decidido'] },
  ], rodape: 'Número ruim não é fracasso seu. Número ruim que você não viu antes, sim.' },

  // ── 7. ANÁLISE VIRA OPORTUNIDADE ───────────────────────────────────────
  { tipo: 'frase', texto: 'Toda dor que aparece na reunião é um serviço esperando para ser oferecido. Cobrança frouxa, preço defasado, caixa descasado —', destaque: 'isso tem nome, escopo e preço.' },

  { tipo: 'tabela', titulo: 'Da dor na reunião', italico: 'à proposta na mesa', colunas: ['O que apareceu', 'O que você pode oferecer'], larguras: '1fr 1.3fr', linhas: [
    ['Inadimplência alta', 'Gestão de cobrança com régua e relatório semanal'],
    ['Preço sem revisão há meses', 'Estudo de precificação e margem por produto'],
    ['Caixa sempre apertado', 'Projeção de caixa 90 dias com revisão quinzenal'],
    ['Decisão no escuro', 'Reunião estratégica quinzenal, não mensal'],
    ['Sócios sem combinado', 'Política de pró-labore e distribuição de lucro'],
  ], rodape: 'Não venda no meio da reunião de resultado. Registre a dor, traga a proposta estruturada na semana seguinte.' },

  { tipo: 'frase', texto: 'O BPO que só entrega relatório é substituível por um sistema mais barato. O BPO que conduz a decisão', destaque: 'vira parte do negócio do cliente.' },

  { tipo: 'final', texto: 'Quando o empresário sai da reunião sabendo exatamente o que fazer na segunda-feira, você deixou de ser quem organiza o financeiro e passou a ser', destaque: 'quem ajuda a empresa a crescer.', foto: '/apresentacoes/claudia-sentada.jpg' },
]

export default function ApresentacaoConversaEstrategicaPage() {
  return <ApresentacaoConexao slides={SLIDES} rotulo="NÚMEROS QUE VIRAM DECISÃO" />
}
