-- Libera curtir e comentar na Comunidade da Mentoria pra contas da equipe
-- Fluxe (fluxe_staff), que nao sao empresas mentoradas mas precisam
-- participar/moderar. Mesma logica ja usada em mentoria_posts.

create policy mentoria_post_curtidas_select_staff on mentoria_post_curtidas
  for select
  using (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));

create policy mentoria_post_curtidas_insert_staff on mentoria_post_curtidas
  for insert
  with check (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));

create policy mentoria_post_curtidas_delete_staff on mentoria_post_curtidas
  for delete
  using (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));

create policy mentoria_post_comentarios_select_staff on mentoria_post_comentarios
  for select
  using (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));

create policy mentoria_post_comentarios_insert_staff on mentoria_post_comentarios
  for insert
  with check (exists (select 1 from usuarios u where u.id = auth.uid() and u.fluxe_staff = true));
