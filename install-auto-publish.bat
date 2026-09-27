@echo off
rem Turns on auto publish from a stable copy outside the working folder.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\auto-publish-control.ps1" -Action Install -SitePath "%~dp0"
if errorlevel 1 echo Auto publish could not be installed. Read the error above.
pause
