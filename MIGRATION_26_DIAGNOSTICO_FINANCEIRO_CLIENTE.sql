-- Diagnóstico financeiro do cliente novo, coletado no onboarding — extensão
-- da mesma tabela cliente_onboarding (não cria tabela paralela). Os campos
-- de identificação (razão social, CNPJ, segmento...) já existem em
-- `clientes` e não são repetidos aqui.
--
-- Preenchido por dois caminhos: (1) a equipe, autenticada, direto na aba
-- Onboarding do cliente (RLS já existente cobre isso); (2) o cliente, sem
-- login, por um link público /diagnostico/:clienteId — que passa pela Edge
-- Function `diagnostico-cliente` (service role) em vez de RLS, porque não
-- há usuário autenticado nesse caminho e a tabela guarda outros campos
-- internos (objetivos, responsabilidades) que não podem ficar expostos.

alter table cliente_onboarding add column if not exists regime_tributario text;
alter table cliente_onboarding add column if not exists porte text;
alter table cliente_onboarding add column if not exists faturamento_medio numeric;
alter table cliente_onboarding add column if not exists funcionarios_clt int;
alter table cliente_onboarding add column if not exists socios int;
alter table cliente_onboarding add column if not exists tem_dividas boolean;
alter table cliente_onboarding add column if not exists dividas_valor numeric;
alter table cliente_onboarding add column if not exists conta_vermelho boolean;
alter table cliente_onboarding add column if not exists separa_pj_pf text;
alter table cliente_onboarding add column if not exists retirada_prolabore text;
alter table cliente_onboarding add column if not exists reserva_emergencia text;
alter table cliente_onboarding add column if not exists bancos_utilizados text;
alter table cliente_onboarding add column if not exists qtd_contas_bancarias int;
alter table cliente_onboarding add column if not exists aceita_open_finance text;
alter table cliente_onboarding add column if not exists diagnostico_preenchido_em timestamptz;
