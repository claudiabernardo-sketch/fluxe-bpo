-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 19: Painel do Mentor (BPO Lucrativo)
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════════
-- Flag simples pra marcar quais empresas são mentoradas do programa "BPO
-- Lucrativo" — só quem tiver essa flag aparece no Painel do Mentor (visível
-- só pra fluxe_staff), que junta o Radar e o Plano de Negócio de cada uma
-- num lugar só.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mentorado_bpo_lucrativo boolean NOT NULL DEFAULT false;
