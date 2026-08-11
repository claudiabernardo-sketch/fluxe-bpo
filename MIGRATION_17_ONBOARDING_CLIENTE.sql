-- Aba "Onboarding" no ClientePage: checklist operacional de onboarding por
-- cliente, baseado no modelo real que a Claudia usa com clientes novos
-- (linha do tempo de 5 semanas, responsabilidades, canal de comunicacao).
-- Uma linha por cliente (upsert).

create table if not exists cliente_onboarding (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null unique references clientes(id) on delete cascade,
  objetivos jsonb not null default '[]',
  etapas jsonb not null default '[]',
  responsabilidades_nossas jsonb not null default '[]',
  responsabilidades_cliente jsonb not null default '[]',
  canal_comunicacao text,
  erp_usado text,
  email_padrao text,
  atualizado_em timestamptz not null default now()
);

alter table cliente_onboarding enable row level security;

create policy "cliente_onboarding: ver via cliente da empresa" on cliente_onboarding
  for select using (
    cliente_id in (select id from clientes where empresa_id = auth_empresa_id())
  );

create policy "cliente_onboarding: inserir via cliente da empresa" on cliente_onboarding
  for insert with check (
    cliente_id in (select id from clientes where empresa_id = auth_empresa_id())
  );

create policy "cliente_onboarding: editar via cliente da empresa" on cliente_onboarding
  for update using (
    cliente_id in (select id from clientes where empresa_id = auth_empresa_id())
  );
