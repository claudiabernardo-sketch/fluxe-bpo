-- Comunidade dentro do Fluxe: mural onde qualquer mentorado (grupo ou
-- individual) posta, comenta e curte. Substitui a decisao anterior
-- (MIGRATION_16) de deixar a comunidade so no WhatsApp, agora que faz
-- sentido ter isso dentro do proprio app de mentoria.
--
-- Nome do autor e da empresa vao denormalizados na propria linha porque a
-- leitura aqui e cross-empresa (todo mentorado ve o post de qualquer outro
-- mentorado), e as policies de usuarios/empresas nao permitem esse tipo de
-- join entre tenants diferentes.

create table if not exists mentoria_posts (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  autor_id uuid not null references usuarios(id) on delete cascade,
  autor_nome text not null,
  empresa_nome text,
  conteudo text not null,
  criado_em timestamptz not null default now()
);

create table if not exists mentoria_post_comentarios (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references mentoria_posts(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  autor_id uuid not null references usuarios(id) on delete cascade,
  autor_nome text not null,
  conteudo text not null,
  criado_em timestamptz not null default now()
);

create table if not exists mentoria_post_curtidas (
  post_id uuid not null references mentoria_posts(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, empresa_id)
);

alter table mentoria_posts enable row level security;
alter table mentoria_post_comentarios enable row level security;
alter table mentoria_post_curtidas enable row level security;

-- Leitura: qualquer usuario cuja empresa e mentorado ve tudo (feed comum).
create policy mentoria_posts_select on mentoria_posts
  for select using (
    exists (
      select 1 from usuarios u join empresas e on e.id = u.empresa_id
      where u.id = auth.uid() and e.mentorado_bpo_lucrativo = true
    )
  );
create policy mentoria_posts_insert on mentoria_posts
  for insert with check (
    autor_id = auth.uid()
    and empresa_id = (select usuarios.empresa_id from usuarios where usuarios.id = auth.uid())
    and exists (select 1 from empresas e where e.id = empresa_id and e.mentorado_bpo_lucrativo = true)
  );
create policy mentoria_posts_delete on mentoria_posts
  for delete using (
    autor_id = auth.uid()
    or exists (select 1 from usuarios where usuarios.id = auth.uid() and usuarios.fluxe_staff = true)
  );

create policy mentoria_post_comentarios_select on mentoria_post_comentarios
  for select using (
    exists (
      select 1 from usuarios u join empresas e on e.id = u.empresa_id
      where u.id = auth.uid() and e.mentorado_bpo_lucrativo = true
    )
  );
create policy mentoria_post_comentarios_insert on mentoria_post_comentarios
  for insert with check (
    autor_id = auth.uid()
    and empresa_id = (select usuarios.empresa_id from usuarios where usuarios.id = auth.uid())
    and exists (select 1 from empresas e where e.id = empresa_id and e.mentorado_bpo_lucrativo = true)
  );
create policy mentoria_post_comentarios_delete on mentoria_post_comentarios
  for delete using (
    autor_id = auth.uid()
    or exists (select 1 from usuarios where usuarios.id = auth.uid() and usuarios.fluxe_staff = true)
  );

create policy mentoria_post_curtidas_select on mentoria_post_curtidas
  for select using (
    exists (
      select 1 from usuarios u join empresas e on e.id = u.empresa_id
      where u.id = auth.uid() and e.mentorado_bpo_lucrativo = true
    )
  );
create policy mentoria_post_curtidas_insert on mentoria_post_curtidas
  for insert with check (
    empresa_id = (select usuarios.empresa_id from usuarios where usuarios.id = auth.uid())
    and exists (select 1 from empresas e where e.id = empresa_id and e.mentorado_bpo_lucrativo = true)
  );
create policy mentoria_post_curtidas_delete on mentoria_post_curtidas
  for delete using (empresa_id = (select usuarios.empresa_id from usuarios where usuarios.id = auth.uid()));

create index if not exists idx_mentoria_posts_criado_em on mentoria_posts (criado_em desc);
create index if not exists idx_mentoria_post_comentarios_post on mentoria_post_comentarios (post_id, criado_em);
