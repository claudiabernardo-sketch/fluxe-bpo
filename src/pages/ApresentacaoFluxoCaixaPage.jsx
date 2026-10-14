import ApresentacaoConexao from '../components/apresentacao/ApresentacaoConexao'

// Aula "Fluxo de Caixa: enxergando o dinheiro antes que ele falte"
// (Conexão BPO), irmã da aula de DRE, mesma estrutura e mesmo visual.
const SLIDES = [
  { tipo: 'capa', titulo: 'Fluxo de Caixa', tituloTamanho: 96, sub: 'Enxergando o dinheiro\nantes que ele falte', foto: '/apresentacoes/claudia-laptop.jpg' },
  { tipo: 'frase', texto: 'Empresa não quebra por falta de lucro. Empresa quebra', destaque: 'por falta de caixa.' },
  { tipo: 'lista', titulo: 'O problema é que', italico: 'o cliente só olha o saldo do banco', itens: [
    'O cliente decide pelo saldo de hoje, sem saber o que vence amanhã.',
    'O BPO registra o que já aconteceu, mas não mostra o que vem pela frente.',
    'A falta de caixa só aparece quando a conta vence, e aí já é tarde para escolher.',
  ], virada: 'o fluxo de caixa precisa olhar pra frente: ele é o radar do dinheiro.',
    rodape: 'O fluxo de caixa não é um extrato bonito. É a ferramenta que avisa, com semanas de antecedência, quando vai faltar e quanto vai sobrar.' },
  { tipo: 'perguntas', antes: 'Antes de pensar em planilha, pense em perguntas:', titulo: 'O que o cliente', italico: 'realmente quer enxergar', perguntas: [
    'Vou ter dinheiro pra pagar as contas deste mês?',
    'Em que semana o caixa vai apertar?',
    'Quanto posso retirar sem descapitalizar a empresa?',
    'Vou precisar de capital de giro ou de empréstimo?',
  ] },
  { tipo: 'frase', texto: 'Essas respostas vêm do fluxo de caixa, quando ele é projetado e não só registrado. Por isso, ele precisa ser organizado de um jeito que o cliente', destaque: 'consiga decidir olhando pra ele.' },
  { tipo: 'tabela', titulo: 'A estrutura do fluxo de caixa', italico: 'e como torná-lo estratégico', colunas: ['Etapa', 'O que é', 'Pergunta que ajuda o cliente'], linhas: [
    ['Saldo Inicial', 'O dinheiro disponível no começo do período', 'Com quanto eu começo?'],
    ['Entradas Operacionais', 'Recebimentos de clientes, cartões e plataformas', 'Quanto vai entrar, e quando?'],
    ['Saídas Operacionais', 'Fornecedores, folha, impostos, despesas fixas', 'Quanto vai sair, e quando?'],
    ['Geração de Caixa Operacional', 'Entradas menos saídas da operação', 'A operação se paga sozinha?'],
    ['Investimentos', 'Compra de equipamentos, reformas, sistemas', 'Estou investindo com dinheiro que tenho?'],
    ['Financiamentos e Sócios', 'Empréstimos, parcelas, aportes e retiradas', 'Estou tapando buraco com dívida?'],
    ['Saldo Final Projetado', 'Quanto vai sobrar no fim de cada semana', 'Quando o caixa aperta?'],
  ] },
  { tipo: 'dica', etiqueta: 'DICA', texto: 'Mostre o fluxo em semanas, não só em meses. É na semana que a conta vence.' },
  { tipo: 'dois', kicker: 'O QUE O CLIENTE PRECISA COMPREENDER', titulo: 'Lucro', italico: 'não é caixa', lados: [
    { icone: '📊', titulo: 'DRE (competência)', texto: 'Mostra se a empresa ganhou ou perdeu dinheiro no mês, pela data em que a venda e a despesa aconteceram.', exemplos: ['Venda a prazo entra no mês da venda', 'Depreciação aparece', 'Empréstimo não aparece', 'Retirada não aparece'] },
    { icone: '💵', titulo: 'Fluxo de caixa', texto: 'Mostra se tem dinheiro na conta, pela data em que o dinheiro realmente entrou ou saiu.', exemplos: ['Venda a prazo entra quando receber', 'Compra de equipamento sai inteira', 'Parcela do empréstimo sai', 'Retirada do sócio sai'] },
  ], rodape: 'Uma empresa pode dar lucro e ficar sem caixa, ou ter caixa e estar no prejuízo. O cliente precisa ver as duas coisas.' },
  { tipo: 'tabela', titulo: 'Indicadores que transformam', italico: 'caixa em decisão', colunas: ['Indicador', 'O que mostra', 'Se estiver ruim…'], larguras: '1fr 1.2fr 1.2fr', linhas: [
    ['Prazo Médio de Recebimento', 'Em quantos dias o cliente paga', 'Vende a prazo demais ou cobra mal'],
    ['Prazo Médio de Pagamento', 'Em quantos dias a empresa paga', 'Paga antes de receber'],
    ['Ciclo Financeiro', 'Quantos dias a empresa financia a operação', 'Precisa de capital de giro'],
    ['Geração de Caixa Operacional', 'Se a operação se paga sozinha', 'Vive de empréstimo ou aporte'],
    ['Reserva de Caixa', 'Quantos meses o caixa aguenta', 'Qualquer imprevisto vira crise'],
  ], rodape: 'Lembre-se: o poder do fluxo de caixa está em olhar pra frente.' },
  { tipo: 'indicadores', itens: [
    { nome: 'Prazo Médio de Recebimento', desc: 'Mostra em quantos dias, em média, o dinheiro das vendas entra no caixa.', formula: 'Contas a receber ÷ Faturamento do mês × 30', faixasTitulo: 'O QUE OLHAR', faixas: ['Cartão de crédito: 30 dias', 'Boleto a prazo: o que foi combinado', 'Plataformas: prazo de saque'], baixo: 'o dinheiro entra rápido, ótimo pro caixa.', alto: 'a empresa está financiando o cliente.' },
    { nome: 'Prazo Médio de Pagamento', desc: 'Mostra em quantos dias, em média, a empresa paga fornecedores.', formula: 'Contas a pagar ÷ Compras do mês × 30', faixasTitulo: 'IDEAL', faixas: ['Pagar depois de receber', 'PMP maior que PMR'], baixo: 'paga rápido demais, aperta o caixa.', alto: 'boa negociação com fornecedores.' },
  ] },
  { tipo: 'indicadores', itens: [
    { nome: 'Ciclo Financeiro', desc: 'Quantos dias a empresa precisa bancar a operação com dinheiro próprio.', formula: 'Prazo de recebimento + Prazo de estoque − Prazo de pagamento', faixasTitulo: 'COMO LER', faixas: ['Negativo: o fornecedor financia você', 'Positivo: você financia a operação'], extra: 'Quanto maior o ciclo, mais capital de giro a empresa precisa ter parado.' },
    { nome: 'Necessidade de Capital de Giro', desc: 'Quanto dinheiro precisa estar disponível pra girar a operação sem apertar.', formula: '(Custos e despesas do mês ÷ 30) × Ciclo financeiro', faixasTitulo: 'EXEMPLO', faixas: ['Custos de R$ 60 mil/mês', 'Ciclo de 25 dias', 'Capital de giro ≈ R$ 50 mil'], baixo: 'operação enxuta, gira rápido.', alto: 'hora de negociar prazos ou rever a política de vendas a prazo.' },
  ] },
  { tipo: 'indicadores', itens: [
    { nome: 'Reserva de Caixa', desc: 'Quantos meses a empresa aguenta pagando os fixos, mesmo sem vender.', formula: 'Saldo em caixa ÷ Despesas fixas mensais', faixasTitulo: 'REFERÊNCIA COMUM', faixas: ['Mínimo: 1 mês de fixos', 'Confortável: 3 meses', 'Negócio sazonal: mais'], baixo: 'qualquer atraso de cliente vira crise.', alto: 'tranquilidade pra investir e negociar.' },
    { nome: 'Como definir parâmetros', desc: 'Não existe número mágico: combine 3 níveis, como na DRE.', formula: 'Exemplo: "Vamos montar uma reserva de 2 meses de fixos até março."', faixasTitulo: 'OS 3 NÍVEIS', faixas: ['Mercado: prazos usuais do setor', 'Histórico do cliente: últimos 6 a 12 meses', 'Meta personalizada: realista e progressiva'] },
  ] },
  { tipo: 'frase', texto: 'Um bom fluxo de caixa não é o registro do que passou, é o aviso do que vem. Ele mostra quando antecipar, quando negociar e quanto dá pra retirar. Seu papel como profissional financeiro é', destaque: 'dar tempo pro cliente decidir.' },
  { tipo: 'final', texto: 'Quando o cliente enxerga o caixa das próximas semanas, ele para de apagar incêndio e passa a ver você como', destaque: 'quem cuida do fôlego do negócio.', foto: '/apresentacoes/claudia-sentada.jpg' },
]

export default function ApresentacaoFluxoCaixaPage() {
  return <ApresentacaoConexao slides={SLIDES} rotulo="FLUXO DE CAIXA PARA DECISÃO" />
}
