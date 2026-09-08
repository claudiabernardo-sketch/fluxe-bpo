-- Agenda de mentoria individual, privada por empresa. Diferente da turma
-- (compartilhada com todo o grupo), aqui cada empresa so ve os proprios
-- encontros, sincronizados da agenda pessoal da Claudia casando o e-mail
-- do convidado do evento com o e-mail do usuario da empresa.

create table mentoria_encontros_individuais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  uid_ics text not null unique,
  titulo text not null,
  data date not null,
  horario time,
  link_meet text,
  video_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index mentoria_encontros_individuais_empresa_idx on mentoria_encontros_individuais(empresa_id);

alter table mentoria_encontros_individuais enable row level security;

-- Cada empresa ve so os proprios encontros individuais.
create policy mentoria_encontros_individuais_select on mentoria_encontros_individuais
  for select
  using (empresa_id = (select empresa_id from usuarios where id = auth.uid()));

-- Equipe Fluxe (staff) ve todos, mesmo padrao ja usado em outras tabelas de mentoria.
create policy mentoria_encontros_individuais_select_staff on mentoria_encontros_individuais
  for select
  using (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));
