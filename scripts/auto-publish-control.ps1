# Install or stop the background publisher without depending on the checked-out
# branch at the next login. The stable script copy is deliberately kept on Stop.
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('Install', 'Stop')]
  [string]$Action,
  [Parameter(Mandatory = $true)]
  [string]$SitePath,
  [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'LonghandResearch\AutoPublish'),
  [string]$StartupFolder = [Environment]::GetFolderPath('Startup'),
  [switch]$NoStart
)

$ErrorActionPreference = 'Stop'
$site = (Resolve-Path -LiteralPath $SitePath).Path.TrimEnd('\')
$source = Join-Path $site 'auto-publish.ps1'
if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Auto-publish script not found in $site" }
if (-not (Test-Path -LiteralPath (Join-Path $site 'reports') -PathType Container)) { throw "Reports folder not found in $site" }

$stable = Join-Path $InstallRoot 'auto-publish.ps1'
$shortcutPath = Join-Path $StartupFolder 'Longhand auto publish.lnk'

# Match only this site's old script path or its stable installed copy. A broad
# '*auto-publish.ps1*' match would also kill this installer or another project.
function Stop-ManagedPublisher {
  $paths = @($source, $stable) | ForEach-Object { [regex]::Escape($_) }
  $running = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -in @('powershell.exe', 'pwsh.exe') -and $_.ProcessId -ne $PID
  }
  foreach ($process in $running) {
    foreach ($path in $paths) {
      if ($process.CommandLine -match ('(?i)(?:^|\s)-File\s+"?' + $path + '"?(?=\s|$)')) {
        Stop-Process -Id $process.ProcessId -Force
        break
      }
    }
  }
}

Stop-ManagedPublisher
if ($Action -eq 'Stop') {
  if (Test-Path -LiteralPath $shortcutPath) { Remove-Item -LiteralPath $shortcutPath }
  Write-Output 'Auto publish is off. The installed script copy is kept for a later reinstall.'
  return
}

New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $stable -Force
$powershell = (Get-Command powershell.exe).Source
$arguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -SitePath "{1}"' -f $stable, $site
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $powershell
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $site
$shortcut.WindowStyle = 7
$shortcut.Save()

if (-not $NoStart) {
  Start-Process -FilePath $powershell -ArgumentList $arguments -WindowStyle Hidden
}
Write-Output "Auto publish is installed from a fixed copy at $stable."
