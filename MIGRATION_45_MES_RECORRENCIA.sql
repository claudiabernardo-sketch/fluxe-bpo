-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 45: mês configurável nas recorrências longas
-- Execute no Supabase SQL Editor
--
-- PROBLEMA: bimestral, trimestral, semestral e anual tinham os meses CHUMBADOS
-- no código da Edge Function (anual = janeiro, semestral = jan/jul, trimestral
-- = jan/abr/jul/out, bimestral = meses ímpares). Não existia campo de mês em
-- tarefa_modelos. Quem cadastrasse "Entrega do IRPF, anual, dia 30 de abril"
-- ficava com uma rotina que nunca gerava tarefa nenhuma, sem erro na tela.
--
-- Agora `mes` (1-12) diz em qual mês a série COMEÇA, e o passo da recorrência
-- (2, 3, 6 ou 12 meses) corre a partir dele.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Coluna no modelo e no vínculo (override por cliente) ──────────────────
ALTER TABLE tarefa_modelos
  ADD COLUMN IF NOT EXISTS mes INTEGER
  CHECK (mes IS NULL OR (mes >= 1 AND mes <= 12));

ALTER TABLE cliente_modelos
  ADD COLUMN IF NOT EXISTS mes INTEGER
  CHECK (mes IS NULL OR (mes >= 1 AND mes <= 12));

COMMENT ON COLUMN tarefa_modelos.mes IS
  'Mês (1-12) em que a série bimestral/trimestral/semestral/anual começa. NULL = janeiro.';
COMMENT ON COLUMN cliente_modelos.mes IS
  'Override do mês só para este cliente. NULL = usa o mês do modelo.';

-- ── 2. Backfill preservando o comportamento atual ────────────────────────────
-- Todas as rotinas longas que existem hoje se comportam como se começassem em
-- janeiro (era o que o código fazia). Gravar 1 explicitamente mantém a agenda
-- de quem já opera exatamente como está — ninguém acorda com tarefa em mês novo.
UPDATE tarefa_modelos
   SET mes = 1
 WHERE recorrencia IN ('bimestral','trimestral','semestral','anual')
   AND mes IS NULL;

-- ── 3. Conferência: rotinas longas e o mês em que passam a cair ──────────────
SELECT
  e.nome            AS empresa,
  tm.titulo         AS modelo,
  tm.recorrencia,
  tm.dia_mes,
  tm.mes            AS mes_inicial,
  CASE tm.recorrencia
    WHEN 'anual'      THEN 'só o mês ' || tm.mes
    WHEN 'semestral'  THEN 'mês ' || tm.mes || ' e +6'
    WHEN 'trimestral' THEN 'mês ' || tm.mes || ' e +3, +6, +9'
    WHEN 'bimestral'  THEN 'mês ' || tm.mes || ' e a cada 2'
  END               AS cai_em,
  CASE WHEN tm.dia_mes > 28
    THEN '⚠️ dia ' || tm.dia_mes || ' — agora cai no último dia dos meses curtos (antes não gerava)'
    ELSE '—' END  AS observacao
FROM tarefa_modelos tm
JOIN empresas e ON e.id = tm.empresa_id
WHERE tm.recorrencia IN ('bimestral','trimestral','semestral','anual')
  AND tm.deleted_at IS NULL
ORDER BY e.nome, tm.titulo;
