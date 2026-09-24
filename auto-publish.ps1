# Longhand Research: auto publish
# Runs quietly in the background. When Publish or Delete on the site changes
# the reports folder (and sitemap.xml with it), it commits them and pushes
# them to GitHub. Only those are sent; other edits still go with publish.bat.

$ErrorActionPreference = 'Continue'
$site = $PSScriptRoot
Set-Location $site

# One copy at a time
$mutex = New-Object System.Threading.Mutex($false, 'Local\LonghandAutoPublish')
if (-not $mutex.WaitOne(0)) { exit }

$log = Join-Path $env:LOCALAPPDATA 'LonghandAutoPublish.log'
function Write-Log($text) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $text" | Add-Content -Path $log -Encoding utf8 }

Add-Type -AssemblyName System.Windows.Forms
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.SystemIcons]::Information
$tray.Text = 'Longhand auto publish'
$tray.Visible = $true
function Show-Note($title, $text) { $tray.ShowBalloonTip(5000, $title, $text, 'Info') }

Write-Log 'Started'
$last = ''
$stableSince = $null

try {
  while ($true) {
    Start-Sleep -Seconds 5
    $status = (git status --porcelain -- reports sitemap.xml 2>$null) -join "`n"

    if ($status) {
      # Wait until the folder has stopped changing for 10 seconds
      if ($status -ne $last) { $last = $status; $stableSince = Get-Date; continue }
      if (((Get-Date) - $stableSince).TotalSeconds -lt 10) { continue }

      git add -A -- reports sitemap.xml 2>$null
      git commit -q -m "Update reports $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -- reports sitemap.xml 2>$null
      Write-Log 'Committed report changes'
      $last = ''
    }

    # Push anything not yet on GitHub (also retries after being offline)
    $ahead = git rev-list --count origin/main..main 2>$null
    if ($ahead -and [int]$ahead -gt 0) {
      git pull -q --rebase --autostash origin main 2>$null
      git push -q origin main 2>$null
      if ($LASTEXITCODE -eq 0) {
        Write-Log 'Pushed to GitHub'
        Show-Note 'Longhand Research' 'Your reports are on their way. The website updates in about a minute.'
      } else {
        Write-Log 'Push failed, will try again'
        Start-Sleep -Seconds 55
      }
    }
  }
} finally {
  $tray.Dispose()
  $mutex.ReleaseMutex()
}
