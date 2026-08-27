-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Quebra de tarefa por banco vira chavinha própria do modelo
-- Execute no Supabase SQL Editor
--
-- Antes: o gerador quebrava a tarefa por banco quando a CATEGORIA do modelo era
-- exatamente "Conciliação Bancária". Isso fazia a categoria acumular dois
-- papéis, classificar pro relatório e decidir quantas tarefas o dia gera, com
-- dois efeitos ruins:
--   • conciliação salva como "Contas a Pagar" não puxava o banco (foi o caso da
--     L.T. Colchões, que ficou com tarefa com banco e sem banco no mesmo dia);
--   • "Conciliação Hotmart", "Kiwify" e cartão de crédito estavam na categoria
--     Conciliação Bancária e se multiplicariam por conta bancária no dia em que
--     a recorrência deles batesse.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Coluna nova ───────────────────────────────────────────────────────────
ALTER TABLE tarefa_modelos
  ADD COLUMN IF NOT EXISTS expandir_por_banco BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN tarefa_modelos.expandir_por_banco IS
  'Gera uma tarefa por conta bancária do cliente. Independe da categoria.';

-- ── 2. Ligar nos modelos que devem quebrar por banco ─────────────────────────
-- Lista explícita, conferida modelo a modelo. Ficaram de fora, de propósito:
--   • plataforma e cartão (Hotmart, Kiwify, Eduzz, Asaas, Infinite Pay, cartão)
--   • modelos com o banco já escrito no nome (SICOOB, INTER, Nubank), que
--     virariam "AGENDAMENTOS BANCÁRIOS - SICOOB — Sicoob"
--   • "Mapear todas as contas bancárias" e "Lançar saldo inicial de todas as
--     contas bancárias", que já são uma tarefa só pra todas as contas
UPDATE tarefa_modelos SET expandir_por_banco = true WHERE id IN (
  -- Agendamento bancário
  'fc7d8537-b7ce-4703-9149-371bfc2520b6',  -- AGEDAMENTOS BANCÁRIOS
  '86d88ac8-ff2a-43a4-a6fd-edda28d51111',  -- Agendamento Bancário
  '24180c39-dc9d-43a3-9471-161c545c71b5',  -- Agendamento Bancário
  '1431386a-0f6c-481e-aa1e-dc288c03fe32',  -- Agendamento Bancário
  '8e822cfa-c47e-4e11-b6f2-e2a80b1c5922',  -- Agendamento bancário da semana
  'c54d15dc-cd91-4221-9a8c-20c5e4f469bf',  -- Agendamento bancário da semana
  '48630402-a790-40af-9100-d3d80377d1ba',  -- AGENDAMENTOS BANCARIOS
  'f9cc080f-b89e-42df-beea-9ccba2fb46e4',  -- Agendamentos bancários
  'f420a5c2-aa66-4d66-8543-9354344b0476',  -- AGENDAMENTOS BANCÁRIOS
  '1d4a2ad0-5aa1-4cbe-9bae-335d99353d73',  -- AGENDAMENTOS BANCÁRIOS
  '9fdd228e-f111-41a9-bd2f-54ee87810852',  -- AGENDAMENTOS BANCÁRIOS
  -- Conciliação bancária
  '4db2575b-4f37-47b3-a6a6-ce194b5768f4',  -- Conciliação Bancaria
  '3aeec124-802c-4044-9a96-cdeb84720c3f',  -- Conciliação bancária
  '22302a0e-b7db-419c-8065-0c5dbd624a59',  -- Conciliação bancária
  '00da7ccb-eeb8-4065-8017-4993a55e5314',  -- Conciliação bancária
  '8e130ae8-6330-4407-b5d7-a88ba98d43ad',  -- Conciliação Bancária
  '4702ef08-600a-49ab-ad4f-83dc6de45145',  -- CONCILIAÇÃO BANCÁRIA
  'e209837c-13b7-4f97-a378-53e7e7a15b42',  -- CONCILIAÇÃO BANCÁRIA
  '90ba1a8d-e945-46d4-9f61-1beb267d8a87',  -- CONICLIAÇÃO BANCÁRIA (nome com erro)
  'fe6eaa56-2b2e-45fb-a6b4-f98a47c62c49',  -- CONCILIAÇÕES BANCÁRIAS
  '85022634-187d-4071-acb4-6a841f1e1a38',  -- CONCILIAÇÕES BANCÁRIAS
  '322cfd5b-b3ec-4db6-a27f-2027f06e8ce6',  -- Conciliar Banco
  '7a92ecde-fef6-431d-861f-154974475639',  -- Conciliar Conta Bancária
  'd8a26df3-f8f5-4ba8-8bb3-7e786f314046',  -- Conciliar extrato bancário conta a conta
  '7a783a66-5c4d-4460-91bb-ea34bb0fc6b1',  -- Conciliar extrato bancário conta a conta
  '4817cb0c-fc0b-4442-9ba5-3af19bf2fc45',  -- Conciliar primeiros extratos bancários
  '0588f106-39b6-4361-8c2e-148a6ef8788e',  -- Conciliar primeiros extratos bancários
  '2d3dd79e-fe76-4545-925c-08793225fe4c',  -- Conferência bancária matinal
  '7ce5a887-2dca-4fb2-9898-68ee2fa092f8'   -- Conferência bancária matinal
);

