-- Cada empresa da Mentoria em Grupo precisa ver só a própria turma (calendário,
-- aulas, grupo de WhatsApp), não "a turma que está ativa agora" — duas turmas
-- podem rodar ao mesmo tempo (ex: Turma Agosto só termina em novembro, Turma
-- Outubro já começou a vender). Sem essa coluna, o sistema só tinha como
-- adivinhar "a turma atual" globalmente, o que misturava os dois grupos.

alter table empresas add column if not exists turma_id uuid references turma_grupo(id);

-- Backfill: todo mundo criado antes da Turma Outubro existir e classificado
-- como grupo (ou nunca classificado, mentoria_origem null) pertence à Turma
-- Agosto 2026. Individual fica de fora (não usa turma_id).
update empresas
set turma_id = '1c3e9acc-4f8e-456f-93c8-fa6a613f7b19'
where mentorado_bpo_lucrativo = true
  and (mentoria_origem is null or mentoria_origem = 'grupo')
  and criado_em < '2026-09-17 00:00:00+00'
  and turma_id is null;

-- Mirian comprou a Turma Outubro (id real do caso: kiwify-webhook criou a
-- empresa dela em 2026-09-17, depois da Turma Agosto já estar rodando).
update empresas
set turma_id = '7deef358-9980-4af5-bef2-329603e6def8'
where id = 'abec20cd-fabd-42ca-ba4d-fcb94cccf9b1';
