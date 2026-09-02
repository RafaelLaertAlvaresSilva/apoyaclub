@echo off
cd /d "%~dp0"
chcp 65001 >nul
title Configurar claves de ApoyaClub
echo.
echo  ================================================
echo    CLAVES DE APOYACLUB
echo  ================================================
echo.
echo  Pega cada valor y pulsa Enter.
echo  Para pegar aqui: clic derecho con el raton.
echo.
set "URL="
set "ANON="
set "SECRET="
set /p "URL=1) Project URL (https://....supabase.co): "
set /p "ANON=2) Publishable key (sb_publishable_...): "
set /p "SECRET=3) Secret key (sb_secret_...): "
echo.
if "%URL%"=="" goto falta
if "%ANON%"=="" goto falta
if "%SECRET%"=="" goto falta
(
echo # Claves de ApoyaClub. Generado por configurar-claves.bat
echo # No subir este archivo a ningun sitio publico.
echo.
echo NEXT_PUBLIC_SUPABASE_URL=%URL%
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=%ANON%
echo SUPABASE_SERVICE_ROLE_KEY=%SECRET%
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
echo.
echo # Emails ^(resend.com^) - pendiente
echo RESEND_API_KEY=
echo RESEND_FROM_EMAIL=onboarding@resend.dev
echo CONTACT_EMAIL=
echo.
echo # Stripe - pendiente
echo STRIPE_SECRET_KEY=
echo STRIPE_PRICE_ID=
echo STRIPE_WEBHOOK_SECRET=
echo.
echo # Sentry - pendiente
echo NEXT_PUBLIC_SENTRY_DSN=
echo.
echo # Inventadas, ya valen asi
echo CRON_SECRET=apoyaclub-cron-9f2b7d41c6
echo ADMIN_SIGNUP_KEY=apoyaclub-admin-3e8a1c
) > ".env.local"
echo  LISTO: el archivo .env.local se ha guardado.
echo.
echo  Ahora avisa a Claude para que lo revise.
echo.
pause
exit /b
:falta
echo  Falta algun valor: no se ha guardado nada.
echo  Vuelve a ejecutarlo y pega los tres.
echo.
pause
