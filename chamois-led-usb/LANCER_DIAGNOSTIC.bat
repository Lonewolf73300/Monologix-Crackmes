@echo off
rem Lance le diagnostic LED (lecture seule). Compatible Windows 7 / PowerShell 2.0.
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0OUTILS\Diagnostic_LED_W7.ps1"
echo.
echo Termine. Le rapport est dans le dossier RAPPORTS de la cle.
pause
