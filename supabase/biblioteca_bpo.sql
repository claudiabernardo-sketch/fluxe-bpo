-- ============================================================
-- BIBLIOTECA BPO COMPLETA — Fluxe BPO
-- ETAPA 2 — Templates operacionais com descrições
-- IMPORTANTE: rode etapa2_preparo.sql ANTES deste arquivo
-- ============================================================
-- ATENÇÃO: Este script NÃO exclui templates da sua empresa.
-- Ele insere templates com empresa_id = NULL (globais).
-- Substitua 'SUA_EMPRESA_ID' pelo UUID da sua empresa antes de rodar.
-- Ou use a versão com empresa_id = NULL se quiser templates globais
-- (mas os templates precisam de empresa_id para aparecer no sistema).
--
-- COMO USAR:
-- 1. Copie o UUID da sua empresa em: Config → Informações da Empresa → ID
-- 2. Substitua todas as ocorrências de 'SUA_EMPRESA_ID' abaixo
-- 3. Rode o script
-- 4. Os templates já existentes NÃO serão duplicados (título+empresa é único por design)
-- ============================================================

-- Limpeza opcional dos templates genéricos anteriores (descomente se quiser)
-- DELETE FROM tarefa_modelos
-- WHERE empresa_id = 'SUA_EMPRESA_ID'
--   AND titulo IN (
--     'Conciliação Bancária','Contas a Pagar','Contas a Receber',
--     'Emissão de Notas Fiscais','Relatório Mensal'
--   );

-- ============================================================
-- ETAPA: COMERCIAL
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Prospecção ativa de leads — WhatsApp e LinkedIn',
  'Identificar 5 a 10 empresas-alvo por semana. Enviar mensagem de abordagem personalizada no WhatsApp ou LinkedIn. Registrar cada contato no CRM com data e resposta obtida. Priorizar empresas de 5 a 30 funcionários nos segmentos de serviços, saúde e varejo.',
  'Relacionamento', 'comercial', 'media', 'semanal',
  '["Definir lista de empresas-alvo da semana","Pesquisar sócio responsável pelo financeiro","Enviar mensagem de abordagem (WhatsApp ou LinkedIn)","Registrar contato no CRM","Aguardar resposta e agendar follow-up em 48h"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Follow-up de propostas enviadas — contato ativo',
  'Ligar ou enviar mensagem para cada prospect que recebeu proposta há 2 ou mais dias sem resposta. Tratar objeções, ajustar escopo se necessário e mover o lead para a próxima etapa no CRM.',
  'Relacionamento', 'comercial', 'alta', 'dias_uteis',
  '["Verificar propostas enviadas há +2 dias sem resposta","Contatar o decisor (WhatsApp ou ligação)","Registrar resposta no CRM","Ajustar proposta se necessário","Definir próximo passo (reunião, assinatura ou descarte)"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Reunião de diagnóstico com prospect',
  'Conduzir reunião de diagnóstico financeiro com o prospect. Levantar processos atuais, sistemas utilizados, volume de NFs, pagamentos e dores. Usar a reunião para personalizar a proposta.',
  'Estratégico', 'comercial', 'alta', 'semanal',
  '["Confirmar data, horário e canal da reunião","Preparar pauta com perguntas de diagnóstico","Conduzir reunião e anotar respostas","Identificar as 3 principais dores do cliente","Enviar resumo por e-mail em até 24h","Preparar proposta personalizada"]',
  true
);

