@echo off
cd /d "%~dp0"

echo Removendo lock do git...
del /f /q ".git\index.lock" 2>nul

echo Adicionando todos os arquivos...
git add -A

echo Commitando...
git commit -m "fix: responsavel_id nas tarefas + filtro operador + rotinas chips + /cap routes

- Edge Function: fallback responsavel_id de clientes quando vinculo nao tem
- AgendaPage: redesign rotinas de hoje (chips horizontais, avatar, progresso)
- TasksPage: filtro por cliente no Meu Dia corrigido
- ModelosPage: campo tarefas_geradas + label dia_mes 1-31
- InsightsDash + OnboardingChecklist: rota /cap corrigida
- ClientsPage: campo responsavel equipe + Iniciar Operacao + save payload
- BACKFILL_RESPONSAVEL.sql: atualiza tarefas existentes sem responsavel_id"

echo.
echo Fazendo deploy no Vercel...
npx vercel --prod

echo.
echo PRONTO! Commit e deploy concluidos.
pause
