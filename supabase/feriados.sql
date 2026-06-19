-- ════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Calendário de feriados (pra não gerar tarefa "dias úteis"
-- em feriado nacional, estadual ou municipal)
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════════
-- Por empresa (cada BPO atende clientes em municípios diferentes, então
-- não dá pra fixar uma lista única de feriados no código).
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feriados (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  data        date NOT NULL,
  descricao   text NOT NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feriados_empresa_data_uniq'
  ) THEN
    ALTER TABLE feriados ADD CONSTRAINT feriados_empresa_data_uniq UNIQUE (empresa_id, data);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS feriados_empresa_idx ON feriados(empresa_id);

ALTER TABLE feriados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feriados_empresa" ON feriados;
CREATE POLICY "feriados_empresa" ON feriados
  FOR ALL
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()))
  WITH CHECK (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Semeia os feriados nacionais fixos (não móveis) do ano corrente e do
-- próximo, pra cada empresa já existente. Feriados móveis (Carnaval,
-- Sexta-feira Santa, Corpus Christi) e municipais ficam por conta do
-- cadastro manual na tela de Configurações, porque variam por ano/cidade.
INSERT INTO feriados (empresa_id, data, descricao)
SELECT e.id, d.data, d.descricao
FROM empresas e
CROSS JOIN (VALUES
  (make_date(EXTRACT(YEAR FROM now())::int, 1, 1),  'Confraternização Universal'),
  (make_date(EXTRACT(YEAR FROM now())::int, 4, 21), 'Tiradentes'),
  (make_date(EXTRACT(YEAR FROM now())::int, 5, 1),  'Dia do Trabalho'),
  (make_date(EXTRACT(YEAR FROM now())::int, 9, 7),  'Independência do Brasil'),
  (make_date(EXTRACT(YEAR FROM now())::int, 10, 12),'Nossa Senhora Aparecida'),
  (make_date(EXTRACT(YEAR FROM now())::int, 11, 2), 'Finados'),
  (make_date(EXTRACT(YEAR FROM now())::int, 11, 15),'Proclamação da República'),
  (make_date(EXTRACT(YEAR FROM now())::int, 11, 20),'Consciência Negra'),
  (make_date(EXTRACT(YEAR FROM now())::int, 12, 25),'Natal'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 1, 1),  'Confraternização Universal'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 4, 21), 'Tiradentes'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 5, 1),  'Dia do Trabalho'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 9, 7),  'Independência do Brasil'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 10, 12),'Nossa Senhora Aparecida'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 11, 2), 'Finados'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 11, 15),'Proclamação da República'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 11, 20),'Consciência Negra'),
  (make_date(EXTRACT(YEAR FROM now())::int + 1, 12, 25),'Natal')
) AS d(data, descricao)
ON CONFLICT (empresa_id, data) DO NOTHING;