-- ============================================================
-- ETAPA: PRÉ-ONBOARDING
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Envio do e-mail de boas-vindas e apresentação da equipe',
  'Enviar e-mail personalizado de boas-vindas ao novo cliente dentro de 24h após a assinatura do contrato. Apresentar o nome do analista responsável, metodologia de trabalho, canais de comunicação e próximos passos.',
  'Relacionamento', 'pre_ob', 'alta', 'mensal',
  '["Confirmar assinatura do contrato","Preparar e-mail com nome da equipe responsável","Incluir metodologia resumida","Informar canal principal (WhatsApp comercial)","Informar horário de atendimento","Enviar e-mail e confirmar recebimento"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Coleta de documentação do novo cliente',
  'Solicitar e receber todos os documentos necessários para início dos serviços: CNPJ, contrato social, certificado digital, credenciais de acesso, dados bancários e informações do sistema financeiro utilizado.',
  'Implantação', 'pre_ob', 'alta', 'mensal',
  '["Enviar checklist de documentos por WhatsApp","CNPJ e contrato social","RG/CPF do sócio responsável","Certificado digital (A1 ou A3)","Senha e-CAC (Receita Federal)","Acesso ao internet banking","Acesso ao ERP ou sistema financeiro","Acesso à plataforma de NF","Definir prazo para entrega (máx. 5 dias úteis)"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Verificação do regime tributário do cliente',
  'Identificar o regime tributário atual (Simples Nacional, Lucro Presumido ou Lucro Real). Verificar pendências na Receita Federal e alinhar com o cliente as obrigações do regime para orientar os processos.',
  'Estratégico', 'pre_ob', 'alta', 'mensal',
  '["Acessar e-CAC com certificado digital","Verificar regime tributário vigente","Verificar débitos ou pendências na RFB","Verificar CNPJ ativo","Identificar competências tributárias (DAS, DARF, ISS)","Registrar informações no cadastro do cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Definição do canal e rotina de comunicação',
  'Alinhar com o cliente qual será o canal principal de comunicação, horário de atendimento, responsável pelo financeiro do lado do cliente e agenda mensal de entregas.',
  'Relacionamento', 'pre_ob', 'media', 'mensal',
  '["Confirmar canal principal (WhatsApp ou e-mail)","Definir horário de atendimento da equipe","Definir responsável do cliente por área","Confirmar dia do fechamento mensal","Confirmar dia da reunião mensal","Confirmar dia de emissão das NFs","Confirmar dia dos pagamentos","Enviar resumo por escrito ao cliente"]',
  true
);

-- ============================================================
-- ETAPA: ONBOARDING
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Reunião de kick-off — primeiro encontro operacional',
  'Realizar a reunião de kick-off para apresentar a equipe, alinhar escopo, definir a agenda mensal e apresentar o sistema financeiro ao cliente. Esta reunião define o tom de toda a operação.',
  'Relacionamento', 'onboarding', 'alta', 'mensal',
  '["Enviar convite com pauta detalhada","Apresentar equipe responsável","Apresentar metodologia BPO (entradas → processamento → saída)","Alinhar escopo exato dos serviços","Confirmar sistema financeiro do cliente","Definir calendário mensal de entregas","Definir limite de aprovação de pagamentos","Registrar decisões e enviar ata em 24h"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Mapeamento de todas as contas bancárias do cliente',
  'Levantar e cadastrar todas as contas bancárias do cliente no sistema financeiro. Confirmar agência, conta, banco e saldo inicial. Testar acesso ao internet banking de cada conta.',
  'Conciliação Bancária', 'onboarding', 'alta', 'mensal',
  '["Listar todos os bancos e contas com o cliente","Confirmar agência e número de cada conta","Verificar saldo atual de cada conta","Confirmar nível de acesso (consulta ou operacional)","Cadastrar contas no ERP","Testar login no internet banking de cada banco","Registrar credenciais no cofre do sistema"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Levantamento de recebíveis, despesas fixas e inadimplência',
  'Mapear todos os recebimentos mensais fixos, as despesas fixas recorrentes e identificar a inadimplência atual do cliente. Esse mapeamento é a base para o fluxo de caixa inicial.',
  'Fluxo de Caixa', 'onboarding', 'alta', 'mensal',
  '["Listar todos os clientes que pagam mensalmente e valores","Listar despesas fixas (aluguel, folha, financiamentos, assinaturas)","Identificar inadimplentes atuais","Classificar inadimplentes por faixa de atraso","Lançar todas as informações no ERP","Gerar primeiro fluxo de caixa e apresentar ao cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Entrega do panorama financeiro inicial ao cliente',
  'Apresentar ao cliente o diagnóstico financeiro completo: posição de caixa, inadimplência, despesas fixas, e os 3 principais pontos de atenção identificados. Esta é a primeira entrega de valor real.',
  'Estratégico', 'onboarding', 'alta', 'mensal',
  '["Consolidar dados levantados no onboarding","Calcular posição de caixa atual","Listar top 3 pontos de atenção","Preparar apresentação visual (máx. 1 página)","Enviar relatório 24h antes da reunião","Apresentar ao cliente com destaque para ações imediatas"]',
  true
);

