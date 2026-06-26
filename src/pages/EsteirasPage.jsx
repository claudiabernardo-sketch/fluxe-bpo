import { useState } from 'react'
import { useClients, useCreateTask } from '../hooks/useData'
import { Card, CardHeader, Btn, Loader } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

// ── ESTEIRAS COM TAREFAS E CHECKLISTS COMPLETOS ────────────────
const ESTEIRAS = [
  { id:'comercial', name:'Jornada Comercial', icon:'🤝', color:'#8B5CF6',
    etapas:[
      { titulo:'Prospecção & Diagnóstico', tasks:[
        { titulo:'Identificar empresa-alvo e pesquisar porte e segmento', categoria:'Relacionamento', checklist:['Verificar faturamento estimado','Identificar segmento de atuação','Pesquisar concorrentes que atendem'] },
        { titulo:'Primeiro contato — WhatsApp ou LinkedIn', categoria:'Relacionamento', checklist:['Preparar mensagem de abordagem','Enviar mensagem','Registrar resposta'] },
        { titulo:'Agendar reunião de diagnóstico', categoria:'Relacionamento', checklist:['Confirmar data e horário','Enviar convite','Preparar pauta da reunião'] },
        { titulo:'Levantar processos financeiros atuais', categoria:'Estratégico', checklist:['Quem faz o financeiro hoje?','Qual sistema usa?','Quais dores principais?','Volume de NFs por mês','Volume de pagamentos por mês'] },
      ]},
      { titulo:'Proposta & Fechamento', tasks:[
        { titulo:'Elaborar proposta personalizada', categoria:'Estratégico', checklist:['Definir escopo dos serviços','Calcular precificação','Preparar apresentação'] },
        { titulo:'Enviar proposta ao decisor', categoria:'Relacionamento', checklist:['Enviar por WhatsApp','Enviar por e-mail','Agendar follow-up em 48h'] },
        { titulo:'Follow-up da proposta', categoria:'Relacionamento', checklist:['Ligar para o decisor','Tratar objeções','Ajustar escopo se necessário'] },
        { titulo:'Assinar contrato de prestação de serviços', categoria:'Relacionamento', checklist:['Enviar contrato para assinatura','Confirmar assinatura','Arquivar contrato assinado'] },
      ]},
    ]
  },
  { id:'pre_ob', name:'Pré-Onboarding', icon:'📋', color:'#F59E0B',
    etapas:[
      { titulo:'Documentos necessários', tasks:[
        { titulo:'Enviar e-mail de boas-vindas com apresentação da equipe', categoria:'Relacionamento', checklist:['Preparar e-mail personalizado','Incluir foto da equipe','Apresentar metodologia resumida'] },
        { titulo:'Solicitar documentação da empresa', categoria:'Relacionamento', checklist:['CNPJ e contrato social','RG/CPF do sócio responsável','Comprovante de endereço','Certificado digital (se tiver)','Senha e-CAC (Receita Federal)'] },
        { titulo:'Verificar regime tributário', categoria:'Estratégico', checklist:['Simples Nacional?','Lucro Presumido?','Lucro Real?','Verificar pendências na Receita'] },
      ]},
      { titulo:'Acessos ao sistema financeiro', materiais:[
        { nome:'Guia de Acesso Bancário', url:'/materiais/guia-acesso-bancario.pdf', icon:'🏦' },
      ], tasks:[
        { titulo:'Solicitar acesso ao internet banking', categoria:'Relacionamento', checklist:['Definir nível de acesso (consulta ou operacional)','Cadastrar IP se necessário','Testar acesso'] },
        { titulo:'Solicitar acesso ao ERP ou sistema de gestão', categoria:'Implantação', checklist:['Omie?','Conta Azul?','Meu Dinheiro Web?','Nibo?','Bom Controle?','Outro sistema?'] },
        { titulo:'Solicitar acesso à plataforma de emissão de NF', categoria:'Implantação', checklist:['Prefeitura (NFS-e)?','Dentro do ERP?','Testar emissão'] },
        { titulo:'Verificar maquininha e marketplaces', categoria:'Relacionamento', checklist:['Tem maquininha? Qual operadora?','Solicitar acesso ao painel','Tem marketplace? (Mercado Livre, etc)','Solicitar relatório de repasses'] },
      ]},
      { titulo:'Alinhamento de expectativas', tasks:[
        { titulo:'Definir canal principal de comunicação', categoria:'Relacionamento', checklist:['WhatsApp comercial?','E-mail?','Definir horário de atendimento'] },
        { titulo:'Confirmar agenda mensal', categoria:'Relacionamento', checklist:['Dia do fechamento','Dia da reunião mensal','Dia de emissão das NFs','Dia dos pagamentos'] },
        { titulo:'Definir responsável do cliente por área', categoria:'Relacionamento', checklist:['Responsável por NFs','Responsável por aprovações de pagamento','Responsável por documentos'] },
      ]},
    ]
  },
  { id:'onboarding', name:'Onboarding', icon:'🚀', color:'#1A56DB',
    etapas:[
      { titulo:'Kick-off Meeting', tasks:[
        { titulo:'Realizar reunião de kick-off', categoria:'Relacionamento', checklist:['Enviar convite com pauta','Apresentar equipe responsável','Apresentar metodologia BPO','Alinhar escopo exato','Confirmar sistema financeiro','Definir calendário mensal','Registrar decisões da reunião'] },
        { titulo:'Apresentar sistema financeiro ao cliente', categoria:'Implantação', checklist:['Mostrar como acessar','Mostrar onde ver relatórios','Mostrar como aprovar pagamentos','Tirar dúvidas'] },
      ]},
      { titulo:'Diagnóstico financeiro inicial', tasks:[
        { titulo:'Mapear todas as contas bancárias', categoria:'Conciliação Bancária', checklist:['Listar todos os bancos','Confirmar agência e conta de cada um','Verificar saldo atual','Cadastrar no sistema'] },
        { titulo:'Levantar recebíveis e despesas fixas', categoria:'Fluxo de Caixa', checklist:['Listar clientes que pagam mensalmente','Listar despesas fixas (aluguel, folha, etc)','Identificar vencimentos','Lançar no sistema'] },
        { titulo:'Verificar inadimplentes em aberto', categoria:'Cobrança / Inadimplência', checklist:['Listar todos os devedores','Classificar por faixa de atraso','Definir estratégia de cobrança','Registrar no sistema'] },
        { titulo:'Entregar panorama financeiro inicial ao cliente', categoria:'Estratégico', checklist:['Montar resumo da situação atual','Identificar os 3 principais problemas','Apresentar ao cliente'] },
      ]},
      { titulo:'Configuração no sistema', tasks:[
        { titulo:'Configurar plano de contas no ERP', categoria:'Implantação', checklist:['Definir categorias de CP','Definir categorias de CR','Criar centros de custo se necessário','Validar com o cliente'] },
        { titulo:'Cadastrar contas bancárias no sistema', categoria:'Implantação', checklist:['Cadastrar todas as contas','Conectar via OFX se possível','Lançar saldo inicial','Testar importação de extrato'] },
        { titulo:'Registrar todos os acessos no cadastro do cliente', categoria:'Implantação', checklist:['Internet banking','ERP/sistema','Plataforma de NF','Maquininha','Outros acessos relevantes'] },
      ]},
    ]
  },
  { id:'implantacao', name:'Implantação', icon:'⚙️', color:'#F97316',
    etapas:[
      { titulo:'Configuração do software', tasks:[
        { titulo:'Configurar empresa no Omie ERP', categoria:'Implantação', software:'Omie', checklist:['Criar conta / acessar empresa','Configurar CNPJ e regime tributário','Cadastrar contas bancárias com OFX','Configurar plano de contas','Cadastrar fornecedores recorrentes','Ativar módulo de NF-e / NFS-e','Testar emissão de primeira NF'] },
        { titulo:'Configurar empresa no Conta Azul', categoria:'Implantação', software:'Conta Azul', checklist:['Criar conta / acessar empresa','Conectar via Open Finance','Configurar plano de contas','Cadastrar produtos/serviços','Configurar integrações (maquininha)','Testar boleto e NF'] },
        { titulo:'Configurar empresa no Meu Dinheiro Web', categoria:'Implantação', software:'Meu Dinheiro Web', checklist:['Acessar empresa','Cadastrar contas bancárias','Definir categorias','Lançar saldo inicial'] },
        { titulo:'Configurar empresa no Nibo', categoria:'Implantação', software:'Nibo', checklist:['Acessar empresa','Conectar contas via OFX','Configurar plano de contas gerencial','Ativar módulo DRE','Testar importação de extrato'] },
        { titulo:'Configurar empresa no Bom Controle', categoria:'Implantação', software:'Bom Controle', checklist:['Acessar empresa','Cadastrar contas bancárias','Definir categorias de CP e CR'] },
      ]},
      { titulo:'Primeiros lançamentos', tasks:[
        { titulo:'Lançar saldo inicial de todas as contas bancárias', categoria:'Conciliação Bancária', checklist:['Confirmar saldo com extrato','Lançar no sistema','Validar com o cliente'] },
        { titulo:'Importar ou lançar contas a pagar do mês', categoria:'Contas a Pagar', checklist:['Listar todos os compromissos do mês','Lançar com data de vencimento','Verificar se há duplicatas'] },
        { titulo:'Importar ou lançar contas a receber do mês', categoria:'Contas a Receber', checklist:['Listar todos os recebimentos previstos','Lançar com data prevista','Verificar inadimplentes'] },
        { titulo:'Conciliar primeiros extratos bancários', categoria:'Conciliação Bancária', checklist:['Baixar extrato do banco','Importar no sistema','Conciliar lançamento por lançamento','Verificar diferenças'] },
        { titulo:'Validar todos os lançamentos com o cliente', categoria:'Estratégico', checklist:['Agendar call de validação','Apresentar o que foi lançado','Ajustar conforme feedback'] },
      ]},
      { titulo:'Go-live & Validação', tasks:[
        { titulo:'Testar fluxo completo de operação', categoria:'Implantação', checklist:['Lançar → conciliar → gerar DRE','Testar aprovação de pagamento','Testar emissão de NF','Confirmar que todos os acessos funcionam'] },
        { titulo:'Aplicar pesquisa de satisfação pós-implantação', categoria:'Relacionamento', checklist:['Enviar formulário de satisfação','Registrar nota recebida','Registrar feedback e melhorias'] },
      ]},
    ]
  },
  { id:'operacional', name:'Rotina Operacional', icon:'🔄', color:'#22C55E',
    etapas:[
      { titulo:'Rotina Diária', tasks:[
        { titulo:'Conferência bancária matinal', categoria:'Conciliação Bancária', checklist:['Acessar internet banking de cada cliente','Verificar saldo atual de todas as contas','Identificar movimentações não reconhecidas','Confirmar recebimentos do dia anterior'] },
        { titulo:'Verificar contas a pagar com vencimento hoje', categoria:'Contas a Pagar', checklist:['Acessar lista de CP do dia','Verificar se há saldo disponível','Obter autorização do cliente para pagamentos acima do limite','Efetuar pagamentos autorizados','Salvar comprovantes','Baixar os títulos no sistema'] },
        { titulo:'Agendar pagamentos do próximo dia útil', categoria:'Pagamentos', checklist:['Verificar vencimentos de amanhã','Confirmar disponibilidade de saldo','Agendar no internet banking','Comunicar cliente sobre agendamentos realizados'] },
        { titulo:'Verificar recebimentos previstos para hoje', categoria:'Contas a Receber', checklist:['Verificar pagamentos confirmados no banco','Baixar os títulos recebidos no sistema','Comunicar cliente sobre recebimentos do dia','Cobrar os não recebidos'] },
        { titulo:'Checar NFs a emitir hoje', categoria:'Emissão de NF', checklist:['Verificar contratos com recorrência','Confirmar dados com o cliente se necessário','Emitir NFs pendentes no portal','Enviar XML e PDF para os clientes','Registrar número da NF no controle'] },
        { titulo:'Responder mensagens e pendências do dia', categoria:'Relacionamento', checklist:['Verificar WhatsApp e e-mail','Responder dúvidas dos clientes','Registrar pendências que não foram resolvidas','Atualizar status das tarefas afetadas'] },
      ]},
      { titulo:'Rotina Semanal', tasks:[
        { titulo:'Conciliação de plataformas — cartão, boleto e PIX', categoria:'Conciliação Bancária', checklist:['Baixar relatório da maquininha','Baixar relatório de boletos','Conciliar com lançamentos no sistema','Verificar divergências'] },
        { titulo:'Agendamento bancário da semana', categoria:'Pagamentos', checklist:['Listar pagamentos a vencer nos próximos 7 dias','Separar por banco','Agendar no internet banking','Confirmar com o cliente os que precisam de aprovação'] },
        { titulo:'Verificar aprovações de pagamento pendentes', categoria:'Pagamentos', checklist:['Listar pagamentos aguardando aprovação','Enviar lembrete ao cliente','Registrar aprovações recebidas'] },
        { titulo:'Emissão de NFs de serviço recorrentes', categoria:'Emissão de NF', checklist:['Verificar contratos com emissão semanal','Emitir NFs','Enviar para destinatários'] },
        { titulo:'Conferir inadimplência da semana', categoria:'Cobrança / Inadimplência', checklist:['Listar títulos vencidos','Classificar por faixa de atraso','Enviar cobranças conforme régua'] },
      ]},
      { titulo:'Fechamento Mensal', tasks:[
        { titulo:'Cobrar extrato bancário e documentos do cliente', categoria:'Conciliação Bancária', checklist:['Solicitar extrato de todas as contas','Solicitar faturas de cartão','Solicitar comprovantes de despesas físicas','Solicitar NFs de compras em falta','Definir prazo para entrega (máximo dia 5 do mês seguinte)'] },
        { titulo:'Emitir NFs dos contratos de serviço BPO do mês', categoria:'Emissão de NF', checklist:['Verificar lista de contratos recorrentes','Confirmar valores com o contrato','Emitir NFS-e no portal da prefeitura','Enviar para os clientes por e-mail','Registrar número das NFs emitidas'] },
        { titulo:'Verificar e cobrar guias de tributos do mês', categoria:'Contas a Pagar', checklist:['DAS (Simples Nacional) — verificar vencimento e valor','GPS (INSS) — se Lucro Presumido','DARF (IRPJ/CSLL/PIS/COFINS) — se Lucro Presumido','ISS municipal — verificar guia','Confirmar recolhimento com o contador/cliente','Arquivar comprovantes de pagamento'] },
        { titulo:'Conciliar extrato bancário conta a conta', categoria:'Conciliação Bancária', checklist:['Conciliar conta corrente principal','Conciliar demais contas','Conciliar cartão corporativo','Verificar lançamentos duplicados','Verificar lançamentos não identificados'] },
        { titulo:'Conciliar plataformas digitais', categoria:'Conciliação Bancária', checklist:['Conciliar boletos emitidos x recebidos','Conciliar PIX recebidos','Conciliar maquininha (crédito e débito)','Conciliar marketplaces (ML, Shopee, etc)','Verificar taxas descontadas pelas plataformas'] },
        { titulo:'Enviar comprovantes de pagamentos do mês ao cliente', categoria:'Contas a Pagar', checklist:['Organizar comprovantes por data','Criar pasta por cliente e mês','Enviar por e-mail ou pasta compartilhada','Confirmar recebimento pelo cliente'] },
        { titulo:'Fechar período no ERP', categoria:'DRE / Relatórios', checklist:['Verificar se todos os lançamentos estão corretos','Revisar categorias dos lançamentos','Fechar mês no sistema','Gerar backup dos dados'] },
        { titulo:'Gerar relatório gerencial do mês', categoria:'DRE / Relatórios', checklist:['Gerar relatório de receitas e despesas no sistema','Calcular margens do período','Comparar com mês anterior','Revisar valores antes de enviar'] },
        { titulo:'Gerar Fluxo de Caixa projetado para o próximo mês', categoria:'Fluxo de Caixa', checklist:['Projetar receitas do próximo mês','Projetar despesas fixas e variáveis','Incluir tributos a vencer','Identificar gap de caixa','Alertar cliente se houver risco de saldo negativo'] },
        { titulo:'Preparar e enviar relatório executivo ao cliente', categoria:'DRE / Relatórios', checklist:['Montar resumo executivo (1 página)','Incluir resultado do mês','Incluir fluxo de caixa projetado','Incluir indicadores (margem, inadimplência, ticket médio)','Enviar ao cliente 24h antes da reunião'] },
        { titulo:'Realizar reunião mensal de resultados', categoria:'Estratégico', checklist:['Abrir com resultado do mês em 2 minutos','Apresentar top 3 pontos de atenção','Apresentar posição de caixa atual','Apresentar projeção do próximo mês','Definir top 3 prioridades do próximo mês','Registrar ata e enviar em até 24h'] },
      ]},
    ]
  },
  { id:'estrategico', name:'BPO Estratégico', icon:'📈', color:'#06B6D4',
    etapas:[
      { titulo:'Análise & Indicadores', tasks:[
        { titulo:'Calcular indicadores financeiros do mês', categoria:'DRE / Relatórios', checklist:['Margem Bruta','Margem Líquida','Ponto de Equilíbrio','Ticket médio','Taxa de inadimplência','Comparar com mês anterior e meta'] },
        { titulo:'Identificar os 3 maiores vazamentos de caixa', categoria:'Estratégico', checklist:['Analisar top 10 despesas','Comparar com mês anterior','Identificar oportunidades de corte','Preparar recomendações'] },
      ]},
      { titulo:'Reunião de Decisão', tasks:[
        { titulo:'Enviar relatório ao cliente 24h antes da reunião', categoria:'Estratégico', checklist:['DRE do mês','Fluxo de caixa projetado','Indicadores','Análise dos vazamentos'] },
        { titulo:'Conduzir reunião estratégica mensal', categoria:'Estratégico', checklist:['Resultado do mês em 2 minutos','Top 3 vazamentos identificados','Posição de caixa atual','Projeção próximos 30 dias','Definir top 3 prioridades','Registrar plano de ação'] },
        { titulo:'Enviar ata da reunião ao cliente', categoria:'Estratégico', checklist:['Registrar decisões tomadas','Definir responsáveis e prazos','Enviar em até 24h após a reunião'] },
      ]},
    ]
  },
  { id:'acompanhamento', name:'Acompanhamento & Retenção', icon:'🤝', color:'#0EA5E9',
    etapas:[
      { titulo:'Saúde do Cliente', tasks:[
        { titulo:'Avaliar saúde financeira do cliente mensalmente', categoria:'Estratégico', checklist:['Verificar se inadimplência está controlada','Verificar se o caixa está positivo','Verificar se as tarefas estão em dia','Calcular health score do mês','Registrar no cadastro do cliente'] },
        { titulo:'Identificar sinais de risco de churn', categoria:'Estratégico', checklist:['Cliente reclamou de alguma entrega?','Houve atraso recorrente em tarefas?','O cliente está respondendo normalmente?','O MRR está ameaçado?','Acionar plano de retenção se necessário'] },
        { titulo:'Monitorar satisfação com as entregas do mês', categoria:'Relacionamento', checklist:['Houve alguma entrega atrasada?','O cliente ficou satisfeito com o relatório?','Alguma reclamação foi registrada?','Registrar feedback no sistema'] },
      ]},
      { titulo:'NPS & Renovação', tasks:[
        { titulo:'Aplicar NPS trimestral ao cliente', categoria:'Relacionamento', checklist:['Enviar formulário de NPS (0-10)','Registrar nota e comentários','Analisar resultado (promotor, neutro, detrator)','Criar plano de ação para notas abaixo de 7','Registrar no cadastro do cliente'] },
        { titulo:'Renovação contratual anual', categoria:'Estratégico', checklist:['Verificar vencimento do contrato (30 dias antes)','Preparar proposta de renovação com reajuste','Enviar ao decisor','Negociar e ajustar escopo se necessário','Assinar aditivo ou novo contrato','Arquivar contrato renovado'] },
      ]},
      { titulo:'Upsell & Expansão de Escopo', tasks:[
        { titulo:'Identificar oportunidades de expansão de serviços', categoria:'Estratégico', checklist:['Tem demanda por emissão de NF que ainda não fazemos?','Tem pagamentos que o cliente ainda faz manualmente?','Tem necessidade de relatórios gerenciais extras?','Há oportunidade de gerir mais contas bancárias?','Documentar oportunidade e apresentar proposta'] },
        { titulo:'Apresentar proposta de expansão de escopo', categoria:'Relacionamento', checklist:['Preparar proposta com novo escopo e preço','Apresentar os benefícios ao cliente','Negociar e ajustar','Assinar aditivo contratual','Comunicar equipe operacional sobre a expansão'] },
      ]},
    ]
  },
  { id:'encerramento', name:'Encerramento de Contrato', icon:'🔚', color:'#64748B',
    etapas:[
      { titulo:'Aviso Prévio & Planejamento', tasks:[
        { titulo:'Receber e registrar aviso de cancelamento', categoria:'Relacionamento', checklist:['Registrar data do aviso','Verificar cláusula de aviso prévio no contrato (geralmente 30 dias)','Calcular data de encerramento dos serviços','Comunicar o gestor responsável','Iniciar protocolo de encerramento'] },
        { titulo:'Alinhar o processo de encerramento com o cliente', categoria:'Relacionamento', checklist:['Confirmar data final dos serviços','Definir o que será entregue (histórico, relatórios, senhas)','Definir responsável do cliente para receber os materiais','Agendar reunião de passagem'] },
      ]},
      { titulo:'Entrega do Histórico', tasks:[
        { titulo:'Organizar e entregar histórico financeiro do cliente', categoria:'Estratégico', checklist:['Exportar todos os extratos do período','Exportar lançamentos do ERP (CSV ou Excel)','Exportar relatórios gerenciais do período','Organizar por mês em pasta compartilhada','Enviar link de acesso ao cliente'] },
        { titulo:'Realizar reunião de passagem de informações', categoria:'Relacionamento', checklist:['Apresentar onde está cada arquivo','Explicar metodologia utilizada','Responder dúvidas do cliente','Apresentar pendências em aberto (se houver)','Registrar ata da reunião'] },
        { titulo:'Entregar senhas e acessos ao cliente', categoria:'Implantação', checklist:['Identificar todas as senhas e acessos gerenciados','Entregar de forma segura (não por e-mail aberto)','Confirmar que o cliente conseguiu acessar','Remover usuários da Fluxe do ERP e bancos'] },
      ]},
      { titulo:'Financeiro & Encerramento Formal', tasks:[
        { titulo:'Emitir NF final e cobrar saldo devedor', categoria:'Emissão de NF', checklist:['Verificar se há mensalidades em aberto','Emitir NF referente ao mês proporcional (se aplicável)','Cobrar saldo devedor','Confirmar recebimento antes de encerrar os acessos'] },
        { titulo:'Revogar acessos da equipe Fluxe', categoria:'Implantação', checklist:['Revogar acesso ao internet banking','Revogar acesso ao ERP do cliente','Revogar acesso ao portal de NF','Revogar acesso a plataformas (maquininha, marketplace)','Confirmar revogação de todos os acessos','Registrar no sistema'] },
        { titulo:'Encerrar cadastro do cliente no sistema', categoria:'Implantação', checklist:['Alterar status do cliente para "inativo"','Registrar data de encerramento','Registrar motivo do cancelamento','Arquivar contrato e documentação','Enviar e-mail de despedida e agradecimento'] },
      ]},
    ]
  },
  { id:'cobranca', name:'Cobrança & Inadimplência', icon:'💰', color:'#EF4444',
    etapas:[
      { titulo:'Identificação & Triagem', tasks:[
        { titulo:'Listar e classificar todos os títulos vencidos', categoria:'Cobrança / Inadimplência', checklist:['1 a 7 dias de atraso','8 a 30 dias de atraso','31 a 60 dias de atraso','Acima de 60 dias','Ordenar por valor (maiores primeiro)'] },
      ]},
      { titulo:'Régua de Comunicação', tasks:[
        { titulo:'D+1: Lembrete amigável via WhatsApp', categoria:'Cobrança / Inadimplência', checklist:['Enviar mensagem amigável com o boleto em anexo','Confirmar que a mensagem foi entregue','Registrar tentativa no sistema'] },
        { titulo:'D+5: Cobrança formal por escrito', categoria:'Cobrança / Inadimplência', checklist:['Enviar mensagem formal por WhatsApp','Enviar e-mail com boleto atualizado (juros e multa)','Mencionar que o débito pode ser negativado','Registrar no sistema'] },
        { titulo:'D+10: Ligação telefônica ao responsável financeiro', categoria:'Cobrança / Inadimplência', checklist:['Ligar para o responsável financeiro','Ligar para o sócio se o financeiro não responder','Entender o motivo do atraso','Oferecer parcelamento se necessário','Registrar resultado da ligação'] },
        { titulo:'D+15: Oferecer acordo de parcelamento formal', categoria:'Cobrança / Inadimplência', checklist:['Propor parcelamento com entrada','Definir número de parcelas e datas','Emitir novos boletos com vencimentos acordados','Formalizar o acordo por e-mail','Registrar acordo no sistema'] },
        { titulo:'D+30: Escalar para o sócio proprietário', categoria:'Cobrança / Inadimplência', checklist:['Enviar notificação extrajudicial por e-mail','Contatar o sócio diretamente','Informar que os serviços podem ser suspensos','Dar prazo de 5 dias úteis para quitação','Registrar comunicação e resposta'] },
        { titulo:'D+60+: Avaliar negativação ou encaminhamento jurídico', categoria:'Cobrança / Inadimplência', checklist:['Avaliar valor da dívida vs custo do processo','Consultar o cliente (BPO) sobre a decisão','Negativar no SPC/Serasa se aprovado','Encaminhar para advogado se valor justificar','Registrar decisão no sistema','Encerrar prestação de serviços se aplicável'] },
      ]},
      { titulo:'Negociação & Baixa', tasks:[
        { titulo:'Registrar acordo e emitir novo boleto', categoria:'Cobrança / Inadimplência', checklist:['Registrar condições do acordo','Emitir boleto com novo vencimento','Enviar ao cliente'] },
        { titulo:'Confirmar recebimento e dar baixa', categoria:'Cobrança / Inadimplência', checklist:['Confirmar no banco','Dar baixa no título','Arquivar comprovante','Comunicar ao cliente do BPO'] },
      ]},
    ]
  },
]

