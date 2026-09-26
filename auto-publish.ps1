# Longhand Research: auto publish
# Runs quietly in the background. When Publish or Delete on the site changes
# the reports folder (and sitemap.xml with it), it commits them to main and
# pushes them to GitHub. Only those are sent; other edits still go with
# publish.bat.
#
# The folder is often checked out on a Codex or Claude branch with work in
# progress. Then the report changes are committed onto main without touching
# that branch, its files or its index: the commit is built in a scratch index
# with git's own plumbing and pushed straight to main.

$ErrorActionPreference = 'Continue'
$site = $PSScriptRoot
Set-Location $site

# One copy at a time
$mutex = New-Object System.Threading.Mutex($false, 'Local\LonghandAutoPublish')
if (-not $mutex.WaitOne(0)) { exit }

$log = Join-Path $env:LOCALAPPDATA 'LonghandAutoPublish.log'
$lastLine = ''
function Write-Log($text) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $text" | Add-Content -Path $log -Encoding utf8; $script:lastLine = $text }
# For news that would otherwise be written again every few seconds
function Write-LogOnce($text) { if ($text -ne $script:lastLine) { Write-Log $text } }

Add-Type -AssemblyName System.Windows.Forms
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.SystemIcons]::Information
$tray.Text = 'Longhand auto publish'
$tray.Visible = $true
function Show-Note($title, $text) { $tray.ShowBalloonTip(5000, $title, $text, 'Info') }

$gitDir = git rev-parse --absolute-git-dir 2>$null
$scratch = Join-Path $gitDir 'longhand-publish-index'   # never the folder's own index
$sentFile = Join-Path $gitDir 'longhand-publish-sent'   # what was last sent from a branch

