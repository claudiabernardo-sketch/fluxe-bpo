-- Diagnostico do Caos, formulario publico pro PlayBPO Summit. Qualquer
-- pessoa preenche sem login, a resposta e' salva aqui e um e-mail e'
-- disparado pra Claudia via edge function. Sem leitura publica, so
-- insercao, pra nao expor a lista de participantes.

create table if not exists diagnostico_caos_respostas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text not null,
  whatsapp text,
  empresa text,
  notas jsonb not null, -- { onboarding: 3, padronizacao: 2, ... } de 0 a 5 cada
  pontuacao_total int not null,
  quebraria_primeiro text,
  origem text default 'PlayBPO Summit',
  criado_em timestamptz not null default now()
);

alter table diagnostico_caos_respostas enable row level security;

-- Sem policy nenhuma = ninguem le/edita via API publica (nem anon nem
-- authenticated). Insercao e leitura acontecem so pela edge function,
-- com service role, que ignora RLS.
