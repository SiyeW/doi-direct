$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $PSScriptRoot
$shared = Join-Path $root 'shared'
$targets = @( (Join-Path $root '0-probe'), (Join-Path $root '1-routes') )

foreach ($t in $targets) {
  if (-not (Test-Path $t)) { New-Item -ItemType Directory -Force -Path $t | Out-Null }
  $dst = Join-Path $t 'shared'
  if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Force -Path $dst | Out-Null }
  Copy-Item (Join-Path $shared 'doi-core.js')  $dst -Force
  Copy-Item (Join-Path $shared 'log-store.js') $dst -Force
  foreach ($f in @('popup.html','popup.css','popup.js')) {
    Copy-Item (Join-Path $shared $f) $t -Force
  }
  Write-Output ('synced -> ' + $t)
}
