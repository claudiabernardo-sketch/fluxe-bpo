-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 06: Upload de contrato assinado em Clientes
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Coluna contrato_url na tabela clientes ─────────────────────────────────
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS contrato_url TEXT;

-- ── 2. Criar bucket "documentos" via SQL ─────────────────────────────────────
-- (Se preferir criar pela UI: Storage > New bucket > nome "documentos", privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,                          -- bucket privado (acesso via URL assinada)
  10485760,                       -- 10 MB por arquivo
  ARRAY['application/pdf','image/png','image/jpeg','image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. RLS do Storage — empresa só acessa seus próprios arquivos ──────────────
-- Padrão de path: documentos/{empresa_id}/{cliente_id}/{arquivo}

CREATE POLICY "storage: upload próprios documentos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = (
      SELECT empresa_id::text FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "storage: ler próprios documentos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = (
      SELECT empresa_id::text FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "storage: deletar próprios documentos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = (
      SELECT empresa_id::text FROM usuarios WHERE id = auth.uid()
    )
  );

-- ── Verificar resultado ───────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clientes' AND column_name = 'contrato_url';
