# LocalCart - Log Viewer Script
# Quick script to view logs in various ways

param(
    [string]$Service = "backend",
    [int]$Lines = 50,
    [switch]$Follow,
    [switch]$Errors
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   LocalCart Log Viewer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if ($Follow) {
    Write-Host "Following $Service logs (Press Ctrl+C to stop)..." -ForegroundColor Yellow
    docker logs localcart-$Service -f
}
elseif ($Errors) {
    Write-Host "Showing ERROR logs from $Service (last $Lines lines)..." -ForegroundColor Red
    docker logs localcart-$Service --tail $Lines 2>&1 | Select-String "ERROR|Exception|Failed"
}
else {
    Write-Host "Showing last $Lines lines from $Service..." -ForegroundColor Green
    docker logs localcart-$Service --tail $Lines
}
