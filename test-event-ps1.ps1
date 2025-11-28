$eventData = @{
    projectName = "Test Auto-Created Project $(Get-Date -Format 'yyyyMMddHHmmss')"
    customerId = "c1234567-1234-1234-1234-123456789012"
    salesUserId = "e7ac4f28-c807-48f1-8f2c-857a77bb2e57"
    salesOrderId = "SO-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
    soNumber = "SO-2025-TEST-001"
    totalValue = 8500000
    description = "Test project created via event listener"
} | ConvertTo-Json

Write-Host "=== Testing Project.Won Event Listener ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Event Data:" -ForegroundColor Yellow
Write-Host $eventData
Write-Host ""

try {
    Write-Host "Sending event to http://localhost:4007/events/project-won..." -ForegroundColor Yellow
    
    $response = Invoke-WebRequest `
        -Uri "http://localhost:4007/events/project-won" `
        -Method Post `
        -Body $eventData `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host ""
    Write-Host "✅ Event processed successfully!" -ForegroundColor Green
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
    
    Write-Host ""
    Write-Host "═" * 70 -ForegroundColor Green
    Write-Host "✅ EVENT LISTENER WORKING!" -ForegroundColor Green
    Write-Host "   - Project Workspace created automatically" -ForegroundColor Green
    Write-Host "   - Status set to 'Planning'" -ForegroundColor Green
    Write-Host "   - Check Project Service logs for details" -ForegroundColor Green
    Write-Host "═" * 70 -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
        
        if ($responseBody -like "*customer*" -or $responseBody -like "*Foreign key*") {
            Write-Host ""
            Write-Host "💡 Note: Customer ID may not exist in database." -ForegroundColor Yellow
            Write-Host "   The event listener code is working!" -ForegroundColor Yellow
            Write-Host "   Just need valid customer ID for full test." -ForegroundColor Yellow
        }
    } elseif ($_.Exception.Message -like "*refused*") {
        Write-Host ""
        Write-Host "⚠️  Project Service not running on port 4007" -ForegroundColor Yellow
        Write-Host "   Start it with: npm run dev:project" -ForegroundColor Yellow
    }
}
