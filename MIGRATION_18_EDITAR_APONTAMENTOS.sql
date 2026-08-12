-- Permite apagar um apontamento (lancamento de horas) — faltava a policy de
-- DELETE (so existia SELECT/INSERT/UPDATE). Necessario pra deixar o usuario
-- corrigir um apontamento errado (ex: esqueceu o timer ligado e gerou horas
-- absurdas) apagando e relancando, ou editando direto (UPDATE ja permitia).
create policy "apontamentos: excluir própria empresa" on apontamentos
  for delete using (empresa_id = auth_empresa_id());
