@echo off
cd /d "%~dp0"
echo === COMMITANDO FIXES DE BUGS ===
echo.

REM Remove lock file se existir
if exist ".git\index.lock" del /f ".git\index.lock"

REM Adicionar apenas os arquivos corrigidos
git add src/hooks/useData.js
git add src/pages/EsteirasPage.jsx
git add src/pages/ExecPage.jsx
git add src/pages/ClientsPage.jsx
git add src/pages/AgendaPage.jsx

REM Verificar o que vai ser commitado
echo === Arquivos no commit: ===
git diff --cached --name-only
echo.

REM Commit
git commit -m "fix: corrige 5 bugs encontrados na varredura

- useData.js: useCreateTask retorna data[0] em vez do array completo
- EsteirasPage.jsx: completa modal truncado + adiciona empresa_id + corrige software_erp
- ExecPage.jsx: onboarding filtra por etapa (nao status)
- ClientsPage.jsx: corrige enum invalido prioridade/status ao aplicar modelos
- AgendaPage.jsx: adiciona empresa_id no update do kanban"

echo.
echo === Enviando para GitHub ===
git push origin master

echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
