-- Turma da Mentoria em Grupo: link do grupo do WhatsApp da turma (comunidade
-- entre os mentorados acontece la, nao dentro do Fluxe) + progresso do
-- mentorado pelas aulas (check visual de "aula concluida").

alter table turma_grupo add column if not exists grupo_whatsapp_url text;

create table if not exists turma_aulas_progresso (
  id uuid primary key default uuid_generate_v4(),
  aula_id uuid not null references turma_aulas(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  concluido_em timestamptz not null default now(),
  unique (aula_id, empresa_id)
);

alter table turma_aulas_progresso enable row level security;

create policy turma_aulas_progresso_select on turma_aulas_progresso
  for select using (empresa_id = (select usuarios.empresa_id from usuarios where usuarios.id = auth.uid()));
create policy turma_aulas_progresso_insert on turma_aulas_progresso
  for insert with check (empresa_id = (select usuarios.empresa_id from usuarios where usuarios.id = auth.uid()));
create policy turma_aulas_progresso_delete on turma_aulas_progresso
  for delete using (empresa_id = (select usuarios.empresa_id from usuarios where usuarios.id = auth.uid()));
