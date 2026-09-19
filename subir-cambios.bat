@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo == ApoyaClub: subir los cambios a GitHub ==
echo.

if exist "_sync_favoritos_1.tgz" (
  move /y "_sync_favoritos_1.tgz" "_to_delete\" > nul
  echo Paquete antiguo apartado, ya no hacia falta.
)

echo.
echo -- 1 de 3: preparando los archivos --
git add -A
if errorlevel 1 goto error

echo.
echo -- 2 de 3: guardando el cambio --
git commit -F "_to_delete\mensaje-commit.txt"
if errorlevel 1 goto error

echo.
echo -- 3 de 3: subiendo a GitHub --
git push
if errorlevel 1 goto error

echo.
echo ================================
echo   LISTO. Ya esta subido.
echo   Vercel lo publica en un par de minutos.
echo ================================
echo.
pause
exit /b 0

:error
echo.
echo ================================
echo   ALGO HA FALLADO.
echo   Copia el texto de arriba y pegaselo a Claude.
echo ================================
echo.
pause
exit /b 1
