@echo off
echo Deploying gerar-tarefas edge function...
set SUPABASE_ACCESS_TOKEN=sbp_df4334b4d8b9f911504575f90b1757ce9fb9571d
cd /d "C:\Users\Cliente\Downloads\fluxe-bpo"
npx supabase functions deploy gerar-tarefas --project-ref zwvmprcuxhvhbuvdcybs --use-api --no-verify-jwt
echo.
echo Deploy finished. Check above for errors.
pause