-- ============================================================
-- ETAPA: IMPLANTAÇÃO
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Configuração do ERP / sistema financeiro do cliente',
  'Configurar a empresa no sistema financeiro escolhido (Omie, Conta Azul, Nibo, MDW etc). Cadastrar contas bancárias, plano de contas, fornecedores recorrentes e ativar os módulos necessários.',
  'Implantação', 'implantacao', 'alta', 'mensal',
  '["Acessar o sistema e localizar o cadastro da empresa","Verificar CNPJ e regime tributário cadastrado","Cadastrar contas bancárias com OFX/Open Finance","Configurar plano de contas (receitas e despesas)","Cadastrar fornecedores recorrentes","Ativar módulo de NF-e / NFS-e","Configurar integração com maquininha (se aplicável)","Testar emissão da primeira NF","Testar importação de extrato bancário"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Lançamento do saldo inicial de todas as contas bancárias',
  'Lançar no sistema o saldo inicial de cada conta bancária, confirmado com extrato do banco. Este lançamento é o marco zero da conciliação bancária do cliente.',
  'Conciliação Bancária', 'implantacao', 'alta', 'mensal',
  '["Baixar extrato bancário de cada conta (data de corte)","Confirmar saldo com o cliente","Lançar saldo inicial no sistema","Validar saldo exibido no sistema vs extrato","Registrar data de início da conciliação no cadastro"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Importação e lançamento das contas a pagar do mês',
  'Levantar e lançar no sistema todos os compromissos financeiros do mês vigente: fornecedores, impostos, folha de pagamento, financiamentos e despesas fixas.',
  'Contas a Pagar', 'implantacao', 'alta', 'mensal',
  '["Listar todos os compromissos do mês com o cliente","Separar por data de vencimento","Lançar no sistema com categoria correta","Verificar se há duplicatas","Confirmar com o cliente os valores de folha e impostos","Validar total de CP lançado vs expectativa do cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Importação e lançamento das contas a receber do mês',
  'Levantar e lançar todos os recebimentos previstos do mês: contratos de serviço, cobranças de clientes inadimplentes, marketplaces e outras receitas esperadas.',
  'Contas a Receber', 'implantacao', 'alta', 'mensal',
  '["Listar todos os recebimentos previstos do mês","Lançar com data prevista e cliente de origem","Identificar cobranças em atraso","Registrar estratégia de cobrança para inadimplentes","Validar total de CR lançado vs expectativa do cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Validação dos primeiros lançamentos com o cliente',
  'Agendar call para revisar tudo que foi lançado no sistema durante a implantação. O cliente confirma valores, corrige categorias e aprova a posição inicial.',
  'Estratégico', 'implantacao', 'alta', 'mensal',
  '["Agendar call de validação","Exportar resumo de CP e CR lançados","Apresentar saldo inicial vs posição atual","Corrigir categorias conforme feedback","Validar fornecedores e clientes cadastrados","Registrar aprovação do cliente por escrito"]',
  true
);

