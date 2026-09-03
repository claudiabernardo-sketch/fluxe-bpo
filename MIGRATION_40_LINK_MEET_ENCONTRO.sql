-- Link do Google Meet de cada encontro, sincronizado automaticamente da
-- agenda (campo X-GOOGLE-CONFERENCE do evento). Permite um botao "Entrar
-- na aula" direto, sem passar por nenhuma tela de edicao de evento.

alter table turma_aulas add column if not exists link_meet text;
