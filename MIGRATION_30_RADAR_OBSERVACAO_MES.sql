-- Radar confundia os mentorados: parecia não ter histórico (na verdade cada
-- mês já virava uma linha no banco, só nunca aparecia na tela) e os números
-- mensais não tinham espaço pra explicar o contexto do mês.

alter table radar_metricas_mensais add column if not exists observacao text;