-- ============================================================
-- ETAPA: OPERACIONAL — Rotina Diária
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Conferência bancária matinal — verificar saldo e movimentos',
  'Todo dia útil pela manhã: acessar o internet banking de cada cliente, verificar o saldo atual, identificar entradas e saídas do dia anterior e registrar qualquer movimentação não reconhecida.',
  'Conciliação Bancária', 'operacional', 'alta', 'dias_uteis',
  '["Acessar internet banking de cada cliente","Verificar saldo atual de todas as contas","Identificar movimentações novas desde ontem","Verificar se pagamentos agendados foram debitados","Identificar entradas recebidas","Registrar qualquer movimentação não reconhecida","Comunicar cliente sobre movimentações relevantes"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Verificação e pagamento de contas com vencimento hoje',
  'Verificar lista de CP com vencimento no dia, confirmar saldo disponível, obter autorização do cliente para pagamentos acima do limite e efetuar os pagamentos autorizados com emissão de comprovante.',
  'Contas a Pagar', 'operacional', 'alta', 'dias_uteis',
  '["Acessar lista de CP com vencimento hoje","Verificar saldo disponível para pagamentos","Separar pagamentos acima do limite de aprovação","Enviar para aprovação do cliente","Efetuar pagamentos autorizados","Salvar comprovantes","Baixar os títulos no sistema","Comunicar cliente sobre pagamentos realizados"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Agendamento bancário dos pagamentos do próximo dia útil',
  'Verificar os vencimentos do próximo dia útil, confirmar saldo e agendar os pagamentos no internet banking. Comunicar o cliente sobre os agendamentos realizados.',
  'Pagamentos', 'operacional', 'alta', 'dias_uteis',
  '["Verificar CP com vencimento amanhã ou no próximo dia útil","Confirmar disponibilidade de saldo","Agendar pagamentos no internet banking","Obter aprovação do cliente para valores acima do limite","Comunicar cliente sobre agendamentos realizados","Registrar no sistema os pagamentos agendados"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Verificação de recebimentos previstos para hoje',
  'Verificar no extrato bancário se os recebimentos previstos para o dia entraram na conta. Dar baixa nos títulos recebidos e acionar a régua de cobrança para os não recebidos.',
  'Contas a Receber', 'operacional', 'alta', 'dias_uteis',
  '["Verificar extrato bancário","Identificar recebimentos do dia","Comparar com CR previsto no sistema","Baixar os títulos recebidos","Identificar recebimentos em atraso","Acionar cobrança para inadimplentes do dia","Comunicar cliente sobre recebimentos"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Emissão de notas fiscais com vencimento hoje',
  'Verificar contratos com emissão de NF programada para o dia. Emitir no portal da prefeitura ou ERP. Enviar XML e PDF por e-mail para os tomadores. Registrar número da NF no controle.',
  'Emissão de NF', 'operacional', 'alta', 'dias_uteis',
  '["Verificar lista de NFs a emitir hoje (recorrências)","Confirmar dados do tomador e valor do serviço","Verificar se houve alteração de valor ou escopo","Emitir NF no portal ou ERP","Salvar XML e PDF","Enviar para o tomador por e-mail","Registrar número da NF e data de emissão no controle"]',
  true
);

-- ============================================================
-- ETAPA: OPERACIONAL — Rotina Semanal
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Conciliação de plataformas digitais — cartão, boleto e PIX semanal',
  'Toda semana baixar os relatórios da maquininha, boletos e PIX recebidos. Conciliar com os lançamentos no sistema, verificar taxas descontadas e identificar divergências.',
  'Conciliação Bancária', 'operacional', 'media', 'semanal',
  '["Baixar relatório de vendas da maquininha","Baixar relatório de boletos emitidos e pagos","Baixar relatório de PIX recebidos","Conciliar com lançamentos no sistema","Verificar taxas descontadas pelas operadoras","Identificar divergências","Registrar ajustes no sistema"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Agendamento bancário semanal — próximos 7 dias',
  'Todo início de semana verificar todos os pagamentos a vencer nos próximos 7 dias. Separar por banco, verificar saldo e agendar no internet banking os que têm aprovação.',
  'Pagamentos', 'operacional', 'media', 'semanal',
  '["Listar CP a vencer nos próximos 7 dias","Separar por banco","Verificar saldo disponível em cada conta","Identificar pagamentos que precisam de aprovação","Enviar lista de aprovações pendentes ao cliente","Agendar pagamentos aprovados no internet banking","Registrar agendamentos no sistema"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Verificação de aprovações de pagamento pendentes',
  'Verificar semanalmente os pagamentos que estão aguardando aprovação do cliente. Enviar lembrete e registrar as aprovações recebidas.',
  'Pagamentos', 'operacional', 'media', 'semanal',
  '["Listar pagamentos no status aguardando aprovação","Verificar há quantos dias estão aguardando","Enviar lembrete ao responsável do cliente","Registrar aprovações recebidas","Executar os pagamentos aprovados","Cancelar ou remarcar os rejeitados"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Emissão de NFs de serviço recorrentes semanais',
  'Verificar contratos com frequência de emissão semanal. Emitir, enviar e registrar.',
  'Emissão de NF', 'operacional', 'media', 'semanal',
  '["Verificar lista de contratos com NF semanal","Confirmar valores e dados do tomador","Emitir NFs no portal ou ERP","Enviar XML e PDF para destinatários","Registrar número e data no controle"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Verificação semanal de inadimplência e cobrança ativa',
  'Toda semana verificar a lista de títulos vencidos. Classificar por faixa de atraso e acionar a régua de cobrança conforme o protocolo: D+1 WhatsApp amigável, D+5 formal, D+10 ligação.',
  'Cobrança / Inadimplência', 'operacional', 'media', 'semanal',
  '["Listar títulos vencidos até hoje","Classificar por faixa: 1-7d, 8-30d, 31-60d, +60d","Enviar cobranças D+1 (lembrete amigável)","Enviar cobranças D+5 (cobrança formal com juros)","Registrar tentativas de contato","Comunicar cliente sobre posição de inadimplência"]',
  true
);

