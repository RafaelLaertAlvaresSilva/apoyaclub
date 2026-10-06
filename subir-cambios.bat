@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo == ApoyaClub: subir los cambios a GitHub ==
echo.

echo -- 1 de 3: preparando los archivos --
git add -A
if errorlevel 1 goto error

echo.
echo -- 2 de 3: guardando el cambio --
rem Que no haya nada nuevo que guardar NO es un fallo.
rem
rem Pasa siempre que un intento anterior llego a guardar el cambio pero
rem no consiguio subirlo (por ejemplo, si GitHub falla justo en ese
rem momento). Antes el script se paraba aqui dando error y no llegaba
rem nunca al paso 3, que era justo el que faltaba: volver a dar doble
rem clic no arreglaba nada y parecia que el cambio se habia perdido.
rem
rem git diff --cached --quiet devuelve 0 si no hay nada preparado y 1
rem si hay algo. Por eso "errorlevel 1" aqui significa "si hay cambios".
git diff --cached --quiet
if errorlevel 1 goto guardar
echo    Nada nuevo que guardar: el cambio ya estaba guardado de antes.
goto subir

:guardar
git commit -F "_to_delete\mensaje-commit.txt"
if errorlevel 1 goto error

:subir
echo.
echo -- 3 de 3: subiendo a GitHub --
git push
if errorlevel 1 goto errorsubida

echo.
echo ================================
echo   LISTO. Ya esta subido.
echo   Vercel lo publica en un par de minutos.
echo ================================
echo.
pause
exit /b 0

:errorsubida
echo.
echo ================================
echo   NO SE HA PODIDO SUBIR A GITHUB.
echo.
echo   Tu cambio SI esta guardado en el ordenador. No se ha perdido.
echo   Lo unico que falta es la subida.
echo.
echo   Espera unos minutos y vuelve a dar doble clic en este archivo.
echo   Si sigue fallando, copia el texto de arriba y pegaselo a Claude.
echo ================================
echo.
pause
exit /b 1

:error
echo.
echo ================================
echo   ALGO HA FALLADO.
echo   Copia el texto de arriba y pegaselo a Claude.
echo ================================
echo.
pause
exit /b 1
