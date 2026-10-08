-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 46: equipe Fluxe enxerga a lista de espera da mentoria
--
-- A tabela evento_leads recebe cadastros pela Edge Function evento-lead-capture
-- (service_role), usada pela lista de espera da página /mentoriaBPOlucrativo
-- (evento = 'lista_espera_mentoria_grupo') e pela página do Foca no seu BPO.
-- Sem política de leitura, ninguém conseguia consultar os cadastros pelo app.
-- Esta migration libera SOMENTE leitura para a equipe Fluxe (usuarios.fluxe_staff).
-- A escrita continua exclusiva da Edge Function. Idempotente.
-- Já aplicada no projeto zwvmprcuxhvhbuvdcybs.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE evento_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evento_leads_staff_select ON evento_leads;
CREATE POLICY evento_leads_staff_select ON evento_leads
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND fluxe_staff = true));