-- ============================================================
-- ETAPA: OPERACIONAL — Fechamento Mensal
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Solicitar extrato bancário e documentos do mês ao cliente',
  'No início do fechamento, solicitar ao cliente todos os extratos bancários, faturas de cartão, comprovantes de despesas físicas e NFs de compras que não foram enviadas ao longo do mês.',
  'Conciliação Bancária', 'operacional', 'mensal',
  NULL,
  '["Enviar solicitação por WhatsApp com checklist","Extrato de todas as contas bancárias","Fatura do cartão corporativo (se houver)","Comprovantes de despesas em dinheiro ou cartão pessoal","NFs de compras recebidas em papel","Definir prazo de entrega (máx. dia 5 do mês seguinte)","Registrar data de solicitação"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Emissão das NFs dos contratos BPO do mês',
  'Emitir as notas fiscais de serviço referentes às mensalidades de cada cliente. Confirmar valor com o contrato, emitir no portal da prefeitura e enviar por e-mail.',
  'Emissão de NF', 'operacional', 'alta', 'mensal',
  '["Verificar lista de contratos ativos","Confirmar valor de cada mensalidade","Emitir NFS-e no portal da prefeitura","Salvar XML e PDF","Enviar para o contato financeiro do cliente","Registrar número e data de emissão","Arquivar na pasta do cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Conciliação bancária completa — conta a conta',
  'Conciliar o extrato bancário de cada conta do cliente: lançamento a lançamento, identificar divergências, registrar ajustes e fechar o extrato do mês sem diferença.',
  'Conciliação Bancária', 'operacional', 'alta', 'mensal',
  '["Baixar extrato bancário de cada conta","Acessar o ERP ou sistema financeiro","Conciliar cada lançamento do extrato","Identificar lançamentos não reconhecidos","Verificar transferências entre contas","Registrar lançamentos faltantes","Fechar conciliação sem diferença","Gerar relatório de conciliação"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Conciliação de plataformas digitais — fechamento mensal',
  'Conciliar todos os canais de recebimento do mês: boletos, PIX, maquininha (crédito e débito), marketplaces (Mercado Livre, Shopee etc). Verificar taxas descontadas e ajustar no sistema.',
  'Conciliação Bancária', 'operacional', 'alta', 'mensal',
  '["Baixar relatório consolidado de boletos (emitidos x recebidos)","Baixar relatório de PIX recebidos","Baixar relatório da maquininha (crédito e débito separados)","Baixar relatório de marketplaces (repasses)","Conciliar cada canal com lançamentos no sistema","Verificar taxas e tarifas descontadas","Registrar ajustes no sistema","Fechar total de recebimentos do mês"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Verificação e controle de guias de tributos do mês',
  'Verificar os tributos a vencer no mês do cliente (DAS, DARF, ISS, GPS). Confirmar com o contador se necessário, acompanhar o pagamento e arquivar os comprovantes.',
  'Contas a Pagar', 'operacional', 'alta', 'mensal',
  '["Verificar DAS (Simples Nacional) — vencimento e valor","Verificar ISS municipal (se aplicável)","Verificar DARF (se Lucro Presumido ou Real)","Verificar GPS/INSS (se aplicável)","Confirmar valores com contador ou cliente","Acompanhar pagamento dentro do prazo","Arquivar comprovantes de recolhimento"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Fechar período no ERP e gerar relatório gerencial',
  'Após conciliação completa, fechar o período no sistema. Revisar categorias, gerar DRE gerencial e conferir se os números fazem sentido antes de enviar ao cliente.',
  'DRE Gerencial / Relatórios', 'operacional', 'alta', 'mensal',
  '["Verificar se todos os lançamentos do mês estão registrados","Revisar categorias dos lançamentos principais","Verificar se todas as conciliações foram fechadas","Fechar período no ERP","Gerar DRE gerencial do mês","Conferir receita total, despesas totais e resultado","Gerar relatório de CP e CR do mês","Criar backup dos dados antes de fechar"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Gerar fluxo de caixa projetado para o próximo mês',
  'Com o mês fechado, projetar o fluxo de caixa do próximo mês. Incluir receitas esperadas, despesas fixas, tributos e alertar o cliente sobre possíveis gaps de caixa.',
  'Fluxo de Caixa', 'operacional', 'alta', 'mensal',
  '["Projetar receitas do próximo mês (contratos + variáveis)","Projetar despesas fixas","Incluir tributos com vencimento no próximo mês","Incluir parcelas de financiamentos","Calcular saldo projetado dia a dia","Identificar gap de caixa (dia crítico)","Alertar cliente se houver risco de saldo negativo","Preparar recomendação de ação"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Enviar comprovantes de pagamentos do mês ao cliente',
  'Organizar todos os comprovantes de pagamentos realizados no mês e enviar ao cliente em pasta organizada por data. Confirmar recebimento.',
  'Contas a Pagar', 'operacional', 'media', 'mensal',
  '["Reunir todos os comprovantes de pagamento do mês","Organizar por data de pagamento","Criar pasta no Google Drive ou enviar por e-mail","Enviar link ou arquivo ao contato do cliente","Confirmar recebimento pelo cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Preparar e enviar relatório executivo mensal ao cliente',
  'Montar o relatório executivo de uma página: resultado do mês, posição de caixa, fluxo projetado, top 3 pontos de atenção e indicadores. Enviar 24h antes da reunião mensal.',
  'DRE Gerencial / Relatórios', 'operacional', 'alta', 'mensal',
  '["Consolidar resultado do mês (receita, despesas, resultado)","Calcular margem bruta e líquida","Verificar posição de caixa atual","Incluir fluxo de caixa projetado","Calcular top 3 indicadores (inadimplência, ticket médio, margem)","Identificar top 3 pontos de atenção","Preparar apresentação visual (máx. 1 página)","Enviar ao cliente com 24h de antecedência"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Reunião mensal de resultados com o cliente',
  'Conduzir a reunião mensal: apresentar resultado em 2 minutos, apontar os 3 pontos de atenção, apresentar posição de caixa, projeção do próximo mês e definir as 3 prioridades do mês seguinte.',
  'Estratégico', 'operacional', 'alta', 'mensal',
  '["Confirmar data e horário com antecedência","Preparar apresentação com base no relatório executivo","Abrir com resultado do mês (2 minutos)","Apresentar top 3 pontos de atenção","Apresentar posição de caixa atual","Apresentar projeção próximos 30 dias","Definir top 3 prioridades do próximo mês","Registrar ata e enviar em até 24h"]',
  true
);