export default function EsteirasPage() {
  const { empresa } = useAuthStore()
  const { data: clients = [] } = useClients()
  const createTask = useCreateTask()
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [tasksSelecionadas, setTasksSelecionadas] = useState({}) // { 'etIdx-tIdx': true|false }
  const [applyModal, setApplyModal] = useState(null) // { esteira, etapa } or { esteira, all }
  const [applyClient, setApplyClient] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const est = ESTEIRAS.find(e => e.id === selected)

  // Por padrão todas as tarefas vêm marcadas — usuário desmarca o que não quer aplicar
  function isTaskSelecionada(etIdx, tIdx) {
    const key = `${etIdx}-${tIdx}`
    return tasksSelecionadas[key] !== false
  }
  function toggleTask(etIdx, tIdx) {
    const key = `${etIdx}-${tIdx}`
    setTasksSelecionadas(p => ({ ...p, [key]: !isTaskSelecionada(etIdx, tIdx) }))
  }
  function tasksDaEtapaSelecionadas(et, etIdx) {
    return et.tasks.filter((_, tIdx) => isTaskSelecionada(etIdx, tIdx))
  }
  function todasTasksSelecionadas(esteira) {
    return esteira.etapas.flatMap((et, etIdx) => tasksDaEtapaSelecionadas(et, etIdx))
  }

  async function aplicarTarefas(clienteId, tasks) {
    // Trava: tarefas marcadas com `software` (ex: "Configurar empresa no Omie")
    // só fazem sentido pro sistema que o cliente realmente usa. Sem essa
    // trava, aplicar a etapa "Configuração do software" cria uma tarefa pra
    // CADA sistema (Omie, Conta Azul, Nibo...), mesmo o cliente só usando um.
    const cliente = clients.find(c => c.id === clienteId)
    const softwareCliente = (cliente?.software_erp || '').trim().toLowerCase()
    const temTarefaDeSoftware = tasks.some(t => t.software)
    const softwareClienteBateComAlguma = temTarefaDeSoftware && tasks.some(t => t.software && t.software.toLowerCase() === softwareCliente)

    const tasksFiltradas = tasks.filter(t => {
      if (!t.software) return true // tarefa normal, sem filtro
      if (!softwareClienteBateComAlguma) return true // não sabemos qual é → mantém todas, não arrisca sumir tarefa
      return t.software.toLowerCase() === softwareCliente // só a do sistema certo
    })

    if (temTarefaDeSoftware && !softwareClienteBateComAlguma) {
      const continuar = confirm(
        `O campo "Software Contábil" deste cliente está vazio ou não bate com nenhuma opção conhecida (Omie, Conta Azul, Meu Dinheiro Web, Nibo, Bom Controle).\n\n` +
        `Por segurança, vou criar a tarefa de configuração para TODOS os sistemas — o que provavelmente não é o que você quer.\n\n` +
        `Recomendo cancelar, preencher o campo "Software Contábil" no cadastro do cliente e aplicar de novo. Continuar mesmo assim?`
      )
      if (!continuar) { setApplyModal(null); return }
    }

    setApplying(true)
    try {
      for (const task of tasksFiltradas) {
        const created = await createTask.mutateAsync({
          titulo: task.titulo,
          categoria: task.categoria,
          prioridade: 'media',
          status: 'aberta',
          cliente_id: clienteId,
          data_execucao: new Date().toLocaleDateString('en-CA'),
        })
        if (task.checklist?.length && created?.id) {
          const items = task.checklist.map((texto, ordem) => ({ tarefa_id: created.id, texto, ordem, empresa_id: empresa?.id }))
          await supabase.from('tarefa_checklists').insert(items)
        }
      }
      setApplied(true)
      setApplyModal(null)
    } catch (err) {
      alert('Erro ao aplicar esteira: ' + err.message)
    } finally {
      setApplying(false)
    }
    qc.invalidateQueries({ queryKey: ['tasks'] })
    setTimeout(() => setApplied(false), 3000)
  }

  if (selected && est) {
    const totalSelecionadas = todasTasksSelecionadas(est).length
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button onClick={() => setSelected(null)} style={{ border:'1px solid #E2E8F0', background:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12 }}>← Voltar</button>
          <span style={{ fontSize:16, fontWeight:700, color:'#0F172A', flex:1 }}>{est.icon} {est.name}</span>
          <Btn variant="primary" disabled={totalSelecionadas===0} onClick={() => setApplyModal({ esteira: est, all: true })}>
            ⚡ Aplicar selecionadas ao cliente ({totalSelecionadas} tarefa{totalSelecionadas!==1?'s':''})
          </Btn>
        </div>

        {applied && (
          <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'10px 16px', marginBottom:14, color:'#15803D', fontWeight:600, fontSize:13 }}>
            ✓ Tarefas criadas com sucesso! Veja na página de Tarefas.
          </div>
        )}

        {est.etapas.map((et, etIdx) => {
          const selecionadasEtapa = tasksDaEtapaSelecionadas(et, etIdx)
          return (
          <Card key={etIdx} style={{ marginBottom:14 }}>
            <CardHeader title={et.titulo} right={
              <Btn small variant="primary" disabled={selecionadasEtapa.length===0} onClick={() => setApplyModal({ esteira: est, etapa: et, etIdx })}>
                + Aplicar selecionadas ({selecionadasEtapa.length} de {et.tasks.length})
              </Btn>
            } />
            {et.materiais?.length > 0 && (
              <div style={{ padding:'8px 16px', borderBottom:'1px solid #F1F5F9', background:'#F8FAFF' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>📎 Materiais de apoio</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {et.materiais.map((mat, mIdx) => (
                    <a key={mIdx} href={mat.url} download target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #DBEAFE', borderRadius:8, padding:'6px 12px', textDecoration:'none', color:'#1A56DB', fontSize:11, fontWeight:600 }}>
                      <span>{mat.icon}</span>
                      <span>{mat.nome}</span>
                      <span style={{ color:'#93C5FD', fontSize:10 }}>↓ PDF</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div style={{ padding:'8px 0' }}>
              {et.tasks.map((task, tIdx) => {
                const sel = isTaskSelecionada(etIdx, tIdx)
                return (
                <div key={tIdx} style={{ borderBottom:'1px solid #F8FAFC', opacity: sel ? 1 : .5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'#FAFAFA' }}>
                    <div onClick={() => toggleTask(etIdx, tIdx)} style={{ width:16, height:16, borderRadius:4, border:`2px solid ${sel?'#6366F1':'#CBD5E1'}`, background: sel?'#6366F1':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}
                      title={sel ? 'Clique pra não incluir essa tarefa' : 'Clique pra incluir essa tarefa'}>
                      {sel && <span style={{ color:'#fff', fontSize:10 }}>✓</span>}
                    </div>
                    <div style={{ flex:1, cursor:'pointer' }} onClick={() => toggleTask(etIdx, tIdx)}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#0F172A' }}>{task.titulo}</div>
                      <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>📂 {task.categoria} · {task.checklist.length} itens de checklist</div>
                    </div>
                  </div>
                  {/* Checklist é só pré-visualização do que vem dentro da tarefa — não é interativo aqui */}
                  <div style={{ padding:'4px 16px 8px 38px' }}>
                    {task.checklist.map((ck, ckIdx) => (
                      <div key={ckIdx} style={{ display:'flex', alignItems:'center', gap:8, padding:'3px 0' }}>
                        <span style={{ color:'#CBD5E1', fontSize:10 }}>•</span>
                        <span style={{ fontSize:11, color:'#94A3B8' }}>{ck}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </Card>
        )})}

        {applyModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <div style={{ background:'#fff', borderRadius:16, padding:24, width:400 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>
                {applyModal.all ? `Aplicar selecionadas de "${est.name}"` : `Aplicar selecionadas de "${applyModal.etapa.titulo}"`}
              </div>
              <div style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>
                {applyModal.all ? totalSelecionadas : tasksDaEtapaSelecionadas(applyModal.etapa, applyModal.etIdx).length} tarefas serão criadas com checklists completos, vinculadas ao cliente selecionado.
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#94A3B8', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Selecionar cliente *</label>
                <select value={applyClient} onChange={e=>setApplyClient(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #E2E8F0', borderRadius:8, fontSize:13 }}>
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.razao_social || c.fantasia}</option>
                  ))}
                </select>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Btn variant="ghost" onClick={() => { setApplyModal(null); setApplyClient('') }}>Cancelar</Btn>
                <Btn variant="primary" disabled={!applyClient || applying} onClick={() => aplicarEsteira(applyClient)}>
                  {applying ? 'Aplicando…' : 'Aplicar tarefas'}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}
}
