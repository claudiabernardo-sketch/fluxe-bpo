-- ============================================================
-- SETUP INFINANCE — Fluxe BPO
-- Popula clientes, modelos de tarefa e rotinas da Juliana
-- ============================================================
-- ANTES DE RODAR:
--   1. Acesse o Fluxe da Juliana → Configurações → Informações da Empresa
--   2. Copie o ID da empresa (UUID)
--   3. Cole no lugar de COLE_O_ID_DA_EMPRESA_AQUI (linha 18)
--   4. Cole este script no Supabase → SQL Editor → Run
-- ============================================================

DO $$
DECLARE
  v_emp UUID := 'COLE_O_ID_DA_EMPRESA_AQUI'; -- <<< PREENCHER

  -- IDs dos clientes (gerados automaticamente)
  id_agil        UUID;
  id_tres_marias UUID;
  id_bom_sono    UUID;
  id_kf          UUID;
  id_sameiro     UUID;
  id_cyborgs     UUID;
  id_diana       UUID;
  id_camila      UUID;

BEGIN

-- ============================================================
-- 1. CLIENTES
-- ============================================================

INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'Ágil', 'Ágil', 'Contabilidade', 'operacional', 'ativo')
RETURNING id INTO id_agil;

INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'Três Marias', 'Três Marias', 'Confecção', 'operacional', 'ativo')
RETURNING id INTO id_tres_marias;

INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'Bom Sono', 'Bom Sono', 'Confecção', 'operacional', 'ativo')
RETURNING id INTO id_bom_sono;

INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'KF', 'KF', 'Infoprodutor', 'operacional', 'ativo')
RETURNING id INTO id_kf;

INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'Sameiro', 'Sameiro', 'Infoprodutor', 'operacional', 'ativo')
RETURNING id INTO id_sameiro;

INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'Cyborgs', 'Cyborgs', 'Infoprodutor', 'operacional', 'ativo')
RETURNING id INTO id_cyborgs;

INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'Instituto Diana', 'Instituto Diana', 'Infoprodutora', 'operacional', 'ativo')
RETURNING id INTO id_diana;

-- Camila Carvalho = em integração (etapa onboarding)
INSERT INTO clientes (empresa_id, razao_social, fantasia, segmento, etapa, status)
VALUES (v_emp, 'Camila Carvalho', 'Camila Carvalho', 'Infoprodutora', 'onboarding', 'ativo')
RETURNING id INTO id_camila;


-- ============================================================
-- 2. MODELOS DE TAREFA — ÁGIL
-- ============================================================
-- recorrencia: 'diaria' | 'dias_uteis' | 'semanal' | 'mensal'
-- dias_semana (tarefa_modelos): 1=seg 2=ter 3=qua 4=qui 5=sex 6=sab 0=dom

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_agil,
  'Conciliação bancária — Itaú',
  'Verificar e lançar todas as movimentações do dia no Itaú. Categorizar cada transação e fechar o dia sem pendências.',
  'Conciliação', 'operacional', 'alta', 'dias_uteis',
  '["Acessar internet banking Itaú","Baixar extrato do dia","Lançar e categorizar transações","Verificar saldo conciliado"]',
  true
),
(
  v_emp, id_agil,
  'Cobrança de inadimplentes',
  'Acionar por WhatsApp ou telefone os clientes da Ágil com contas em atraso. Registrar resposta e próximo passo.',
  'Cobrança', 'operacional', 'alta', 'semanal',
  '["Atualizar lista de inadimplentes","Enviar mensagem WhatsApp para cada devedor","Ligar para quem não respondeu em 24h","Registrar retorno e novo prazo combinado"]',
  true
),
(
  v_emp, id_agil,
  'Envio de boletos — novos clientes',
  'Emitir e enviar boletos para novos clientes que entraram na semana. Confirmar recebimento.',
  'Faturamento', 'operacional', 'media', 'semanal',
  '["Verificar novos contratos assinados na semana","Emitir boleto por cliente","Enviar boleto por e-mail e WhatsApp","Confirmar recebimento","Registrar na planilha de controle"]',
  true
);

