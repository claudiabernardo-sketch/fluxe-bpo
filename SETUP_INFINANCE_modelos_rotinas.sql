-- ============================================================
-- SETUP INFINANCE -- Modelos de Tarefa e Rotinas
-- Versao para clientes JA CADASTRADOS no Fluxe
-- empresa_id: 17bbd5be-7ed5-4684-8fe1-3821ca255629
-- ============================================================

-- Cada INSERT usa subquery para buscar o cliente_id
-- ON CONFLICT DO NOTHING = idempotente (pode rodar multiplas vezes)

-- ============================================================
-- AGIL
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - Itau',
  'Verificar e lancar movimentacoes do dia no Itau. Categorizar cada transacao e fechar o dia sem pendencias.',
  'Conciliacao', 'operacional', 'alta', 'dias_uteis',
  '["Acessar internet banking Itau","Baixar extrato do dia","Lancar e categorizar transacoes","Verificar saldo conciliado"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Agil%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Cobranca de inadimplentes',
  'Acionar por WhatsApp ou telefone os clientes da Agil com contas em atraso. Toda quarta-feira.',
  'Cobranca', 'operacional', 'alta', 'semanal',
  '["Atualizar lista de inadimplentes","Enviar WhatsApp para cada devedor","Ligar para quem nao respondeu em 24h","Registrar retorno e novo prazo combinado"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Agil%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Envio de boletos - novos clientes',
  'Emitir e enviar boletos para novos clientes que entraram na semana. Toda sexta-feira se houver.',
  'Faturamento', 'operacional', 'media', 'semanal',
  '["Verificar novos contratos assinados na semana","Emitir boleto por cliente","Enviar por e-mail e WhatsApp","Confirmar recebimento","Registrar no controle"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Agil%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- TRES MARIAS
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - BB e Itau',
  'Conciliar os dois bancos diariamente. Nao acumular lancamentos.',
  'Conciliacao', 'operacional', 'alta', 'dias_uteis',
  '["Acessar BB - baixar extrato do dia","Lancar e categorizar transacoes BB","Acessar Itau - baixar extrato do dia","Lancar e categorizar transacoes Itau","Verificar saldo conciliado em ambos"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio semanal de faturamento',
  'Gerar e enviar relatorio de faturamento da semana anterior. Toda terca-feira.',
  'Relatorios', 'operacional', 'alta', 'semanal',
  '["Coletar dados de vendas da semana","Consolidar entradas por forma de pagamento","Gerar relatorio de faturamento","Revisar antes de enviar","Enviar ao cliente"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio semanal de inadimplentes',
  'Gerar lista atualizada de inadimplentes. Toda terca-feira junto do relatorio de faturamento.',
  'Relatorios', 'operacional', 'alta', 'semanal',
  '["Verificar contas vencidas e nao pagas","Calcular valor total em atraso","Gerar relatorio","Enviar ao cliente com orientacao de acao"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Cobranca de inadimplentes',
  'Acionar inadimplentes toda quarta-feira com base na lista da terca.',
  'Cobranca', 'operacional', 'alta', 'semanal',
  '["Revisar lista da terca","Enviar WhatsApp para cada inadimplente","Ligar para quem nao respondeu","Registrar resultado de cada contato","Informar ao cliente os retornos"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario',
  'Verificar e executar agendamentos bancarios (BB e Itau). Toda quinta-feira.',
  'Bancario', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar na semana","Confirmar saldo BB","Confirmar saldo Itau","Executar agendamentos","Salvar comprovantes","Confirmar ao cliente"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Fluxo de Caixa mensal',
  'Gerar FC do mes anterior com analise. Enviar ate o dia 5.',
  'Relatorios', 'operacional', 'alta', 'mensal',
  '["Fechar conciliacao do mes","Consolidar entradas e saidas por categoria","Calcular saldo","Gerar FC no template","Incluir analise de desvios","Enviar ate o dia 5"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'DRE mensal',
  'Gerar DRE do mes anterior. Enviar junto com o FC ate o dia 5.',
  'Relatorios', 'operacional', 'alta', 'mensal',
  '["Consolidar receitas do mes","Consolidar custos e despesas","Calcular resultado","Gerar DRE no template","Enviar ate o dia 5"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- BOM SONO
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - BB e Itau BS',
  'Conciliar os dois bancos diariamente.',
  'Conciliacao', 'operacional', 'alta', 'dias_uteis',
  '["Acessar BB - baixar extrato","Lancar e categorizar BB","Acessar Itau - baixar extrato","Lancar e categorizar Itau","Verificar saldo conciliado"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio semanal de faturamento BS',
  'Gerar e enviar relatorio de faturamento. Toda terca-feira.',
  'Relatorios', 'operacional', 'alta', 'semanal',
  '["Coletar dados de vendas da semana","Consolidar entradas","Gerar relatorio","Enviar ao cliente"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio semanal de inadimplentes BS',
  'Gerar lista de inadimplentes. Toda terca-feira.',
  'Relatorios', 'operacional', 'alta', 'semanal',
  '["Verificar contas vencidas","Calcular valor em atraso","Gerar relatorio","Enviar ao cliente"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio semanal - cliente Z3',
  'Relatorio semanal exclusivo do cliente Z3 da Bom Sono. Toda terca-feira.',
  'Relatorios', 'operacional', 'alta', 'semanal',
  '["Coletar dados do cliente Z3","Gerar relatorio no formato acordado","Revisar","Enviar ao responsavel"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Cobranca de inadimplentes BS',
  'Acionar inadimplentes toda quarta-feira.',
  'Cobranca', 'operacional', 'alta', 'semanal',
  '["Revisar lista da terca","Enviar WhatsApp","Ligar para quem nao respondeu","Registrar resultados"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario BS',
  'Executar agendamentos bancarios (BB e Itau). Toda quinta-feira.',
  'Bancario', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar","Confirmar saldo","Executar agendamentos BB e Itau","Salvar comprovantes"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Fluxo de Caixa mensal BS',
  'Gerar FC do mes anterior. Enviar ate o dia 5.',
  'Relatorios', 'operacional', 'alta', 'mensal',
  '["Fechar conciliacao","Consolidar entradas e saidas","Gerar FC","Enviar ate o dia 5"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'DRE mensal BS',
  'Gerar DRE do mes anterior. Enviar junto com o FC.',
  'Relatorios', 'operacional', 'alta', 'mensal',
  '["Consolidar receitas e despesas","Calcular resultado","Gerar DRE","Enviar ate o dia 5"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- KF
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - Sicredi',
  'Conciliar conta corrente Sicredi diariamente.',
  'Conciliacao', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Sicredi - baixar extrato do dia","Lancar e categorizar transacoes","Verificar saldo conciliado"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%KF%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao plataformas - Asaas InfinitePay Eduzz',
  'Conciliar as tres plataformas com o banco. Atencao as taxas retidas por cada uma.',
  'Conciliacao', 'operacional', 'alta', 'semanal',
  '["Baixar relatorio Asaas","Conciliar Asaas x Sicredi","Lancar taxas Asaas","Baixar relatorio InfinitePay","Conciliar InfinitePay x Sicredi","Baixar relatorio Eduzz","Conciliar Eduzz x Sicredi","Fechar sem divergencias"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%KF%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartao de credito - Sicredi',
  'Conciliar fatura do cartao Sicredi semanalmente.',
  'Conciliacao', 'operacional', 'media', 'semanal',
  '["Baixar fatura do cartao Sicredi","Lancar e categorizar cobracas","Verificar taxas e encargos","Fechar conciliacao"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%KF%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMEIRO
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - Inter',
  'Conciliar conta corrente Inter diariamente.',
  'Conciliacao', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Inter - baixar extrato do dia","Lancar e categorizar transacoes","Verificar saldo conciliado"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao plataformas - Asaas e Hotmart',
  'Conciliar as duas plataformas com o banco. Toda quinta-feira.',
  'Conciliacao', 'operacional', 'alta', 'semanal',
  '["Baixar relatorio Asaas","Conciliar Asaas x Inter","Lancar taxas Asaas","Baixar relatorio Hotmart","Conciliar Hotmart x Inter","Lancar taxas Hotmart","Fechar sem divergencias"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartao de credito - Inter',
  'Conciliar fatura do cartao Inter semanalmente.',
  'Conciliacao', 'operacional', 'media', 'semanal',
  '["Baixar fatura cartao Inter","Lancar e categorizar cobracas","Verificar encargos","Fechar conciliacao"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario Sameiro',
  'Executar agendamentos no Inter. Toda quinta-feira de manha.',
  'Bancario', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar","Confirmar saldo Inter","Executar agendamentos","Salvar comprovantes","Confirmar ao cliente"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- CYBORGS
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - Santander e Conta Simples',
  'Conciliar os dois bancos diariamente. Cliente de maior volume.',
  'Conciliacao', 'operacional', 'alta', 'dias_uteis',
  '["Acessar Santander - baixar extrato","Lancar e categorizar Santander","Acessar Conta Simples - baixar extrato","Lancar e categorizar Conta Simples","Verificar saldo conciliado em ambos"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao plataforma - Kiwify',
  'Conciliar Kiwify com os bancos. Toda quinta-feira.',
  'Conciliacao', 'operacional', 'alta', 'semanal',
  '["Baixar relatorio Kiwify","Conciliar receitas Kiwify x Santander/Conta Simples","Identificar e lancar taxas Kiwify","Verificar divergencias","Fechar conciliacao"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartoes - Sicredi e Conta Simples',
  'Conciliar os dois cartoes. Toda sexta-feira.',
  'Conciliacao', 'operacional', 'media', 'semanal',
  '["Baixar fatura cartao Sicredi","Lancar e categorizar Sicredi","Baixar fatura cartao Conta Simples","Lancar e categorizar Conta Simples","Conferir cobracas recorrentes"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario Cyborgs',
  'Executar agendamentos (Santander e Conta Simples). Toda quinta-feira.',
  'Bancario', 'operacional', 'alta', 'semanal',
  '["Verificar pagamentos a agendar","Confirmar saldo Santander","Confirmar saldo Conta Simples","Executar agendamentos","Salvar comprovantes","Confirmar ao cliente"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio semanal - retirada dos socios',
  'Gerar relatorio de retirada dos socios. Toda terca-feira.',
  'Relatorios', 'operacional', 'alta', 'semanal',
  '["Verificar valores de retirada da semana","Consolidar por socio","Gerar relatorio","Enviar aos socios"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Fluxo de Caixa mensal Cyborgs',
  'Gerar FC do mes anterior. Base para a consultoria. Enviar ate o dia 5.',
  'Relatorios', 'operacional', 'alta', 'mensal',
  '["Fechar conciliacao do mes","Consolidar entradas e saidas","Gerar FC","Incluir analise de desvios","Preparar pauta da consultoria","Enviar ate o dia 5"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Consultoria mensal Cyborgs',
  'Reuniao mensal de resultados com os socios. Entre os dias 8 e 10.',
  'Consultoria', 'operacional', 'alta', 'mensal',
  '["Revisar FC do mes","Preparar pauta de resultados","Confirmar data/horario","Realizar reuniao","Enviar resumo escrito apos a reuniao"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- INSTITUTO DIANA
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - C6',
  'Conciliar conta corrente C6 diariamente.',
  'Conciliacao', 'operacional', 'alta', 'dias_uteis',
  '["Acessar C6 - baixar extrato do dia","Lancar e categorizar transacoes","Verificar saldo conciliado"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao plataforma - Hotmart Diana',
  'Conciliar Hotmart com o C6. Toda quinta-feira.',
  'Conciliacao', 'operacional', 'alta', 'semanal',
  '["Baixar relatorio Hotmart","Conciliar receitas Hotmart x C6","Identificar e lancar taxas Hotmart","Fechar conciliacao"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartao de credito - C6',
  'Conciliar fatura do cartao C6. Toda sexta-feira.',
  'Conciliacao', 'operacional', 'media', 'semanal',
  '["Baixar fatura cartao C6","Lancar e categorizar cobracas","Verificar assinaturas recorrentes","Fechar conciliacao"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Consultoria mensal Diana',
  'Reuniao mensal de resultados. Entre os dias 8 e 10.',
  'Consultoria', 'operacional', 'alta', 'mensal',
  '["Consolidar resultados do mes","Preparar pauta","Confirmar data com o cliente","Realizar reuniao","Enviar resumo escrito"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- CAMILA CARVALHO
