@echo off
REM ============================================================================
REM Deploy das Edge Functions do Fluxe.
REM
REM O token de acesso NAO fica mais escrito aqui: este arquivo esta no
REM repositorio, entao qualquer pessoa com acesso ao codigo lia o token e
REM ganhava controle da conta Supabase inteira.
REM
REM Antes de rodar, defina o token (uma vez por sessao) OU crie um arquivo
REM .supabase_token (fora do git) com o token dentro:
REM     set SUPABASE_ACCESS_TOKEN=seu_token_aqui
REM Pegue em: https://supabase.com/dashboard/account/tokens
REM ============================================================================
if "%SUPABASE_ACCESS_TOKEN%"=="" if exist "%~dp0.supabase_token" (
  set /p SUPABASE_ACCESS_TOKEN=<"%~dp0.supabase_token"
)
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

echo Deploying autentique-sign...
npx supabase functions deploy autentique-sign --project-ref zwvmprcuxhvhbuvdcybs --use-api --no-verify-jwt

echo Deploying autentique-webhook...
npx supabase functions deploy autentique-webhook --project-ref zwvmprcuxhvhbuvdcybs --use-api --no-verify-jwt

echo.
echo Deploy finished. Check above for errors.
pause
