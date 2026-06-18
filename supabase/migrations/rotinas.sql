-- ────────────────────────────────────────────────────
-- Tabela: rotinas
-- Rotinas operacionais recorrentes por cliente
-- ────────────────────────────────────────────────────
create table if not exists rotinas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  cliente_id  uuid not null references clientes(id) on delete cascade,
  titulo      text not null,
  tipo        text not null check (tipo in ('semanal','mensal')),
  -- semanal: 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sáb, 6=Dom
  dia_semana  int  check (dia_semana between 0 and 6),
  -- mensal: 1–31
  dia_mes     int  check (dia_mes between 1 and 31),
  periodo     text not null default 'dia_todo' check (periodo in ('manha','tarde','dia_todo')),
  observacao  text,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Índices para buscas frequentes
create index if not exists rotinas_empresa_idx on rotinas(empresa_id);
create index if not exists rotinas_cliente_idx on rotinas(cliente_id);

-- RLS
alter table rotinas enable row level security;

create policy "rotinas_empresa" on rotinas
  using (empresa_id = (
    select empresa_id from usuarios where id = auth.uid()
  ));
