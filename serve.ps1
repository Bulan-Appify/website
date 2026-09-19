# Preview the Bulan site locally.
#   PS> .\serve.ps1          # http://localhost:8000
#   PS> .\serve.ps1 -Port 3000
#
# A local server is required: pages link with root-relative paths (/about.html),
# which do not resolve when a file is opened directly from disk.

param([int]$Port = 8000)

$python = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $python) { $python = (Get-Command python3 -ErrorAction SilentlyContinue) }

if (-not $python) {
  Write-Host "Python not found." -ForegroundColor Yellow
  Write-Host "Install it from https://python.org, or use an alternative:"
  Write-Host "  npx serve ."
  Write-Host "  Or the 'Live Server' extension in VS Code."
  exit 1
}

Write-Host ""
Write-Host "  Bulan  ->  http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Ctrl+C to stop"
Write-Host ""

Start-Process "http://localhost:$Port"
& $python.Source -m http.server $Port --directory $PSScriptRoot
