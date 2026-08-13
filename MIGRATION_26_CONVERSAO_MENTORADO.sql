-- Oferta de conversão "continuar usando o Fluxe" (R$147/mes) pros mentorados
-- que ainda estao no Pro cortesia (sem assinatura Asaas real). Alguns
-- mentorados ja tem acordo proprio (ex: acesso incluido na mentoria que
-- compraram) e nao devem ver essa oferta na conta deles.
alter table empresas
  add column if not exists oferta_conversao_oculta boolean not null default false;

comment on column empresas.oferta_conversao_oculta is
  'true = nao mostrar a oferta de virar assinante mensal (R$147) pra essa empresa — ja tem acordo proprio com a mentoria';
