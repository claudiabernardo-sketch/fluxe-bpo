-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 16: Segunda opção de WhatsApp (Z-API, não-oficial)
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Cada empresa escolhe qual caminho usar pro WhatsApp: 'meta' (API oficial,
-- sem risco) ou 'zapi' (conexão via QR Code, mais rápida mas não-oficial —
-- a Meta pode bloquear o número a qualquer momento). A escolha é da empresa
-- cliente do Fluxe, com aviso de risco claro na tela antes de confirmar.

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS wa_provider TEXT CHECK (wa_provider IN ('meta','zapi'));
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS zapi_instance_id TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS zapi_instance_token TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS zapi_client_token TEXT;

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'empresas' AND (column_name LIKE 'wa_%' OR column_name LIKE 'zapi_%');
