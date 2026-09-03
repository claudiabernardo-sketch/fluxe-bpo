-- Horario de cada encontro (alem da data), e um campo de check-in livre da
-- mentorada ("como esta indo?"), visivel pra Claudia no painel admin.

alter table turma_aulas add column if not exists horario time;

create table if not exists mentoria_checkins (
  id uuid primary key default uuid_generate_v4(),
  empresa_id uuid not null unique references empresas(id) on delete cascade,
  texto text,
  atualizado_em timestamptz not null default now()
);

alter table mentoria_checkins enable row level security;

-- So a propria empresa mentorada le/edita o proprio check-in. Leitura da
-- Claudia (fluxe_staff) acontece via admin-painel, com service role,
-- igual ao resto do painel admin, sem precisar de policy aqui.
create policy mentoria_checkins_select on mentoria_checkins
  for select
  using (
    exists (
      select 1 from usuarios u join empresas e on e.id = u.empresa_id
      where u.id = auth.uid() and u.empresa_id = mentoria_checkins.empresa_id and e.mentorado_bpo_lucrativo = true
    )
  );

create policy mentoria_checkins_insert on mentoria_checkins
  for insert
  with check (
    exists (
      select 1 from usuarios u join empresas e on e.id = u.empresa_id
      where u.id = auth.uid() and u.empresa_id = mentoria_checkins.empresa_id and e.mentorado_bpo_lucrativo = true
    )
  );

create policy mentoria_checkins_update on mentoria_checkins
  for update
  using (
    exists (
      select 1 from usuarios u join empresas e on e.id = u.empresa_id
      where u.id = auth.uid() and u.empresa_id = mentoria_checkins.empresa_id and e.mentorado_bpo_lucrativo = true
    )
  )
  with check (
    exists (
      select 1 from usuarios u join empresas e on e.id = u.empresa_id
      where u.id = auth.uid() and u.empresa_id = mentoria_checkins.empresa_id and e.mentorado_bpo_lucrativo = true
    )
  );
