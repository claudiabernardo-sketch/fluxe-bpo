-- ============================================================
-- PASSO 2 — Cole este SQL no editor e clique em Run
-- Biblioteca BPO completa — detecta seu empresa_id automaticamente
-- ============================================================

DO $$
DECLARE
  eid UUID;
BEGIN
  -- Pega o empresa_id da primeira empresa cadastrada
  SELECT id INTO eid FROM empresas LIMIT 1;

  IF eid IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa encontrada. Faça login no sistema primeiro.';
  END IF;

  -- ══════════════════════════════════════
  -- ETAPA: COMERCIAL
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Prospecção ativa de leads — WhatsApp e LinkedIn',
   'Identificar 5 a 10 empresas-alvo por semana. Enviar mensagem de abordagem personalizada no WhatsApp ou LinkedIn. Registrar cada contato no CRM com data e resposta obtida. Priorizar empresas de 5 a 30 funcionários nos segmentos de serviços, saúde e varejo.',
   'Relacionamento', 'comercial', 'media', 'semanal',
   '["Definir lista de empresas-alvo da semana","Pesquisar sócio responsável pelo financeiro","Enviar mensagem de abordagem","Registrar contato no CRM","Agendar follow-up em 48h"]', true),

  (eid, 'Follow-up de propostas enviadas — contato ativo',
   'Ligar ou enviar mensagem para cada prospect que recebeu proposta há 2 ou mais dias sem resposta. Tratar objeções, ajustar escopo se necessário e mover o lead para a próxima etapa no CRM.',
   'Relacionamento', 'comercial', 'alta', 'dias_uteis',
   '["Verificar propostas enviadas há +2 dias sem resposta","Contatar o decisor","Registrar resposta no CRM","Ajustar proposta se necessário","Definir próximo passo"]', true),

  (eid, 'Reunião de diagnóstico com prospect',
   'Conduzir reunião de diagnóstico financeiro com o prospect. Levantar processos atuais, sistemas, volume de NFs e dores.',
   'Estratégico', 'comercial', 'alta', 'semanal',
   '["Confirmar data e canal da reunião","Preparar pauta de diagnóstico","Conduzir reunião","Identificar as 3 principais dores","Enviar resumo em até 24h","Preparar proposta personalizada"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: PRÉ-ONBOARDING
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Envio do e-mail de boas-vindas e apresentação da equipe',
   'Enviar e-mail personalizado de boas-vindas ao novo cliente dentro de 24h após a assinatura do contrato. Apresentar o analista responsável, metodologia e próximos passos.',
   'Relacionamento', 'pre_ob', 'alta', 'mensal',
   '["Confirmar assinatura do contrato","Preparar e-mail com nome da equipe","Incluir metodologia resumida","Informar canal principal","Informar horário de atendimento","Confirmar recebimento"]', true),

  (eid, 'Coleta de documentação do novo cliente',
   'Solicitar e receber todos os documentos necessários para início: CNPJ, contrato social, certificado digital, credenciais de acesso, dados bancários e sistema financeiro.',
   'Implantação', 'pre_ob', 'alta', 'mensal',
   '["Enviar checklist de documentos","CNPJ e contrato social","RG/CPF do sócio","Certificado digital","Senha e-CAC","Acesso ao internet banking","Acesso ao ERP","Acesso à plataforma de NF","Prazo de entrega: 5 dias úteis"]', true),

  (eid, 'Verificação do regime tributário do cliente',
   'Identificar o regime tributário atual (Simples, Lucro Presumido ou Real). Verificar pendências na Receita Federal.',
   'Estratégico', 'pre_ob', 'alta', 'mensal',
   '["Acessar e-CAC com certificado digital","Verificar regime tributário vigente","Verificar pendências na RFB","Verificar CNPJ ativo","Registrar no cadastro do cliente"]', true),

  (eid, 'Definição do canal e rotina de comunicação',
   'Alinhar canal principal, horário de atendimento, responsável do cliente e agenda mensal de entregas.',
   'Relacionamento', 'pre_ob', 'media', 'mensal',
   '["Confirmar canal principal","Definir horário de atendimento","Definir responsável do cliente","Confirmar dia do fechamento","Confirmar dia da reunião mensal","Confirmar dia dos pagamentos","Enviar resumo por escrito"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: ONBOARDING
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Reunião de kick-off — primeiro encontro operacional',
   'Apresentar equipe, alinhar escopo, definir agenda mensal e apresentar o sistema financeiro ao cliente. Esta reunião define o tom de toda a operação.',
   'Relacionamento', 'onboarding', 'alta', 'mensal',
   '["Enviar convite com pauta","Apresentar equipe responsável","Alinhar escopo exato","Confirmar sistema financeiro","Definir calendário de entregas","Definir limite de aprovação de pagamentos","Enviar ata em 24h"]', true),

  (eid, 'Mapeamento de todas as contas bancárias do cliente',
   'Levantar e cadastrar todas as contas bancárias no sistema. Confirmar agência, conta, banco e saldo inicial.',
   'Conciliação Bancária', 'onboarding', 'alta', 'mensal',
   '["Listar todos os bancos e contas","Confirmar agência e número de cada conta","Verificar saldo atual","Confirmar nível de acesso (consulta ou operacional)","Cadastrar contas no ERP","Testar login em cada banco","Registrar credenciais no cofre"]', true),

  (eid, 'Levantamento de recebíveis, despesas fixas e inadimplência',
   'Mapear todos os recebimentos mensais fixos, despesas recorrentes e inadimplência atual. Base para o fluxo de caixa inicial.',
   'Fluxo de Caixa', 'onboarding', 'alta', 'mensal',
   '["Listar clientes que pagam mensalmente","Listar despesas fixas","Identificar inadimplentes atuais","Classificar por faixa de atraso","Lançar no ERP","Gerar primeiro fluxo de caixa"]', true),

  (eid, 'Entrega do panorama financeiro inicial ao cliente',
   'Apresentar diagnóstico: posição de caixa, inadimplência, despesas fixas e os 3 principais pontos de atenção.',
   'Estratégico', 'onboarding', 'alta', 'mensal',
   '["Consolidar dados levantados","Calcular posição de caixa atual","Listar top 3 pontos de atenção","Preparar apresentação (máx. 1 página)","Enviar 24h antes da reunião","Apresentar com foco em ações imediatas"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: IMPLANTAÇÃO
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Configuração do ERP / sistema financeiro do cliente',
   'Configurar empresa no sistema (Omie, Conta Azul, Nibo, MDW etc). Cadastrar contas bancárias, plano de contas e ativar módulos necessários.',
   'Implantação', 'implantacao', 'alta', 'mensal',
   '["Acessar o sistema e localizar o cadastro","Verificar CNPJ e regime tributário","Cadastrar contas bancárias com OFX","Configurar plano de contas","Cadastrar fornecedores recorrentes","Ativar módulo de NF","Testar importação de extrato"]', true),

  (eid, 'Lançamento do saldo inicial de todas as contas bancárias',
   'Lançar no sistema o saldo inicial de cada conta, confirmado com extrato do banco. Marco zero da conciliação.',
   'Conciliação Bancária', 'implantacao', 'alta', 'mensal',
   '["Baixar extrato bancário de cada conta","Confirmar saldo com o cliente","Lançar saldo inicial no sistema","Validar saldo no sistema vs extrato","Registrar data de início da conciliação"]', true),

  (eid, 'Importação das contas a pagar do mês de implantação',
   'Levantar e lançar no sistema todos os compromissos do mês: fornecedores, impostos, folha e despesas fixas.',
   'Contas a Pagar', 'implantacao', 'alta', 'mensal',
   '["Listar todos os compromissos do mês","Separar por vencimento","Lançar no sistema com categoria correta","Verificar duplicatas","Confirmar valores de folha e impostos","Validar total com o cliente"]', true),

  (eid, 'Importação das contas a receber do mês de implantação',
   'Levantar e lançar todos os recebimentos previstos: contratos, cobranças e outras receitas esperadas.',
   'Contas a Receber', 'implantacao', 'alta', 'mensal',
   '["Listar recebimentos previstos do mês","Lançar com data prevista","Identificar cobranças em atraso","Registrar estratégia para inadimplentes","Validar total com o cliente"]', true),

  (eid, 'Validação dos primeiros lançamentos com o cliente',
   'Call para revisar tudo que foi lançado durante a implantação. Cliente confirma valores, corrige categorias e aprova posição inicial.',
   'Estratégico', 'implantacao', 'alta', 'mensal',
   '["Agendar call de validação","Exportar resumo de CP e CR","Apresentar saldo inicial","Corrigir conforme feedback","Validar fornecedores e clientes","Registrar aprovação por escrito"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: OPERACIONAL — Rotina Diária
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Conferência bancária matinal — saldo e movimentos do dia',
   'Todo dia útil pela manhã: acessar o internet banking, verificar saldo atual, entradas e saídas do dia anterior e identificar movimentações não reconhecidas.',
   'Conciliação Bancária', 'operacional', 'alta', 'dias_uteis',
   '["Acessar internet banking de cada cliente","Verificar saldo atual de todas as contas","Identificar movimentações novas","Confirmar débito de agendamentos","Identificar entradas recebidas","Comunicar cliente sobre movimentações relevantes"]', true),

  (eid, 'Verificação e pagamento das contas com vencimento hoje',
   'Verificar CP com vencimento no dia, confirmar saldo, obter autorização do cliente para pagamentos acima do limite e efetuar os pagamentos com comprovante.',
   'Contas a Pagar', 'operacional', 'alta', 'dias_uteis',
   '["Acessar lista de CP com vencimento hoje","Verificar saldo disponível","Separar pagamentos acima do limite de aprovação","Enviar para aprovação do cliente","Efetuar pagamentos autorizados","Salvar comprovantes","Baixar os títulos no sistema"]', true),

  (eid, 'Agendamento bancário dos pagamentos do próximo dia útil',
   'Verificar vencimentos do próximo dia útil, confirmar saldo e agendar pagamentos no internet banking.',
   'Pagamentos', 'operacional', 'alta', 'dias_uteis',
   '["Verificar CP com vencimento amanhã","Confirmar disponibilidade de saldo","Agendar pagamentos no internet banking","Obter aprovação para valores acima do limite","Comunicar cliente sobre agendamentos","Registrar no sistema"]', true),

  (eid, 'Verificação de recebimentos previstos para hoje',
   'Verificar no extrato se os recebimentos do dia entraram. Baixar títulos recebidos e acionar cobrança para não recebidos.',
   'Contas a Receber', 'operacional', 'alta', 'dias_uteis',
   '["Verificar extrato bancário","Identificar recebimentos do dia","Comparar com CR previsto","Baixar os títulos recebidos","Identificar inadimplentes do dia","Acionar cobrança","Comunicar cliente"]', true),

  (eid, 'Emissão de notas fiscais com vencimento hoje',
   'Verificar NFs programadas para o dia, emitir no portal, enviar XML e PDF para os tomadores.',
   'Emissão de NF', 'operacional', 'alta', 'dias_uteis',
   '["Verificar lista de NFs a emitir hoje","Confirmar dados do tomador e valor","Emitir NF no portal ou ERP","Salvar XML e PDF","Enviar para o tomador","Registrar número e data no controle"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: OPERACIONAL — Rotina Semanal
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Conciliação semanal — cartão, boleto e PIX',
   'Baixar relatórios da maquininha, boletos e PIX. Conciliar com lançamentos no sistema, verificar taxas e identificar divergências.',
   'Conciliação Bancária', 'operacional', 'media', 'semanal',
   '["Baixar relatório da maquininha","Baixar relatório de boletos","Baixar relatório de PIX","Conciliar com lançamentos no sistema","Verificar taxas descontadas","Identificar divergências","Registrar ajustes"]', true),

  (eid, 'Agendamento bancário semanal — próximos 7 dias',
   'Todo início de semana verificar CP a vencer nos próximos 7 dias. Agendar no internet banking os que têm aprovação.',
   'Pagamentos', 'operacional', 'media', 'semanal',
   '["Listar CP a vencer em 7 dias","Separar por banco","Verificar saldo disponível","Enviar lista de aprovações pendentes","Agendar pagamentos aprovados","Registrar agendamentos no sistema"]', true),

  (eid, 'Verificação semanal de inadimplência e cobrança ativa',
   'Verificar lista de títulos vencidos. Classificar por faixa de atraso e acionar régua de cobrança.',
   'Cobrança / Inadimplência', 'operacional', 'media', 'semanal',
   '["Listar títulos vencidos","Classificar: 1-7d, 8-30d, 31-60d, +60d","Enviar cobranças D+1 (lembrete amigável)","Enviar cobranças D+5 (formal com juros)","Registrar tentativas de contato","Comunicar posição de inadimplência ao cliente"]', true),

  (eid, 'Emissão de NFs de serviço recorrentes semanais',
   'Verificar contratos com frequência semanal. Emitir, enviar e registrar.',
   'Emissão de NF', 'operacional', 'media', 'semanal',
   '["Verificar contratos com NF semanal","Confirmar valores e dados do tomador","Emitir NFs","Enviar XML e PDF","Registrar no controle"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: OPERACIONAL — Fechamento Mensal
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Solicitar extrato bancário e documentos do mês ao cliente',
   'No início do fechamento, solicitar extratos, faturas de cartão, comprovantes de despesas e NFs de compras.',
   'Conciliação Bancária', 'operacional', 'alta', 'mensal',
   '["Enviar solicitação por WhatsApp com checklist","Extrato de todas as contas bancárias","Fatura do cartão corporativo","Comprovantes de despesas em dinheiro","NFs de compras recebidas em papel","Prazo: máx. dia 5 do mês seguinte"]', true),

  (eid, 'Emissão das NFs dos contratos BPO do mês',
   'Emitir as NFs de serviço das mensalidades de cada cliente. Confirmar valor, emitir no portal e enviar por e-mail.',
   'Emissão de NF', 'operacional', 'alta', 'mensal',
   '["Verificar lista de contratos ativos","Confirmar valor de cada mensalidade","Emitir NFS-e no portal da prefeitura","Salvar XML e PDF","Enviar para o cliente","Registrar número e data","Arquivar na pasta do cliente"]', true),

  (eid, 'Conciliação bancária completa — conta a conta',
   'Conciliar extrato bancário lançamento a lançamento. Identificar divergências, ajustar e fechar sem diferença.',
   'Conciliação Bancária', 'operacional', 'alta', 'mensal',
   '["Baixar extrato de cada conta","Conciliar cada lançamento","Identificar lançamentos não reconhecidos","Verificar transferências entre contas","Fechar conciliação sem diferença","Gerar relatório de conciliação"]', true),

  (eid, 'Conciliação de plataformas digitais — fechamento mensal',
   'Conciliar boletos, PIX, maquininha e marketplaces. Verificar taxas e ajustar no sistema.',
   'Conciliação Bancária', 'operacional', 'alta', 'mensal',
   '["Baixar relatório de boletos","Baixar relatório de PIX","Baixar relatório da maquininha","Baixar relatório de marketplaces","Conciliar cada canal no sistema","Verificar taxas descontadas","Registrar ajustes"]', true),

  (eid, 'Verificação e controle de guias de tributos do mês',
   'Verificar DAS, DARF, ISS e GPS a vencer. Acompanhar pagamento e arquivar comprovantes.',
   'Contas a Pagar', 'operacional', 'alta', 'mensal',
   '["Verificar DAS (Simples Nacional)","Verificar ISS municipal","Verificar DARF (Lucro Presumido/Real)","Verificar GPS/INSS","Confirmar com contador","Acompanhar pagamento no prazo","Arquivar comprovantes"]', true),

  (eid, 'Fechar período no ERP e gerar relatório gerencial',
   'Após conciliação, fechar período, revisar categorias, gerar DRE e verificar números antes de enviar.',
   'DRE Gerencial / Relatórios', 'operacional', 'alta', 'mensal',
   '["Verificar todos os lançamentos do mês","Revisar categorias dos lançamentos","Fechar período no ERP","Gerar DRE gerencial","Conferir receita, despesas e resultado","Gerar relatório de CP e CR","Criar backup dos dados"]', true),

  (eid, 'Gerar fluxo de caixa projetado para o próximo mês',
   'Projetar o FC do próximo mês: receitas esperadas, despesas fixas, tributos e alertar sobre gaps de caixa.',
   'Fluxo de Caixa', 'operacional', 'alta', 'mensal',
   '["Projetar receitas (contratos + variáveis)","Projetar despesas fixas","Incluir tributos a vencer","Incluir parcelas de financiamentos","Calcular saldo projetado dia a dia","Identificar gap de caixa","Alertar cliente se houver risco"]', true),

  (eid, 'Enviar comprovantes de pagamentos do mês ao cliente',
   'Organizar comprovantes por data e enviar em pasta organizada. Confirmar recebimento.',
   'Contas a Pagar', 'operacional', 'media', 'mensal',
   '["Reunir todos os comprovantes do mês","Organizar por data","Criar pasta no Google Drive ou e-mail","Enviar para o cliente","Confirmar recebimento"]', true),

  (eid, 'Preparar e enviar relatório executivo mensal ao cliente',
   'Montar relatório de uma página: resultado, caixa, FC projetado, top 3 pontos de atenção. Enviar 24h antes da reunião.',
   'DRE Gerencial / Relatórios', 'operacional', 'alta', 'mensal',
   '["Consolidar resultado do mês","Calcular margem bruta e líquida","Verificar posição de caixa","Incluir FC projetado","Calcular top 3 indicadores","Identificar top 3 pontos de atenção","Enviar 24h antes da reunião"]', true),

  (eid, 'Reunião mensal de resultados com o cliente',
   'Conduzir a reunião mensal: resultado em 2 min, top 3 atenções, posição de caixa, projeção e definir 3 prioridades do próximo mês.',
   'Estratégico', 'operacional', 'alta', 'mensal',
   '["Confirmar data e horário","Abrir com resultado do mês (2 minutos)","Apresentar top 3 pontos de atenção","Apresentar posição de caixa","Apresentar projeção 30 dias","Definir top 3 prioridades","Registrar ata e enviar em 24h"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: ESTRATÉGICO
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Cálculo de indicadores financeiros estratégicos do mês',
   'Calcular KPIs do cliente: margem bruta, líquida, ponto de equilíbrio, ticket médio, inadimplência e capital de giro. Comparar com meta.',
   'DRE Gerencial / Relatórios', 'estrategico', 'alta', 'mensal',
   '["Calcular Margem Bruta","Calcular Margem Líquida","Calcular Ponto de Equilíbrio","Calcular Ticket Médio","Calcular Taxa de Inadimplência","Comparar com mês anterior","Comparar com meta","Registrar no histórico do cliente"]', true),

  (eid, 'Identificação dos 3 maiores vazamentos de caixa do mês',
   'Analisar despesas do mês e identificar os 3 maiores pontos de sangramento. Preparar recomendações de corte ou renegociação.',
   'Estratégico', 'estrategico', 'alta', 'mensal',
   '["Analisar top 10 despesas do mês","Comparar com mês anterior","Calcular % de cada categoria sobre a receita","Identificar os 3 maiores vazamentos","Verificar contratos para renegociação","Preparar recomendações com impacto estimado"]', true),

  (eid, 'Reunião estratégica mensal — análise e plano de ação',
   'Reunião focada em decisões: resultado, vazamentos, projeção e definição do top 3 prioridades. Enviar ata.',
   'Estratégico', 'estrategico', 'alta', 'mensal',
   '["Enviar relatório 24h antes","Resultado do mês em 2 minutos","Top 3 vazamentos de caixa","Posição de caixa e projeção","Definir top 3 prioridades","Registrar ata e enviar em 24h"]', true),

  (eid, 'Análise trimestral de lucratividade por cliente/produto',
   'A cada trimestre, analisar lucratividade por segmento. Identificar o que gera mais e menos margem.',
   'Estratégico', 'estrategico', 'media', 'trimestral',
   '["Separar receitas por tipo de cliente ou produto","Alocar custos diretos","Calcular margem por segmento","Identificar segmento mais lucrativo","Identificar menos lucrativo","Preparar análise comparativa","Apresentar com recomendações"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: ACOMPANHAMENTO
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Avaliação mensal da saúde financeira do cliente — health score',
   'Calcular health score do cliente: inadimplência, caixa, tarefas em dia, satisfação. Acionar retenção se score < 60.',
   'Estratégico', 'acompanhamento', 'alta', 'mensal',
   '["Verificar se inadimplência < 5% da receita","Verificar se caixa projetado é positivo","Verificar se tarefas foram entregues no prazo","Verificar se houve reclamações","Calcular health score (0-100)","Registrar no cadastro","Acionar plano de retenção se < 60"]', true),

  (eid, 'Identificação de sinais de risco de churn',
   'Verificar mensalmente sinais de cancelamento: atrasos, reclamações, inadimplência e queda de engajamento.',
   'Relacionamento', 'acompanhamento', 'alta', 'mensal',
   '["Cliente respondeu todas as solicitações?","Houve reclamação registrada?","Cliente está inadimplente com a Fluxe?","Cliente participou das reuniões?","Health score caiu?","Há risco de churn? Se sim, acionar retenção"]', true),

  (eid, 'NPS trimestral — pesquisa de satisfação do cliente',
   'A cada trimestre, enviar formulário NPS (0-10). Registrar nota e criar plano de ação para notas abaixo de 7.',
   'Relacionamento', 'acompanhamento', 'alta', 'trimestral',
   '["Preparar formulário de NPS","Enviar por WhatsApp","Aguardar resposta (5 dias)","Registrar nota e comentários","Classificar: Promotor (9-10), Neutro (7-8), Detrator (0-6)","Criar ação para notas < 7","Ligar para detratores em 48h"]', true),

  (eid, 'Identificação de oportunidades de expansão de escopo',
   'Verificar trimestralmente se há serviços que o cliente faz internamente e que poderiam ser absorvidos pelo BPO.',
   'Estratégico', 'acompanhamento', 'media', 'trimestral',
   '["Há emissão de NF ainda interna?","Há pagamentos feitos pelo cliente?","Há relatórios extras com demanda?","Há novas contas sem conciliação?","Documentar oportunidade","Preparar proposta com novo valor"]', true)

  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════
  -- ETAPA: ENCERRAMENTO
  -- ══════════════════════════════════════

  INSERT INTO tarefa_modelos (empresa_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
  VALUES
  (eid, 'Registro formal do aviso de cancelamento e protocolo de encerramento',
   'Ao receber aviso de cancelamento: registrar data, verificar aviso prévio contratual, calcular data final e comunicar gestor.',
   'Relacionamento', 'encerramento', 'alta', 'mensal',
   '["Registrar data do aviso formal","Verificar cláusula de aviso prévio","Calcular data de encerramento","Comunicar gestor responsável","Iniciar checklist de encerramento","Confirmar por escrito com o cliente"]', true),

  (eid, 'Organização e entrega do histórico financeiro do cliente',
   'Exportar todo o histórico: extratos, lançamentos, relatórios mensais. Organizar em pasta por ano/mês e compartilhar.',
   'Estratégico', 'encerramento', 'alta', 'mensal',
   '["Exportar extratos conciliados do período","Exportar lançamentos do ERP em CSV","Exportar relatórios mensais","Organizar por ano e mês","Fazer upload no Google Drive","Enviar link ao cliente","Confirmar que baixou os arquivos"]', true),

  (eid, 'Entrega de senhas e revogação de acessos da equipe Fluxe',
   'Entregar senhas com segurança ao cliente. Revogar acesso de todos os membros da equipe dos sistemas do cliente.',
   'Implantação', 'encerramento', 'alta', 'mensal',
   '["Listar todos os acessos gerenciados","Entregar senhas de forma segura","Confirmar que cliente acessou cada sistema","Revogar acesso no internet banking","Revogar acesso no ERP","Revogar acesso no portal de NF","Confirmar revogação completa"]', true),

  (eid, 'Encerramento formal e e-mail de despedida',
   'Emitir NF final, cobrar saldo devedor, encerrar cadastro e enviar e-mail de despedida com abertura para retorno.',
   'Relacionamento', 'encerramento', 'media', 'mensal',
   '["Verificar mensalidades em aberto","Emitir NF proporcional","Cobrar saldo devedor","Confirmar recebimento antes de revogar acessos","Alterar status para inativo","Registrar motivo do cancelamento","Enviar e-mail de despedida"]', true)

  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Biblioteca BPO inserida com sucesso para empresa_id: %', eid;
END $$;

-- Verificação final
SELECT etapa, COUNT(*) as templates
FROM tarefa_modelos
GROUP BY etapa
ORDER BY etapa;