-- ============================================================
-- 3. MODELOS DE TAREFA — TRÊS MARIAS
-- ============================================================

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_tres_marias,
  'Conciliação bancária — BB e Itaú',
  'Conciliar os dois bancos (Banco do Brasil e Itaú) diariamente. Não acumular lançamentos.',
  'Conciliação', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Banco do Brasil — baixar extrato do dia","Lançar e categorizar transações BB","Acessar Itaú — baixar extrato do dia","Lançar e categorizar transações Itaú","Verificar saldo conciliado em ambos"]',
  true
),
(
  v_emp, id_tres_marias,
  'Relatório semanal de faturamento',
  'Gerar e enviar relatório de faturamento da semana anterior. Enviar toda terça-feira.',
  'Relatórios', 'operacional', 'alta', 'semanal',
  '["Coletar dados de vendas da semana (segunda)","Consolidar entradas por forma de pagamento","Gerar relatório de faturamento","Revisar antes de enviar","Enviar ao cliente por WhatsApp ou e-mail"]',
  true
),
(
  v_emp, id_tres_marias,
  'Relatório semanal de inadimplentes',
  'Gerar lista atualizada de clientes inadimplentes e enviar ao responsável. Toda terça-feira.',
  'Relatórios', 'operacional', 'alta', 'semanal',
  '["Verificar contas vencidas e não pagas","Calcular valor total em atraso","Gerar relatório de inadimplentes","Enviar ao cliente com orientação de ação"]',
  true
),
(
  v_emp, id_tres_marias,
  'Cobrança de inadimplentes',
  'Acionar inadimplentes toda quarta-feira. Usar a lista gerada na terça.',
  'Cobrança', 'operacional', 'alta', 'semanal',
  '["Revisar lista de inadimplentes da terça","Enviar WhatsApp para cada inadimplente","Ligar para quem não respondeu","Registrar resultado de cada contato","Informar ao cliente os retornos obtidos"]',
  true
),
(
  v_emp, id_tres_marias,
  'Agendamento bancário',
  'Verificar e executar agendamentos bancários (BB e Itaú). Toda quinta-feira.',
  'Bancário', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar na semana","Confirmar saldo disponível em conta","Executar agendamentos no BB","Executar agendamentos no Itaú","Salvar comprovantes","Confirmar execução ao cliente"]',
  true
),
(
  v_emp, id_tres_marias,
  'Fluxo de Caixa mensal',
  'Gerar Fluxo de Caixa do mês anterior com análise resumida. Enviar até o dia 5.',
  'Relatórios', 'operacional', 'alta', 'mensal',
  '["Fechar conciliação do mês anterior","Consolidar entradas e saídas por categoria","Calcular saldo do período","Gerar FC mensal no template padrão","Incluir análise resumida (desvios, pontos de atenção)","Enviar ao cliente até o dia 5"]',
  true
),
(
  v_emp, id_tres_marias,
  'DRE mensal',
  'Gerar Demonstração do Resultado do Exercício do mês anterior. Enviar junto com o FC.',
  'Relatórios', 'operacional', 'alta', 'mensal',
  '["Consolidar receitas do mês","Consolidar custos e despesas do mês","Calcular resultado bruto e líquido","Gerar DRE no template padrão","Revisar antes de enviar","Enviar ao cliente até o dia 5"]',
  true
);

