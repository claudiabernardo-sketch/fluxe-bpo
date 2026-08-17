import { useState } from 'react'
import { useCreateFluxeBug } from '../hooks/useData'

// Recorta um trecho do conteúdo em volta do termo buscado, pra dar contexto
// no resultado da busca (em vez de só mostrar o início do artigo sempre).
function trechoComContexto(conteudo, termo, raio = 70) {
  const idx = conteudo.toLowerCase().indexOf(termo.toLowerCase())
  if (idx === -1) return conteudo.slice(0, raio * 2) + (conteudo.length > raio * 2 ? '…' : '')
  const ini = Math.max(0, idx - raio)
  const fim = Math.min(conteudo.length, idx + termo.length + raio)
  return (ini > 0 ? '…' : '') + conteudo.slice(ini, fim) + (fim < conteudo.length ? '…' : '')
}

// Destaca a primeira ocorrência do termo dentro do texto (case-insensitive)
function destacarTermo(texto, termo) {
  if (!termo) return texto
  const idx = texto.toLowerCase().indexOf(termo.toLowerCase())
  if (idx === -1) return texto
  return (
    <>
      {texto.slice(0, idx)}
      <mark style={{ background:'#FEF08A', color:'#78350F', borderRadius:2, padding:'0 1px' }}>
        {texto.slice(idx, idx + termo.length)}
      </mark>
      {texto.slice(idx + termo.length)}
    </>
  )
}

