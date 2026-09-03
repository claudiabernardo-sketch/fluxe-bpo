-- Custo direto mensal por cliente (ferramentas/softwares e outros custos
-- diretamente ligados ao atendimento daquele cliente, além da mão de obra).
-- Entra no calculo de margem de contribuicao em Rentabilidade e Precificacao.

alter table clientes add column if not exists custo_direto_mensal numeric not null default 0;
