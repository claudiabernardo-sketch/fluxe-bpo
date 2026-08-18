-- Materiais Gerais da Mentoria: biblioteca de materiais (planilhas, PDFs,
-- links) organizada por etapa do ciclo do cliente (mesma taxonomia de
-- ModelosPage.jsx: comercial, pre_ob, onboarding, implantacao, operacional,
-- estrategico, acompanhamento, encerramento). Visível pra TODOS os
-- mentorados, sem depender de qual empresa (diferente de mentoria_links,
-- que é por empresa_id). Escrita só via admin-painel (service role).

create table if not exists materiais_gerais (
  id uuid primary key default uuid_generate_v4(),
  etapa text not null,
  titulo text not null,
  descricao text,
  url text,
  arquivo_path text,
  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

alter table materiais_gerais enable row level security;

create policy materiais_gerais_select_publico on materiais_gerais
  for select using (true);
