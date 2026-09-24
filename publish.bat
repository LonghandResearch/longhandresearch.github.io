@echo off
rem Double-click to send your changes (new or deleted reports) to GitHub.
cd /d "%~dp0"
echo Longhand Research: publishing to GitHub
echo.

git pull --rebase --autostash -q origin main
if errorlevel 1 goto failed

git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo Nothing new to publish. Use Publish or Delete on the site first.
  goto end
)

git commit -q -m "Update reports %date% %time:~0,5%"
if errorlevel 1 goto failed
git push -q origin main
if errorlevel 1 goto failed

echo Done. The website updates in about a minute.
goto end

:failed
echo.
echo Something went wrong. Read the message above, or ask for help.

:end
echo.
pause
