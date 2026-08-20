-- Passo "Explore a Biblioteca" do checklist de primeiros passos, pra ficar
-- auto-calculado igual o resto do checklist (sem precisar marcar na mão).

alter table empresas add column if not exists biblioteca_visitada_em timestamptz;
