-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 17: Painel admin interno (controle de empresas + bugs)
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Marca seu próprio usuário como "staff" do Fluxe — só quem tem essa flag
-- consegue ver o painel /admin e agir sobre QUALQUER empresa (bloquear,
-- desbloquear, estender trial). Nenhum cliente do Fluxe tem esse acesso.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fluxe_staff BOOLEAN NOT NULL DEFAULT false;

UPDATE usuarios SET fluxe_staff = true
WHERE email = 'empreendabpo@gmail.com';

-- Registro interno de bugs/chamados reportados por clientes do Fluxe. Não é
-- por empresa (é você quem usa, olhando o Fluxe todo) — por isso RLS aqui é
-- "só staff", em vez do padrão "só a própria empresa" usado em todo o resto
-- do sistema.

CREATE TABLE IF NOT EXISTS fluxe_bugs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_nome   TEXT,
  empresa_id     UUID        REFERENCES empresas(id) ON DELETE SET NULL,
  reportado_por  TEXT,
  descricao      TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','investigando','resolvido')),
  prioridade     TEXT        NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta')),
  criado_por     UUID        REFERENCES usuarios(id),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvido_em   TIMESTAMPTZ
);

ALTER TABLE fluxe_bugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY fluxe_bugs_staff_all ON fluxe_bugs FOR ALL
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND fluxe_staff = true))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND fluxe_staff = true));

-- ── Verificar resultado ───────────────────────────────────────────────────
SELECT nome, email, fluxe_staff FROM usuarios WHERE fluxe_staff = true;