-- ============================================================
-- ETAPA: OPERACIONAL — Por vencimento / recorrência específica
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, dia_mes, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Cobrança de clientes inadimplentes — D+10 ligação telefônica',
  'Para devedores com 10 dias de atraso: ligar para o responsável financeiro e, se não atender, para o sócio. Entender o motivo do atraso, oferecer parcelamento e registrar resultado.',
  'Cobrança / Inadimplência', 'operacional', 'alta', 'mensal',
  10,
  '["Listar inadimplentes com 10+ dias de atraso","Ligar para o responsável financeiro","Ligar para o sócio se não houver resposta","Entender o motivo do atraso","Oferecer parcelamento se necessário","Registrar resultado da ligação","Atualizar status no sistema"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Verificação de vencimento de contratos e renovações',
  'Verificar mensalmente os contratos que vencem nos próximos 60 dias. Iniciar processo de renovação com antecedência para evitar descontinuidade de serviço.',
  'Estratégico', 'operacional', 'media', 'mensal',
  1,
  '["Verificar contratos com vencimento nos próximos 60 dias","Preparar proposta de renovação com reajuste","Enviar ao decisor com 30 dias de antecedência","Negociar e ajustar escopo se necessário","Assinar aditivo ou novo contrato","Atualizar data de vencimento no cadastro"]',
  true
);

