-- Adiciona campo motivo_pendencia na tabela tarefas
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS motivo_pendencia TEXT;
