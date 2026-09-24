@echo off
rem Stops auto publish and keeps it from starting at login.
rem To turn it back on, ask for it or run install-auto-publish.bat.
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*auto-publish.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Longhand auto publish.lnk" 2>nul
echo Auto publish is off. Use publish.bat to send changes by hand.
pause
