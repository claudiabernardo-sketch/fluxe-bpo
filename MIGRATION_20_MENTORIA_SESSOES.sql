-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 20: Registro de Sessões de Mentoria
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════════
-- Histórico de conversas 1:1 com cada mentorado do BPO Lucrativo: data, o que
-- foi falado e os combinados. Fica só no Painel do Mentor — de propósito sem
-- política de RLS pra usuário comum, só a Edge Function admin-painel (que já
-- valida fluxe_staff) acessa via service role. O mentorado não vê essas notas.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mentoria_sessoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data        date NOT NULL DEFAULT CURRENT_DATE,
  nota        text NOT NULL,
  combinados  text,
  criado_por  uuid REFERENCES usuarios(id),
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentoria_sessoes_empresa_idx ON mentoria_sessoes(empresa_id, data DESC);

ALTER TABLE mentoria_sessoes ENABLE ROW LEVEL SECURITY;
-- Nenhuma política criada de propósito — RLS ligado + zero políticas bloqueia
-- totalmente acesso via chave anon/authenticated; só a service role (usada
-- pela Edge Function) enxerga essa tabela.
