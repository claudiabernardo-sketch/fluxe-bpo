-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 14: Registrar quem enviou cada mensagem de WhatsApp
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Hoje a caixa de WhatsApp é compartilhada entre todos os usuários do Fluxe,
-- mas nada registra qual analista respondeu cada mensagem. Essa coluna
-- guarda o usuário que enviou (fica NULL em mensagens recebidas do
-- cliente, que não têm autor interno).

ALTER TABLE whatsapp_mensagens ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'whatsapp_mensagens'
ORDER BY ordinal_position;
