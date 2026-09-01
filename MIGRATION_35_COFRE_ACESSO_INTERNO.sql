-- Permite cadastrar no Cofre acessos que nao sao de um cliente especifico,
-- e sim da propria empresa que usa o Fluxe (ex: sistema contabil interno,
-- email da empresa, banco da propria empresa). Pedido da Vanessa via WhatsApp.

alter table acessos alter column cliente_id drop not null;
