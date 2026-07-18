-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 18: Mentoria (links) + chamados abertos pelo cliente
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Links de mentoria (vídeos, materiais) que a empresa cadastra pra sua
-- equipe ver — cada empresa só vê os próprios links, como o resto do Fluxe.

CREATE TABLE IF NOT EXISTS mentoria_links (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  titulo         TEXT        NOT NULL,
  url            TEXT        NOT NULL,
  descricao      TEXT,
  criado_por     UUID        REFERENCES usuarios(id),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentoria_links_empresa_idx ON mentoria_links (empresa_id, criado_em DESC);

ALTER TABLE mentoria_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentoria_links_select ON mentoria_links FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY mentoria_links_insert ON mentoria_links FOR INSERT
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY mentoria_links_update ON mentoria_links FOR UPDATE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY mentoria_links_delete ON mentoria_links FOR DELETE
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Permite que QUALQUER usuário logado (de qualquer empresa cliente) registre
-- um chamado em fluxe_bugs — antes só o staff conseguia inserir. A leitura,
-- edição e mudança de status continuam só pra staff (política já existente
-- da Migration 17 continua valendo pra isso).

CREATE POLICY fluxe_bugs_insert_qualquer_usuario ON fluxe_bugs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Deixa o usuário ver os chamados da PRÓPRIA empresa (senão o insert acima
-- teria efeito, mas ele não conseguiria nem ver o que acabou de registrar).
CREATE POLICY fluxe_bugs_select_propria_empresa ON fluxe_bugs FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('mentoria_links','fluxe_bugs') ORDER BY tablename, cmd;
