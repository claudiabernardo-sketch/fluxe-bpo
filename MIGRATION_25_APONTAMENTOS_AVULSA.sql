-- O timer das tarefas Avulsas gravava o id de tarefas_avulsas no campo
-- tarefa_id de apontamentos, que tem FK pra tabela tarefas — violava a FK
-- e o insert falhava sempre (silenciosamente, sem erro visivel pro
-- usuario). Cria uma coluna propria pra apontamento de avulsa.
alter table apontamentos
  add column if not exists tarefa_avulsa_id uuid references tarefas_avulsas(id) on delete set null;
