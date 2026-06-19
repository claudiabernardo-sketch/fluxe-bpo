-- ════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Rotina real do cliente (agenda com horário)
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════════
-- Contexto: a rotina hoje só permite 1 dia por registro e não tem
-- horário fixo (só período manhã/tarde/dia todo). Isso não dá conta de
-- "toda terça e quinta às 10h" nem de "todo dia útil às 8h". Esta
-- migration adiciona:
--   - tipo 'diaria' (além de semanal/mensal)
--   - dias_semana (array) — permite multi-seleção de dias num só registro
--   - hora (horário específico, ex: 08:00) — substitui o uso de período
--     pra exibição em agenda; periodo continua existindo só por
--     compatibilidade com dados antigos, não é mais obrigatório na UI.
-- ════════════════════════════════════════════════════════════════════

-- 1) Permitir 'diaria' no tipo
ALTER TABLE rotinas DROP CONSTRAINT IF EXISTS rotinas_tipo_check;
ALTER TABLE rotinas ADD CONSTRAINT rotinas_tipo_check
  CHECK (tipo IN ('diaria','semanal','mensal'));

-- 2) Novas colunas
ALTER TABLE rotinas ADD COLUMN IF NOT EXISTS dias_semana smallint[];
ALTER TABLE rotinas ADD COLUMN IF NOT EXISTS hora time;

-- 3) Backfill: registros semanais antigos viram array de 1 elemento
UPDATE rotinas
SET dias_semana = ARRAY[dia_semana]::smallint[]
WHERE tipo = 'semanal' AND dia_semana IS NOT NULL AND dias_semana IS NULL;

-- 4) Backfill: período manhã/tarde vira um horário aproximado, só pra
--    ordenar a agenda de quem nunca vai preencher hora manualmente
UPDATE rotinas SET hora = '08:00' WHERE periodo = 'manha'    AND hora IS NULL;
UPDATE rotinas SET hora = '14:00' WHERE periodo = 'tarde'    AND hora IS NULL;
UPDATE rotinas SET hora = '09:00' WHERE periodo = 'dia_todo' AND hora IS NULL;

-- periodo e dia_semana (singular) permanecem na tabela por compatibilidade
-- histórica, mas o frontend a partir de agora grava/lê via dias_semana e hora.