-- ============================================================
-- ETAPA: ESTRATÉGICO
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Cálculo de indicadores financeiros estratégicos do mês',
  'Calcular os principais KPIs do cliente: margem bruta, margem líquida, ponto de equilíbrio, ticket médio, taxa de inadimplência e capital de giro. Comparar com mês anterior e metas.',
  'DRE Gerencial / Relatórios', 'estrategico', 'alta', 'mensal',
  '["Calcular Margem Bruta (receita - CMV)","Calcular Margem Líquida (resultado / receita)","Calcular Ponto de Equilíbrio","Calcular Ticket Médio","Calcular Taxa de Inadimplência","Calcular Giro de Capital","Comparar com mês anterior","Comparar com meta acordada com o cliente","Registrar indicadores no histórico do cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Identificação dos 3 maiores vazamentos de caixa do mês',
  'Analisar as despesas do mês e identificar os 3 maiores pontos de sangramento financeiro. Preparar recomendações objetivas de corte ou renegociação.',
  'Estratégico', 'estrategico', 'alta', 'mensal',
  '["Analisar top 10 despesas do mês","Comparar com mês anterior e identificar aumentos","Calcular % de cada categoria sobre a receita","Identificar os 3 maiores vazamentos","Verificar contratos de fornecedores para renegociação","Preparar recomendações com impacto estimado","Apresentar na reunião mensal"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Reunião estratégica mensal — análise e plano de ação',
  'Conduzir a reunião estratégica mensal focada em decisões: resultado, vazamentos, projeção e definição do top 3 prioridades do próximo mês. Enviar ata com plano de ação.',
  'Estratégico', 'estrategico', 'alta', 'mensal',
  '["Enviar relatório ao cliente 24h antes","Abrir com resultado do mês em 2 minutos","Apresentar top 3 vazamentos de caixa","Apresentar posição de caixa e projeção","Definir top 3 prioridades do próximo mês","Definir responsável e prazo para cada prioridade","Registrar ata e enviar em até 24h"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Análise trimestral de lucratividade por cliente / produto',
  'A cada trimestre, analisar a lucratividade por segmento de clientes ou linha de produtos. Identificar o que está gerando mais e menos margem para orientar decisões estratégicas.',
  'Estratégico', 'estrategico', 'media', 'trimestral',
  '["Separar receitas por tipo de cliente ou produto","Alocar custos diretos por segmento","Calcular margem por segmento","Identificar o segmento mais lucrativo","Identificar o menos lucrativo","Preparar análise comparativa trimestral","Apresentar ao cliente com recomendações"]',
  true
);

-- ============================================================
-- ETAPA: ACOMPANHAMENTO
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Avaliação mensal da saúde financeira do cliente — health score',
  'Calcular o health score do cliente com base em: inadimplência controlada, caixa positivo, tarefas em dia e satisfação. Registrar no cadastro e acionar plano de retenção se abaixo de 60.',
  'Estratégico', 'acompanhamento', 'alta', 'mensal',
  '["Verificar se inadimplência está abaixo de 5% da receita","Verificar se o caixa projetado é positivo nos próximos 30 dias","Verificar se as tarefas do mês foram concluídas no prazo","Verificar se houve reclamações ou atrasos de entrega","Calcular health score (0-100)","Registrar no cadastro do cliente","Acionar plano de retenção se score < 60"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Identificação de sinais de risco de churn',
  'Verificar mensalmente os sinais de que o cliente pode cancelar: atrasos de resposta, reclamações, inadimplência do próprio cliente (BPO) e queda de engajamento nas reuniões.',
  'Relacionamento', 'acompanhamento', 'alta', 'mensal',
  '["O cliente respondeu todas as solicitações no mês?","Houve reclamação registrada?","O cliente está inadimplente com a Fluxe?","O cliente participou das reuniões?","O health score caiu em relação ao mês anterior?","Há risco de churn? Se sim, acionar plano de retenção"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'NPS trimestral — pesquisa de satisfação do cliente',
  'A cada trimestre, enviar formulário de NPS (0-10) ao decisor do cliente. Registrar nota, comentários e criar plano de ação para notas abaixo de 7.',
  'Relacionamento', 'acompanhamento', 'alta', 'trimestral',
  '["Preparar formulário de NPS (Google Forms ou typeform)","Enviar por WhatsApp ou e-mail","Aguardar resposta (prazo de 5 dias)","Registrar nota e comentários no cadastro","Classificar: Promotor (9-10), Neutro (7-8), Detrator (0-6)","Criar plano de ação para notas abaixo de 7","Ligar para detratores dentro de 48h"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Identificação de oportunidades de expansão de escopo',
  'Verificar trimestralmente se há serviços que o cliente ainda faz internamente e que poderiam ser absorvidos pelo BPO. Preparar proposta de expansão.',
  'Estratégico', 'acompanhamento', 'media', 'trimestral',
  '["Há emissão de NF que ainda é feita internamente?","Há pagamentos que o cliente ainda faz sozinho?","Há relatórios gerenciais extras com demanda?","Há novas contas bancárias sem conciliação?","Há necessidade de cobranças que não gerenciamos?","Documentar oportunidade identificada","Preparar proposta de expansão com novo valor"]',
  true
);