-- ============================================================
-- 4. MODELOS DE TAREFA — BOM SONO
-- (mesma rotina de Três Marias + relatório Z3)
-- ============================================================

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_bom_sono,
  'Conciliação bancária — BB e Itaú',
  'Conciliar os dois bancos (Banco do Brasil e Itaú) diariamente. Mesma rotina da Três Marias.',
  'Conciliação', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Banco do Brasil — baixar extrato do dia","Lançar e categorizar transações BB","Acessar Itaú — baixar extrato do dia","Lançar e categorizar transações Itaú","Verificar saldo conciliado em ambos"]',
  true
),
(
  v_emp, id_bom_sono,
  'Relatório semanal de faturamento',
  'Gerar e enviar relatório de faturamento da semana anterior. Toda terça-feira.',
  'Relatórios', 'operacional', 'alta', 'semanal',
  '["Coletar dados de vendas da semana (segunda)","Consolidar entradas por forma de pagamento","Gerar relatório de faturamento","Revisar antes de enviar","Enviar ao cliente"]',
  true
),
(
  v_emp, id_bom_sono,
  'Relatório semanal de inadimplentes',
  'Gerar lista de inadimplentes e enviar ao responsável. Toda terça-feira.',
  'Relatórios', 'operacional', 'alta', 'semanal',
  '["Verificar contas vencidas e não pagas","Calcular valor total em atraso","Gerar relatório","Enviar ao cliente"]',
  true
),
(
  v_emp, id_bom_sono,
  'Relatório semanal — cliente Z3',
  'Gerar relatório semanal específico do cliente Z3 da Bom Sono. Toda terça-feira junto dos demais.',
  'Relatórios', 'operacional', 'alta', 'semanal',
  '["Coletar dados do cliente Z3 da semana","Gerar relatório no formato acordado","Revisar antes de enviar","Enviar ao responsável"]',
  true
),
(
  v_emp, id_bom_sono,
  'Cobrança de inadimplentes',
  'Acionar inadimplentes toda quarta-feira.',
  'Cobrança', 'operacional', 'alta', 'semanal',
  '["Revisar lista de inadimplentes","Enviar WhatsApp para cada inadimplente","Ligar para quem não respondeu","Registrar resultado de cada contato"]',
  true
),
(
  v_emp, id_bom_sono,
  'Agendamento bancário',
  'Executar agendamentos bancários (BB e Itaú). Toda quinta-feira.',
  'Bancário', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar","Confirmar saldo","Executar agendamentos BB","Executar agendamentos Itaú","Salvar comprovantes"]',
  true
),
(
  v_emp, id_bom_sono,
  'Fluxo de Caixa mensal',
  'Gerar FC do mês anterior. Enviar até o dia 5.',
  'Relatórios', 'operacional', 'alta', 'mensal',
  '["Fechar conciliação do mês","Consolidar entradas e saídas","Gerar FC mensal","Incluir análise resumida","Enviar até o dia 5"]',
  true
),
(
  v_emp, id_bom_sono,
  'DRE mensal',
  'Gerar DRE do mês anterior. Enviar junto com o FC.',
  'Relatórios', 'operacional', 'alta', 'mensal',
  '["Consolidar receitas","Consolidar custos e despesas","Calcular resultado","Gerar DRE","Enviar até o dia 5"]',
  true
);

-- ============================================================
-- 5. MODELOS DE TAREFA — KF
-- ============================================================

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_kf,
  'Conciliação bancária — Sicredi',
  'Conciliar conta corrente e cartão de crédito Sicredi diariamente.',
  'Conciliação', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Sicredi — baixar extrato da conta corrente","Lançar e categorizar transações","Verificar saldo conciliado"]',
  true
),
(
  v_emp, id_kf,
  'Conciliação plataformas — Asaas, InfinitePay e Eduzz',
  'Conciliar as três plataformas de vendas com o banco. Atenção especial às taxas retidas por cada plataforma.',
  'Conciliação', 'operacional', 'alta', 'semanal',
  '["Acessar Asaas — baixar relatório do período","Conciliar Asaas com extrato Sicredi","Identificar e lançar taxas Asaas","Acessar InfinitePay — baixar relatório","Conciliar InfinitePay com extrato Sicredi","Identificar e lançar taxas InfinitePay","Acessar Eduzz — baixar relatório","Conciliar Eduzz com extrato Sicredi","Identificar e lançar taxas Eduzz","Fechar conciliação sem divergências"]',
  true
),
(
  v_emp, id_kf,
  'Conciliação cartão de crédito — Sicredi',
  'Conciliar fatura do cartão Sicredi. Verificar cobranças e taxas.',
  'Conciliação', 'operacional', 'media', 'semanal',
  '["Baixar fatura do cartão Sicredi","Lançar e categorizar cada cobrança","Verificar taxas e encargos","Fechar conciliação do cartão"]',
  true
);