-- ============================================================

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria - Itau e Sicredi',
  'Conciliar os dois bancos. Iniciar apos conclusao da integracao.',
  'Conciliacao', 'onboarding', 'alta', 'dias_uteis',
  '["Acessar Itau - baixar extrato","Lancar e categorizar Itau","Acessar Sicredi - baixar extrato","Lancar e categorizar Sicredi","Verificar saldo conciliado"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Camila%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tarefa_modelos (empresa_id, cliente_id, titulo, descricao, categoria, etapa, prioridade, recorrencia, checklist_items, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Definir processos operacionais',
  'Mapear e documentar todos os processos antes de iniciar a operacao plena.',
  'Implantacao', 'onboarding', 'alta', 'mensal',
  '["Levantar bancos cartoes e plataformas do cliente","Definir processos mensais","Definir processos semanais","Documentar rotina no sistema","Validar com o cliente antes de operar"]', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Camila%' AND deleted_at IS NULL LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROTINAS
-- dia_semana: 0=Seg 1=Ter 2=Qua 3=Qui 4=Sex
-- ============================================================

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria Itau', 'semanal', 0, 'manha', 'Todo dia util pela manha', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Agil%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Cobranca de inadimplentes Agil', 'semanal', 2, 'dia_todo', 'Toda quarta-feira', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Agil%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Envio de boletos novos clientes', 'semanal', 4, 'tarde', 'Sexta - se houver novo contrato', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Agil%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao BB e Itau', 'semanal', 0, 'manha', 'Todo dia util', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Coletar dados de vendas', 'semanal', 0, 'tarde', 'Segunda - base dos relatorios de terca', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio de faturamento', 'semanal', 1, 'manha', 'Terca - enviar ao cliente', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio de inadimplentes', 'semanal', 1, 'manha', 'Terca - junto do faturamento', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Cobranca de inadimplentes TM', 'semanal', 2, 'dia_todo', 'Quarta - usar lista da terca', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario TM', 'semanal', 3, 'manha', 'Quinta - BB e Itau', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Fluxo de Caixa mensal TM', 'mensal', NULL, 'dia_todo', 'Ate o dia 5 de cada mes', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'DRE mensal TM', 'mensal', NULL, 'dia_todo', 'Ate o dia 5 junto com o FC', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%3 MARIAS%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao BB e Itau BS', 'semanal', 0, 'manha', 'Todo dia util', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Coletar dados de vendas BS', 'semanal', 0, 'tarde', 'Segunda - junto da Tres Marias', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio de faturamento BS', 'semanal', 1, 'manha', 'Terca - junto da Tres Marias', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio de inadimplentes BS', 'semanal', 1, 'manha', 'Terca', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio semanal cliente Z3', 'semanal', 1, 'tarde', 'Terca a tarde - exclusivo Bom Sono', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Cobranca de inadimplentes BS', 'semanal', 2, 'dia_todo', 'Quarta', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario BS', 'semanal', 3, 'manha', 'Quinta - BB e Itau', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Fluxo de Caixa mensal BS', 'mensal', NULL, 'dia_todo', 'Ate o dia 5', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'DRE mensal BS', 'mensal', NULL, 'dia_todo', 'Ate o dia 5 junto com FC', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Bom Sono%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria Sicredi KF', 'semanal', 0, 'manha', 'Todo dia util', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%KF%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao plataformas KF', 'semanal', 3, 'dia_todo', 'Quinta - 3 plataformas juntas', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%KF%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartao Sicredi KF', 'semanal', 4, 'tarde', 'Sexta a tarde', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%KF%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria Inter Sameiro', 'semanal', 0, 'manha', 'Todo dia util', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario Sameiro', 'semanal', 3, 'manha', 'Quinta de manha', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao plataformas Sameiro', 'semanal', 3, 'tarde', 'Quinta a tarde', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartao Inter Sameiro', 'semanal', 4, 'tarde', 'Sexta a tarde', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Sameiro%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao Santander e Conta Simples', 'semanal', 0, 'manha', 'Todo dia util - maior volume', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Relatorio retirada dos socios', 'semanal', 1, 'manha', 'Terca de manha', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Agendamento bancario Cyborgs', 'semanal', 3, 'manha', 'Quinta de manha', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao Kiwify', 'semanal', 3, 'tarde', 'Quinta a tarde', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartoes Cyborgs', 'semanal', 4, 'tarde', 'Sexta a tarde', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Fluxo de Caixa mensal Cyborgs', 'mensal', NULL, 'dia_todo', 'Ate o dia 5 - base para a consultoria', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Consultoria mensal com os socios', 'mensal', NULL, 'dia_todo', 'Entre os dias 8 e 10', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Cyborgs%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao bancaria C6 Diana', 'semanal', 0, 'manha', 'Todo dia util', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao Hotmart Diana', 'semanal', 3, 'tarde', 'Quinta a tarde', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Conciliacao cartao C6 Diana', 'semanal', 4, 'tarde', 'Sexta a tarde', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Consultoria mensal Diana', 'mensal', NULL, 'dia_todo', 'Entre os dias 8 e 10', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Diana%' AND deleted_at IS NULL LIMIT 1;

INSERT INTO rotinas (empresa_id, cliente_id, titulo, tipo, dia_semana, periodo, observacao, ativo)
SELECT '17bbd5be-7ed5-4684-8fe1-3821ca255629', id, 'Definir processos antes de operar', 'mensal', NULL, 'dia_todo', 'EM INTEGRACAO - mapear rotina completa antes de ativar', true
FROM clientes WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629' AND razao_social ILIKE '%Camila%' AND deleted_at IS NULL LIMIT 1;

