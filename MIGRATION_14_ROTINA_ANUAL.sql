-- Adiciona suporte a recorrencia anual nas rotinas do cliente (aba Rotina).
-- 'mes' guarda o mes (1-12) em que a rotina anual acontece; 'dia_mes' (ja
-- existente, reaproveitado do tipo 'mensal') guarda o dia daquele mes.
alter table rotinas add column if not exists mes integer;

-- O CHECK original só permitia 'diaria'/'semanal'/'mensal' — precisa incluir 'anual'.
alter table rotinas drop constraint rotinas_tipo_check;
alter table rotinas add constraint rotinas_tipo_check
  check (tipo = any (array['diaria'::text, 'semanal'::text, 'mensal'::text, 'anual'::text]));
