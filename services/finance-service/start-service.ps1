Write-Host "Starting Finance Service..." -ForegroundColor Cyan

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Starting server on port 3001..." -ForegroundColor Green
Write-Host ""

npm run dev
