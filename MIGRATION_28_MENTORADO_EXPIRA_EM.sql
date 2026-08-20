-- Controle do 1 ano de acesso grátis ao Fluxe pra quem comprou a Mentoria em
-- Grupo. Antes o selo mentorado_bpo_lucrativo era só um sim/não sem prazo,
-- então o acesso nunca vencia sozinho.

alter table empresas add column if not exists mentorado_expira_em timestamptz;

-- Backfill dos mentorados já existentes: usa a data de cadastro + 1 ano como
-- melhor aproximação disponível (não temos a data exata da compra registrada
-- em nenhuma tabela hoje). Só preenche quem ainda não tem assinatura Asaas
-- real, pra não mexer no único caso hoje que é pagante de verdade.
update empresas
set mentorado_expira_em = criado_em + interval '1 year'
where mentorado_bpo_lucrativo = true
  and mentorado_expira_em is null
  and asaas_subscription_id is null;