-- ============================================================
-- ETAPA: ENCERRAMENTO
-- ============================================================
INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  'SUA_EMPRESA_ID',
  'Registro formal do aviso de cancelamento e protocolo de encerramento',
  'Ao receber aviso de cancelamento, registrar data, verificar cláusula de aviso prévio, calcular data final de serviços e comunicar o gestor responsável para iniciar o protocolo.',
  'Relacionamento', 'encerramento', 'alta', 'mensal',
  '["Registrar data do aviso formal","Verificar cláusula de aviso prévio no contrato","Calcular data de encerramento dos serviços","Comunicar o gestor responsável","Iniciar checklist de encerramento","Confirmar por escrito com o cliente"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Organização e entrega do histórico financeiro do cliente',
  'Exportar todo o histórico financeiro do período de serviço: extratos, lançamentos, relatórios mensais. Organizar em pasta por ano/mês e compartilhar com o cliente.',
  'Estratégico', 'encerramento', 'alta', 'mensal',
  '["Exportar todos os extratos conciliados do período","Exportar lançamentos do ERP em CSV/Excel","Exportar relatórios mensais de todos os períodos","Organizar em pasta por ano e mês","Fazer upload no Google Drive","Enviar link de acesso ao cliente","Confirmar que o cliente conseguiu baixar os arquivos"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Entrega de senhas e revogação de acessos da equipe Fluxe',
  'Entregar de forma segura todas as senhas e acessos gerenciados ao cliente. Em seguida, revogar o acesso de todos os membros da equipe Fluxe dos sistemas do cliente.',
  'Implantação', 'encerramento', 'alta', 'mensal',
  '["Listar todos os acessos gerenciados (bancos, ERP, portais)","Entregar senhas de forma segura (não por e-mail aberto)","Confirmar que o cliente conseguiu acessar cada sistema","Revogar acesso dos usuários Fluxe no internet banking","Revogar acesso no ERP do cliente","Revogar acesso no portal de NF","Revogar acesso em plataformas adicionais","Confirmar revogação completa e registrar no sistema"]',
  true
),
(
  'SUA_EMPRESA_ID',
  'Encerramento formal e e-mail de despedida',
  'Emitir NF final, cobrar saldo devedor, encerrar o cadastro no sistema e enviar e-mail de despedida e agradecimento com abertura para retorno futuro.',
  'Relacionamento', 'encerramento', 'media', 'mensal',
  '["Verificar se há mensalidades em aberto","Emitir NF referente ao período proporcional","Cobrar saldo devedor (se houver)","Confirmar recebimento antes de revogar acessos","Alterar status do cliente para inativo","Registrar data e motivo do cancelamento","Arquivar contrato e documentação","Enviar e-mail de despedida e agradecimento"]',
  true
);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT etapa, COUNT(*) as total, COUNT(descricao) as com_descricao
FROM tarefa_modelos
WHERE empresa_id = 'SUA_EMPRESA_ID'
GROUP BY etapa
ORDER BY etapa;