-- ============================================================
-- 6. MODELOS DE TAREFA — SAMEIRO
-- ============================================================

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_sameiro,
  'Conciliação bancária — Inter',
  'Conciliar conta corrente Inter diariamente.',
  'Conciliação', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Inter — baixar extrato do dia","Lançar e categorizar transações","Verificar saldo conciliado"]',
  true
),
(
  v_emp, id_sameiro,
  'Conciliação plataformas — Asaas e Hotmart',
  'Conciliar as duas plataformas de vendas com o banco. Atenção às taxas retidas.',
  'Conciliação', 'operacional', 'alta', 'semanal',
  '["Acessar Asaas — baixar relatório do período","Conciliar Asaas com extrato Inter","Identificar e lançar taxas Asaas","Acessar Hotmart — baixar relatório","Conciliar Hotmart com extrato Inter","Identificar e lançar taxas Hotmart","Fechar conciliação sem divergências"]',
  true
),
(
  v_emp, id_sameiro,
  'Conciliação cartão de crédito — Inter',
  'Conciliar fatura do cartão Inter. Verificar cobranças e taxas.',
  'Conciliação', 'operacional', 'media', 'semanal',
  '["Baixar fatura cartão Inter","Lançar e categorizar cada cobrança","Verificar taxas e encargos","Fechar conciliação do cartão"]',
  true
),
(
  v_emp, id_sameiro,
  'Agendamento bancário',
  'Verificar e executar agendamentos bancários no Inter. Toda quinta-feira.',
  'Bancário', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar na semana","Confirmar saldo Inter","Executar agendamentos","Salvar comprovantes","Confirmar execução ao cliente"]',
  true
);

-- ============================================================
-- 7. MODELOS DE TAREFA — CYBORGS
-- ============================================================

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_cyborgs,
  'Conciliação bancária — Santander e Conta Simples',
  'Conciliar os dois bancos diariamente. Cliente com maior volume — não acumular.',
  'Conciliação', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Santander — baixar extrato do dia","Lançar e categorizar transações Santander","Acessar Conta Simples — baixar extrato do dia","Lançar e categorizar transações Conta Simples","Verificar saldo conciliado em ambos"]',
  true
),
(
  v_emp, id_cyborgs,
  'Conciliação plataforma — Kiwify',
  'Conciliar Kiwify com os bancos. Verificar taxas e repassar ao cliente.',
  'Conciliação', 'operacional', 'alta', 'semanal',
  '["Acessar Kiwify — baixar relatório do período","Conciliar receitas Kiwify com Santander/Conta Simples","Identificar e lançar taxas Kiwify","Verificar divergências","Fechar conciliação"]',
  true
),
(
  v_emp, id_cyborgs,
  'Conciliação cartões — Sicredi e Conta Simples',
  'Conciliar os dois cartões de crédito. Verificar cobranças recorrentes e assinaturas.',
  'Conciliação', 'operacional', 'media', 'semanal',
  '["Baixar fatura cartão Sicredi","Lançar e categorizar cobranças Sicredi","Baixar fatura cartão Conta Simples","Lançar e categorizar cobranças Conta Simples","Conferir cobranças recorrentes/assinaturas"]',
  true
),
(
  v_emp, id_cyborgs,
  'Agendamento bancário',
  'Executar agendamentos bancários (Santander e Conta Simples). Toda quinta-feira.',
  'Bancário', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar","Confirmar saldo Santander","Confirmar saldo Conta Simples","Executar agendamentos","Salvar todos os comprovantes","Confirmar execução ao cliente"]',
  true
),
(
  v_emp, id_cyborgs,
  'Relatório semanal — retirada dos sócios',
  'Gerar relatório semanal de retirada dos sócios. Enviar toda terça-feira.',
  'Relatórios', 'operacional', 'alta', 'semanal',
  '["Verificar valores de retirada dos sócios na semana","Consolidar por sócio","Gerar relatório no template padrão","Enviar aos sócios por WhatsApp ou e-mail"]',
  true
),
(
  v_emp, id_cyborgs,
  'Fluxo de Caixa mensal',
  'Gerar FC do mês anterior. Base para a consultoria mensal. Enviar até o dia 5.',
  'Relatórios', 'operacional', 'alta', 'mensal',
  '["Fechar conciliação do mês anterior","Consolidar entradas e saídas por categoria","Calcular saldo do período","Gerar FC mensal no template","Incluir análise de desvios","Preparar pauta da consultoria com base no FC","Enviar FC ao cliente até o dia 5"]',
  true
),
(
  v_emp, id_cyborgs,
  'Consultoria mensal',
  'Reunião mensal de resultados com os sócios. Baseada no FC do mês. Realizar entre os dias 8 e 10.',
  'Consultoria', 'operacional', 'alta', 'mensal',
  '["Preparar pauta com base no FC (receitas, despesas, desvios)","Checar pontos de atenção do mês","Preparar projeção do mês corrente","Confirmar data e horário com o cliente","Realizar reunião","Enviar resumo por escrito após a reunião"]',
  true
);

