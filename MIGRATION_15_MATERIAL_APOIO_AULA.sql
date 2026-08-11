-- Adiciona link de material de apoio (PDF, slide, planilha etc) por aula da
-- Turma da Mentoria em Grupo, separado do link do vídeo da aula.
alter table turma_aulas add column if not exists material_url text;