# reports/ and sitemap.xml as they stand: git's list of changes, plus each
# file's size and time so a file that changes again is noticed. Empty when
# they match the checked-out commit.
function Get-ReportState {
  $status = (git --no-optional-locks status --porcelain -- reports sitemap.xml 2>$null) -join "`n"
  if (-not $status) { return '' }
  $files = Get-ChildItem -Path reports, sitemap.xml -Recurse -File -Force -ErrorAction SilentlyContinue |
    ForEach-Object { "$($_.FullName) $($_.Length) $($_.LastWriteTimeUtc.Ticks)" }
  "$status`n$($files -join "`n")"
}

# A rebase, merge, cherry-pick, revert or bisect is under way in the folder
function Test-GitBusy {
  foreach ($name in 'rebase-merge', 'rebase-apply', 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'BISECT_LOG', 'sequencer') {
    if (Test-Path (Join-Path $gitDir $name)) { return $true }
  }
  $false
}

# The tree of $commit with reports/ and sitemap.xml taken from $source, or
# from the folder on disk when there is no $source. Returns nothing if git
# fails.
function New-ReportTree($commit, $source) {
  $env:GIT_INDEX_FILE = $scratch
  try {
    git read-tree $commit 2>$null
    if ($LASTEXITCODE -ne 0) { return }
    if ($source) { git restore --staged "--source=$source" -- reports sitemap.xml 2>$null }
    else { git add -A -- reports sitemap.xml 2>$null }
    if ($LASTEXITCODE -ne 0) { return }
    git write-tree 2>$null
  } finally {
    Remove-Item Env:\GIT_INDEX_FILE -ErrorAction SilentlyContinue
  }
}

# Sends the report changes to main while another branch is checked out.
# Only what changed since the state last sent (or since the branch's own
# commit) is merged onto main, so nothing that reached main some other way is
# undone. Returns sent, already, clash, offline or failed.
function Send-FromBranch {
  git fetch -q origin main 2>$null
  if ($LASTEXITCODE -ne 0) { return 'offline' }
  # Build on local main when it only adds to GitHub's (commits made offline)
  git merge-base --is-ancestor origin/main main 2>$null
  $parent = if ($LASTEXITCODE -eq 0) { git rev-parse main } else { git rev-parse origin/main }
  $mainTree = git rev-parse "$parent^{tree}"

  # The state last sent still counts while the branch's own reports stay the same
  $key = (git rev-parse HEAD:reports HEAD:sitemap.xml 2>$null) -join ' '
  $source = 'HEAD'
  $sent = @(Get-Content $sentFile -ErrorAction SilentlyContinue)
  if ($sent.Count -eq 2 -and $sent[0] -eq $key) {
    git cat-file -e "$($sent[1])^{tree}" 2>$null
    if ($LASTEXITCODE -eq 0) { $source = $sent[1] }
  }

  $baseTree = New-ReportTree $parent $source
  $diskTree = New-ReportTree $parent $null
  if (-not $baseTree -or -not $diskTree) { return 'failed' }
  # merge-tree takes commits (older Git rejects bare trees), so wrap both sides
  $baseCommit = git commit-tree $baseTree -m base 2>$null
  $diskCommit = git commit-tree $diskTree -m disk 2>$null
  if (-not $baseCommit -or -not $diskCommit) { return 'failed' }
  $merged = @(git merge-tree --write-tree "--merge-base=$baseCommit" $parent $diskCommit 2>$null)
  if ($LASTEXITCODE -eq 1) { return 'clash' }
  if ($LASTEXITCODE -ne 0 -or -not $merged) { return 'failed' }
  $newTree = $merged[0]

  if ($newTree -ne $mainTree) {
    $commit = git commit-tree $newTree -p $parent -m "Update reports $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>$null
    if ($LASTEXITCODE -ne 0) { return 'failed' }
    git push -q origin "${commit}:refs/heads/main" 2>$null
    if ($LASTEXITCODE -ne 0) { return 'offline' }
    # Bring local main along; git leaves it alone if it is checked out or has diverged
    git fetch -q origin main:main 2>$null
  }
  Set-Content -Path $sentFile -Value $key, $diskTree -Encoding ascii
  if ($newTree -eq $mainTree) { 'already' } else { 'sent' }
}

Write-Log 'Started'
$last = ''
$stableSince = $null
$handled = ''

try {
  while ($true) {
    Start-Sleep -Seconds 5
    $branch = git symbolic-ref --short -q HEAD 2>$null
    $state = Get-ReportState

    if (-not $state) {
      # In step with the checked-out commit again: start afresh
      if (Test-Path $sentFile) { Remove-Item $sentFile -ErrorAction SilentlyContinue }
      $last = ''
    } else {
      # Wait until the folder has stopped changing for 10 seconds
      if ($state -ne $last) { $last = $state; $stableSince = Get-Date; continue }
      if (((Get-Date) - $stableSince).TotalSeconds -lt 10) { continue }

      if (Test-GitBusy) {
        Write-LogOnce 'Waiting: a rebase or merge is under way in the site folder'
      } elseif ($branch -eq 'main') {
        git add -A -- reports sitemap.xml 2>$null
        git commit -q -m "Update reports $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -- reports sitemap.xml 2>$null
        Write-Log 'Committed report changes'
        $last = ''
      } elseif ($state -ne $handled) {
        $where = if ($branch) { $branch } else { 'a detached HEAD' }
        switch (Send-FromBranch) {
          'sent' {
            Write-Log "Pushed report changes to main (the folder is on $where)"
            Show-Note 'Longhand Research' 'Your reports are on their way. The website updates in about a minute.'
            $handled = $state
          }
          'already' {
            Write-LogOnce "Report changes on $where are already on main"
            $handled = $state
          }
          'clash' {
            Write-Log "Not sent: the report changes on $where clash with changes on main. Publish them from main."
            Show-Note 'Longhand Research' 'A report change was not sent, because the reports on GitHub changed in the same place. Publish it again from the main branch.'
            $handled = $state
          }
          'offline' {
            Write-Log 'Push failed, will try again'
            Start-Sleep -Seconds 55
          }
          default {
            Write-LogOnce "Could not prepare the report changes on $where, will try again"
            Start-Sleep -Seconds 55
          }
        }
      }
    }

    # Push anything not yet on GitHub (also retries after being offline)
    $ahead = git rev-list --count origin/main..main 2>$null
    if ($ahead -and [int]$ahead -gt 0) {
      git merge-base --is-ancestor origin/main main 2>$null
      if ($branch -ne 'main' -and $LASTEXITCODE -ne 0) {
        # main is only rebased while it is checked out, never under another branch
        Write-LogOnce 'main has commits GitHub does not; they go once the site folder is back on main'
        continue
      }
      if ($branch -eq 'main') { git pull -q --rebase --autostash origin main 2>$null }
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
