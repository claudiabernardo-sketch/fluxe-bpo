-- Painel do Mentor misturava quem veio pela Mentoria em Grupo (Kiwify, turma
-- com aulas e cronograma) e quem é mentorado individual (ex: TMB, Controla),
-- sem nenhuma forma de separar visualmente os dois. Esse campo guarda a
-- origem de cada mentorado pra dar pra filtrar.

alter table empresas add column if not exists mentoria_origem text
  check (mentoria_origem is null or mentoria_origem in ('grupo', 'individual'));

-- Classificação inicial dos dois que a Claudia já confirmou como individuais.
-- O resto fica sem classificar (aparece como "Não classificado" no painel)
-- até ela marcar um a um pela tela nova, não temos como adivinhar com
-- segurança quem veio de onde pros que já existem.
update empresas set mentoria_origem = 'individual'
  where id in ('7c6c5986-8a14-4f69-9e48-2cef649982b1', '44d8d18f-9d5d-47f5-885d-927a51572e4c');
