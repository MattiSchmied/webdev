@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  start "" "%~dp0index.html"
  exit /b
)
echo Friseur Imhof v2.1.0
echo Lokale Vorschau: http://127.0.0.1:4187
echo Dieses Fenster offen lassen. Strg+C beendet die Vorschau.
start "" "http://127.0.0.1:4187"
node src\serve.ts
pause
