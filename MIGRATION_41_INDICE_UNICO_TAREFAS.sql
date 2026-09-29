-- ══════════════════════════════════════════════════════════════════════════════
-- Fluxe BPO — Migration 41: índice único contra tarefas duplicadas
-- Já aplicada direto em produção via Management API em 2026-09-29.
-- Este arquivo é só o registro/histórico da mudança.
-- ══════════════════════════════════════════════════════════════════════════════

-- Achado real: 84 tarefas duplicadas em produção (Monarca BPO/Eva entre
-- outras empresas), geradas quando duas chamadas de gerar-tarefas rodam
-- muito próximas uma da outra (cron + clique manual, ou dois cliques
-- seguidos) — as duas passam pela checagem "já existe?" antes de qualquer
-- uma ter inserido, e as duas inserem. A checagem em memória (existSet) não
-- segura corrida entre execuções, só duplicidade dentro da mesma execução.
--
-- Este índice é a trava real, no banco: garante que não existem duas
-- tarefas (não-deletadas, vindas de um modelo) com o mesmo
-- empresa+modelo+cliente+banco+data, não importa quantas execuções
-- concorrentes tentem inserir.
create unique index if not exists tarefas_unico_modelo_cliente_banco_data
on tarefas (empresa_id, modelo_id, coalesce(cliente_id::text, 'null'), coalesce(banco, ''), data_execucao)
where deleted_at is null and modelo_id is not null;

-- A função gerar-tarefas foi atualizada (mesmo commit) pra reconhecer o
-- código de erro 23505 (violação de constraint única) como "já existe,
-- ignora" em vez de erro de verdade, e refazer o lote um a um quando isso
-- acontece, pra não descartar as tarefas legítimas do mesmo lote.

-- Limpeza feita nessa mesma manutenção: 84 tarefas duplicadas (a mais
-- recente de cada par/trio, priorizando manter a já concluída) foram
-- soft-deletadas (deleted_at = now()), preservando histórico. Nenhuma tinha
-- checklist marcado, apontamento de tempo ou pendência únicos — só um
-- registro redundante de "Status → concluída" nos casos concluídos.
