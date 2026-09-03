-- Permite ao admin liberar, usuario por usuario, quem alem dele tem acesso
-- a aba "Cofre da empresa" (acessos internos do proprio BPO), independente
-- do perfil da pessoa.

alter table usuarios add column if not exists acesso_cofre_empresa boolean not null default false;
