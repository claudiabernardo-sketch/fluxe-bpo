@echo off
REM ============================================================================
REM Deploy das Edge Functions do Fluxe.
REM
REM O token de acesso NAO fica mais escrito aqui: este arquivo esta no
REM repositorio, entao qualquer pessoa com acesso ao codigo lia o token e
REM ganhava controle da conta Supabase inteira.
REM
REM Antes de rodar, defina o token no terminal (uma vez por sessao):
REM     set SUPABASE_ACCESS_TOKEN=seu_token_aqui
REM Pegue em: https://supabase.com/dashboard/account/tokens
REM ============================================================================
if "%SUPABASE_ACCESS_TOKEN%"=="" (
  echo.
  echo ERRO: defina SUPABASE_ACCESS_TOKEN antes de rodar.
  echo     set SUPABASE_ACCESS_TOKEN=seu_token_aqui
  echo Pegue o token em https://supabase.com/dashboard/account/tokens
  echo.
  pause
  exit /b 1
)

cd /d "%~dp0"

echo Deploying gerar-tarefas...
npx supabase functions deploy gerar-tarefas --project-ref zwvmprcuxhvhbuvdcybs --use-api --no-verify-jwt

echo Deploying radar-calcular...
npx supabase functions deploy radar-calcular --project-ref zwvmprcuxhvhbuvdcybs --use-api --no-verify-jwt

echo.
echo Deploy finished. Check above for errors.
pause
