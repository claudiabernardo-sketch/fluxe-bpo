-- Agenda a sincronizacao diaria da grade da turma com a agenda pessoal da
-- Claudia no Google Calendar (via link secreto iCal, so leitura). Roda
-- todo dia as 9h UTC (6h em Brasilia), chamando a edge function
-- sync-agenda-mentoria, que atualiza titulo/data dos encontros na
-- turma_aulas sem mexer em video_url, material_url ou exercicio.

select cron.schedule(
  'sync-agenda-mentoria-diario',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://zwvmprcuxhvhbuvdcybs.supabase.co/functions/v1/sync-agenda-mentoria',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
