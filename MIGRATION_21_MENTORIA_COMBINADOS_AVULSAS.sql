-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 21: Combinados rastreáveis + sessões avulsas (mentoria)
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════════
-- 1) Sessão de mentoria passa a poder existir sem empresa cadastrada como
--    mentorada — cobre quem só comprou uma sessão avulsa (não tem 🎓 marcado,
--    às vezes nem é cliente do Fluxe).
-- 2) "Combinados" vira item rastreável com prazo e status de concluído, em
--    vez de só texto solto dentro da sessão — dá pra ver tudo que está em
--    aberto, de todo mundo, num lugar só.
-- Mesma lógica de acesso da Migration 20: RLS ligado e sem nenhuma política,
-- só a Edge Function admin-painel (service role, valida fluxe_staff) acessa.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE mentoria_sessoes ALTER COLUMN empresa_id DROP NOT NULL;
ALTER TABLE mentoria_sessoes ADD COLUMN IF NOT EXISTS nome_avulso text;
ALTER TABLE mentoria_sessoes DROP CONSTRAINT IF EXISTS mentoria_sessoes_empresa_ou_avulso;
ALTER TABLE mentoria_sessoes ADD CONSTRAINT mentoria_sessoes_empresa_ou_avulso
  CHECK (empresa_id IS NOT NULL OR nome_avulso IS NOT NULL);

CREATE TABLE IF NOT EXISTS mentoria_combinados (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id     uuid NOT NULL REFERENCES mentoria_sessoes(id) ON DELETE CASCADE,
  texto         text NOT NULL,
  prazo         date,
  concluido     boolean NOT NULL DEFAULT false,
  concluido_em  timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentoria_combinados_sessao_idx ON mentoria_combinados(sessao_id);
CREATE INDEX IF NOT EXISTS mentoria_combinados_abertos_idx ON mentoria_combinados(concluido, prazo);

ALTER TABLE mentoria_combinados ENABLE ROW LEVEL SECURITY;
