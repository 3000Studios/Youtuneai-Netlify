# Auto-sync script: watches the repo for changes, commits, pushes, and re-deploys via GitHub Actions.
# Usage: ./auto-sync.ps1
# Optional env vars:
#   GIT_BRANCH     - branch to push to (default: main)
#   SYNC_INTERVAL  - seconds between checks (default: 15)
#   COMMIT_PREFIX  - commit message prefix (default: "auto: sync")

param(
  [string]$Branch = $(if ($env:GIT_BRANCH) { $env:GIT_BRANCH } else { "main" }),
  [int]$Interval = $(if ($env:SYNC_INTERVAL) { [int]$env:SYNC_INTERVAL } else { 15 }),
  [string]$CommitPrefix = $(if ($env:COMMIT_PREFIX) { $env:COMMIT_PREFIX } else { "auto: sync" })
)

function Has-GitChanges {
  $status = git status --porcelain
  return -not [string]::IsNullOrWhiteSpace($status)
}

Write-Host "Auto-sync watching branch '$Branch' every $Interval seconds. Press Ctrl+C to stop." -ForegroundColor Cyan

while ($true) {
  try {
    # Always pull latest changes first to avoid conflicts
    git pull origin $Branch

    if (Has-GitChanges) {
      $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
      $message = "$CommitPrefix - $timestamp"
      git add . | Out-Null
      git commit -m "$message" | Out-Null
      git push origin $Branch
      Write-Host "Pushed: $message" -ForegroundColor Green
    }
  } catch {
    Write-Host "Error during sync: $($_.Exception.Message)" -ForegroundColor Red
  }
  Start-Sleep -Seconds $Interval
}