const CATS = [
  {
    id:'inicio', icon:'fa-solid fa-rocket', cor:'#6366F1', bg:'#EEF2FF',
    titulo:'Primeiros Passos', artigos:[
      { titulo:'Visão geral do Fluxe BPO', tempo:'3 min', conteudo:'O Fluxe é uma plataforma de gestão operacional para escritórios de BPO. Aqui você gerencia clientes, esteiras de processos, tarefas recorrentes, equipe e resultados em um só lugar. Acesse a Central Operacional (ícone de foguete) para ver o painel em tempo real.' },
      { titulo:'Cadastrar empresa e equipe', tempo:'5 min', conteudo:'Vá em Configurações > Empresa para preencher os dados do seu BPO. Em seguida, acesse Configurações > Equipe para convidar colaboradores por e-mail e definir seus perfis: Admin, Gestor, Supervisor, Operador ou Comercial.' },
      { titulo:'Criar o primeiro cliente', tempo:'2 min', conteudo:'Acesse o módulo Clientes e clique em "Novo cliente". Preencha nome, CNPJ e contato. Depois, vá em Modelos, selecione esse cliente e vincule os modelos de tarefa contratados — é isso que ativa a rotina e faz as tarefas recorrentes serem geradas automaticamente todo dia.' },
      { titulo:'Cadastrar um novo colaborador', tempo:'3 min', conteudo:'Acesse Configurações > Equipe e clique em "+ Convidar membro". Preencha nome, e-mail, escolha o Perfil de acesso (esse é o momento de decidir o que essa pessoa vai poder ver no Fluxe — veja o artigo "Os tipos de acesso e o que cada um vê") e o custo/hora dela, que alimenta a Precificação e a Capacidade da Equipe. Ao clicar em "Enviar convite", o Fluxe cria o acesso e manda um e-mail com o link de primeiro login; se o e-mail não chegar, aparece um botão pra copiar login e senha e mandar por WhatsApp.' },
      { titulo:'Alterar o perfil de um colaborador', tempo:'2 min', conteudo:'Em Configurações > Equipe, encontre a pessoa na lista e clique no ícone de lápis (✏) na frente do nome dela. No formulário que abre, troque o campo "Perfil" pelo novo nível de acesso e clique em Salvar. A mudança vale a partir do próximo login (ou do próximo recarregamento da página, se a pessoa já estiver com o Fluxe aberto) — não precisa recriar o cadastro nem reenviar convite.' },
      { titulo:'Os tipos de acesso e o que cada um vê', tempo:'4 min', conteudo:'Início (Dashboard), Meu Painel, Ajuda e Central Operacional aparecem pra todo mundo, em qualquer perfil. O que muda é o resto:\n\nAdmin: acesso total a tudo, sem exceção — inclusive Configurações, Segurança, Integrações e o plano de assinatura do Fluxe. Costuma ser o dono do BPO ou o sócio.\n\nGestor: acesso quase total — vê e usa Tarefas, Modelos, CRM, Precificação, Clientes, Esteiras, Executivo, Rentabilidade, Equipe, Cofre, Relatórios, Mentoria, Plano de Negócio e Configurações — menos as abas de Integrações, Segurança e o Meu Plano (financeiro da assinatura), que ficam só com o Admin. Perfil pra quem coordena a operação no dia a dia.\n\nSupervisor: acesso operacional amplo, mas sem dado financeiro estratégico — vê Tarefas, Modelos, Pendências, Avulsas, Clientes, Esteiras e Mensagens. Não vê CRM, Precificação, Executivo, Rentabilidade, Equipe (custo/hora), Cofre nem Configurações.\n\nOperador: o mais restrito — só o necessário pra executar o trabalho: Tarefas, Avulsas e Clientes (sem as abas Financeiro, Radar, Relatório 360 e Cofre, que ficam ocultas mesmo dentro do cadastro do cliente).\n\nComercial: foco em vendas — CRM, Precificação e Clientes, sem acesso à operação (Tarefas, Modelos, Esteiras) nem a Configurações.\n\nEm todo perfil que não seja Admin, o item de menu some sozinho quando a pessoa não tem acesso àquela tela — e mesmo se ela tentar entrar direto pelo link, o Fluxe redireciona pro Dashboard.' },
    ]
  },
  {
    id:'clientes', icon:'fa-solid fa-building', cor:'#0EA5E9', bg:'#F0F9FF',
    titulo:'Clientes', artigos:[
      { titulo:'Cadastrar e editar clientes', tempo:'3 min', conteudo:'No módulo Clientes, clique em "Novo cliente" e preencha os dados. Depois de salvo, o vínculo com os modelos de tarefa (o que ativa a rotina do cliente) é feito na tela Modelos, não no próprio cadastro — veja o artigo "Vincular modelos ao cliente".' },
      { titulo:'Vincular modelos ao cliente', tempo:'2 min', conteudo:'Acesse o módulo Modelos e selecione o cliente no filtro do topo da tela. O Fluxe cruza as Rotinas cadastradas do cliente com os modelos disponíveis e mostra um botão "Vincular" pra cada um. Assim que o primeiro modelo é vinculado, a operação do cliente ativa sozinha — não existe um botão separado de "iniciar operação". Cada vínculo pode ter recorrência e checklist próprios pra aquele cliente, sem alterar o modelo original nem afetar outros clientes.' },
      { titulo:'Pausar, reativar ou inativar um cliente', tempo:'2 min', conteudo:'Não existe "arquivar" cliente — são dois controles diferentes. O campo "Status" na aba Financeiro (Ativo, Onboarding, Implantação, Pausado ou Inativo) é uma etiqueta comercial, só organiza a visualização — use o filtro de Status na lista de Clientes pra ver quem está em cada situação. Já pra realmente suspender a geração automática de tarefas, use o botão "⏸ Pausar" no topo do cadastro do cliente; pra retomar, "▶ Reativar" aparece no lugar dele. O histórico de tarefas já geradas nunca é apagado, nem quando o cliente está pausado ou inativo.' },
    ]
  },
  {
    id:'radar', icon:'fa-solid fa-satellite-dish', cor:'#EC4899', bg:'#FDF2F8',
    titulo:'Radar do Cliente', artigos:[
      { titulo:'O que é o Radar', tempo:'4 min', conteudo:'O Radar mostra a saúde de cada cliente em até 13 áreas (Recebíveis, Pagamentos, Fluxo de Caixa, Equipe, Comercial, entre outras), cada uma com um semáforo verde/amarelo/vermelho. Ele calcula automaticamente a partir das tarefas em dia, mas fica mais preciso quando você preenche os números reais. Quando o score geral fica amarelo ou vermelho, aparece um botão "📲 Avisar time no WhatsApp" que já monta uma mensagem pronta com o resumo do score e as áreas críticas — só escolher pra quem mandar.', video:null },
      { titulo:'Preencher os números reais do mês', tempo:'4 min', conteudo:'Abra o cliente, aba Radar, e preencha "Em aberto a receber", "Recebido", "Em aberto a pagar", "Pago" e "Saldo em caixa" daquele mês. O Radar passa a calcular Recebíveis, Pagamentos, Caixa e Fluxo de Caixa com base nesses valores reais, em vez de só olhar tarefa em dia.', video:null },
      { titulo:'Ajuste manual de uma área', tempo:'2 min', conteudo:'Se você sabe que uma área está diferente do que o sistema calculou (ex: o cliente avisou de um problema que ainda não virou tarefa), edite o semáforo daquela área manualmente direto na aba Radar, com uma observação. O ajuste manual tem prioridade sobre o cálculo automático, mas vale por 30 dias — depois disso, expira sozinho e o Radar volta a mostrar o cálculo automático daquela área.' },
      { titulo:'Relatório 360°', tempo:'3 min', conteudo:'Na aba "Relatório 360" do cliente, o Fluxe monta um relatório pronto pra imprimir ou salvar como PDF (usando "Salvar como PDF" na tela de impressão do navegador), com o histórico do Radar dos últimos meses — ideal pra levar pra reunião com o cliente.' },
    ]
  },
  {
    id:'precificacao', icon:'fa-solid fa-tag', cor:'#F59E0B', bg:'#FFFBEB',
    titulo:'Precificação', artigos:[
      { titulo:'Como funciona a Precificação consultiva', tempo:'4 min', conteudo:'A calculadora monta uma proposta em etapas: escopo do cliente, horas estimadas, custo real da equipe e valor final. Ela já usa o custo/hora configurado em Equipe pra sugerir uma margem saudável.' },
      { titulo:'Aviso de capacidade ao fechar proposta', tempo:'2 min', conteudo:'Na última etapa, o Fluxe mostra se fechar aquele cliente cabe na capacidade atual da sua equipe (verde, amarelo ou vermelho), com base nas horas disponíveis e já comprometidas. Ajuda a não aceitar cliente demais pro time atual.' },
    ]
  },
  {
    id:'capacidade', icon:'fa-solid fa-users-gear', cor:'#6366F1', bg:'#EEF2FF',
    titulo:'Capacidade da Equipe', artigos:[
      { titulo:'Ocupação da equipe', tempo:'2 min', conteudo:'Mostra quantas horas cada analista já usou no mês frente às horas configuradas dele. Configure horas/mês e custo/hora de cada um em Configurações > Equipe pra esse cálculo ficar preciso.' },
      { titulo:'Previsão de crescimento e quando contratar', tempo:'3 min', conteudo:'Com base no ritmo real de novos clientes dos últimos 6 meses, o Fluxe projeta em quantos meses a equipe deve estourar 85% de ocupação, e sugere a data limite pra começar o processo seletivo (o tempo de contratação é configurável).' },
      { titulo:'Simule um cenário ("e se")', tempo:'3 min', conteudo:'Teste hipóteses antes de decidir: "e se eu fechar mais 3 clientes de R$1.200 cada?" mostra o impacto na ocupação, no MRR e na margem da carteira, sem gravar nada — é só uma calculadora.' },
    ]
  },
  {
    id:'crm', icon:'fa-solid fa-chart-line', cor:'#8B5CF6', bg:'#F5F3FF',
    titulo:'CRM Comercial', artigos:[
      { titulo:'Pipeline de leads', tempo:'3 min', conteudo:'Cadastre leads e acompanhe cada um pelas etapas do funil comercial: Lead novo → Contato → Diagnóstico → Proposta → Fechado (ou Perdido, se não fechar). Vincule direto com uma proposta gerada na Precificação.' },
      { titulo:'Buscar um lead', tempo:'1 min', conteudo:'Na barra de ações do CRM, use o campo "🔍 Buscar por nome, contato, e-mail..." pra encontrar um lead rapidamente. A busca considera nome/razão social, nome fantasia, contato, e-mail e WhatsApp — funciona tanto na visão Kanban quanto na Lista.' },
      { titulo:'Excluir um lead', tempo:'2 min', conteudo:'Abra o lead (botão Editar) e clique em "🗑 Excluir lead" no rodapé do modal. O histórico de interações desse lead é apagado junto. Se o lead já tiver uma proposta gerada na Precificação, o Fluxe recusa a exclusão de propósito — pra não perder um documento comercial — e mostra uma mensagem explicando.' },
      { titulo:'Anexar um arquivo na conversa do lead', tempo:'2 min', conteudo:'Dentro do histórico de um lead ("▼ Histórico"), o formulário de novo registro tem um campo de arquivo, ao lado do texto da interação. Use pra anexar um diagnóstico, proposta ou qualquer documento trocado com o lead por fora do Fluxe. Depois de salvo, aparece um link "📎 anexo" ao lado da interação, pra baixar quando precisar.\n\nAtenção: a aba "📄 Documentos" do lead é outra coisa — mostra só propostas geradas aqui dentro pela Precificação (botão 💰 Proposta), não tem opção de anexar arquivo. Pra anexar algo trocado por fora do Fluxe, é sempre pelo Histórico.' },
    ]
  },
  {
    id:'cofre', icon:'fa-solid fa-shield-halved', cor:'#0EA5E9', bg:'#F0F9FF',
    titulo:'Cofre Digital', artigos:[
      { titulo:'Guardar senhas e acessos de clientes', tempo:'2 min', conteudo:'No Cofre, cadastre sistema, login e senha de cada acesso do cliente (banco, ERP, portal da prefeitura, etc.), com criptografia. Assim, quando um analista sai da equipe, ninguém perde acesso a nada.' },
    ]
  },
  {
    id:'whatsapp', icon:'fa-brands fa-whatsapp', cor:'#22C55E', bg:'#ECFDF5',
    titulo:'WhatsApp', artigos:[
      { titulo:'Conectar o WhatsApp ao Fluxe', tempo:'5 min', conteudo:'Em Configurações > Integrações, você escolhe entre a API oficial da Meta (mais segura, sem risco de bloqueio) ou a conexão rápida via QR Code (mais simples de configurar, mas não-oficial — a Meta pode bloquear o número a qualquer momento). Depois de conectado, a tela Mensagens passa a mostrar as conversas.' },
      { titulo:'Atender pelo Fluxe', tempo:'2 min', conteudo:'Toda a equipe vê a mesma caixa de mensagens compartilhada, vinculada ao número da empresa. Cada mensagem enviada registra qual analista respondeu. Documentos recebidos (boletos, notas fiscais) são lidos automaticamente por IA.' },
    ]
  },
  {
    id:'crescimento', icon:'fa-solid fa-arrow-trend-up', cor:'#10B981', bg:'#ECFDF5',
    titulo:'Meta de Crescimento', artigos:[
      { titulo:'Definir e acompanhar sua meta', tempo:'3 min', conteudo:'No Executivo, defina uma meta de MRR ou de número de clientes ativos, com prazo. O Fluxe projeta se você está no ritmo de bater a meta, com base no seu crescimento real dos últimos 6 meses.' },
    ]
  },
  {
    id:'mentoria', icon:'fa-solid fa-graduation-cap', cor:'#A855F7', bg:'#FAF5FF',
    titulo:'Mentoria', artigos:[
      { titulo:'Materiais de mentoria', tempo:'2 min', conteudo:'Na aba Mentoria, você encontra vídeos e materiais de apoio cadastrados pela sua liderança — links de aulas, planilhas e conteúdos de treinamento da equipe.' },
      { titulo:'Como enviar um material ou exercício', tempo:'2 min', conteudo:'Na aba Mentoria, clique em "Adicionar material". Você pode enviar um link (de vídeo, planilha, documento — cole a URL) ou fazer upload direto de um arquivo (PDF, imagem, vídeo). Dê um título e, se quiser, uma descrição, e clique em Salvar. Se o envio falhar, aparece uma mensagem explicando o motivo — tente de novo ou avise sua liderança.' },
      { titulo:'Acompanhar seus combinados com a mentora', tempo:'2 min', conteudo:'Na seção "Combinados com sua mentora", você vê a lista de ações combinadas nas sessões, cada uma com prazo (se tiver). Marque a caixinha quando concluir um combinado, e use o campo "Como está indo?" pra deixar uma atualização curta pra sua mentora acompanhar — não precisa esperar a próxima sessão pra dar notícia.' },
      { titulo:'Marcar aulas da turma como concluídas', tempo:'2 min', conteudo:'Se você faz parte de uma turma da Mentoria em Grupo, a seção "Aulas da Turma" mostra a lista de encontros com um círculo numerado por aula. Clique no círculo pra marcar aquela aula como concluída (ele fica verde com um ✓) — isso alimenta seu progresso, que sua mentora acompanha do lado dela.' },
    ]
  },
  {
    id:'esteiras', icon:'fa-solid fa-sitemap', cor:'#8B5CF6', bg:'#F5F3FF',
    titulo:'Esteiras', artigos:[
      { titulo:'O que é uma esteira operacional', tempo:'3 min', conteudo:'Esteiras é uma biblioteca pronta de checklists (playbooks) pra momentos específicos do cliente — Jornada Comercial, Pré-Onboarding, Onboarding, Implantação, Rotina Operacional, BPO Estratégico, Acompanhamento & Retenção, Cobrança e Encerramento. Diferente dos Modelos (que geram tarefas recorrentes automaticamente todo dia), uma esteira é aplicada manualmente, de uma vez só, criando tarefas avulsas pra hoje — ideal pra processos pontuais como "tudo que precisa ser feito no onboarding desse cliente".' },
      { titulo:'Como aplicar uma esteira a um cliente', tempo:'3 min', conteudo:'No módulo Esteiras, escolha o playbook (ex: "Onboarding"), selecione o cliente, e marque/desmarque as tarefas que fazem sentido pra esse caso específico — nem toda tarefa do checklist padrão precisa ser usada. Clique em "⚡ Aplicar selecionadas ao cliente" e o Fluxe cria essas tarefas de uma vez, com prazo pra hoje. Não existe cadastro de esteira nova pela tela — a lista de playbooks é fixa.' },
      { titulo:'Esteiras x Modelos: qual usar', tempo:'2 min', conteudo:'Use Esteiras pra processos que acontecem uma vez (ex: o checklist de implantação de um cliente novo). Use Modelos (categoria "Modelos" desta Central de Ajuda) pra rotinas que se repetem todo mês/semana/dia sozinhas, sem você precisar aplicar de novo — como conciliação bancária ou contas a pagar recorrentes.' },
    ]
  },
  {
    id:'tarefas', icon:'fa-solid fa-list-check', cor:'#10B981', bg:'#ECFDF5',
    titulo:'Tarefas', artigos:[
      { titulo:'Tipos de tarefas no Fluxe', tempo:'3 min', conteudo:'Existem dois tipos: Recorrentes (geradas automaticamente todo dia pelos Modelos vinculados ao cliente) e Avulsas (criadas manualmente, ou de uma vez via Esteiras, para atividades pontuais). Ambas aparecem na Central Operacional e podem ser atribuídas a um responsável.' },
      { titulo:'Status de uma tarefa', tempo:'2 min', conteudo:'Aberta → Em andamento → Ag. cliente → Em revisão → Concluída. Também existe "Impedimento", à parte, pra tarefas travadas por bloqueio externo. O Kanban (aba "☰ Fila de Trabalho" da Central Operacional) mostra 4 colunas — Abertas, Em andamento, Ag. cliente e Concluídas — e dá pra arrastar entre elas; os status "Em revisão" e "Impedimento" são definidos no detalhe da tarefa.' },
      { titulo:'Registrar uma pendência', tempo:'2 min', conteudo:'Quando uma tarefa não pode ser concluída, registre o motivo no campo "Motivo da pendência". Isso alimenta o relatório de pendências e o score de saúde do cliente.' },
      { titulo:'Apontamento de horas', tempo:'3 min', conteudo:'Use o Timer na barra superior para registrar o tempo dedicado a cada tarefa. O apontamento é vinculado à tarefa e ao operador, alimentando relatórios de horas e rentabilidade.' },
      { titulo:'Tarefas Avulsas', tempo:'2 min', conteudo:'Para atividades eventuais que não pertencem a uma esteira, use o módulo Avulsas. Crie a tarefa, atribua um responsável e defina o prazo. Ela aparecerá normalmente na Central Operacional.' },
    ]
  },
  {
    id:'rotinas', icon:'fa-solid fa-rotate', cor:'#F59E0B', bg:'#FFFBEB',
    titulo:'Modelos', artigos:[
      { titulo:'Como funcionam os modelos de tarefa', tempo:'3 min', conteudo:'Modelos são templates de tarefas recorrentes vinculados a clientes. O sistema gera automaticamente as tarefas de cada cliente com base nos modelos do seu escopo e na recorrência configurada.' },
      { titulo:'Criar e editar modelos', tempo:'4 min', conteudo:'No módulo Modelos, crie templates que definem título, categoria, recorrência e prioridade. Cada modelo pode ser vinculado a um ou mais clientes, com configurações específicas por cliente.' },
      { titulo:'Geração automática de tarefas', tempo:'2 min', conteudo:'A geração ocorre automaticamente todo dia à meia-noite (horário de Brasília) via servidor. Não é necessário abrir nenhuma tela — o sistema gera as tarefas do dia para todos os clientes operacionais, registra logs e evita duplicatas.' },
      { titulo:'Ajustar recorrência só para um cliente', tempo:'2 min', conteudo:'Selecione o cliente em Modelos e clique em "🔁 Recorrência" no modelo vinculado. Dá pra mudar a recorrência, os dias e o horário só pra esse cliente, sem alterar o modelo original nem afetar os outros clientes que usam o mesmo modelo. Clique em "Usar padrão do modelo" a qualquer momento pra voltar ao comportamento padrão.' },
      { titulo:'Checklist específico por cliente', tempo:'3 min', conteudo:'Por padrão, o checklist de uma tarefa é uma cópia do checklist cadastrado no modelo — igual pra todo cliente que usa aquele modelo. Se um cliente tem uma particularidade (ex: um banco extra, um passo a mais), selecione o cliente em Modelos e clique em "📋 Checklist" no modelo vinculado. Adicione, edite ou remova itens só pra aquele cliente — o modelo original e os demais clientes não são afetados. Um selo "📋 checklist próprio" aparece quando o cliente tem uma versão personalizada. Clique em "Usar padrão do modelo" pra voltar ao checklist padrão a qualquer momento.' },
    ]
  },
  {
    id:'central', icon:'fa-solid fa-rocket', cor:'#EF4444', bg:'#FEF2F2',
    titulo:'Central Operacional', artigos:[
      { titulo:'Entendendo a Central Operacional', tempo:'4 min', conteudo:'A Central Operacional é o coração do Fluxe. Ela exibe em tempo real: prioridades do dia, tarefas atrasadas, score de saúde dos clientes e o planejamento operacional da equipe.' },
      { titulo:'Usando o Kanban', tempo:'3 min', conteudo:'Na aba "☰ Fila de Trabalho" (o Kanban da Central Operacional), visualize tarefas em colunas por status. Arraste e solte para mudar o status. Use os filtros por período e cliente para focar no que importa.' },
      { titulo:'Calendário operacional', tempo:'2 min', conteudo:'A aba Calendário mostra as tarefas distribuídas por data. Visualize por mês, semana ou dia. Tarefas em vermelho estão atrasadas.' },
    ]
  },
  {
    id:'relatorios', icon:'fa-solid fa-chart-column', cor:'#64748B', bg:'#F1F5F9',
    titulo:'Relatórios', artigos:[
      { titulo:'Relatório de desempenho mensal', tempo:'3 min', conteudo:'Selecione o mês e visualize: taxa de conclusão, tarefas por operador, distribuição por status e por cliente. Todos os dados podem ser exportados para Excel.' },
      { titulo:'Exportar para Excel', tempo:'2 min', conteudo:'Clique em "Exportar Excel" no módulo Relatórios. O arquivo contém 5 abas: Resumo, Tarefas, Pendentes, Por operador e Horas.' },
      { titulo:'Relatório de pendências', tempo:'3 min', conteudo:'A tabela de pendências lista todas as tarefas em atraso com motivo registrado, dias de atraso e responsável. Ideal para reuniões de checkpoint com clientes.' },
    ]
  },
  {
    id:'config', icon:'fa-solid fa-gear', cor:'#6366F1', bg:'#EEF2FF',
    titulo:'Configurações', artigos:[
      { titulo:'Configurar dados da empresa', tempo:'2 min', conteudo:'Acesse Configurações > Empresa para atualizar nome, CNPJ e dados de contato do seu BPO.' },
      { titulo:'Gerenciar a equipe', tempo:'3 min', conteudo:'Em Configurações > Equipe, convide novos colaboradores por e-mail, defina o perfil de acesso e gerencie quem está ativo ou inativo.' },
      { titulo:'Modo escuro', tempo:'1 min', conteudo:'Clique no ícone de lua/sol na topbar para alternar entre modo claro e escuro. A preferência é salva automaticamente.' },
    ]
  },
]

