-- Permite fixar posts na Comunidade da Mentoria (moderacao da Claudia) e
-- libera leitura/fixacao pra contas da equipe Fluxe (fluxe_staff), que nao
-- sao empresas mentoradas mas precisam curar o que fica em destaque.

alter table mentoria_posts add column if not exists fixado boolean not null default false;

create policy mentoria_posts_select_staff on mentoria_posts
  for select
  using (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));

create policy mentoria_posts_update_pin_staff on mentoria_posts
  for update
  using (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true))
  with check (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));
