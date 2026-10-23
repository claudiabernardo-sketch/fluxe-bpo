-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 48: POPs (Procedimentos Operacionais Padrão)
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════════
-- Cada escritório cadastra os próprios procedimentos: título, categoria, passo
-- a passo e um anexo opcional (link externo OU arquivo enviado). Um POP pode
-- ser vinculado a um Modelo (tarefa_modelos.pop_id), e a tarefa gerada por esse
-- modelo mostra o botão "Ver POP".
--
-- Arquivo: reaproveita o bucket "tarefas" já existente, que já separa por
-- empresa pelo primeiro nível do caminho. Path usado: {empresa_id}/pops/{arquivo}
-- (sem bucket nem política de storage nova, mesmo esquema da Migration 23).
--
-- Leitura: todo mundo da empresa (o operador precisa ler pra executar).
-- Escrita: só admin, gestor e supervisor.
-- Idempotente: pode rodar de novo sem quebrar.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pops (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID        NOT NULL REFERENCES empresas(id),
  titulo        TEXT        NOT NULL,
  categoria     TEXT,
  conteudo      TEXT,                      -- passo a passo, texto livre
  url           TEXT,                      -- link externo (vídeo, Drive, doc)
  arquivo_path  TEXT,                      -- arquivo no bucket "tarefas"
  arquivo_nome  TEXT,                      -- nome original, só pra exibir
  criado_por    UUID        REFERENCES auth.users(id),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pops_empresa_idx ON pops (empresa_id, categoria, titulo) WHERE deleted_at IS NULL;

-- set_atualizado_em() já existe desde a Migration 05
DROP TRIGGER IF EXISTS pops_atualizado_em ON pops;
CREATE TRIGGER pops_atualizado_em
  BEFORE UPDATE ON pops
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE pops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pops: empresa vê os próprios" ON pops;
CREATE POLICY "pops: empresa vê os próprios" ON pops
  FOR SELECT USING (empresa_id = auth_empresa_id());

DROP POLICY IF EXISTS "pops: gestão insere" ON pops;
CREATE POLICY "pops: gestão insere" ON pops
  FOR INSERT WITH CHECK (
    empresa_id = auth_empresa_id()
    AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin','gestor','supervisor'))
  );

-- Exclusão é soft delete (deleted_at), então passa pelo UPDATE
DROP POLICY IF EXISTS "pops: gestão atualiza" ON pops;
CREATE POLICY "pops: gestão atualiza" ON pops
  FOR UPDATE USING (
    empresa_id = auth_empresa_id()
    AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin','gestor','supervisor'))
  ) WITH CHECK (empresa_id = auth_empresa_id());

-- ── Vínculo Modelo → POP ──────────────────────────────────────────────────────
ALTER TABLE tarefa_modelos
  ADD COLUMN IF NOT EXISTS pop_id UUID REFERENCES pops(id) ON DELETE SET NULL;

COMMENT ON COLUMN tarefa_modelos.pop_id IS
  'POP vinculado ao modelo. A tarefa gerada mostra o botão "Ver POP". NULL = sem POP.';

-- ── Verificar resultado ───────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pops'
ORDER BY ordinal_position;
