-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 15: WABA ID (Embedded Signup do WhatsApp)
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Guarda o ID da WhatsApp Business Account (WABA) que cada empresa conecta
-- pelo fluxo "Conectar WhatsApp" (login do Facebook). Usado pra inscrever
-- o app nos webhooks daquele número automaticamente.

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS wa_waba_id TEXT;

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'empresas' AND column_name LIKE 'wa_%';