-- ============================================================
-- 8. MODELOS DE TAREFA — INSTITUTO DIANA
-- ============================================================

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_diana,
  'Conciliação bancária — C6',
  'Conciliar conta corrente C6 diariamente.',
  'Conciliação', 'operacional', 'alta', 'dias_uteis',
  '["Acessar C6 — baixar extrato do dia","Lançar e categorizar transações","Verificar saldo conciliado"]',
  true
),
(
  v_emp, id_diana,
  'Conciliação plataforma — Hotmart',
  'Conciliar Hotmart com o C6. Verificar taxas retidas pela plataforma.',
  'Conciliação', 'operacional', 'alta', 'semanal',
  '["Acessar Hotmart — baixar relatório do período","Conciliar receitas Hotmart com extrato C6","Identificar e lançar taxas Hotmart","Verificar divergências","Fechar conciliação"]',
  true
),
(
  v_emp, id_diana,
  'Conciliação cartão de crédito — C6',
  'Conciliar fatura do cartão C6. Verificar cobranças e assinaturas.',
  'Conciliação', 'operacional', 'media', 'semanal',
  '["Baixar fatura cartão C6","Lançar e categorizar cada cobrança","Verificar assinaturas recorrentes","Fechar conciliação do cartão"]',
  true
),
(
  v_emp, id_diana,
  'Consultoria mensal',
  'Reunião mensal de resultados. Realizar entre os dias 8 e 10.',
  'Consultoria', 'operacional', 'alta', 'mensal',
  '["Consolidar resultados do mês","Preparar pauta (receitas, custos, pontos de atenção)","Confirmar data com o cliente","Realizar reunião","Enviar resumo escrito após a reunião"]',
  true
);

-- ============================================================
-- 9. MODELOS DE TAREFA — CAMILA CARVALHO (em integração)
-- ============================================================

INSERT INTO tarefa_modelos
  (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
VALUES
(
  v_emp, id_camila,
  'Conciliação bancária — Itaú e Sicredi',
  'Conciliar os dois bancos após conclusão da integração. Processos em definição.',
  'Conciliação', 'onboarding', 'alta', 'dias_uteis',
  '["Acessar Itaú — baixar extrato","Lançar e categorizar transações Itaú","Acessar Sicredi — baixar extrato","Lançar e categorizar transações Sicredi","Verificar saldo conciliado em ambos"]',
  true
),
(
  v_emp, id_camila,
  'Definir processos operacionais completos',
  'Mapear e documentar todos os processos antes de entrar em operação plena. Evitar retrabalho.',
  'Implantação', 'onboarding', 'alta', 'mensal',
  '["Levantar todos os bancos, cartões e plataformas do cliente","Confirmar processos que serão executados mensalmente","Confirmar processos semanais","Documentar rotina padrão no sistema","Validar com o cliente antes de iniciar operação"]',
  true
);


-- ============================================================
-- 10. ROTINAS — dia a dia por cliente
-- ============================================================
-- dia_semana: 0=Seg 1=Ter 2=Qua 3=Qui 4=Sex

-- ÁGIL
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_agil, 'Conciliação bancária — Itaú', 'semanal', 0, 'manha', 'Fazer toda manhã de segunda a sexta', true),
(v_emp, id_agil, 'Cobrança de inadimplentes', 'semanal', 2, 'dia_todo', 'Toda quarta-feira — usar lista gerada', true),
(v_emp, id_agil, 'Envio de boletos novos clientes', 'semanal', 4, 'tarde', 'Toda sexta se houver novo contrato', true);

