-- Adiciona suporte a recorrencia anual nas rotinas do cliente (aba Rotina).
-- 'mes' guarda o mes (1-12) em que a rotina anual acontece; 'dia_mes' (ja
-- existente, reaproveitado do tipo 'mensal') guarda o dia daquele mes.
alter table rotinas add column if not exists mes integer;
