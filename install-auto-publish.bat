@echo off
rem Turns on auto publish: starts it now and at every login.
cd /d "%~dp0"
powershell -NoProfile -Command "$s = New-Object -ComObject WScript.Shell; $l = $s.CreateShortcut([Environment]::GetFolderPath('Startup') + '\Longhand auto publish.lnk'); $l.TargetPath = 'powershell.exe'; $l.Arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%~dp0auto-publish.ps1\"'; $l.WorkingDirectory = '%~dp0'; $l.WindowStyle = 7; $l.Save()"
start "" /min powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0auto-publish.ps1"
echo Auto publish is on. It starts by itself every time you log in.
pause
