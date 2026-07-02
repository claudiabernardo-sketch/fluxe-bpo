-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 04: Código sequencial de clientes
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Adiciona coluna de código sequencial (auto-incremento)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo SERIAL;

-- Verificar resultado
SELECT id, razao_social, codigo
FROM clientes
WHERE empresa_id = '17bbd5be-7ed5-4684-8fe1-3821ca255629'
ORDER BY codigo;