-- TRÊS MARIAS
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_tres_marias, 'Conciliação bancária — BB e Itaú', 'semanal', 0, 'manha', 'Todo dia útil pela manhã', true),
(v_emp, id_tres_marias, 'Coletar dados de vendas da semana', 'semanal', 0, 'tarde', 'Segunda à tarde — base dos relatórios de terça', true),
(v_emp, id_tres_marias, 'Relatório semanal de faturamento', 'semanal', 1, 'manha', 'Terça — enviar ao cliente', true),
(v_emp, id_tres_marias, 'Relatório semanal de inadimplentes', 'semanal', 1, 'manha', 'Terça — junto do relatório de faturamento', true),
(v_emp, id_tres_marias, 'Cobrança de inadimplentes', 'semanal', 2, 'dia_todo', 'Quarta — baseado no relatório de terça', true),
(v_emp, id_tres_marias, 'Agendamento bancário', 'semanal', 3, 'manha', 'Quinta — BB e Itaú', true),
(v_emp, id_tres_marias, 'Fluxo de Caixa mensal', 'mensal', NULL, 'dia_todo', 'Gerar até o dia 5 de cada mês', true),
(v_emp, id_tres_marias, 'DRE mensal', 'mensal', NULL, 'dia_todo', 'Enviar junto com o FC até o dia 5', true);

-- BOM SONO
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_bom_sono, 'Conciliação bancária — BB e Itaú', 'semanal', 0, 'manha', 'Todo dia útil pela manhã', true),
(v_emp, id_bom_sono, 'Coletar dados de vendas da semana', 'semanal', 0, 'tarde', 'Segunda à tarde — junto da Três Marias', true),
(v_emp, id_bom_sono, 'Relatório semanal de faturamento', 'semanal', 1, 'manha', 'Terça — junto da Três Marias', true),
(v_emp, id_bom_sono, 'Relatório semanal de inadimplentes', 'semanal', 1, 'manha', 'Terça — junto da Três Marias', true),
(v_emp, id_bom_sono, 'Relatório semanal — cliente Z3', 'semanal', 1, 'tarde', 'Terça à tarde — relatório exclusivo Bom Sono', true),
(v_emp, id_bom_sono, 'Cobrança de inadimplentes', 'semanal', 2, 'dia_todo', 'Quarta', true),
(v_emp, id_bom_sono, 'Agendamento bancário', 'semanal', 3, 'manha', 'Quinta — BB e Itaú', true),
(v_emp, id_bom_sono, 'Fluxo de Caixa mensal', 'mensal', NULL, 'dia_todo', 'Até o dia 5', true),
(v_emp, id_bom_sono, 'DRE mensal', 'mensal', NULL, 'dia_todo', 'Até o dia 5, junto do FC', true);

-- KF
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_kf, 'Conciliação bancária — Sicredi', 'semanal', 0, 'manha', 'Todo dia útil', true),
(v_emp, id_kf, 'Conciliação cartão Sicredi', 'semanal', 4, 'tarde', 'Sexta à tarde', true),
(v_emp, id_kf, 'Conciliação plataformas — Asaas, InfinitePay, Eduzz', 'semanal', 3, 'dia_todo', 'Quinta — conciliar as 3 plataformas juntas', true);

