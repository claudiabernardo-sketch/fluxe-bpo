-- Ordem manual dos Materiais de Apoio dentro de cada etapa — sem isso a
-- lista só ordenava por data de criação, o que não reflete a ordem real de
-- uso (ex: em Comercial, "aprender a vender" vem antes de "vender" que vem
-- antes de "assinar o contrato").

alter table materiais_gerais add column if not exists ordem int;
