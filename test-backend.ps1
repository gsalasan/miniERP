Write-Host "🧪 Testing Finance API..." -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 2

try {
    Write-Host "Testing GET /api/tax-rates..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/tax-rates" -Method GET
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
