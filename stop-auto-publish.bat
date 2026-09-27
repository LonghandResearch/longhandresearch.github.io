@echo off
rem Stops this site's publisher and removes its login shortcut.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\auto-publish-control.ps1" -Action Stop -SitePath "%~dp0"
if errorlevel 1 echo Auto publish could not be stopped. Read the error above.
pause
