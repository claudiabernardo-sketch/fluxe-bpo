import ApresentacaoConexao from '../components/apresentacao/ApresentacaoConexao'

// Aula "DRE: construindo relatórios que geram decisão" (Conexão BPO),
// mesma estrutura do material original da Cláudia.
const SLIDES = [
  { tipo: 'capa', titulo: 'DRE', sub: 'Construindo relatórios\nque geram decisão', foto: '/apresentacoes/claudia-laptop.jpg' },
  { tipo: 'frase', texto: 'Muitos profissionais enviam DREs todo mês, mas poucos realmente ajudam o cliente a entender', destaque: 'o que o relatório quer dizer.' },
  { tipo: 'lista', titulo: 'O problema é que', italico: 'a DRE não conta a história do mês', itens: [
    'O cliente recebe o relatório e não entende o que olhar primeiro.',
    'O BPO explica os números, mas não traduz o que eles significam em decisões.',
    'A DRE acaba virando um documento de prestação de contas, e não de inteligência financeira.',
  ], virada: 'a DRE precisa contar uma história: a história do resultado do mês.',
    rodape: 'A DRE não é um espelho do passado. É um mapa estratégico que mostra para onde o negócio está indo e o que precisa ser ajustado para crescer.' },
  { tipo: 'perguntas', antes: 'Antes de pensar em fórmulas, pense em perguntas:', titulo: 'O que o cliente', italico: 'realmente quer enxergar', perguntas: [
    'Estou tendo lucro de verdade ou só ilusão de caixa?',
    'Quanto cada venda realmente deixa de retorno?',
    'Qual o faturamento mínimo para eu não operar no vermelho?',
    'Onde estou perdendo margem?',
  ] },
  { tipo: 'frase', texto: 'Essas respostas vêm da DRE, quando ela é construída de forma inteligente. Por isso, ela precisa ser organizada de um jeito que faça sentido para o cliente,', destaque: 'não apenas para o contador.' },
  { tipo: 'tabela', titulo: 'A estrutura da DRE tradicional', italico: 'e como torná-la estratégica', colunas: ['Etapa', 'O que é', 'Pergunta que ajuda o cliente'], linhas: [
    ['Receita Bruta', 'Tudo o que foi vendido', 'Quanto vendi?'],
    ['Receita Líquida', 'Receita após impostos e devoluções', 'Quanto realmente entrou?'],
    ['Custos Diretos', 'Custos que variam com as vendas', 'Se eu não vender, esse custo existe?'],
    ['Despesas Fixas', 'Custos da estrutura da empresa', 'Pago isso mesmo sem vender?'],
    ['Margem de Contribuição', 'Quanto sobra para pagar fixos e gerar lucro', 'De cada R$ 100, quanto fica pra mim?'],
    ['Ponto de Equilíbrio', 'Faturamento mínimo para empatar', 'Quanto preciso vender pra não perder?'],
    ['Lucro Líquido', 'Resultado final', 'Quanto realmente ganhei no mês?'],
  ] },
  { tipo: 'dica', texto: 'Sempre que possível, explique a DRE com perguntas. Elas despertam raciocínio e criam envolvimento.' },
  { tipo: 'dois', kicker: 'O QUE O CLIENTE PRECISA COMPREENDER', titulo: 'Custos', italico: 'diretos e indiretos', lados: [
    { icone: '🏷️', titulo: 'Custos diretos', texto: 'Só existem se há venda. Sobem e descem junto com o faturamento.', exemplos: ['Mercadoria', 'Insumos', 'Comissão', 'Taxa de cartão', 'Frete de entrega'] },
    { icone: '🏢', titulo: 'Custos indiretos', texto: 'Existem mesmo sem venda. São o custo de manter a empresa aberta.', exemplos: ['Aluguel', 'Equipe fixa', 'Sistemas', 'Contador', 'Pró-labore'] },
  ], rodape: 'Quanto mais o cliente entende essa diferença, mais consciência ele tem para precificar corretamente e controlar despesas.' },
  { tipo: 'tabela', titulo: 'Indicadores que transformam', italico: 'números em decisões', colunas: ['Indicador', 'O que mostra', 'Se estiver baixo…'], larguras: '1fr 1.2fr 1.2fr', linhas: [
    ['Margem Bruta', 'Relação preço x custo direto', 'Preço errado ou custo alto'],
    ['Margem de Contribuição', 'Capacidade de cobrir os fixos', 'Custos variáveis altos'],
    ['Ponto de Equilíbrio', 'Faturamento mínimo pra empatar', 'Estrutura cara demais'],
    ['Margem Operacional', 'Eficiência da operação', 'Gestão ineficiente'],
    ['Margem Líquida', 'Resultado final', 'Despesas ou impostos altos'],
  ], rodape: 'Lembre-se: o poder da DRE está na interpretação, não nos cálculos.' },
  { tipo: 'indicadores', itens: [
    { nome: 'Margem Bruta', desc: 'Mostra quanto sobra das vendas depois de pagar o custo direto.', formula: '(Receita líquida − Custos diretos) ÷ Receita líquida', faixas: ['Comércio: 25% a 40%', 'Indústria: 35% a 55%', 'Serviços: 50% a 80%'], baixo: 'custos altos ou preço mal definido.', alto: 'precificação estratégica e produto de valor agregado.' },
    { nome: 'Margem de Contribuição', desc: 'Revela o quanto sobra para pagar os fixos e gerar lucro.', formula: '(Receita líquida − Custos variáveis) ÷ Receita líquida', faixas: ['Comércio: 25% a 40%', 'Indústria: 30% a 50%', 'Serviços: 50% a 70%'], baixo: 'custos variáveis altos (comissão, insumos).', alto: 'folga para crescer com segurança.' },
  ] },
  { tipo: 'indicadores', itens: [
    { nome: 'Ponto de Equilíbrio', desc: 'Mostra o faturamento mínimo para empatar.', formula: 'Despesas fixas ÷ Margem de contribuição (%)', faixasTitulo: 'IDEAL', faixas: ['Faturamento real ≥ 20% acima do PE'], extra: 'PE abaixo do faturamento → lucro. PE igual → risco. PE acima → prejuízo ou estrutura cara demais.' },
    { nome: 'Margem Operacional', desc: 'Mostra a eficiência da operação antes de impostos e juros.', formula: 'Lucro operacional ÷ Receita líquida', faixasTitulo: 'FAIXA SAUDÁVEL', faixas: ['Comércio: 8% a 15%', 'Indústria: 10% a 20%', 'Serviços: 15% a 30%'], baixo: 'fixos altos ou desorganização.', alto: 'boa gestão e controle.' },
  ] },
  { tipo: 'indicadores', itens: [
    { nome: 'Margem Líquida', desc: 'Percentual de lucro efetivo do negócio.', formula: 'Lucro líquido ÷ Receita líquida', faixas: ['Comércio: 5% a 10%', 'Indústria: 8% a 15%', 'Serviços: 10% a 25%'], baixo: 'juros, impostos ou despesas em excesso.', alto: 'gestão eficiente e operação saudável.' },
    { nome: 'Como definir parâmetros', desc: 'Evite se basear apenas em médias de mercado. Combine 3 níveis:', formula: 'Exemplo: "Vamos subir a margem líquida de 8% para 12% em 4 meses."', faixasTitulo: 'OS 3 NÍVEIS', faixas: ['Mercado: IBGE, Sebrae, benchmarks', 'Histórico do cliente: últimos 6 a 12 meses', 'Meta personalizada: realista e progressiva'] },
  ] },
  { tipo: 'frase', texto: 'Uma boa DRE não é o fim do processo, é o início da conversa estratégica. Ela revela gargalos, mostra oportunidades e ajuda o empresário a decidir com base em fatos. Seu papel como profissional financeiro é', destaque: 'traduzir números em clareza.' },
  { tipo: 'final', texto: 'Quando o cliente entende o que cada linha representa, ele passa a enxergar o financeiro como uma bússola, e você como', destaque: 'um verdadeiro parceiro de crescimento.', foto: '/apresentacoes/claudia-sentada.jpg' },
]

export default function ApresentacaoDREPage() {
  return <ApresentacaoConexao slides={SLIDES} rotulo="DRE PARA DECISÃO" />
}
