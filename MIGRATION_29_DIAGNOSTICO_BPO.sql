-- Autoavaliação de maturidade do BPO (Executa / Transforma em informação / Ajuda a decidir)
-- Guarda a última autoavaliação feita pela empresa sobre o próprio negócio (não por cliente).
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS diagnostico_bpo JSONB;
COMMENT ON COLUMN empresas.diagnostico_bpo IS 'Autoavaliação de nível do BPO: {marcadas:[chaves], nivel:1|2|3, calculado_em}';