-- SAMEIRO
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_sameiro, 'Conciliação bancária — Inter', 'semanal', 0, 'manha', 'Todo dia útil', true),
(v_emp, id_sameiro, 'Conciliação plataformas — Asaas e Hotmart', 'semanal', 3, 'dia_todo', 'Quinta — conciliar as 2 plataformas juntas', true),
(v_emp, id_sameiro, 'Conciliação cartão Inter', 'semanal', 4, 'tarde', 'Sexta à tarde', true),
(v_emp, id_sameiro, 'Agendamento bancário', 'semanal', 3, 'manha', 'Quinta de manhã — antes da conciliação de plataformas', true);

-- CYBORGS
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_cyborgs, 'Conciliação bancária — Santander e Conta Simples', 'semanal', 0, 'manha', 'Todo dia útil — cliente de maior volume', true),
(v_emp, id_cyborgs, 'Relatório semanal — retirada dos sócios', 'semanal', 1, 'manha', 'Terça de manhã — enviar aos sócios', true),
(v_emp, id_cyborgs, 'Conciliação plataforma — Kiwify', 'semanal', 3, 'dia_todo', 'Quinta', true),
(v_emp, id_cyborgs, 'Conciliação cartões Sicredi e Conta Simples', 'semanal', 4, 'tarde', 'Sexta à tarde', true),
(v_emp, id_cyborgs, 'Agendamento bancário', 'semanal', 3, 'manha', 'Quinta de manhã — Santander e Conta Simples', true),
(v_emp, id_cyborgs, 'Fluxo de Caixa mensal', 'mensal', NULL, 'dia_todo', 'Até o dia 5 — base para a consultoria', true),
(v_emp, id_cyborgs, 'Consultoria mensal com os sócios', 'mensal', NULL, 'dia_todo', 'Entre os dias 8 e 10 — preparar pauta com antecedência', true);

-- INSTITUTO DIANA
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_diana, 'Conciliação bancária — C6', 'semanal', 0, 'manha', 'Todo dia útil', true),
(v_emp, id_diana, 'Conciliação plataforma — Hotmart', 'semanal', 3, 'dia_todo', 'Quinta', true),
(v_emp, id_diana, 'Conciliação cartão C6', 'semanal', 4, 'tarde', 'Sexta à tarde', true),
(v_emp, id_diana, 'Consultoria mensal', 'mensal', NULL, 'dia_todo', 'Entre os dias 8 e 10', true);

-- CAMILA CARVALHO (em integração — rotinas mínimas)
INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
VALUES
(v_emp, id_camila, 'Definir processos completos antes da operação', 'mensal', NULL, 'dia_todo', 'EM INTEGRAÇÃO — mapear rotina completa antes de ativar', true);


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
RAISE NOTICE '✓ 8 clientes inseridos';
RAISE NOTICE '✓ Modelos de tarefa criados por cliente';
RAISE NOTICE '✓ Rotinas configuradas na agenda';
RAISE NOTICE '=> Acesse o Fluxe e verifique em: Clientes, Modelos e Agenda';

END $$;

-- ============================================================
-- CONFIRMAR O QUE FOI INSERIDO
-- (rode em seguida para checar)
-- ============================================================
/*
SELECT razao_social, segmento, etapa, status
FROM clientes
WHERE empresa_id = 'COLE_O_ID_DA_EMPRESA_AQUI'
ORDER BY razao_social;

SELECT c.razao_social, tm.titulo, tm.recorrencia
FROM tarefa_modelos tm
JOIN clientes c ON c.id = tm.cliente_id
WHERE tm.empresa_id = 'COLE_O_ID_DA_EMPRESA_AQUI'
ORDER BY c.razao_social, tm.titulo;

SELECT c.razao_social, r.titulo, r.tipo, r.dia_semana
FROM rotinas r
JOIN clientes c ON c.id = r.cliente_id
WHERE r.empresa_id = 'COLE_O_ID_DA_EMPRESA_AQUI'
ORDER BY c.razao_social, r.titulo;
*/