-- ── 3. Backfill do banco nas tarefas que já existem ──────────────────────────
-- A trava anti duplicidade passa a comparar modelo + cliente + banco, no lugar
-- do texto do título. Sem preencher a coluna nas tarefas antigas, a geração
-- veria banco vazio de um lado e "Sicoob" do outro, e criaria tudo de novo.
--
-- O nome vem do sufixo depois do travessão, passando pela MESMA normalização
-- que o gerador aplica na lista de bancos do cliente (normalizarBanco, em
-- gerar-tarefas/index.ts). Sem isso as 122 tarefas antigas com nome no formato
-- velho ("Banco Inter", "Outro") ficariam de fora e voltariam duplicadas.
CREATE OR REPLACE FUNCTION _fluxe_bancos() RETURNS TEXT[] AS $$
  SELECT ARRAY['Banco do Brasil','Bradesco','Itaú','Santander','Caixa','Nubank',
               'Inter','Sicoob','Sicredi','BTG','C6 Bank','XP','Safra','BV',
               'Banrisul','Original','Neon','PicPay','Mercado Pago',
               'CPJ Conta Azul','PagBank','Stone','Cora','Asaas','Outros']
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION _fluxe_norm_banco(nome TEXT) RETURNS TEXT AS $$
  SELECT CASE
    WHEN nome = ANY(_fluxe_bancos()) THEN nome
    WHEN regexp_replace(nome, '^Banco[[:space:]]+', '', 'i') = ANY(_fluxe_bancos())
      THEN regexp_replace(nome, '^Banco[[:space:]]+', '', 'i')
    WHEN lower(trim(nome)) = 'caixa econômica federal' THEN 'Caixa'
    WHEN lower(trim(nome)) = 'banco original'          THEN 'Original'
    WHEN lower(trim(nome)) = 'btg pactual'             THEN 'BTG'
    WHEN lower(trim(nome)) = 'outro'                   THEN 'Outros'
    ELSE nome
  END
$$ LANGUAGE SQL IMMUTABLE;

UPDATE tarefas t
SET banco = x.banco
FROM (
  SELECT id,
         _fluxe_norm_banco(trim(reverse(split_part(reverse(titulo), ' — ', 1)))) AS banco
  FROM tarefas
  WHERE deleted_at IS NULL
    AND banco IS NULL
    AND titulo LIKE '% — %'
) x
WHERE t.id = x.id
  -- Compara sem caixa pra aceitar "SICOOB" escrito em maiúscula pelo usuário,
  -- mas grava o valor como está: é exatamente o que o gerador vai produzir a
  -- partir do cadastro de bancos daquele cliente.
  AND lower(x.banco) = ANY(SELECT lower(b) FROM unnest(_fluxe_bancos()) b);

DROP FUNCTION IF EXISTS _fluxe_norm_banco(TEXT);
DROP FUNCTION IF EXISTS _fluxe_bancos();

-- ── 4. Conferência ───────────────────────────────────────────────────────────
-- Modelos com a chavinha ligada:
-- SELECT titulo, categoria FROM tarefa_modelos
-- WHERE expandir_por_banco AND deleted_at IS NULL ORDER BY titulo;
--
-- Tarefas que ganharam banco no backfill:
-- SELECT banco, count(*) FROM tarefas
-- WHERE banco IS NOT NULL AND deleted_at IS NULL GROUP BY 1 ORDER BY 2 DESC;
