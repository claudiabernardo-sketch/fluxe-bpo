-- Turma da Mentoria em Grupo: cronograma editavel pelo Admin, leitura
-- publica (pagina de vendas + aba Mentoria dentro do Fluxe pros alunos).

create table if not exists turma_grupo (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  data_inicio date,
  ativo boolean not null default true,
  checkout_url text,
  criado_em timestamptz default now()
);

create table if not exists turma_aulas (
  id uuid primary key default uuid_generate_v4(),
  turma_id uuid not null references turma_grupo(id) on delete cascade,
  numero int not null,
  titulo text not null,
  data date,
  exercicio text,
  video_url text,
  criado_em timestamptz default now()
);

alter table turma_grupo enable row level security;
alter table turma_aulas enable row level security;

create policy turma_grupo_select_publico on turma_grupo
  for select using (true);
create policy turma_aulas_select_publico on turma_aulas
  for select using (true);