const Btn = ({ children, onClick, style = {} }) => {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--fn)', ...style,
        ...(hov ? style['&:hover'] || {} : {}) }}
    >{children}</button>
  )
}

export default function AjudaPage() {
  const [busca, setBusca]           = useState('')
  const [catAtiva, setCatAtiva]     = useState(null)
  const [artigo, setArtigo]         = useState(null)
  const [chamadoAberto, setChamadoAberto] = useState(false)
  const [chamadoTexto, setChamadoTexto]   = useState('')
  const [chamadoOk, setChamadoOk]         = useState(false)
  const criarChamado = useCreateFluxeBug()

  async function enviarChamado() {
    if (!chamadoTexto.trim()) return
    await criarChamado.mutateAsync({ descricao: chamadoTexto.trim() })
    setChamadoTexto(''); setChamadoAberto(false); setChamadoOk(true)
    setTimeout(() => setChamadoOk(false), 4000)
  }

  const todoArtigos = CATS.flatMap(c => c.artigos.map(a => ({ ...a, cat: c })))
  const buscaOk = busca.trim().length > 1
  const termoBusca = busca.trim()
  const resultados = buscaOk
    ? todoArtigos
        .filter(a =>
          a.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
          a.conteudo.toLowerCase().includes(termoBusca.toLowerCase()))
        // título batendo aparece antes de artigo que só bate no conteúdo
        .sort((a, b) => {
          const aTitulo = a.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ? 0 : 1
          const bTitulo = b.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ? 0 : 1
          return aTitulo - bTitulo
        })
    : []

  const catSel = CATS.find(c => c.id === catAtiva)

  // ── Artigo aberto ───────────────────────────────
  if (artigo) {
    const relacionados = (artigo.cat?.artigos || [])
      .filter(a => a.titulo !== artigo.titulo)
      .slice(0, 3)
    return (
      <div style={{ maxWidth:700, margin:'0 auto', paddingTop:8 }}>
        <button
          onClick={() => setArtigo(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', fontSize:12, marginBottom:16, fontFamily:'var(--fn)', padding:0 }}
        >
          <i className="fa-solid fa-arrow-left"></i>
          {catSel ? catSel.titulo : 'Resultados'}
        </button>
        <div style={{ background:'var(--sur)', border:'1px solid var(--bo)', borderRadius:'var(--rx)', padding:'24px 28px', boxShadow:'var(--sh)' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--br)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
            {artigo.cat?.titulo} · {artigo.tempo} de leitura
          </div>
          <h1 style={{ fontSize:18, fontWeight:800, color:'var(--tx)', letterSpacing:'-.4px', marginBottom:16 }}>{artigo.titulo}</h1>
          <p style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.75, whiteSpace:'pre-line' }}>{artigo.conteudo}</p>
          {artigo.video && (
            <a href={artigo.video} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:16, padding:'9px 16px', background:'#EEF2FF', color:'#4338CA', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none' }}>
              <i className="fa-solid fa-circle-play"></i> Assistir vídeo
            </a>
          )}
        </div>

        {relacionados.length > 0 && (
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>
              Artigos relacionados
            </div>
            {relacionados.map((a, i) => (
              <ArtigoItem key={i} artigo={{ ...a, cat: artigo.cat }} onClick={() => setArtigo({ ...a, cat: artigo.cat })} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Lista de artigos de uma categoria ───────────
  if (catAtiva && catSel) {
    return (
      <div style={{ maxWidth:700, margin:'0 auto', paddingTop:8 }}>
        <button
          onClick={() => setCatAtiva(null)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', fontSize:12, marginBottom:16, fontFamily:'var(--fn)', padding:0 }}
        >
          <i className="fa-solid fa-arrow-left"></i> Categorias
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:catSel.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:catSel.cor }}>
            <i className={catSel.icon}></i>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--tx)' }}>{catSel.titulo}</div>
            <div style={{ fontSize:11, color:'var(--tx3)' }}>{catSel.artigos.length} {catSel.artigos.length === 1 ? 'artigo' : 'artigos'}</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {catSel.artigos.map((a, i) => (
            <ArtigoItem key={i} artigo={{ ...a, cat: catSel }} onClick={() => setArtigo({ ...a, cat: catSel })} />
          ))}
        </div>
      </div>
    )
  }

  // ── Home ─────────────────────────────────────────
  return (
    <div style={{ maxWidth:860, margin:'0 auto', paddingTop:8 }}>

      {/* Header + busca */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'var(--tx)', letterSpacing:'-.5px', marginBottom:5 }}>Central de Ajuda</div>
        <div style={{ fontSize:13, color:'var(--tx3)', marginBottom:18 }}>Encontre respostas ou fale com o suporte</div>
        <div style={{ position:'relative', maxWidth:440, margin:'0 auto' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--tx3)', fontSize:13 }}></i>
          <input
            type="text" className="fi"
            placeholder="Pesquisar artigos..."
            value={busca} onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft:36, fontSize:13 }}
          />
        </div>
      </div>

      {/* Resultados de busca */}
      {busca.trim().length > 1 && (
        <div style={{ marginBottom:24 }}>
          {resultados.length === 0
            ? <div style={{ textAlign:'center', color:'var(--tx3)', fontSize:13, padding:'20px 0' }}>Nenhum resultado para "{busca}"</div>
            : (
              <>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>
                  {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
                </div>
                {resultados.map((a, i) => (
                  <ArtigoItem key={i} artigo={a} onClick={() => { setCatAtiva(a.cat.id); setArtigo(a) }} withCat query={termoBusca} />
                ))}
              </>
            )
          }
        </div>
      )}

      {/* Grid de categorias */}
      {!busca && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))', gap:10, marginBottom:28 }}>
            {CATS.map(c => <CatCard key={c.id} cat={c} onClick={() => setCatAtiva(c.id)} />)}
          </div>

          {/* Suporte */}
          <div style={{ background:'var(--s2)', border:'1px solid var(--bo)', borderRadius:'var(--rl)', padding:'18px 20px' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)', marginBottom:4 }}>Precisa de mais ajuda?</div>
            <div style={{ fontSize:12, color:'var(--tx3)', marginBottom:14 }}>Nossa equipe atende de segunda a sexta, das 8h às 18h.</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom: chamadoAberto ? 14 : 0 }}>
              <a href="https://wa.me/5511917101173?text=Ol%C3%A1%2C+preciso+de+ajuda+com+o+Fluxe+BPO"
                target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', background:'#25D366', color:'#fff', borderRadius:'var(--r)', fontSize:12, fontWeight:700, textDecoration:'none' }}
              >
                <i className="fa-brands fa-whatsapp"></i> WhatsApp
              </a>
              <a href="mailto:suporte@fluxebpo.com.br"
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', background:'var(--br)', color:'#fff', borderRadius:'var(--r)', fontSize:12, fontWeight:700, textDecoration:'none' }}
              >
                <i className="fa-solid fa-envelope"></i> E-mail
              </a>
              <button onClick={() => setChamadoAberto(v => !v)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', background:'var(--sur)', border:'1px solid var(--bo)', color:'var(--tx)', borderRadius:'var(--r)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--fn)' }}
              >
                <i className="fa-solid fa-triangle-exclamation"></i> Abrir chamado
              </button>
            </div>
            {chamadoAberto && (
              <div>
                <textarea
                  className="fi" value={chamadoTexto} onChange={e => setChamadoTexto(e.target.value)}
                  placeholder="Descreva o problema que você encontrou..."
                  style={{ width:'100%', minHeight:70, resize:'vertical', fontSize:13, marginBottom:8, boxSizing:'border-box' }}
                />
                <button onClick={enviarChamado} disabled={criarChamado.isPending || !chamadoTexto.trim()}
                  style={{ padding:'8px 16px', background:'var(--br)', color:'#fff', border:'none', borderRadius:'var(--r)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--fn)' }}>
                  {criarChamado.isPending ? 'Enviando...' : 'Enviar chamado'}
                </button>
              </div>
            )}
            {chamadoOk && (
              <div style={{ marginTop:10, fontSize:12, color:'#15803D', fontWeight:600 }}>✓ Chamado registrado! Nossa equipe vai analisar.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-componentes ─────────────────────────────────

function CatCard({ cat, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', gap:6, padding:'16px',
        background:'var(--sur)', border:`1px solid ${hov ? cat.cor : 'var(--bo)'}`,
        borderRadius:'var(--rl)', cursor:'pointer', textAlign:'left',
        fontFamily:'var(--fn)', transition:'all .2s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? 'var(--sh2)' : 'none',
      }}
    >
      <div style={{ width:36, height:36, borderRadius:10, background:cat.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:cat.cor }}>
        <i className={cat.icon}></i>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--tx)' }}>{cat.titulo}</div>
      <div style={{ fontSize:10, color:'var(--tx3)' }}>{cat.artigos.length} {cat.artigos.length === 1 ? 'artigo' : 'artigos'}</div>
    </button>
  )
}

function ArtigoItem({ artigo, onClick, withCat, query }) {
  const [hov, setHov] = useState(false)
  // Só mostra o trecho de contexto quando é resultado de busca (tem query) e
  // o termo não aparece no título — se já aparece no título, o trecho seria redundante.
  const mostrarTrecho = !!query && !artigo.titulo.toLowerCase().includes(query.toLowerCase())
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'12px 14px', background:'var(--sur)',
        border:`1px solid ${hov ? 'var(--brm)' : 'var(--bo)'}`,
        borderRadius:'var(--rl)', cursor:'pointer', textAlign:'left',
        width:'100%', fontFamily:'var(--fn)', transition:'border-color .15s',
        marginBottom:6,
      }}
    >
      {withCat && (
        <div style={{ width:32, height:32, borderRadius:8, background:artigo.cat.bg, display:'flex', alignItems:'center', justifyContent:'center', color:artigo.cat.cor, fontSize:12, flexShrink:0 }}>
          <i className={artigo.cat.icon}></i>
        </div>
      )}
      {!withCat && <div style={{ width:8, height:8, borderRadius:'50%', background:artigo.cat?.cor || 'var(--br)', flexShrink:0 }}></div>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>
          {query ? destacarTermo(artigo.titulo, query) : artigo.titulo}
        </div>
        {mostrarTrecho && (
          <div style={{ fontSize:11, color:'var(--tx2)', marginTop:2, lineHeight:1.4 }}>
            {destacarTermo(trechoComContexto(artigo.conteudo, query), query)}
          </div>
        )}
        <div style={{ fontSize:10, color:'var(--tx3)', marginTop:1 }}>
          {withCat && <>{artigo.cat.titulo} · </>}{artigo.tempo} de leitura
        </div>
      </div>
      <i className="fa-solid fa-chevron-right" style={{ color:'var(--tx3)', fontSize:10, flexShrink:0 }}></i>
    </button>
  )
}
